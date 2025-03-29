import logging
from config import Session, engine
from models import Base, User

def init_db_and_load_jobs():
    """Initialize database and load initial jobs."""
    from job_scraper import scrape_and_store_jobs
    
    # This will create the tables if they don't exist and update them if their schema changed
    Base.metadata.create_all(engine)
    
    # Check if we need to update existing User records to add the new columns
    session = Session()
    try:
        # Get all users
        users = session.query(User).all()
        
        # Update any users that don't have the new columns initialized
        for user in users:
            modified = False
            
            # Handle interested_job_ids
            if user.interested_job_ids is None:
                user.interested_job_ids = []
                modified = True
            
            # Handle not_interested_job_ids
            if user.not_interested_job_ids is None:
                user.not_interested_job_ids = []
                modified = True
                
        if modified:
            session.commit()
            
    except Exception as e:
        session.rollback()
        logging.error(f"Error updating user schema: {str(e)}")
    finally:
        session.close()
    
    logging.info("Loading initial jobs on startup...")
    session = Session()
    scrape_and_store_jobs(session)
    session.close()