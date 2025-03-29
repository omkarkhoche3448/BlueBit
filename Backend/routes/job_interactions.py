from flask import request, jsonify
from datetime import datetime
from config import Session
from models import JobInteractionStats

def register_job_interaction_routes(app):
    @app.route('/api/job/<string:job_id>/like', methods=['POST'])
    def like_job(job_id):
        session = Session()
        try:
            stats = session.query(JobInteractionStats).filter(JobInteractionStats.job_id == job_id).first()
            if not stats:
                stats = JobInteractionStats(job_id=job_id, like_count=0, dislike_count=0, bookmark_count=0)
                session.add(stats)
            
            stats.like_count += 1
            stats.last_updated = datetime.now().date()
            session.commit()
            return jsonify({'message': f'Job {job_id} liked successfully', 'like_count': stats.like_count})
        except Exception as e:
            session.rollback()
            return jsonify({'error': str(e)}), 500
        finally:
            session.close()

    @app.route('/api/job/<string:job_id>/dislike', methods=['POST'])
    def dislike_job(job_id):
        session = Session()
        try:
            stats = session.query(JobInteractionStats).filter(JobInteractionStats.job_id == job_id).first()
            if not stats:
                stats = JobInteractionStats(job_id=job_id, like_count=0, dislike_count=0, bookmark_count=0)
                session.add(stats)
            
            stats.dislike_count += 1
            stats.last_updated = datetime.now().date()
            session.commit()
            return jsonify({'message': f'Job {job_id} disliked successfully', 'dislike_count': stats.dislike_count})
        except Exception as e:
            session.rollback()
            return jsonify({'error': str(e)}), 500
        finally:
            session.close()

    @app.route('/api/job/<string:job_id>/bookmark', methods=['POST'])
    def bookmark_job(job_id):
        session = Session()
        try:
            stats = session.query(JobInteractionStats).filter(JobInteractionStats.job_id == job_id).first()
            if not stats:
                stats = JobInteractionStats(job_id=job_id, like_count=0, dislike_count=0, bookmark_count=0)
                session.add(stats)
            
            stats.bookmark_count += 1
            stats.last_updated = datetime.now().date()
            session.commit()
            return jsonify({'message': f'Job {job_id} bookmarked successfully', 'bookmark_count': stats.bookmark_count})
        except Exception as e:
            session.rollback()
            return jsonify({'error': str(e)}), 500
        finally:
            session.close()

    @app.route('/api/job/<string:job_id>/update-interaction-time', methods=['POST'])
    def update_interaction_time(job_id):
        session = Session()
        try:
            stats = session.query(JobInteractionStats).filter(JobInteractionStats.job_id == job_id).first()
            if not stats:
                return jsonify({'error': 'Job interaction stats not found'}), 404
            
            stats.last_updated = datetime.now().date()
            session.commit()
            return jsonify({'message': f'Interaction time for job {job_id} updated successfully', 'last_updated': stats.last_updated})
        except Exception as e:
            session.rollback()
            return jsonify({'error': str(e)}), 500
        finally:
            session.close()