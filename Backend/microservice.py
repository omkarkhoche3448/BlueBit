import logging
import json
import os
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, request, jsonify
from utils.db_utils import init_db_and_load_jobs
from recommendation_engine import recommendation_engine, get_recommendations_for_user
from job_scraper import scrape_and_store_jobs
from config import Session
from models import User, Job
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API key from environment variables
API_KEY = os.getenv('API_SECRET_KEY')
if not API_KEY:
    raise ValueError("API_SECRET_KEY must be set in environment variables")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('api_service.log'),
        logging.StreamHandler()
    ]
)

# Initialize Flask app
app = Flask(__name__)

# Initialize database only - don't start recommendation engine scheduler
init_db_and_load_jobs()
logging.info("✅ Database initialized")

# API key validation decorator
def require_api_key(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get API key from request headers
        provided_key = request.headers.get('X-API-Key')
        
        # Check if API key is valid
        if not provided_key or provided_key != API_KEY:
            return jsonify({"error": "Unauthorized access. Invalid API key"}), 401
        
        return f(*args, **kwargs)
    return decorated_function

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})

@app.route('/api/process-recommendations', methods=['POST'])
@require_api_key
def process_recommendations():
    """
    Process recommendations for all users and store them in the database.
    """
    session = Session()
    logging.info("Starting batch processing of recommendations")
    try:
        # Initialize model if not already initialized
        if not recommendation_engine.model_updated_at:
            recommendation_engine.initialize_model()
            
        # Get all users
        users = session.query(User).all()
        logging.info(f"Processing recommendations for {len(users)} users")
        
        results = {"total_users": len(users), "success_count": 0, "failed_users": []}
        
        for user in users:
            try:
                # Get recommendations for this user
                recommendations = get_recommendations_for_user(user.id, count=50)  # Get more than needed
                
                # Filter out not interested jobs
                not_interested_ids = user.not_interested_job_ids
                if isinstance(not_interested_ids, str):
                    try:
                        not_interested_ids = json.loads(not_interested_ids)
                    except:
                        not_interested_ids = []
                
                if not_interested_ids:
                    recommendations = [job for job in recommendations if job['id'] not in not_interested_ids]
                
                # Store only the job IDs in the user record
                recommendation_ids = [job['id'] for job in recommendations]
                user.recommended_job_ids = recommendation_ids
                
                logging.info(f"Updated recommendations for user {user.id}: {len(recommendation_ids)} jobs")
                results["success_count"] += 1
            except Exception as e:
                error_msg = f"Error processing recommendations for user {user.id}: {str(e)}"
                logging.error(error_msg)
                results["failed_users"].append({"user_id": user.id, "error": str(e)})
                continue
        
        session.commit()
        logging.info("✅ Completed batch processing of recommendations")
        return jsonify({"status": "success", "results": results})
    except Exception as e:
        session.rollback()
        error_msg = f"❌ Error in batch recommendation processing: {str(e)}"
        logging.error(error_msg)
        return jsonify({"status": "error", "message": error_msg}), 500
    finally:
        session.close()

@app.route('/api/scrape-jobs', methods=['POST'])
@require_api_key
def process_job_scraping():
    """Scrape and store new jobs"""
    session = Session()
    logging.info("Starting job scraping")
    try:
        # Run the job scraper
        scraped_jobs = scrape_and_store_jobs(session)
        job_count = len(scraped_jobs) if scraped_jobs else 0
        logging.info(f"✅ Successfully scraped and stored {job_count} jobs")
        return jsonify({
            "status": "success", 
            "jobs_scraped": job_count,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        error_msg = f"❌ Error in job scraping: {str(e)}"
        logging.error(error_msg)
        return jsonify({"status": "error", "message": error_msg}), 500
    finally:
        session.close()
        
@app.route('/api/maintenance/clear-data', methods=['POST'])
@require_api_key
def clear_stale_data():
    """
    Maintenance endpoint to:
    1. Update expired pro users (set is_pro to False)
    2. Delete jobs that haven't been updated in 30+ days
    """
    session = Session()
    try:
        # Get current date for comparison
        today = datetime.now().date()
        
        # Track statistics for response
        updated_users_count = 0
        total_users_checked = 0
        deleted_jobs_count = 0
        total_jobs_checked = 0
        jobs_with_missing_dates = 0
        
        # 1. Check all users and update expired pro subscriptions
        all_users = session.query(User).all()
        total_users_checked = len(all_users)
        logging.info(f"Checking {total_users_checked} users for pro status...")
        
        for user in all_users:
            if user.is_pro:
                if user.pro_expiration_date:
                    days_remaining = (user.pro_expiration_date - today).days
                    logging.info(f"User {user.id}: {days_remaining} days remaining in pro subscription")
                    
                    if days_remaining < 0:
                        user.is_pro = False
                        updated_users_count += 1
                        logging.info(f"User {user.id} pro status expired and set to False")
                else:
                    logging.warning(f"User {user.id} has is_pro=True but no expiration date")
        
        # 2. Find and delete stale jobs (older than 30 days)
        all_jobs = session.query(Job).all()
        total_jobs_checked = len(all_jobs)
        logging.info(f"Checking {total_jobs_checked} jobs for staleness...")
        
        thirty_days_ago = today - timedelta(days=30)
        
        # Safely filter out jobs with None last_updated values
        stale_jobs = []
        for job in all_jobs:
            if job.date_posted is None:
                jobs_with_missing_dates += 1
                logging.warning(f"Job {job.id} has no last_updated date")
                continue
            if job.date_posted < thirty_days_ago:
                stale_jobs.append(job)
        
        # Store job IDs before deletion for reporting
        stale_job_ids = [job.id for job in stale_jobs]
        
        # Delete the stale jobs
        for job in stale_jobs:
            session.delete(job)
            deleted_jobs_count += 1
        
        # Commit all changes
        session.commit()
        
        logging.info(f"Maintenance summary: {updated_users_count}/{total_users_checked} users expired, "
                     f"{deleted_jobs_count}/{total_jobs_checked} jobs deleted, "
                     f"{jobs_with_missing_dates} jobs with missing last_updated dates")
        
        return jsonify({
            'success': True,
            'message': 'Maintenance completed successfully',
            'total_users_checked': total_users_checked,
            'expired_pro_users_count': updated_users_count,
            'total_jobs_checked': total_jobs_checked,
            'deleted_jobs_count': deleted_jobs_count,
            'jobs_with_missing_dates': jobs_with_missing_dates,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        session.rollback()
        logging.error(f"Error during maintenance clean-up: {str(e)}")
        return jsonify({'error': f'Maintenance failed: {str(e)}'}), 500
    finally:
        session.close()

if __name__ == '__main__':
    from config import MICROSERVICE_PORT
    logging.info(os.getenv("API_SECRET_KEY"))
    logging.info(f"🚀 Starting job recommendation API service on port {MICROSERVICE_PORT}")
    app.run(host='0.0.0.0', port=MICROSERVICE_PORT)