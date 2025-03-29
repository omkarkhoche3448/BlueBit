import pandas as pd
from jobspy import scrape_jobs
import logging
from datetime import datetime
from models import Job
import json

RESULTS_WANTED = 10000
HOURS_OLD = 720

def scrape_and_store_jobs(session, params=None):
    if params is None:
        # Default parameters for comprehensive job scraping
        params = {
            'site_name': ['indeed', 'linkedin', 'glassdoor', 'zip_recruiter', 'google'],
            'search_term': 'software engineer',
            'location': 'New York',
            'results_wanted': RESULTS_WANTED,
        }
    
    all_jobs = []
    
    # Define different parameter combinations to get a diverse dataset
    locations = ['India', 'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Australia', 'Netherlands', 'Singapore', 'Remote']
    job_types = ['fulltime', 'parttime', 'contract', 'internship']  # 'parttime', 'contract', 'internship'
    search_terms = ['data scientist', 'product manager', 'software developer', 'AI engineer', 'cybersecurity analyst', 'cloud engineer']
    
    # Loop through different parameter combinations
    for location in locations:
        for job_type in job_types:
            for search_term in search_terms:
                try:
                    current_params = params.copy()
                    current_params['location'] = location
                    current_params['job_type'] = job_type
                    current_params['search_term'] = search_term
                    current_params['results_wanted'] = RESULTS_WANTED  # Get more results per combination
                    current_params['hours_old'] = HOURS_OLD  # Approximately 30 days (1 month)
                    
                    logging.info(f"Scraping jobs for: {search_term} - {job_type} - {location}")
                    
                    jobs = scrape_jobs(**current_params)
                    
                    # Log first job for debugging
                    if len(jobs) > 0:
                        logging.info(f"Found {len(jobs)} jobs for {search_term} - {job_type} - {location}")
                        
                    # Replace NaN values with None before converting to dict
                    jobs = jobs.replace({pd.NA: None, float('nan'): None})
                    jobs_dict = jobs.to_dict(orient='records')
                    all_jobs.extend(jobs_dict)
                    
                    # If we've collected enough jobs, stop scraping
                    if len(all_jobs) >= 10000:
                        logging.info(f"Reached target of 10000 jobs. Stopping scraping.")
                        break
                        
                except Exception as e:
                    logging.error(f"Error scraping jobs for {search_term} - {job_type} - {location}: {str(e)}")
                    continue
            
            # Check if we've collected enough jobs
            if len(all_jobs) >= 10000:
                break
                
        # Check if we've collected enough jobs
        if len(all_jobs) >= 10000:
            break
    
    # Store in database - MODIFIED TO MERGE WITH EXISTING JOBS
    try:
        # First, get all existing jobs from the database
        existing_jobs = session.query(Job).all()
        existing_job_ids = {job.id for job in existing_jobs}
        logging.info(f"Found {len(existing_job_ids)} existing jobs in database")
        
        # Filter out duplicates from newly scraped jobs
        new_jobs_to_add = []
        for job_data in all_jobs:
            if job_data.get('id') not in existing_job_ids:
                new_jobs_to_add.append(job_data)
        
        logging.info(f"Adding {len(new_jobs_to_add)} new unique jobs to database")
        
        # Add only new jobs to the database
        for job_data in new_jobs_to_add:
            job = Job(**job_data)
            session.add(job)
        
        session.commit()
        logging.info(f"Successfully stored jobs in database. Total jobs: {len(existing_job_ids) + len(new_jobs_to_add)}")
        
        # Return all jobs (existing + new)
        all_jobs_dict = [{c.name: getattr(job, c.name) for c in job.__table__.columns} for job in session.query(Job).all()]
        return all_jobs_dict
        
    except Exception as e:
        session.rollback()
        logging.error(f"Database error: {str(e)}")
        return all_jobs  # Return scraped jobs even if DB operation failed
