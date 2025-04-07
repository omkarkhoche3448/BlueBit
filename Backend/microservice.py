import logging
import json
import os
from datetime import datetime
from functools import wraps
from flask import Flask, request, jsonify
from utils.db_utils import init_db_and_load_jobs
from recommendation_engine import init_recommendation_engine, get_recommendations_for_user
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

# Initialize recommendation engine
init_db_and_load_jobs()
init_recommendation_engine()
logging.info("✅ DB and recommendation engine initialized")

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
        # Get all users
        users = session.query(User).all()
        logging.info(f"Processing recommendations for {len(users)} users")
        
        results = {"total_users": len(users), "success_count": 0, "failed_users": []}
        
        for user in users:
            try:
                # Get recommendations for this user
                recommendations = get_recommendations_for_user(user.clerk_id, count=50)  # Get more than needed
                
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
                
                logging.info(f"Updated recommendations for user {user.clerk_id}: {len(recommendation_ids)} jobs")
                results["success_count"] += 1
            except Exception as e:
                error_msg = f"Error processing recommendations for user {user.clerk_id}: {str(e)}"
                logging.error(error_msg)
                results["failed_users"].append({"user_id": user.clerk_id, "error": str(e)})
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

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    logging.info(f"🚀 Starting job recommendation API service on port {port}")
    app.run(host='0.0.0.0', port=port)