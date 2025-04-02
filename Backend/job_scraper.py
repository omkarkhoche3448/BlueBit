import pandas as pd
from jobspy import scrape_jobs
import logging
from datetime import datetime
from models import Job
import sqlalchemy
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy import inspect

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

RESULTS_WANTED = 50
HOURS_OLD = 720  # Approximately 30 days

def scrape_and_store_jobs(session, params=None):
    if params is None:
        # Default parameters focusing on remote jobs
        params = {
            'site_name': ['indeed', 'linkedin', 'glassdoor', 'zip_recruiter', 'google'],
            'search_term': 'software engineer remote',
            'location': 'Remote',
            'is_remote': True,
            'results_wanted': RESULTS_WANTED,
            'hours_old': HOURS_OLD
        }
    
    all_jobs = []
    
    # Define countries to search across (supported by Indeed & Glassdoor)
    countries = [
        'USA', 'UK', 'Canada', 'Australia', 'Germany', 'France', 'India', 
        'Netherlands', 'Singapore', 'Switzerland', 'Spain', 'Italy', 'Japan', 
        'Sweden', 'Ireland', 'Brazil', 'Mexico', 'South Africa', 'Hong Kong', 
        'New Zealand', 'Vietnam', 'Belgium'
    ]
    
    # Job roles to search for
    search_terms = [
        'software engineer remote', 
        'data scientist remote', 
        'product manager remote', 
        'web developer remote', 
        'AI engineer remote', 
        'cybersecurity analyst remote', 
        'cloud engineer remote',
        'devops engineer remote',
        'frontend developer remote',
        'backend developer remote'
    ]
    
    # Iterate through countries and search terms
    for country in countries:
        for search_term in search_terms:
            try:
                # Prepare parameters for this specific search
                current_params = {
                    'site_name': ['indeed', 'linkedin', 'glassdoor', 'zip_recruiter'],
                    'search_term': search_term,
                    'location': 'Remote',
                    'is_remote': True,
                    'results_wanted': RESULTS_WANTED,
                    'hours_old': HOURS_OLD,
                    'country_indeed': country  # Set country for Indeed & Glassdoor
                }
                
                logging.info(f"Scraping remote jobs for: {search_term} in {country}")
                
                # Execute the job scraping
                jobs = scrape_jobs(**current_params)
                
                # Log results
                if len(jobs) > 0:
                    logging.info(f"Found {len(jobs)} remote jobs for {search_term} in {country}")
                    
                # Clean data and convert to dict
                jobs = jobs.replace({pd.NA: None, float('nan'): None})
                jobs_dict = jobs.to_dict(orient='records')
                all_jobs.extend(jobs_dict)
                
                # Break if we have collected enough jobs
                if len(all_jobs) >= 500:
                    logging.info(f"Reached target of 500 jobs. Stopping scraping.")
                    break
                    
            except Exception as e:
                logging.error(f"Error scraping jobs for {search_term} in {country}: {str(e)}")
                continue
        
        # Break outer loop if we have enough jobs
        if len(all_jobs) >= 500:
            break
    
    # Additional search for LinkedIn-specific remote jobs globally
    try:
        linkedin_params = {
            'site_name': ['linkedin'],
            'search_term': 'remote',
            'location': 'Worldwide',
            'is_remote': True,
            'results_wanted': 100,
            'hours_old': HOURS_OLD,
            'linkedin_fetch_description': True  # Get more details from LinkedIn
        }
        
        logging.info("Scraping global remote jobs from LinkedIn")
        linkedin_jobs = scrape_jobs(**linkedin_params)
        
        if len(linkedin_jobs) > 0:
            logging.info(f"Found {len(linkedin_jobs)} global remote jobs from LinkedIn")
            linkedin_jobs = linkedin_jobs.replace({pd.NA: None, float('nan'): None})
            linkedin_jobs_dict = linkedin_jobs.to_dict(orient='records')
            all_jobs.extend(linkedin_jobs_dict)
    except Exception as e:
        logging.error(f"Error scraping global LinkedIn jobs: {str(e)}")
    
    # Store in database - using existing logic from your code
    try:
        # Get existing jobs from the database
        existing_jobs = session.query(Job).all()
        existing_job_ids = {job.id for job in existing_jobs}
        logging.info(f"Found {len(existing_job_ids)} existing jobs in database")
        
        # Filter out duplicates
        new_jobs_to_add = []
        for job_data in all_jobs:
            if job_data.get('id') not in existing_job_ids:
                new_jobs_to_add.append(job_data)
        
        logging.info(f"Adding {len(new_jobs_to_add)} new unique jobs to database")
        
        # Method 1: For PostgreSQL - using ON CONFLICT DO NOTHING
        if 'postgresql' in session.bind.dialect.name:
            try:
                table = inspect(Job).mapped_table
                
                values = [
                    {c.name: job_data.get(c.name) for c in table.c}
                    for job_data in new_jobs_to_add
                ]
                
                stmt = insert(table).values(values)
                stmt = stmt.on_conflict_do_nothing(index_elements=['id'])
                
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