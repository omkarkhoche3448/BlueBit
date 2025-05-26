from flask import request, jsonify
from flask_cors import cross_origin
import logging
import re
from sqlalchemy import func, or_, and_, text, select
from sqlalchemy.engine.result import ScalarResult
from datetime import datetime
from contextlib import contextmanager
from config import Session
from models import Job, User
from utils.jwt_middleware import jwt_required

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

def get_total_count(session, query):
    """Efficiently get the total count using exists() subquery"""
    count_stmt = select(func.count()).select_from(query.subquery())
    return session.execute(count_stmt).scalar()

def apply_pagination(session, query, page, requested_per_page):
    """Apply pagination to query"""
    # Limit per_page to a maximum of 10
    per_page = min(10, requested_per_page)
    
    # Get total count efficiently
    total_count = get_total_count(session, query)
    
    # Apply pagination
    offset = (page - 1) * per_page
    # Use execution plan optimization by adding columns we'll need
    paginated_results = session.execute(
        query.offset(offset).limit(per_page)
    ).scalars().all()
    
    return paginated_results, total_count, per_page

def create_search_conditions(search_input, session=None):
    """Create database-agnostic search conditions with fallback for SQLite."""
    if not search_input or not search_input.strip():
        return []
        
    search_input = search_input.strip().lower()
    
    # Normalize input and handle spelling variations
    search_input = re.sub(r'[^a-z0-9\s\-]', '', search_input)  # Remove special chars
    
    # Extract exact phrases using regex
    exact_phrases = re.findall(r'"([^"]+)"', search_input)
    for phrase in exact_phrases:
        search_input = search_input.replace(f'"{phrase}"', '')
    
    # Process remaining terms
    individual_terms = [term.strip() for term in search_input.split() if term.strip()]
    
    # Combine all search terms
    all_terms = exact_phrases + individual_terms
    if not all_terms:
        return []

    conditions = []
    
    # Check if we're using PostgreSQL by detecting the engine
    is_postgresql = False
    try:
        if session and hasattr(session, 'bind'):
            engine_url = str(session.bind.url).lower()
        else:
            from config import engine
            engine_url = str(engine.url).lower()
        is_postgresql = 'postgresql' in engine_url
    except:
        is_postgresql = False
    
    # Always use basic search for now to avoid database compatibility issues
    # This ensures tests work consistently across different environments
    for term in all_terms:
        # Basic text search using LIKE and contains
        basic_conditions = [
            func.lower(Job.title).contains(term),
            func.lower(Job.company).contains(term),
            func.lower(Job.location).contains(term),
            func.lower(Job.job_type).contains(term)
        ]
        
        # Also check for partial matches
        if len(term) > 2:
            basic_conditions.extend([
                func.lower(Job.title).like(f'%{term}%'),
                func.lower(Job.company).like(f'%{term}%'),
                func.lower(Job.location).like(f'%{term}%'),
                func.lower(Job.job_type).like(f'%{term}%')
            ])
        
        conditions.append(or_(*basic_conditions))
    
    return conditions


def register_job_routes(app):
    @app.route('/api/search-jobs', methods=['GET', 'POST'])
    @cross_origin()
    def search_jobs():
        try:
            with session_scope() as session:
                # Common parameters extraction
                if request.method == 'POST':
                    data = request.json
                    filters = data.get('filters', {})
                    # For backward compatibility, allow optional user_id in request body
                    user_id = data.get('userId')  # Optional for filtering out disliked jobs
                    page = int(data.get('page', 1))
                    requested_per_page = int(data.get('per_page', 10))
                    search_term = filters.get('searchTerm', '')
                    job_types = filters.get('jobType', [])
                    locations = filters.get('location', [])
                    companies = filters.get('company', [])
                    min_salary = filters.get('minSalary')
                    exp_levels = filters.get('experienceLevel', [])
                    sort_by = filters.get('sortBy', 'datePosted')
                else:  # GET request
                    page = int(request.args.get('page', 1))
                    requested_per_page = int(request.args.get('per_page', 10))
                    user_id = request.args.get('userId')  # Optional
                    search_term = request.args.get('searchTerm', '')
                    job_types = [request.args.get('jobType')] if request.args.get('jobType') else []
                    locations = [request.args.get('location')] if request.args.get('location') else []
                    companies = [request.args.get('company')] if request.args.get('company') else []
                    min_salary = None
                    exp_levels = []
                    sort_by = 'datePosted'
                
                # Start with a base query for jobs - select only what we need
                query = select(Job).select_from(Job)
                
                # Create a list of filter conditions
                filter_conditions = []
                
                # Filter out jobs the user is not interested in - optimize with subquery
                if user_id:
                    user = session.query(User).filter(User.id == user_id).first()
                    if user and user.not_interested_job_ids and len(user.not_interested_job_ids) > 0:
                        filter_conditions.append(~Job.id.in_(user.not_interested_job_ids))
                
                # Apply search term filter - use optimized function (now excluding description field)
                if search_term:
                    search_conditions = create_search_conditions(search_term, session)
                    filter_conditions.extend(search_conditions)
                
                # Apply job type filter - IMPROVED
                if job_types:
                    job_type_conditions = []
                    for job_type in job_types:
                        if not job_type:
                            continue
                        job_type_clean = job_type.replace('-', ' ').strip().lower()
                        if ' ' in job_type_clean:
                            job_type_conditions.append(func.lower(Job.job_type).contains(job_type_clean))
                        else:
                            job_type_conditions.append(or_(
                                func.lower(Job.job_type) == job_type_clean,
                                func.lower(Job.job_type).like(f"% {job_type_clean} %"),
                                func.lower(Job.job_type).like(f"% {job_type_clean}"),
                                func.lower(Job.job_type).like(f"{job_type_clean} %")
                            ))
                    if job_type_conditions:
                        filter_conditions.append(or_(*job_type_conditions))
                
                # Apply location filter - IMPROVED
                if locations:
                    location_conditions = []
                    for loc in locations:
                        if not loc:
                            continue
                        loc_clean = loc.replace('-', ' ').strip().lower()
                        if len(loc_clean.split()) > 1:
                            location_conditions.append(func.lower(Job.location).contains(loc_clean))
                        else:
                            location_conditions.append(or_(
                                func.lower(Job.location) == loc_clean,
                                func.lower(Job.location).like(f"% {loc_clean} %"),
                                func.lower(Job.location).like(f"% {loc_clean}"),
                                func.lower(Job.location).like(f"{loc_clean} %"),
                                func.lower(Job.location).like(f"%, {loc_clean}"),
                                func.lower(Job.location).like(f"{loc_clean}, %")
                            ))
                    if location_conditions:
                        filter_conditions.append(or_(*location_conditions))
                
                # Apply company filter - IMPROVED
                if companies:
                    company_conditions = []
                    for comp in companies:
                        if not comp:
                            continue
                        comp_clean = comp.replace('-', ' ').strip().lower()
                        if len(comp_clean.split()) > 1:
                            company_conditions.append(func.lower(Job.company).contains(comp_clean))
                        else:
                            company_conditions.append(or_(
                                func.lower(Job.company) == comp_clean,
                                func.lower(Job.company).like(f"% {comp_clean} %"),
                                func.lower(Job.company).like(f"% {comp_clean}"),
                                func.lower(Job.company).like(f"{comp_clean} %")
                            ))
                    if company_conditions:
                        filter_conditions.append(or_(*company_conditions))
                
                # Apply salary range filter if provided
                if min_salary:
                    try:
                        min_salary_val = float(min_salary)
                        filter_conditions.append(or_(
                            Job.min_amount >= min_salary_val,
                            Job.max_amount >= min_salary_val
                        ))
                    except (ValueError, TypeError):
                        pass
                
                # Apply experience level filter if provided - THIS STILL SEARCHES IN DESCRIPTION
                if exp_levels:
                    exp_conditions = []
                    for level in exp_levels:
                        level_clean = level.replace('-', ' ').lower()
                        exp_conditions.append(or_(
                            func.lower(Job.title).contains(level_clean),
                            func.lower(Job.description).contains(level_clean)  # Keep searching in description for experience levels
                        ))
                    if exp_conditions:
                        filter_conditions.append(or_(*exp_conditions))
                
                # Apply all filters at once
                if filter_conditions:
                    query = query.where(*filter_conditions)
                
                # Apply sorting - using indexes effectively
                if sort_by == 'datePosted':
                    query = query.order_by(Job.date_posted.desc())
                elif sort_by == 'salary':
                    query = query.order_by(Job.max_amount.desc(), Job.date_posted.desc())
                else:
                    query = query.order_by(Job.date_posted.desc())
                
                # Apply pagination and get results
                filtered_jobs, total_count, per_page = apply_pagination(session, query, page, requested_per_page)
                
                # Efficiently convert SQLAlchemy objects to dictionaries
                jobs_list = []
                for job in filtered_jobs:
                    job_dict = {c.name: getattr(job, c.name) for c in job.__table__.columns}
                    
                    # Convert datetime objects to strings only once
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
    @jwt_required
    def manage_saved_job(user_id, job_id):
        with session_scope() as session:
            try:
                # Find the user in the database using JWT user_id
                user = session.query(User).filter(User.id == user_id).first()
                
                if not user:
                    return jsonify({'error': 'User not found'}), 404
                
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

    @app.route('/api/users/saved-jobs', methods=['GET'])
    @jwt_required
    def get_saved_jobs(user_id):
        with session_scope() as session:
            try:
                user = session.query(User).filter(User.id == user_id).first()
                if not user:
                    return jsonify({'saved_jobs': []}), 200
                
                saved_jobs = user.saved_jobs_ids if user.saved_jobs_ids else []
                return jsonify({'saved_jobs': saved_jobs}), 200
                
            except Exception as e:
                logging.error(f"Error fetching saved jobs for user {user_id}: {str(e)}")
                return jsonify({'error': str(e)}), 500

    @app.route('/api/apply-job/<string:job_id>', methods=['POST'])
    def apply_to_job(job_id):
        try:
            # applied_jobs.add(job_id)
            return jsonify({'message': f'Successfully applied to job {job_id}'})
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/users/job-interest', methods=['POST'])
    @jwt_required
    def update_job_interest(user_id):
        with session_scope() as session:
            try:
                data = request.json
                job_id = data.get('jobId')
                interest = data.get('interest')  # true for interested, false for not interested, null for no preference
                
                if not job_id:
                    return jsonify({'error': 'Job ID is required'}), 400
                    
                user = session.query(User).filter(User.id == user_id).first()
                
                if not user:
                    return jsonify({'error': 'User not found'}), 404
                
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
                logging.debug(f"Updated user {user_id} interests: {interested_jobs}")
                logging.debug(f"Updated user {user_id} not-interests: {not_interested_jobs}")
                
                return jsonify({
                    'message': 'Job interest updated successfully',
                    'interest': interest,
                    'interested_jobs': interested_jobs,
                    'not_interested_jobs': not_interested_jobs
                })
                
            except Exception as e:
                logging.error(f"Error updating job interest: {str(e)}")
                return jsonify({'error': str(e)}), 500

    @app.route('/api/users/job-interest/<string:job_id>', methods=['GET'])
    @jwt_required
    def get_job_interest(user_id, job_id):
        with session_scope() as session:
            try:
                user = session.query(User).filter(User.id == user_id).first()
                
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