from flask import request, jsonify
from datetime import datetime
from config import Session
from models import User, Job, JobInteractionStats
from flask_cors import cross_origin

def register_user_job_interaction_routes(app):
    @app.route('/api/users/<string:user_id>/job-interaction', methods=['POST', 'OPTIONS'])
    @cross_origin(methods=['POST', 'OPTIONS'], allow_headers=['Content-Type'])
    def update_job_interaction(user_id):
        if request.method == 'OPTIONS':
            return '', 204  # Return empty response for OPTIONS request
            
        session = Session()
        try:
            data = request.get_json()
            job_id = data.get('jobId')
            interaction_type = data.get('interactionType')  # 'like', 'dislike', or 'bookmark'
            value = data.get('value')  # True/False for toggle
            
            if not all([job_id, interaction_type, value is not None]):
                return jsonify({'error': 'Job ID, interaction type and value are required'}), 400
                
            # Get user
            user = session.query(User).filter(User.clerk_id == user_id).first()
            if not user:
                return jsonify({'error': 'User not found'}), 404
                
            # Initialize arrays if None
            if user.interested_job_ids is None:
                user.interested_job_ids = []
            if user.not_interested_job_ids is None:
                user.not_interested_job_ids = []
            if user.saved_jobs_ids is None:
                user.saved_jobs_ids = []
                
            # Get or create job stats
            stats = session.query(JobInteractionStats).filter(
                JobInteractionStats.job_id == job_id
            ).first()
            
            if not stats:
                stats = JobInteractionStats(
                    job_id=job_id,
                    like_count=0,
                    dislike_count=0,
                    bookmark_count=0,
                    last_updated=datetime.now().date()
                )
                session.add(stats)
            
            # Handle each interaction type
            if interaction_type == 'like':
                # Update user's liked jobs
                if value and job_id not in user.interested_job_ids:
                    user.interested_job_ids.append(job_id)
                    stats.like_count += 1
                elif not value and job_id in user.interested_job_ids:
                    user.interested_job_ids.remove(job_id)
                    stats.like_count = max(0, stats.like_count - 1)
                    
                # Remove from disliked if now liked
                if value and job_id in user.not_interested_job_ids:
                    user.not_interested_job_ids.remove(job_id)
                    stats.dislike_count = max(0, stats.dislike_count - 1)
                    
            elif interaction_type == 'dislike':
                # Update user's disliked jobs
                if value and job_id not in user.not_interested_job_ids:
                    user.not_interested_job_ids.append(job_id)
                    stats.dislike_count += 1
                elif not value and job_id in user.not_interested_job_ids:
                    user.not_interested_job_ids.remove(job_id)
                    stats.dislike_count = max(0, stats.dislike_count - 1)
                    
                # Remove from liked if now disliked
                if value and job_id in user.interested_job_ids:
                    user.interested_job_ids.remove(job_id)
                    stats.like_count = max(0, stats.like_count - 1)
                    
            elif interaction_type == 'bookmark':
                # Update user's bookmarked jobs
                if value and job_id not in user.saved_jobs_ids:
                    user.saved_jobs_ids.append(job_id)
                    stats.bookmark_count += 1
                elif not value and job_id in user.saved_jobs_ids:
                    user.saved_jobs_ids.remove(job_id)
                    stats.bookmark_count = max(0, stats.bookmark_count - 1)
                    
            stats.last_updated = datetime.now().date()
            session.commit()
            
            return jsonify({
                'message': 'Job interaction updated successfully',
                'interaction': {
                    'liked': job_id in user.interested_job_ids,
                    'disliked': job_id in user.not_interested_job_ids,
                    'bookmarked': job_id in user.saved_jobs_ids
                },
                'stats': {
                    'like_count': stats.like_count,
                    'dislike_count': stats.dislike_count,
                    'bookmark_count': stats.bookmark_count
                }
            })
        except Exception as e:
            session.rollback()
            return jsonify({'error': str(e)}), 500
        finally:
            session.close()
    
    @app.route('/api/users/<string:user_id>/bookmarks', methods=['POST', 'OPTIONS'])
    @cross_origin(methods=['POST', 'OPTIONS'], allow_headers=['Content-Type'])
    def manage_user_bookmarks(user_id):
        if request.method == 'OPTIONS':
            return '', 204  # Return empty response for OPTIONS request
            
        session = Session()
        try:
            data = request.get_json()
            item_id = data.get('itemId')
            action = data.get('action')  # 'add' or 'remove'
            
            if not all([item_id, action]):
                return jsonify({'error': 'Item ID and action are required'}), 400
                
            if action not in ['add', 'remove']:
                return jsonify({'error': 'Action must be either "add" or "remove"'}), 400
                
            user = session.query(User).filter(User.clerk_id == user_id).first()
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            # Initialize saved jobs if None
            if user.saved_jobs_ids is None:
                user.saved_jobs_ids = []
                
            # Handle bookmark action
            if action == 'add' and item_id not in user.saved_jobs_ids:
                user.saved_jobs_ids.append(item_id)
                message = 'Item added to bookmarks'
            elif action == 'remove' and item_id in user.saved_jobs_ids:
                user.saved_jobs_ids.remove(item_id)
                message = 'Item removed from bookmarks'
            else:
                message = 'No changes made to bookmarks'
                
            session.commit()
            
            return jsonify({
                'message': message,
                'bookmarks': user.saved_jobs_ids
            })
        except Exception as e:
            session.rollback()
            return jsonify({'error': str(e)}), 500
        finally:
            session.close()
    
    @app.route('/api/users/<string:user_id>/bookmarks', methods=['GET', 'OPTIONS'])
    @cross_origin(methods=['GET', 'OPTIONS'], allow_headers=['Content-Type'])
    def get_user_bookmarks(user_id):
        if request.method == 'OPTIONS':
            return '', 204  # Return empty response for OPTIONS request
            
        session = Session()
        try:
            # Log the request for debugging
            print(f"Fetching bookmarks for user: {user_id}")
            
            user = session.query(User).filter(User.clerk_id == user_id).first()
            if not user:
                print(f"User not found: {user_id}")
                return jsonify({'error': 'User not found'}), 404
            
            # Get the saved job IDs and log them
            bookmark_ids = user.saved_jobs_ids if user.saved_jobs_ids is not None else []
            print(f"User {user_id} has {len(bookmark_ids)} bookmarked jobs: {bookmark_ids}")
            
            # Fetch the actual job objects for these IDs
            bookmarked_jobs = []
            if bookmark_ids:
                # Convert all IDs to strings for consistent comparison
                string_bookmark_ids = [str(id) for id in bookmark_ids]
                
                # Query jobs directly with the IDs
                for job_id in string_bookmark_ids:
                    job = session.query(Job).filter(Job.id == job_id).first()
                    if job:
                        job_dict_data = {
                            'id': job.id,
                            'title': job.title,
                            'company': job.company,
                            'location': job.location,
                            'job_type': job.job_type,
                            'salary_min': job.salary_min,
                            'salary_max': job.salary_max,
                            'salary_currency': job.salary_currency,
                            'salary_period': job.salary_period,
                            'description': job.description,
                            'date_posted': job.date_posted.isoformat() if job.date_posted else None,
                            'job_url': job.job_url,
                            'job_url_direct': job.job_url_direct,
                            'company_url': job.company_url,
                            'company_logo': job.company_logo,
                            'skills': job.skills,
                            'experience_level': job.experience_level,
                            'education_level': job.education_level,
                            'remote': job.remote
                        }
                        bookmarked_jobs.append(job_dict_data)
                    else:
                        print(f"Job ID {job_id} not found in database")
            
            print(f"Returning {len(bookmarked_jobs)} bookmarked jobs")
            return jsonify(bookmarked_jobs)
        except Exception as e:
            print(f"Error fetching bookmarks: {str(e)}")
            return jsonify({'error': str(e)}), 500
        finally:
            session.close()
    
    @app.route('/api/jobs/trending', methods=['GET', 'OPTIONS'])
    @cross_origin(methods=['GET', 'OPTIONS'], allow_headers=['Content-Type'])
    def get_trending_jobs():
        if request.method == 'OPTIONS':
            return '', 204  # Return empty response for OPTIONS request
            
        session = Session()
        try:
            # Get all job stats
            job_stats = session.query(JobInteractionStats).join(Job).all()
            
            # Calculate total interaction score and create tuples (job, total_score)
            uptrend_jobs = []
            downtrend_jobs = []
            
            for stat in job_stats:
                total_interactions = stat.like_count + stat.bookmark_count
                
                job_data = {
                    'job': stat.job,
                    'total_interactions': total_interactions,
                    'dislike_count': stat.dislike_count
                }
                
                if total_interactions > 0:
                    uptrend_jobs.append(job_data)
                if stat.dislike_count > 0:
                    downtrend_jobs.append(job_data)
            
            # Sort uptrend jobs by total interactions (descending)
            uptrend_jobs.sort(key=lambda x: x['total_interactions'], reverse=True)
            
            # Sort downtrend jobs by dislike count (descending)
            downtrend_jobs.sort(key=lambda x: x['dislike_count'], reverse=True)
            
            # Convert jobs to dictionary format
            uptrend_result = [{
                'id': job['job'].id,
                'title': job['job'].title,
                'company': job['job'].company,
                'location': job['job'].location,
                'total_interactions': job['total_interactions']
            } for job in uptrend_jobs[:10]]  # Limit to top 10
            
            downtrend_result = [{
                'id': job['job'].id,
                'title': job['job'].title,
                'company': job['job'].company,
                'location': job['job'].location,
                'dislike_count': job['dislike_count']
            } for job in downtrend_jobs[:10]]  # Limit to top 10
            
            return jsonify({
                'uptrend_jobs': uptrend_result,
                'downtrend_jobs': downtrend_result
            })
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
        finally:
            session.close()