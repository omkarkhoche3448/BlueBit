import pandas as pd
from jobspy import scrape_jobs
import logging
from datetime import datetime
from models import Job
import json

RESULTS_WANTED = 100
HOURS_OLD = 720

# Import necessary modules at the top of the file
import sqlalchemy
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy import inspect

def scrape_and_store_jobs(session, params=None):
    if params is None:
        # Default parameters for comprehensive job scraping
        params = {
            'site_name': ['indeed', 'linkedin', 'glassdoor', 'zip_recruiter', 'google', 'bayt', 'naukri'],
            'search_term': 'internship',
            'location': 'India',
            'results_wanted': RESULTS_WANTED,
        }
    
    all_jobs = []
    
    # Define different parameter combinations for our specific requirements
    
    # For remote internships (both in India and globally)
    remote_locations = ['India', 'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Australia', 
                 'Netherlands', 'Singapore', 'Remote']
    
    # For non-remote internships, we only want India
    non_remote_locations = ['India']
    
    job_type = 'internship'  # We're only interested in internships
    
    search_terms = [
        'software developer', 
        'data scientist', 
        'product manager', 
        'AI engineer', 
        'cybersecurity analyst', 
        'cloud engineer',
        'machine learning engineer',
        'research scientist',
        'computer vision engineer',
        'natural language processing engineer',
        'deep learning engineer',
        'backend developer',
        'full stack developer',
        'data engineer',
        'big data engineer',
        'algorithm researcher',
        'AI researcher',
        'ML researcher',
        'data analyst',
        'quantitative analyst',
        'applied scientist',
        'computational biologist',
        'robotics engineer',
        'blockchain developer',
        'devops engineer',
    ]
    
    # First, scrape all remote internships (both in India and globally)
    for location in remote_locations:
        for search_term in search_terms:
            try:
                current_params = params.copy()
                current_params['location'] = location
                current_params['job_type'] = job_type
                current_params['search_term'] = search_term
                current_params['results_wanted'] = RESULTS_WANTED
                current_params['hours_old'] = HOURS_OLD
                current_params['is_remote'] = True  # Setting is_remote to True for remote jobs
                
                logging.info(f"Scraping remote internships for: {search_term} - {location}")
                
                jobs = scrape_jobs(**current_params)
                
                if len(jobs) > 0:
                    logging.info(f"Found {len(jobs)} remote internships for {search_term} - {location}")
                    
                # Replace NaN values with None before converting to dict
                jobs = jobs.replace({pd.NA: None, float('nan'): None})
                jobs_dict = jobs.to_dict(orient='records')
                all_jobs.extend(jobs_dict)
                
                # If we've collected enough jobs, stop scraping
                if len(all_jobs) >= 2000:
                    logging.info(f"Reached target of 2000 jobs. Stopping scraping.")
                    break
                    
            except Exception as e:
                logging.error(f"Error scraping remote internships for {search_term} - {location}: {str(e)}")
                continue
        
        # Check if we've collected enough jobs
        if len(all_jobs) >= 2000:
            break
    
    # Next, scrape non-remote internships in India
    if len(all_jobs) < 2000:  # Only proceed if we haven't reached our target
        for search_term in search_terms:
            try:
                current_params = params.copy()
                current_params['location'] = 'India'  # Only in India for non-remote
                current_params['job_type'] = job_type
                current_params['search_term'] = search_term
                current_params['results_wanted'] = RESULTS_WANTED
                current_params['hours_old'] = HOURS_OLD
                current_params['is_remote'] = False  # Setting is_remote to False for non-remote jobs
                
                logging.info(f"Scraping non-remote internships for: {search_term} - India")
                
                jobs = scrape_jobs(**current_params)
                
                if len(jobs) > 0:
                    logging.info(f"Found {len(jobs)} non-remote internships for {search_term} - India")
                    
                # Replace NaN values with None before converting to dict
                jobs = jobs.replace({pd.NA: None, float('nan'): None})
                jobs_dict = jobs.to_dict(orient='records')
                all_jobs.extend(jobs_dict)
                
                # If we've collected enough jobs, stop scraping
                if len(all_jobs) >= 2000:
                    logging.info(f"Reached target of 2000 jobs. Stopping scraping.")
                    break
                    
            except Exception as e:
                logging.error(f"Error scraping non-remote internships for {search_term} - India: {str(e)}")
                continue
            
            # Check if we've collected enough jobs
            if len(all_jobs) >= 2000:
                break
    
    # Store in database - KEEPING THE EXISTING CODE LOGIC
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
        
        # Find the part where jobs are being added to the database
        logging.info(f"Adding {len(new_jobs_to_add)} new unique jobs to database")
        
        # Method 1: For PostgreSQL - using ON CONFLICT DO NOTHING
        if 'postgresql' in session.bind.dialect.name:
            try:
                # Get table object
                table = inspect(Job).mapped_table
                
                # Create values to insert
                values = [
                    {c.name: job_data.get(c.name) for c in table.c}
                    for job_data in new_jobs_to_add
                ]
                
                # Create insert statement with ON CONFLICT DO NOTHING
                stmt = insert(table).values(values)
                stmt = stmt.on_conflict_do_nothing(index_elements=['id'])
                
                # Execute statement
                result = session.execute(stmt)
                session.commit()
                logging.info(f"Successfully inserted {result.rowcount} jobs")
            except Exception as e:
                session.rollback()
                logging.error(f"Error during bulk insert: {str(e)}")
        
        # Method 2: For other databases - insert one by one
        else:
            successful_inserts = 0
            for job_data in new_jobs_to_add:
                try:
                    job = Job(**job_data)
                    session.add(job)
                    session.commit()
                    successful_inserts += 1
                except sqlalchemy.exc.IntegrityError:
                    session.rollback()
                    logging.warning(f"Skipping duplicate job ID: {job_data.get('id')}")
                except Exception as e:
                    session.rollback()
                    logging.error(f"Error inserting job {job_data.get('id')}: {str(e)}")
            
            logging.info(f"Successfully inserted {successful_inserts} out of {len(new_jobs_to_add)} jobs")
        
        session.commit()
        logging.info(f"Successfully stored jobs in database. Total jobs: {len(existing_job_ids) + len(new_jobs_to_add)}")
        
        # Return all jobs (existing + new)
        all_jobs_dict = [{c.name: getattr(job, c.name) for c in job.__table__.columns} for job in session.query(Job).all()]
        return all_jobs_dict
        
    except Exception as e:
        session.rollback()
        logging.error(f"Database error: {str(e)}")
        return all_jobs  # Return scraped jobs even if DB operation failed