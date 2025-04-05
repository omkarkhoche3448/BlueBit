import os
import sys
import pytest
import json
from unittest.mock import patch, MagicMock

# Add the parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app
from models import User, Job, JobApplication
from config import Session

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

@pytest.fixture
def mock_db_session():
    with patch('routes.job_interactions.Session') as mock_session_class:
        mock_session = MagicMock()
        mock_session_class.return_value = mock_session
        yield mock_session

@pytest.fixture
def sample_user():
    user = MagicMock(spec=User)
    user.id = 1
    user.clerk_id = 'test_clerk_id'
    user.email = 'test@example.com'
    user.applied_job_ids = ['job1', 'job2']
    return user

@pytest.fixture
def sample_job():
    job = MagicMock(spec=Job)
    job.id = 'job3'
    job.title = 'Software Engineer'
    job.company = 'Tech Company'
    job.location = 'San Francisco, CA'
    job.__table__ = MagicMock()
    job.__table__.columns = [
        MagicMock(name='id'),
        MagicMock(name='title'),
        MagicMock(name='company'),
        MagicMock(name='location')
    ]
    return job

@pytest.fixture
def sample_application():
    application = MagicMock(spec=JobApplication)
    application.id = 1
    application.user_id = 1
    application.job_id = 'job1'
    application.status = 'applied'
    application.applied_date = '2023-01-01T00:00:00'
    application.notes = 'Application notes'
    application.__table__ = MagicMock()
    application.__table__.columns = [
        MagicMock(name='id'),
        MagicMock(name='user_id'),
        MagicMock(name='job_id'),
        MagicMock(name='status'),
        MagicMock(name='applied_date'),
        MagicMock(name='notes')
    ]
    return application

def test_apply_to_job(client, mock_db_session, sample_user, sample_job):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.side_effect = [sample_user, sample_job]
    
    # Execute
    response = client.post(
        '/api/users/test_clerk_id/apply-job/job3',
        json={'notes': 'Test application'}
    )
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'message' in data
    assert 'Successfully applied' in data['message']
    assert mock_db_session.add.called

def test_apply_to_job_already_applied(client, mock_db_session, sample_user):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = sample_user
    
    # Execute
    response = client.post(
        '/api/users/test_clerk_id/apply-job/job1',
        json={'notes': 'Test application'}
    )
    
    # Assert
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data
    assert 'already applied' in data['error']

def test_get_applied_jobs(client, mock_db_session, sample_user, sample_application):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = sample_user
    mock_db_session.query.return_value.join.return_value.filter.return_value.all.return_value = [sample_application]
    
    job = MagicMock(spec=Job)
    job.id = 'job1'
    job.title = 'Software Engineer'
    job.__table__ = MagicMock()
    job.__table__.columns = [MagicMock(name='id'), MagicMock(name='title')]
    
    mock_db_session.query.return_value.filter.return_value.all.return_value = [job]
    
    # Execute
    response = client.get('/api/users/test_clerk_id/applied-jobs')
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'applications' in data
    assert len(data['applications']) == 1
    assert data['applications'][0]['job_id'] == 'job1'

def test_update_application_status(client, mock_db_session, sample_application):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = sample_application
    
    # Execute
    response = client.put(
        '/api/users/test_clerk_id/applications/1',
        json={'status': 'interview', 'notes': 'Updated notes'}
    )
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'message' in data
    assert sample_application.status == 'interview'
    assert sample_application.notes == 'Updated notes'

def test_delete_application(client, mock_db_session, sample_application, sample_user):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.side_effect = [sample_application, sample_user]
    
    # Execute
    response = client.delete('/api/users/test_clerk_id/applications/1')
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'message' in data
    assert mock_db_session.delete.called