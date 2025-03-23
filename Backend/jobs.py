import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from jobspy import scrape_jobs
import uuid
import db
from datetime import datetime
import threading
import time
import json
from db import get_db_connection, init_db, store_jobs, get_jobs, should_update_cache

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# In-memory storage for saved jobs (in production, use a database)
saved_jobs = {}
applied_jobs = set()

# Initialize database on startup
db.init_db()

def scrape_all_common_filters():
    """Background task to scrape jobs for common filter combinations"""
    print("Starting background job scraping...")
    
    # List of common filter combinations to pre-scrape
    common_filters = [
        # General searches
        {'search_term': 'software engineer', 'location': 'New York'},
        {'search_term': 'data scientist', 'location': 'San Francisco'},
        {'search_term': 'product manager', 'location': 'Seattle'},
        
        # Remote jobs
        {'search_term': 'software engineer', 'is_remote': True},
        {'search_term': 'data scientist', 'is_remote': True},
        {'search_term': 'product manager', 'is_remote': True},
        
        # Job types
        {'search_term': 'software engineer', 'job_type': 'fulltime'},
        {'search_term': 'software engineer', 'job_type': 'parttime'},
        {'search_term': 'software engineer', 'job_type': 'contract'},
    ]
    
    for filters in common_filters:
        # Check if we already have recent data for this filter combination
        filter_key = '_'.join(sorted([f"{k}:{v}" for k, v in filters.items()]))
        if not db.should_update_cache('common_filter', filters):
            print(f"Skipping filter combination (cached): {filters}")
            continue
            
        try:
            print(f"Scraping for filter combination: {filters}")
            params = {
                'site_name': ['indeed', 'linkedin', 'glassdoor'],
                'results_wanted': 50,
                **filters
            }
            
            jobs = scrape_jobs(**params)
            
            # Store in database
            db.store_jobs(jobs, 'common_filter', filters)
            
            # Don't overload job sites with requests
            time.sleep(5)
            
        except Exception as e:
            print(f"Error scraping for {filters}: {str(e)}")
    
    print("Background job scraping completed")

# Start the background scraping task when the app starts
def initialize_background_tasks():
    thread = threading.Thread(target=scrape_all_common_filters)
    thread.daemon = True
    thread.start()

@app.route('/api/search-jobs', methods=['GET', 'POST'])
def search_jobs():
    try:
        if request.method == 'POST':
            data = request.json
            filters = data.get('filters', {})
        else:
            # Handle GET parameters
            filters = {}
            for key, value in request.args.items():
                if key == 'is_remote':
                    if value.lower() == 'true':
                        filters[key] = True
                    elif value.lower() == 'false':
                        filters[key] = False
                else:
                    filters[key] = value
        
        # Try to get jobs from the database first
        jobs_data = db.get_jobs(filters)
        
        # If we found results in the database, return them
        if jobs_data:
            return jsonify(jobs_data)
        
        # Otherwise, fall back to scraping
        print("No cached results found, falling back to live scraping")
        
        # Convert frontend filters to JobSpy parameters
        params = {
            'site_name': ['indeed', 'linkedin', 'glassdoor'],
            'search_term': filters.get('searchTerm', 'software engineer'),
            'location': filters.get('location', 'New York'),
            'results_wanted': 50,
        }
        
        # Only add parameters if they have valid values
        if filters.get('jobType'):
            params['job_type'] = filters.get('jobType')
            
        if filters.get('experienceLevel'):
            params['experience_level'] = filters.get('experienceLevel')
            
        if filters.get('company'):
            params['company_name'] = filters.get('company')
        
        # Handle is_remote properly - ensure it's a boolean
        is_remote = filters.get('isRemote')
        if isinstance(is_remote, bool):
            params['is_remote'] = is_remote
        elif isinstance(is_remote, str):
            if is_remote.lower() == 'true':
                params['is_remote'] = True
            elif is_remote.lower() == 'false':
                params['is_remote'] = False
        
        jobs = scrape_jobs(**params)
        
        # Store the scraped jobs in the database for future use
        db.store_jobs(jobs)
        
        # Replace NaN values with None before converting to dict
        jobs = jobs.replace({pd.NA: None, float('nan'): None})
        jobs_dict = jobs.to_dict(orient='records')
        
        return jsonify(jobs_dict)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/job/<string:job_id>', methods=['GET'])
def get_job_by_id(job_id):
    # Try to get the job from the database
    conn = db.get_db_connection()
    cursor = conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,))
    job = cursor.fetchone()
    conn.close()
    
    if job:
        # Convert SQLite row to dictionary and parse JSON fields
        job_dict = dict(job)
        for field in ['skills', 'raw_data']:
            if job_dict.get(field):
                try:
                    job_dict[field] = json.loads(job_dict[field])
                except:
                    pass
        return jsonify(job_dict)
    
    # Job not found in database
    return jsonify({'error': 'Job not found'}), 404

@app.route('/api/apply-job/<string:job_id>', methods=['POST'])
def apply_to_job(job_id):
    try:
        applied_jobs.add(job_id)
        return jsonify({'message': f'Successfully applied to job {job_id}'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/save-job/<string:job_id>', methods=['POST', 'DELETE'])
def manage_saved_job(job_id):
    try:
        if request.method == 'POST':
            job_data = request.json
            saved_jobs[job_id] = job_data
            return jsonify({'message': f'Job {job_id} saved successfully'})
        else:
            if job_id in saved_jobs:
                del saved_jobs[job_id]
            return jsonify({'message': f'Job {job_id} removed from saved jobs'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Initialize background tasks before running the app
    initialize_background_tasks()
    app.run(debug=True, port=8000)