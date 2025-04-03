from flask import request, jsonify
from flask_cors import cross_origin
import logging
from sqlalchemy import func, or_, text, select
from sqlalchemy.engine.result import ScalarResult
from datetime import datetime
from contextlib import contextmanager
from config import Session
from models import Job, User

@contextmanager
def session_scope():
    """Provide a transactional scope around a series of operations."""
    session = Session()
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        raise
    finally:
        session.close()

def apply_pagination(session, query, page, requested_per_page):
    # Limit per_page to a maximum of 10
    per_page = min(10, requested_per_page)
    
    # Get total count - use the original query for counting
    count_stmt = select(func.count()).select_from(query.subquery())
    total_count = session.execute(count_stmt).scalar()
    
    # Apply pagination
    offset = (page - 1) * per_page
    paginated_results = session.execute(query.offset(offset).limit(per_page)).scalars().all()
    
    return paginated_results, total_count, per_page

def register_job_routes(app):
    @app.route('/api/search-jobs', methods=['GET', 'POST'])
    @cross_origin()
    def search_jobs():
        try:
            with session_scope() as session:
                if request.method == 'POST':
                    data = request.json
                    filters = data.get('filters', {})
                    clerk_id = data.get('clerkId')
                    
                    # Get pagination parameters
                    page = int(data.get('page', 1))
                    requested_per_page = int(data.get('per_page', 10))
                    
                    # Start with a base query for jobs
                    query = select(Job).select_from(Job)
                    
                    # Create a list of filter conditions to apply all at once
                    filter_conditions = []
                    
                    # Filter out jobs the user is not interested in
                    if clerk_id:
                        user = session.query(User).filter(User.clerk_id == clerk_id).first()
                        if user and user.not_interested_job_ids and len(user.not_interested_job_ids) > 0:
                            filter_conditions.append(~Job.id.in_(user.not_interested_job_ids))
                    
                    # Apply search term filter
                    if filters.get('searchTerm'):
                        search_term = f"%{filters['searchTerm']}%"
                        search_condition = or_(
                            Job.title.ilike(search_term),
                            Job.description.ilike(search_term),
                            Job.company.ilike(search_term)
                        )
                        filter_conditions.append(search_condition)
                    
                    # Apply job type filter
                    if filters.get('jobType') and len(filters['jobType']) > 0:
                        job_types = filters['jobType']
                        job_type_conditions = [Job.job_type.ilike(f"%{job_type}%") for job_type in job_types]
                        filter_conditions.append(or_(*job_type_conditions))
                    
                    # Apply location filter
                    if filters.get('location') and len(filters['location']) > 0:
                        locations = filters['location']
                        location_conditions = [Job.location.ilike(f"%{loc.replace('-', ' ')}%") for loc in locations]
                        filter_conditions.append(or_(*location_conditions))
                    
                    # Apply company filter
                    if filters.get('company') and len(filters['company']) > 0:
                        companies = filters['company']
                        company_conditions = [Job.company.ilike(f"%{comp.replace('-', ' ')}%") for comp in companies]
                        filter_conditions.append(or_(*company_conditions))
                    
                    # Apply all filters at once
                    if filter_conditions:
                        query = query.where(*filter_conditions)
                    
                    # Apply sorting
                    sort_by = filters.get('sortBy', 'datePosted')
                    if sort_by == 'datePosted':
                        query = query.order_by(Job.date_posted.desc())
                    elif sort_by == 'salary':
                        query = query.order_by(Job.max_amount.desc(), Job.date_posted.desc())
                    else:
                        query = query.order_by(Job.date_posted.desc())
                    
                    # Apply pagination and get results - pass the session
                    filtered_jobs, total_count, per_page = apply_pagination(session, query, page, requested_per_page)
                    
                    # Convert SQLAlchemy objects to dictionaries within the active session
                    jobs_list = []
                    for job in filtered_jobs:
                        job_dict = {c.name: getattr(job, c.name) for c in job.__table__.columns}
                        
                        # Convert datetime objects to strings
                        for key, value in job_dict.items():
                            if isinstance(value, datetime):
                                job_dict[key] = value.isoformat()
                        
                        jobs_list.append(job_dict)
                    
                    # Return paginated results with metadata
                    result = {
                        'jobs': jobs_list,
                        'pagination': {
                            'total': total_count,
                            'page': page,
                            'per_page': per_page,
                            'total_pages': (total_count + per_page - 1) // per_page if per_page > 0 else 0
                        }
                    }
                    
                    return jsonify(result)
                
                # Handle GET request with pagination
                page = int(request.args.get('page', 1))
                requested_per_page = int(request.args.get('per_page', 10))
                clerk_id = request.args.get('clerkId')
                
                # Start with base query
                query = select(Job).select_from(Job)
                
                # Filter out not interested jobs if clerk_id is provided
                if clerk_id:
                    user = session.query(User).filter(User.clerk_id == clerk_id).first()
                    if user and user.not_interested_job_ids and len(user.not_interested_job_ids) > 0:
                        query = query.where(~Job.id.in_(user.not_interested_job_ids))
                
                # Sort by date posted (newest first) as default
                query = query.order_by(Job.date_posted.desc())
                
                # Apply pagination and get results - pass the session
                all_jobs, total_count, per_page = apply_pagination(session, query, page, requested_per_page)
                
                # Convert SQLAlchemy objects to dictionaries within the active session
                jobs_list = []
                for job in all_jobs:
                    job_dict = {c.name: getattr(job, c.name) for c in job.__table__.columns}
                    
                    # Convert datetime objects to strings
                    for key, value in job_dict.items():
                        if isinstance(value, datetime):
                            job_dict[key] = value.isoformat()
                    
                    jobs_list.append(job_dict)
                
                # Return paginated results with metadata
                result = {
                    'jobs': jobs_list,
                    'pagination': {
                        'total': total_count,
                        'page': page,
                        'per_page': per_page,
                        'total_pages': (total_count + per_page - 1) // per_page if per_page > 0 else 0
                    }
                }
                
                return jsonify(result)
                
        except Exception as e:
            logging.error(f"Error in search_jobs: {str(e)}")
            return jsonify({'error': str(e)}), 500

    @app.route('/api/job/<string:job_id>', methods=['GET'])
    @cross_origin()
    def get_job_by_id(job_id):
        with session_scope() as session:
            try:
                job = session.query(Job).filter(Job.id == job_id).first()
                if job:
                    job_dict = {c.name: getattr(job, c.name) for c in job.__table__.columns}
                    
                    # Convert datetime objects to strings
                    for key, value in job_dict.items():
                        if isinstance(value, datetime):
                            job_dict[key] = value.isoformat()
                            
                    return jsonify(job_dict)
                else:
                    return jsonify({"error": "Job not found"}), 404
            except Exception as e:
                logging.error(f"Error getting job by ID: {str(e)}")
                return jsonify({'error': str(e)}), 500

    @app.route('/api/save-job/<string:job_id>', methods=['POST', 'DELETE'])
    def manage_saved_job(job_id):
        with session_scope() as session:
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
                    return jsonify({
                        'message': f'Job {job_id} saved successfully',
                        'saved_jobs': saved_jobs
                    })
                else:  # DELETE method
                    # Remove job from saved list if present
                    if job_id in saved_jobs:
                        saved_jobs.remove(job_id)
                        user.saved_jobs_ids = saved_jobs
                    return jsonify({
                        'message': f'Job {job_id} removed from saved jobs',
                        'saved_jobs': saved_jobs
                    })
            except Exception as e:
                logging.error(f"Error managing saved job: {str(e)}")
                return jsonify({'error': str(e)}), 500

    @app.route('/api/users/<string:clerk_id>/saved-jobs', methods=['GET'])
    def get_saved_jobs(clerk_id):
        with session_scope() as session:
            try:
                user = session.query(User).filter(User.clerk_id == clerk_id).first()
                if not user:
                    return jsonify({'saved_jobs': []}), 200
                
                saved_jobs = user.saved_jobs_ids if user.saved_jobs_ids else []
                return jsonify({'saved_jobs': saved_jobs}), 200
                
            except Exception as e:
                logging.error(f"Error fetching saved jobs for user {clerk_id}: {str(e)}")
                return jsonify({'error': str(e)}), 500

    @app.route('/api/apply-job/<string:job_id>', methods=['POST'])
    def apply_to_job(job_id):
        try:
            # applied_jobs.add(job_id)
            return jsonify({'message': f'Successfully applied to job {job_id}'})
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/users/<string:clerk_id>/job-interest', methods=['POST'])
    def update_job_interest(clerk_id):
        with session_scope() as session:
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
                
                return jsonify({
                    'message': 'Job interest updated successfully',
                    'interest': interest,
                    'interested_jobs': interested_jobs,
                    'not_interested_jobs': not_interested_jobs
                })
                
            except Exception as e:
                logging.error(f"Error updating job interest: {str(e)}")
                return jsonify({'error': str(e)}), 500

    @app.route('/api/users/<string:clerk_id>/job-interest/<string:job_id>', methods=['GET'])
    def get_job_interest(clerk_id, job_id):
        with session_scope() as session:
            try:
                user = session.query(User).filter(User.clerk_id == clerk_id).first()
                
                if not user:
                    return jsonify({'interest': None})
                    
                # Handle potential string representation in SQLite
                interested_jobs = user.interested_job_ids
                not_interested_jobs = user.not_interested_job_ids
                
                if isinstance(interested_jobs, str):
                    try:
                        import json
                        interested_jobs = json.loads(interested_jobs)
                    except:
                        interested_jobs = []
                        
                if isinstance(not_interested_jobs, str):
                    try:
                        import json
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