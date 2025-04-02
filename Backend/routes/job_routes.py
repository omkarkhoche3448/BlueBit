from flask import request, jsonify
from flask_cors import cross_origin
import logging
import pandas as pd
from datetime import datetime
from sqlalchemy import func
from config import Session
from models import Job, User

def register_job_routes(app):
    @app.route('/api/search-jobs', methods=['GET', 'POST'])
    @cross_origin()
    def search_jobs():
        try:
            if request.method == 'POST':
                data = request.json
                filters = data.get('filters', {})
                clerk_id = data.get('clerkId')
                
                # Get pagination parameters
                page = data.get('page', 1)
                per_page = data.get('per_page', 10)
                
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
                
                # ... existing filter code ...
                
                # Apply sorting
                if filters.get('sortBy'):
                    sort_by = filters['sortBy']
                    if sort_by == 'datePosted':
                        query = query.order_by(Job.date_posted.desc())
                    elif sort_by == 'salary':
                        query = query.order_by(Job.max_amount.desc())
                    # Default is relevance, which doesn't need explicit sorting
                
                # Get total count before pagination
                total_count = query.count()
                
                # Apply pagination
                offset = (page - 1) * per_page
                query = query.offset(offset).limit(per_page)
                
                # Execute the query and get results
                filtered_jobs = query.all()
                
                # Convert SQLAlchemy objects to dictionaries
                jobs_list = [{c.name: getattr(job, c.name) for c in job.__table__.columns} for job in filtered_jobs]
                
                # Return paginated results with metadata
                result = {
                    'jobs': jobs_list,
                    'pagination': {
                        'total': total_count,
                        'page': page,
                        'per_page': per_page,
                        'total_pages': (total_count + per_page - 1) // per_page
                    }
                }
                
                session.close()
                return jsonify(result)
            
            # Handle GET request with pagination
            page = int(request.args.get('page', 1))
            per_page = int(request.args.get('per_page', 10))
            clerk_id = request.args.get('clerkId')
            
            session = Session()
            
            # Start with base query
            query = session.query(Job)
            
            # Filter out not interested jobs if clerk_id is provided
            if clerk_id:
                user = session.query(User).filter(User.clerk_id == clerk_id).first()
                if user and user.not_interested_job_ids:
                    # PostgreSQL handles JSON arrays natively
                    if user.not_interested_job_ids:
                        query = query.filter(~Job.id.in_(user.not_interested_job_ids))
            
            # Get total count
            total_count = query.count()
            
            # Apply pagination
            offset = (page - 1) * per_page
            query = query.offset(offset).limit(per_page)
            
            all_jobs = query.all()
            jobs_list = [{c.name: getattr(job, c.name) for c in job.__table__.columns} for job in all_jobs]
            
            # Return paginated results with metadata
            result = {
                'jobs': jobs_list,
                'pagination': {
                    'total': total_count,
                    'page': page,
                    'per_page': per_page,
                    'total_pages': (total_count + per_page - 1) // per_page
                }
            }
            
            session.close()
            return jsonify(result)
                
        except Exception as e:
            logging.error(f"Error in search_jobs: {str(e)}")
            return jsonify({'error': str(e)}), 500


    @app.route('/api/job/<string:job_id>', methods=['GET'])
    @cross_origin()
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

    @app.route('/api/save-job/<string:job_id>', methods=['POST', 'DELETE'])
    def manage_saved_job(job_id):
        session = Session()
        try:
            # Get clerk_id from request data
            data = request.json
            clerk_id = data.get('clerkId')
            
            if not clerk_id:
                return jsonify({'error': 'User ID (clerkId) is required'}), 400
                
            # Find the user in the database
            user = session.query(User).filter(User.clerk_id == clerk_id).first()
            
            if not user:
                # Create new user if doesn't exist
                user = User(
                    clerk_id=clerk_id,
                    saved_jobs_ids=[]
                )
                session.add(user)
            
            # Initialize saved_jobs_ids if it doesn't exist
            if user.saved_jobs_ids is None:
                user.saved_jobs_ids = []
                
            # Get current saved jobs list
            saved_jobs = list(user.saved_jobs_ids) if user.saved_jobs_ids else []
            
            if request.method == 'POST':
                # Add job to saved list if not already there
                if job_id not in saved_jobs:
                    saved_jobs.append(job_id)
                    user.saved_jobs_ids = saved_jobs
                    session.commit()
                return jsonify({
                    'message': f'Job {job_id} saved successfully',
                    'saved_jobs': saved_jobs
                })
            else:  # DELETE method
                # Remove job from saved list if present
                if job_id in saved_jobs:
                    saved_jobs.remove(job_id)
                    user.saved_jobs_ids = saved_jobs
                    session.commit()
                return jsonify({
                    'message': f'Job {job_id} removed from saved jobs',
                    'saved_jobs': saved_jobs
                })
        except Exception as e:
            session.rollback()
            logging.error(f"Error managing saved job: {str(e)}")
            return jsonify({'error': str(e)}), 500
        finally:
            session.close()

    @app.route('/api/users/<string:clerk_id>/saved-jobs', methods=['GET'])
    def get_saved_jobs(clerk_id):
        session = Session()
        try:
            user = session.query(User).filter(User.clerk_id == clerk_id).first()
            if not user:
                return jsonify({'saved_jobs': []}), 200
            
            saved_jobs = user.saved_jobs_ids if user.saved_jobs_ids else []
            return jsonify({'saved_jobs': saved_jobs}), 200
            
        except Exception as e:
            logging.error(f"Error fetching saved jobs for user {clerk_id}: {str(e)}")
            return jsonify({'error': str(e)}), 500
        finally:
            session.close()

    @app.route('/api/apply-job/<string:job_id>', methods=['POST'])
    def apply_to_job(job_id):
        try:
            # applied_jobs.add(job_id)
            return jsonify({'message': f'Successfully applied to job {job_id}'})
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
