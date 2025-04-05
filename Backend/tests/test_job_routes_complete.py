import os
import sys
import pytest
import json
from unittest.mock import patch, MagicMock
from datetime import datetime

# Add the parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app
from models import Job, User
from config import Session

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

@pytest.fixture
def mock_db_session():
    with patch('routes.job_routes.session_scope') as mock_context:
        mock_session = MagicMock()
        mock_context.return_value.__enter__.return_value = mock_session
        yield mock_session

@pytest.fixture
def sample_job():
    job = MagicMock(spec=Job)
    job.id = 'job1'
    job.title = 'Software Engineer'
    job.company = 'Tech Company'
    job.location = 'San Francisco, CA'
    job.job_type = 'Full-time'
    job.date_posted = datetime.now()
    job.description = 'This is a job description'
    job.min_amount = 80000
    job.max_amount = 120000
    job.__table__ = MagicMock()
    job.__table__.columns = [
        MagicMock(name='id'),
        MagicMock(name='title'),
        MagicMock(name='company'),
        MagicMock(name='location'),
        MagicMock(name='job_type'),
        MagicMock(name='date_posted'),
        MagicMock(name='description'),
        MagicMock(name='min_amount'),
        MagicMock(name='max_amount')
    ]
    return job

@pytest.fixture
def sample_user():
    user = MagicMock(spec=User)
    user.clerk_id = 'test_clerk_id'
    user.saved_jobs_ids = ['job1', 'job2']
    user.interested_job_ids = ['job3']
    user.not_interested_job_ids = ['job4']
    return user

def test_search_jobs_get(client, mock_db_session, sample_job):
    # Setup
    mock_db_session.execute.return_value.scalar.return_value = 1
    mock_db_session.execute.return_value.scalars.return_value.all.return_value = [sample_job]
    
    # Execute
    response = client.get('/api/search-jobs?page=1&per_page=10')
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'jobs' in data
    assert 'pagination' in data
    assert data['pagination']['total'] == 1

def test_search_jobs_post(client, mock_db_session, sample_job):
    # Setup
    mock_db_session.execute.return_value.scalar.return_value = 1
    mock_db_session.execute.return_value.scalars.return_value.all.return_value = [sample_job]
    mock_db_session.query.return_value.filter.return_value.first.return_value = None
    
    # Execute
    response = client.post(
        '/api/search-jobs',
        json={
            'page': 1,
            'per_page': 10,
            'filters': {
                'searchTerm': 'engineer',
                'jobType': ['Full-time'],
                'location': ['San Francisco'],
                'company': ['Tech Company'],
                'minSalary': 50000,
                'experienceLevel': ['Entry Level']
            }
        }
    )
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'jobs' in data
    assert 'pagination' in data

def test_search_jobs_with_clerk_id(client, mock_db_session, sample_job, sample_user):
    # Setup
    mock_db_session.execute.return_value.scalar.return_value = 1
    mock_db_session.execute.return_value.scalars.return_value.all.return_value = [sample_job]
    mock_db_session.query.return_value.filter.return_value.first.return_value = sample_user
    
    # Execute
    response = client.post(
        '/api/search-jobs',
        json={
            'page': 1,
            'per_page': 10,
            'clerkId': 'test_clerk_id',
            'filters': {
                'searchTerm': 'engineer'
            }
        }
    )
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'jobs' in data

def test_get_job_by_id(client, mock_db_session, sample_job):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = sample_job
    
    # Execute
    response = client.get('/api/job/job1')
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['id'] == 'job1'
    assert data['title'] == 'Software Engineer'

def test_get_job_by_id_not_found(client, mock_db_session):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = None
    
    # Execute
    response = client.get('/api/job/nonexistent')
    
    # Assert
    assert response.status_code == 404
    data = json.loads(response.data)
    assert 'error' in data

def test_save_job(client, mock_db_session, sample_user):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = sample_user
    
    # Execute
    response = client.post(
        '/api/save-job/job5',
        json={'clerkId': 'test_clerk_id'}
    )
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'message' in data
    assert 'saved_jobs' in data
    assert 'job5' in data['saved_jobs']

def test_remove_saved_job(client, mock_db_session, sample_user):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = sample_user
    
    # Execute
    response = client.delete(
        '/api/save-job/job1',
        json={'clerkId': 'test_clerk_id'}
    )
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'message' in data
    assert 'saved_jobs' in data
    assert 'job1' not in data['saved_jobs']

def test_get_saved_jobs(client, mock_db_session, sample_user):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = sample_user
    
    # Execute
    response = client.get('/api/users/test_clerk_id/saved-jobs')
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'saved_jobs' in data
    assert data['saved_jobs'] == sample_user.saved_jobs_ids

def test_apply_to_job(client):
    # Execute
    response = client.post('/api/apply-job/job1')
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'message' in data
    assert 'Successfully applied to job job1' in data['message']

def test_update_job_interest_interested(client, mock_db_session, sample_user):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = sample_user
    
    # Execute
    response = client.post(
        '/api/users/test_clerk_id/job-interest',
        json={'jobId': 'job5', 'interest': True}
    )
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'message' in data
    assert 'interested_jobs' in data
    assert 'job5' in data['interested_jobs']

def test_update_job_interest_not_interested(client, mock_db_session, sample_user):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = sample_user
    
    # Execute
    response = client.post(
        '/api/users/test_clerk_id/job-interest',
        json={'jobId': 'job5', 'interest': False}
    )
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'message' in data
    assert 'not_interested_jobs' in data
    assert 'job5' in data['not_interested_jobs']

def test_get_job_interest_interested(client, mock_db_session, sample_user):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = sample_user
    
    # Execute
    response = client.get('/api/users/test_clerk_id/job-interest/job3')
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'interest' in data
    assert data['interest'] is True

def test_get_job_interest_not_interested(client, mock_db_session, sample_user):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = sample_user
    
    # Execute
    response = client.get('/api/users/test_clerk_id/job-interest/job4')
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'interest' in data
    assert data['interest'] is False

def test_get_job_interest_no_preference(client, mock_db_session, sample_user):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = sample_user
    
    # Execute
    response = client.get('/api/users/test_clerk_id/job-interest/job5')
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'interest' in data
    assert data['interest'] is None