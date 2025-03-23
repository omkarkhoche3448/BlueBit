import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from jobspy import scrape_jobs

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/api/jobs/search', methods=['GET', 'POST'])  # Update the endpoint path
def search_jobs():
    try:
        if request.method == 'GET':
            params = request.args.to_dict()
            if 'site_names' in params:
                params['site_name'] = params['site_names'].split(',')
            if 'results_wanted' in params:
                params['results_wanted'] = int(params['results_wanted'])
        else:
            params = request.json
        
        jobs = scrape_jobs(
            site_name=params.get('site_name', ['indeed', 'linkedin']),
            search_term=params.get('search_term', 'software engineer'),
            location=params.get('location', 'New York'),
            results_wanted=params.get('results_wanted', 20)
        )
        
        # Convert DataFrame to dictionary and handle NaN values
        jobs_dict = jobs.where(pd.notnull(jobs), None).to_dict(orient='records')
        return jsonify(jobs_dict)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port='8000')