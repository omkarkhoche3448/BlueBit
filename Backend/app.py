from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import google.generativeai as genai
from PyPDF2 import PdfReader
from docx import Document
import json
import re
import csv
from jobspy import scrape_jobs
from io import StringIO
import pandas as pd
from datetime import datetime
from typing import Dict, List, Any, Optional
import traceback
import uuid
from jobspy import scrape_jobs

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

# Configure Gemini API
GEMINI_API_KEY = 'AIzaSyDCSbDt2Xdd3xvvIIwqqcc9EiZfQ_mTyHM'  
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash', generation_config={
    'temperature': 0
})  # Set temperature to 0 for deterministic outputs

# Function to extract text from PDF files
def extract_text_from_pdf(file):
    try:
        reader = PdfReader(file)
        text = ''
        for page in reader.pages:
            text += page.extract_text() or ''  # Handle cases where extract_text() returns None
        return text, None
    except Exception as e:
        return None, str(e)

# Function to extract text from DOCX files
def extract_text_from_docx(file):
    try:
        doc = Document(file)
        text = ''
        for paragraph in doc.paragraphs:
            text += paragraph.text + '\n'
        return text, None
    except Exception as e:
        return None, str(e)

# Function to analyze the resume and return ATS scoring
def analyze_resume(text):
    prompt = f"""
    Analyze this resume and provide an ATS score out of 100, along with detailed feedback. Consider the following criteria, each with the specified weight:

    1. Keyword Optimization (20): Check for the presence of relevant skills, job titles, and industry terms. Look for keywords commonly expected in resumes for the field or industry mentioned.
    2. Action Verbs (15): Evaluate the use of strong action verbs in bullet points, such as "led," "developed," "implemented," etc.
    3. Measurable Achievements (15): Look for quantifiable results in the experience section, e.g., "increased sales by 20%" or "managed a team of 10."
    4. Clarity and Conciseness (15): Assess the clarity and brevity of the writing. Check for concise sentences and avoidance of unnecessary jargon.
    5. Professional Tone (10): Ensure the language is formal and professional, without informal expressions or slang.
    6. Section Completeness (10): Verify the presence of standard sections like Experience, Education, and Skills.
    7. Length (10): Count the words in the resume. For a one-page resume, the ideal word count is 450-600 words. For two pages, the ideal range is 800-1200 words. Score based on adherence to these ranges.
    8. Format Indicators (5): Look for textual signs of poor formatting, such as excessive symbols, unusual characters, or inconsistent spacing.

    For each criterion, provide a sub-score out of the specified weight and a brief comment explaining the score. Calculate the total score by summing the sub-scores.

    Additionally, provide line-by-line improvement suggestions by:
    1. Identifying weak or vague phrases and suggesting stronger alternatives
    2. Highlighting missing important keywords or skills
    3. Pointing out formatting issues or inconsistencies
    4. Suggesting ways to make achievements more quantifiable
    5. Recommending better action verbs where applicable

    Return the analysis results strictly in the following JSON format without any additional text or explanations:

    {{
        "score": <total score out of 100>,
        "sub_scores": {{
            "Keyword Optimization": <score out of 20>,
            "Action Verbs": <score out of 15>,
            "Measurable Achievements": <score out of 15>,
            "Clarity and Conciseness": <score out of 15>,
            "Professional Tone": <score out of 10>,
            "Section Completeness": <score out of 10>,
            "Length": <score out of 10>,
            "Format Indicators": <score out of 5>
        }},
        "comments": {{
            "Keyword Optimization": "<comment>",
            "Action Verbs": "<comment>",
            "Measurable Achievements": "<comment>",
            "Clarity and Conciseness": "<comment>",
            "Professional Tone": "<comment>",
            "Section Completeness": "<comment>",
            "Length": "<comment>",
            "Format Indicators": "<comment>"
        }},
        "line_by_line_feedback": [
            {{
                "line_number": <line number>,
                "original_text": "<original text>",
                "suggestion": "<improvement suggestion>",
                "reason": "<reason for suggestion>"
            }}
        ],
        "overall_assessment": "<summary of strengths and weaknesses>",
        "improvement_tips": "<specific tips for enhancement>",
        "keyword_suggestions": [
            {{
                "category": "<category name>",
                "missing_keywords": ["<keyword1>", "<keyword2>", ...]
            }}
        ],
        "action_verb_alternatives": {{
            "<weak_verb>": ["<strong_alternative1>", "<strong_alternative2>", ...]
        }}
    }}

    Resume text:
    {text}
    """

    try:
        response = model.generate_content(prompt)
        response_text = response.text
        
        json_match = re.search(r'({.*})', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
            analysis_result = json.loads(json_str)
        else:
            try:
                analysis_result = json.loads(response_text)
            except:
                return {"error": "Failed to extract JSON from the response"}
        
        if "score" in analysis_result:
            analysis_result["score"] = round(analysis_result["score"])
            
            if "sub_scores" in analysis_result:
                for key in analysis_result["sub_scores"]:
                    analysis_result["sub_scores"][key] = round(analysis_result["sub_scores"][key], 1)
                    
                total = sum(analysis_result["sub_scores"].values())
                analysis_result["score"] = round(total)
        
        return analysis_result
        
    except json.JSONDecodeError as e:
        return {"error": f"Failed to parse analysis result as JSON: {str(e)}"}
    except Exception as e:
        return {"error": f"Analysis failed: {str(e)}"}

# API endpoint for resume analysis
@app.route('/api/analyze', methods=['POST'])
def analyze():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    try:
        # Determine file type and extract text
        if file.filename.endswith('.pdf'):
            text, error = extract_text_from_pdf(file)
        elif file.filename.endswith('.docx'):
            text, error = extract_text_from_docx(file)
        else:
            return jsonify({'error': 'Unsupported file format (only PDF and DOCX are supported)'}), 400

        # Check for extraction errors
        if error:
            return jsonify({'error': f'Failed to extract text: {error}'}), 400
        if not text:
            return jsonify({'error': 'No text extracted from the file'}), 400

        # Analyze the resume
        analysis_result = analyze_resume(text)
        if "error" in analysis_result:
            return jsonify(analysis_result), 500
        return jsonify(analysis_result)

    except Exception as e:
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500

def format_job_for_frontend(job_dict):
    """
    Transform JobSpy job data format to match the frontend's expected format exactly
    """
    # Generate a unique ID if not present
    if 'job_id' in job_dict and job_dict['job_id']:
        job_id = str(job_dict['job_id'])
    else:
        job_id = str(uuid.uuid4())
    
    # Map experience level based on job title and description
    job_level = "Entry-Level"
    title_lower = job_dict.get('title', '').lower()
    description_lower = job_dict.get('description', '').lower() if job_dict.get('description') else ''
    
    if any(level in title_lower or level in description_lower for level in ['senior', 'lead', 'sr.', 'sr ']):
        job_level = "Senior"
    elif any(level in title_lower or level in description_lower for level in ['mid', 'intermediate']):
        job_level = "Mid-Level"
    elif any(level in title_lower or level in description_lower for level in ['executive', 'director', 'vp', 'c-level']):
        job_level = "Executive"
    
    # Parse location
    city = ''
    state = ''
    country = 'United States'  # Default
    
    if job_dict.get('location'):
        location_parts = job_dict.get('location', '').split(',')
        if len(location_parts) >= 1:
            city = location_parts[0].strip()
        if len(location_parts) >= 2:
            state = location_parts[1].strip()
        
    if job_dict.get('country'):
        country = job_dict.get('country')
    
    # Format location as per frontend requirement
    location = {
        "country": country,
        "city": city,
        "state": state,
    }
    
    # Format salary
    salary = None
    if job_dict.get('compensation_min') is not None or job_dict.get('compensation_max') is not None:
        salary = {
            "interval": job_dict.get('compensation_interval', 'yearly'),
            "min_amount": job_dict.get('compensation_min', 0),
            "max_amount": job_dict.get('compensation_max', 0),
            "currency": job_dict.get('compensation_currency', 'USD'),
            "salary_source": "direct_data",
        }
    
    # Determine job type
    job_type = job_dict.get('job_type', '').lower() if job_dict.get('job_type') else ''
    if not job_type:
        if 'full-time' in description_lower or 'fulltime' in description_lower:
            job_type = 'fulltime'
        elif 'part-time' in description_lower or 'parttime' in description_lower:
            job_type = 'parttime'
        elif 'contract' in description_lower:
            job_type = 'contract'
        elif 'intern' in description_lower:
            job_type = 'internship'
        else:
            job_type = 'fulltime'  # Default
    
    # Extract emails using regex
    emails = []
    if job_dict.get('description'):
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        found_emails = re.findall(email_pattern, job_dict.get('description', ''))
        if found_emails:
            emails = found_emails
    
    # Extract skills from description
    skills = []
    common_skills = [
        "Python", "JavaScript", "React", "Angular", "Vue", "TypeScript", "Node.js", 
        "Java", "C++", "C#", ".NET", "AWS", "Azure", "SQL", "NoSQL", "MongoDB",
        "Docker", "Kubernetes", "Git", "HTML", "CSS", "PHP", "Ruby", "Swift",
        "Go", "Rust", "Redux", "GraphQL", "REST API", "Django", "Flask", "Spring"
    ]
    
    for skill in common_skills:
       if skill.lower() in description_lower or (job_dict.get('description') and skill in job_dict.get('description')):
            skills.append(skill)
    
    # Extract job function based on title/description
    job_function = []
    if "frontend" in title_lower or "front-end" in title_lower or "front end" in title_lower:
        job_function.append("Frontend Development")
    if "backend" in title_lower or "back-end" in title_lower or "back end" in title_lower:
        job_function.append("Backend Development")
    if "fullstack" in title_lower or "full-stack" in title_lower or "full stack" in title_lower:
        job_function.append("Full Stack Development")
    if not job_function:
        job_function.append("Software Development")  # Default
    
    # Company industry based on description/site
    company_industry = "Technology"  # Default
    industry_keywords = {
        "healthcare": ["healthcare", "medical", "health"],
        "finance": ["finance", "banking", "investment"],
        "retail": ["retail", "e-commerce", "shop"],
        "education": ["education", "school", "teaching"],
        "manufacturing": ["manufacturing", "factory", "production"],
    }
    
    for industry, keywords in industry_keywords.items():
        if any(keyword in description_lower for keyword in keywords):
            company_industry = industry.capitalize()
            break
    
    # Format for frontend
    formatted_job = {
        "id": job_id,
        "title": job_dict.get('title', ''),
        "company": job_dict.get('company', ''),
        "company_url": job_dict.get('company_url', ''),
        "job_url": job_dict.get('url', ''),
        "location": location,
        "is_remote": job_dict.get('is_remote', False),
        "description": job_dict.get('description', ''),
        "job_type": job_type,
        "job_function": job_function,
        "salary": salary,
        "date_posted": job_dict.get('date_posted', datetime.now().isoformat()),
        "emails": emails,
        "skills": skills,
        "job_level": job_level,
        "company_industry": company_industry,
        "company_logo": "",  # JobSpy doesn't provide this
        "company_country": location["country"],
        "company_addresses": [f"{location['city']}, {location['state']}"] if location['city'] and location['state'] else [],
        "company_employees_label": "",  # JobSpy doesn't provide this
        "company_revenue_label": "",  # JobSpy doesn't provide this
        "company_description": ""  # JobSpy doesn't provide this
    }
    
    return formatted_job

@app.route('/api/search-jobs', methods=['GET', 'POST'])
def search_jobs():
    """
    Endpoint to search for jobs using JobSpy and format them for the frontend
    """
    try:
        # Get parameters from request (either GET or POST)
        if request.method == 'POST':
            params = request.json if request.json else {}
        else:
            params = request.args.to_dict(flat=False)
            
            # Convert parameters to appropriate types
            for key, value in params.items():
                if len(value) == 1:
                    params[key] = value[0]  # Extract single values from lists
                
                # Convert boolean strings to actual booleans
                if key == 'is_remote' or key == 'easy_apply' or key == 'linkedin_fetch_description' or key == 'enforce_annual_salary':
                    if isinstance(params[key], str):
                        params[key] = params[key].lower() == 'true'
                
                # Convert numeric strings to integers
                if key in ['distance', 'results_wanted', 'hours_old', 'offset', 'verbose']:
                    if isinstance(params[key], str) and params[key].isdigit():
                        params[key] = int(params[key])
                
                # Handle site_name as a list
                if key == 'site_name' and isinstance(params[key], str):
                    if ',' in params[key]:
                        params[key] = [site.strip() for site in params[key].split(',')]

        # Map frontend filters to JobSpy parameters
        if 'filters' in params:
            filters = params['filters']
            # Handle searchTerm
            if filters.get('searchTerm'):
                params['search_term'] = filters['searchTerm']
            
            # Handle location
            if filters.get('location'):
                if filters['location'] != 'remote':
                    params['location'] = filters['location']
                else:
                    params['is_remote'] = True
            
            # Handle jobType
            if filters.get('jobType'):
                params['job_type'] = filters['jobType']
            
            # Handle datePosted - convert to hours_old
            if filters.get('datePosted'):
                date_posted_map = {
                    'today': 24,
                    'week': 168,  # 7 days * 24 hours
                    'month': 720  # 30 days * 24 hours
                }
                if filters['datePosted'] in date_posted_map:
                    params['hours_old'] = date_posted_map[filters['datePosted']]
            
            # Handle experienceLevel
            if filters.get('experienceLevel'):
                # JobSpy doesn't directly support experience level filtering
                # We'll handle this in post-processing
                pass
            
            # Handle salaryRange
            if filters.get('salaryRange'):
                # JobSpy doesn't directly support salary range filtering
                # We'll handle this in post-processing
                pass
            
            # Remove the filters key as JobSpy doesn't use it
            params.pop('filters', None)

        # Ensure we have at least search_term or google_search_term
        if 'search_term' not in params and 'google_search_term' not in params:
            # Use a default search term if none provided
            params['search_term'] = 'software developer'

        # Set some defaults if not specified
        if 'site_name' not in params:
            params['site_name'] = ['linkedin', 'indeed', 'glassdoor']
        if 'results_wanted' not in params:
            params['results_wanted'] = 25
        if 'verbose' not in params:
            params['verbose'] = 0

        # Call jobspy's scrape_jobs function
        jobs = scrape_jobs(**params)
        
        # Convert to frontend format
        result = []
        for _, row in jobs.iterrows():
            job_dict = row.to_dict()
            
            # Handle non-serializable objects (like numpy types)
            for key, value in job_dict.items():
                if pd.isna(value):
                    job_dict[key] = None
                elif isinstance(value, (pd.Timestamp, datetime)):
                    job_dict[key] = value.isoformat()
            
            # Format job for frontend
            formatted_job = format_job_for_frontend(job_dict)
            
            # Apply additional filters that JobSpy doesn't handle natively
            include_job = True
            
            # Filter by experience level if specified
            if 'filters' in params and params['filters'].get('experienceLevel'):
                exp_level = params['filters']['experienceLevel']
                if exp_level == 'entry' and formatted_job['job_level'] != 'Entry-Level':
                    include_job = False
                elif exp_level == 'mid' and formatted_job['job_level'] != 'Mid-Level':
                    include_job = False
                elif exp_level == 'senior' and formatted_job['job_level'] != 'Senior':
                    include_job = False
                elif exp_level == 'executive' and formatted_job['job_level'] != 'Executive':
                    include_job = False
            
            # Filter by salary range if specified
            if 'filters' in params and params['filters'].get('salaryRange') and formatted_job['salary']:
                salary_range = params['filters']['salaryRange']
                min_salary, max_salary = None, None
                
                if '-' in salary_range:
                    parts = salary_range.split('-')
                    min_salary = int(parts[0]) if parts[0] else None
                    max_salary = int(parts[1]) if parts[1] else None
                else:
                    min_salary = int(salary_range)
                
                if min_salary and formatted_job['salary']['max_amount'] < min_salary:
                    include_job = False
                if max_salary and formatted_job['salary']['min_amount'] > max_salary:
                    include_job = False
            
            if include_job:
                result.append(formatted_job)
            
        return jsonify(result)
    
    except Exception as e:
        # Log the full traceback for debugging
        traceback_str = traceback.format_exc()
        app.logger.error(f"Error searching jobs: {traceback_str}")
        
        return jsonify({
            'error': str(e),
            'traceback': traceback_str
        }), 500

@app.route('/api/job/<string:job_id>', methods=['GET'])
def get_job_by_id(job_id):
    """
    Endpoint to get a specific job by ID
    Uses a simulated database lookup with cached search results
    """
    try:
        # Instead of doing a new search every time, we'll use the search parameters
        # from the request to find similar jobs, then look for our target job
        
        # Get search parameters from the query string if available
        search_term = request.args.get('search_term', 'software developer')
        location = request.args.get('location', '')
        
        # Build parameters for job search
        params = {
            'site_name': ['linkedin', 'indeed', 'glassdoor'],
            'search_term': search_term,
            'results_wanted': 100,  # Request more results to increase chance of finding the job
            'verbose': 0
        }
        
        # Add location if provided
        if location:
            params['location'] = location
            
        # Add remote flag if specified
        if request.args.get('is_remote') == 'true':
            params['is_remote'] = True
            
        app.logger.info(f"Searching for job with ID: {job_id} using params: {params}")
            
        # Call jobspy's scrape_jobs function
        jobs = scrape_jobs(**params)
        
        # Look for a job with matching ID or similar characteristics
        target_job = None
        potential_matches = []
        
        for _, row in jobs.iterrows():
            job_dict = row.to_dict()
            
            # Handle non-serializable objects
            for key, value in job_dict.items():
                if pd.isna(value):
                    job_dict[key] = None
                elif isinstance(value, (pd.Timestamp, datetime)):
                    job_dict[key] = value.isoformat()
            
            # Format job
            formatted_job = format_job_for_frontend(job_dict)
            
            # Exact match by ID
            if formatted_job['id'] == job_id:
                target_job = formatted_job
                break
                
            # Collect potential matches based on URL (in case ID changed but URL is consistent)
            if job_dict.get('url') and 'url' in request.args and job_dict['url'] == request.args['url']:
                potential_matches.append(formatted_job)
                
        # If we didn't find an exact match but have potential matches, use the first one
        if not target_job and potential_matches:
            target_job = potential_matches[0]
        
        if target_job:
            return jsonify(target_job)
        else:
            # If we couldn't find it, create a mock job as fallback
            # (In production, you'd store jobs in a database instead)
            mock_job = {
                "id": job_id,
                "title": request.args.get('title', 'Software Developer'),
                "company": request.args.get('company', 'Example Company'),
                "description": "Job details could not be retrieved. Please view the original job posting.",
                "job_type": request.args.get('job_type', 'fulltime'),
                "job_level": request.args.get('job_level', 'Mid-Level'),
                "location": {
                    "city": request.args.get('city', ''),
                    "state": request.args.get('state', ''),
                    "country": request.args.get('country', 'US')
                },
                "is_remote": request.args.get('is_remote', 'false').lower() == 'true',
                "salary": None,
                "date_posted": request.args.get('date_posted', datetime.now().isoformat()),
                "postedDate": request.args.get('date_posted', datetime.now().isoformat()),
                "url": request.args.get('url', ''),
                "source": request.args.get('source', '')
            }
            
            return jsonify(mock_job)
    
    except Exception as e:
        traceback_str = traceback.format_exc()
        app.logger.error(f"Error fetching job: {traceback_str}")
        
        return jsonify({
            'error': str(e),
            'traceback': traceback_str
        }), 500
    
@app.route('/api/apply-job/<string:job_id>', methods=['POST'])
def apply_to_job(job_id):
    """
    Endpoint to simulate applying to a job
    In a real implementation, this would submit an application
    """
    try:
        # Simulate API call delay - in reality, this would submit application data
        return jsonify({
            'success': True,
            'message': f'Successfully applied to job {job_id}',
            'job_id': job_id
        })
    
    except Exception as e:
        return jsonify({
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

@app.route('/api/job-search-parameters', methods=['GET'])
def get_job_search_parameters():
    """
    Returns the available parameters for the job search API
    """
    parameters = {
        "site_name": {
            "type": "list or string",
            "description": "Job boards to search",
            "options": ["linkedin", "zip_recruiter", "indeed", "glassdoor", "google", "bayt", "naukri"],
            "default": "all"
        },
        "search_term": {
            "type": "string",
            "description": "Job search keywords"
        },
        "google_search_term": {
            "type": "string",
            "description": "Search term for Google jobs (this is the only parameter for filtering Google jobs)"
        },
        "location": {
            "type": "string",
            "description": "Job location"
        },
        "distance": {
            "type": "integer",
            "description": "Search radius in miles",
            "default": 50
        },
        "job_type": {
            "type": "string",
            "description": "Type of job",
            "options": ["fulltime", "parttime", "internship", "contract"]
        },
        "is_remote": {
            "type": "boolean",
            "description": "Filter for remote jobs"
        },
        "results_wanted": {
            "type": "integer",
            "description": "Number of job results to retrieve for each site"
        },
        "easy_apply": {
            "type": "boolean",
            "description": "Filter for jobs hosted on the job board site"
        },
        "description_format": {
            "type": "string",
            "description": "Format type of job descriptions",
            "options": ["markdown", "html"],
            "default": "markdown"
        },
        "offset": {
            "type": "integer",
            "description": "Start search from an offset (e.g., 25 will start from the 25th result)"
        },
        "hours_old": {
            "type": "integer",
            "description": "Filter jobs by hours since posted"
        },
        "verbose": {
            "type": "integer",
            "description": "Controls verbosity of runtime printouts",
            "options": [0, 1, 2],
            "default": 2
        },
        "linkedin_fetch_description": {
            "type": "boolean",
            "description": "Fetch full description and direct job URL for LinkedIn"
        },
        "country_indeed": {
            "type": "string",
            "description": "Filter country on Indeed & Glassdoor"
        },
        "enforce_annual_salary": {
            "type": "boolean",
            "description": "Convert wages to annual salary"
        }
    }
    
    # Add limitations
    limitations = {
        "indeed": [
            "Only one from this list can be used in a search: hours_old, job_type & is_remote, easy_apply"
        ],
        "linkedin": [
            "Only one from this list can be used in a search: hours_old, easy_apply"
        ],
        "supported_countries": {
            "linkedin": "LinkedIn searches globally & uses only the location parameter",
            "ziprecruiter": "ZipRecruiter searches for jobs in US/Canada & uses only the location parameter",
            "indeed_glassdoor": "Indeed & Glassdoor support most countries, but country_indeed parameter is required"
        }
    }
    
    return jsonify({
        "parameters": parameters,
        "limitations": limitations
    })


if __name__ == '__main__':
    app.run(debug=True)