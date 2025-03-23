import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from jobspy import scrape_jobs
import uuid
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# In-memory storage for saved jobs (in production, use a database)
saved_jobs = {}
applied_jobs = set()

@app.route('/api/search-jobs', methods=['GET', 'POST'])
def search_jobs():
    try:
        if request.method == 'POST':
            data = request.json
            filters = data.get('filters', {})
            
            # Convert frontend filters to JobSpy parameters
            params = {
                'site_name': ['indeed', 'linkedin'],
                'search_term': filters.get('searchTerm', 'software engineer'),
                'location': filters.get('location', 'New York'),
                'results_wanted': 20,
                'job_type': filters.get('jobType'),
                'is_remote': filters.get('location') == 'remote'
            }
        else:
            params = request.args.to_dict()
        
        jobs = scrape_jobs(**params)
        
        # Replace NaN values with None before converting to dict
        jobs = jobs.replace({pd.NA: None, float('nan'): None})
        jobs_dict = jobs.to_dict(orient='records')
        
        return jsonify(jobs_dict)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/job/<string:job_id>', methods=['GET'])
def get_job_by_id(job_id):
    try:
        jobs = scrape_jobs(
            site_name=['indeed', 'linkedin'],
            search_term='software engineer',
            results_wanted=1000
        )
        
        # Replace NaN values with None before converting to dict
        jobs = jobs.replace({pd.NA: None, float('nan'): None})
        jobs_dict = jobs.to_dict(orient='records')
        
        # Find the job with matching ID
        job = next((job for job in jobs_dict if str(job.get('job_id')) == job_id), None)
        
        if job:
            return jsonify(job)
        return jsonify({'error': 'Job not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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
    app.run(debug=True, port=8000)