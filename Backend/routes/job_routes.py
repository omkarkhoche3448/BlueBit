from flask import request, jsonify
import logging
import pandas as pd
from datetime import datetime
from sqlalchemy import func
from config import Session
from models import Job, User

def register_job_routes(app):
    @app.route('/api/search-jobs', methods=['GET', 'POST'])
    def search_jobs():
        try:
            if request.method == 'POST':
                data = request.json
                filters = data.get('filters', {})
                clerk_id = data.get('clerkId')
                
                # Get a database session
                session = Session()
                
                # Start with a base query for all jobs
                query = session.query(Job)
                
                # Filter out jobs the user is not interested in
                if clerk_id:
                    user = session.query(User).filter(User.clerk_id == clerk_id).first()
                    if user and user.not_interested_job_ids:
                        # PostgreSQL handles JSON arrays natively
                        if user.not_interested_job_ids:
                            query = query.filter(~Job.id.in_(user.not_interested_job_ids))
                
                # Apply filters
                if filters.get('searchTerm'):
                    search_term = f"%{filters['searchTerm']}%"
                    query = query.filter(
                        (Job.title.ilike(search_term)) | 
                        (Job.description.ilike(search_term)) |
                        (Job.company.ilike(search_term))
                    )
                
                if filters.get('jobType'):
                    query = query.filter(Job.job_type.ilike(f"%{filters['jobType']}%"))
                    
                if filters.get('location'):
                    location_filter = filters['location']
                    # If location is a list, take the first item
                    if isinstance(location_filter, list):
                        location_filter = location_filter[0]
                    location_filter = location_filter.lower()
                    query = query.filter(func.lower(Job.location).contains(location_filter))

                if filters.get('company'):
                    company_filter = filters['company']
                    # Debug logging
                    logging.debug(f"Filtering by company: {company_filter}")
                    
                    # Handle potential list input
                    if isinstance(company_filter, list):
                        company_filter = company_filter[0]
                    
                    company_filter = company_filter.lower()
                    
                    # More precise filtering
                    query = query.filter(func.lower(Job.company) == company_filter)
                    
                if filters.get('isRemote') == 'true':
                    query = query.filter(Job.is_remote == True)
                    
                # Handle salary range if provided
                if filters.get('salaryRange'):
                    salary_range = filters['salaryRange']
                    # Implement salary range filtering based on your specific format
                    # Example: if salary_range is "50000-100000"
                    if '-' in salary_range:
                        min_salary, max_salary = salary_range.split('-')
                        if min_salary:
                            query = query.filter(Job.min_amount >= float(min_salary))
                        if max_salary:
                            query = query.filter(Job.max_amount <= float(max_salary))
                
                # Handle date posted filter
                if filters.get('datePosted'):
                    date_posted = filters['datePosted']
                    today = datetime.now().date()
                    
                    if date_posted == 'past24h':
                        date_threshold = today - pd.Timedelta(days=1)
                        query = query.filter(Job.date_posted >= date_threshold)
                    elif date_posted == 'past3days':
                        date_threshold = today - pd.Timedelta(days=3)
                        query = query.filter(Job.date_posted >= date_threshold)
                    elif date_posted == 'pastWeek':
                        date_threshold = today - pd.Timedelta(days=7)
                        query = query.filter(Job.date_posted >= date_threshold)
                    elif date_posted == 'pastMonth':
                        date_threshold = today - pd.Timedelta(days=30)
                        query = query.filter(Job.date_posted >= date_threshold)
                
                # Apply sorting
                if filters.get('sortBy'):
                    sort_by = filters['sortBy']
                    if sort_by == 'datePosted':
                        query = query.order_by(Job.date_posted.desc())
                    elif sort_by == 'salary':
                        query = query.order_by(Job.max_amount.desc())
                    # Default is relevance, which doesn't need explicit sorting
                
                # Execute the query and get results
                filtered_jobs = query.all()
                
                # Convert SQLAlchemy objects to dictionaries
                jobs_list = [{c.name: getattr(job, c.name) for c in job.__table__.columns} for job in filtered_jobs]    
                session.close()
                return jsonify(jobs_list)
            
            # Handle GET request (optional - you might want to return all jobs or a subset)
            clerk_id = request.args.get('clerkId')
            session = Session()
            
            # Start with base query
            query = session.query(Job).limit(100)
            
            # Filter out not interested jobs if clerk_id is provided
            if clerk_id:
                user = session.query(User).filter(User.clerk_id == clerk_id).first()
                if user and user.not_interested_job_ids:
                    # PostgreSQL handles JSON arrays natively
                    if user.not_interested_job_ids:
                        query = query.filter(~Job.id.in_(user.not_interested_job_ids))
            
            all_jobs = query.all()
            jobs_list = [{c.name: getattr(job, c.name) for c in job.__table__.columns} for job in all_jobs]
            session.close()
            return jsonify(jobs_list)
                
        except Exception as e:
            logging.error(f"Error in search_jobs: {str(e)}")
            return jsonify({'error': str(e)}), 500

    @app.route('/api/job/<string:job_id>', methods=['GET'])
    def get_job_by_id(job_id):
        session = Session()
        try:
            job = session.query(Job).filter(Job.id == job_id).first()
            if job:
                job_dict = {c.name: getattr(job, c.name) for c in job.__table__.columns}
                return jsonify(job_dict)
            else:
                return jsonify({"error": "Job not found"}), 404
        finally:
            session.close()

    @app.route('/api/apply-job/<string:job_id>', methods=['POST'])
    def apply_to_job(job_id):
        try:
            # applied_jobs.add(job_id)
            return jsonify({'message': f'Successfully applied to job {job_id}'})
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/save-job/<string:job_id>', methods=['POST', 'DELETE'])
    def manage_saved_job(job_id):
        try:
            if request.method == 'POST':
                job_data = request.json
                # saved_jobs[job_id] = job_data
                return jsonify({'message': f'Job {job_id} saved successfully'})
            else:
                # if job_id in saved_jobs:
                    # del saved_jobs[job_id]
                return jsonify({'message': f'Job {job_id} removed from saved jobs'})
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/users/<string:clerk_id>/job-interest', methods=['POST'])
    def update_job_interest(clerk_id):
        session = Session()
        try:
            data = request.json
            job_id = data.get('jobId')
            interest = data.get('interest')  # true for interested, false for not interested, null for no preference
            
            if not job_id:
                return jsonify({'error': 'Job ID is required'}), 400
                
            user = session.query(User).filter(User.clerk_id == clerk_id).first()
            
            if not user:
                # Create new user if doesn't exist
                user = User(
                    clerk_id=clerk_id,
                    interested_job_ids=[],
                    not_interested_job_ids=[]
                )
                session.add(user)
            
            # Initialize lists if they don't exist
            if user.interested_job_ids is None:
                user.interested_job_ids = []
            if user.not_interested_job_ids is None:
                user.not_interested_job_ids = []
                
            # PostgreSQL handles JSON arrays natively, no need for string conversion
            interested_jobs = list(user.interested_job_ids) if user.interested_job_ids else []
            not_interested_jobs = list(user.not_interested_job_ids) if user.not_interested_job_ids else []
            
            # Remove job from both lists first (to handle changes in preference)
            if job_id in interested_jobs:
                interested_jobs.remove(job_id)
            if job_id in not_interested_jobs:
                not_interested_jobs.remove(job_id)
                
            # Add job to appropriate list based on interest
            if interest is True:
                interested_jobs.append(job_id)
            elif interest is False:
                not_interested_jobs.append(job_id)
            
            # Update the user with the modified lists
            user.interested_job_ids = interested_jobs
            user.not_interested_job_ids = not_interested_jobs
            
            # Debug logging
            logging.debug(f"Updated user {clerk_id} interests: {interested_jobs}")
            logging.debug(f"Updated user {clerk_id} not-interests: {not_interested_jobs}")
            
            session.commit()
            return jsonify({
                'message': 'Job interest updated successfully',
                'interest': interest,
                'interested_jobs': interested_jobs,
                'not_interested_jobs': not_interested_jobs
            })
            
        except Exception as e:
            session.rollback()
            logging.error(f"Error updating job interest: {str(e)}")
            return jsonify({'error': str(e)}), 500
        finally:
            session.close()

    @app.route('/api/users/<string:clerk_id>/job-interest/<string:job_id>', methods=['GET'])
    def get_job_interest(clerk_id, job_id):
        session = Session()
        try:
            user = session.query(User).filter(User.clerk_id == clerk_id).first()
            
            if not user:
                return jsonify({'interest': None})
                
            # Handle potential string representation in SQLite
            interested_jobs = user.interested_job_ids
            not_interested_jobs = user.not_interested_job_ids
            
            if isinstance(interested_jobs, str):
                try:
                    interested_jobs = json.loads(interested_jobs)
                except:
                    interested_jobs = []
                    
            if isinstance(not_interested_jobs, str):
                try:
                    not_interested_jobs = json.loads(not_interested_jobs)
                except:
                    not_interested_jobs = []
                
            if interested_jobs and job_id in interested_jobs:
                return jsonify({'interest': True})
            elif not_interested_jobs and job_id in not_interested_jobs:
                return jsonify({'interest': False})
            else:
                return jsonify({'interest': None})
                
        except Exception as e:
            logging.error(f"Error getting job interest: {str(e)}")
            return jsonify({'error': str(e)}), 500
        finally:
            session.close()
