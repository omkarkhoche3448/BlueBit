import logging
import json
from models import User, Job
from recommendation_engine import get_recommendations_for_user

def batch_process_recommendations(session):
    """
    Process recommendations for all users and store them in the database.
    This function is meant to be called periodically (e.g., once per hour).
    """
    logging.info("Starting batch processing of recommendations")
    try:
        # Get all users
        users = session.query(User).all()
        
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
            except Exception as e:
                logging.error(f"Error processing recommendations for user {user.clerk_id}: {str(e)}")
                continue
        
        session.commit()
        logging.info("Completed batch processing of recommendations")
    except Exception as e:
        session.rollback()
        logging.error(f"Error in batch recommendation processing: {str(e)}")

def start_recommendation_scheduler(session):
    import time
    import schedule
    
    # Schedule the batch processing to run every hour
    def run_batch_process():
        batch_process_recommendations(session)
    
    schedule.every(2).minutes.do(run_batch_process)
    
    # Run once immediately on startup
    batch_process_recommendations(session)
    
    # Keep running the scheduler
    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute