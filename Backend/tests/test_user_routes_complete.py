import os
import sys
import pytest
import json
from unittest.mock import patch, MagicMock
from io import BytesIO
from werkzeug.datastructures import FileStorage

# Add the parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app
from models import User, Job
from config import Session

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

@pytest.fixture
def mock_db_session():
    with patch('routes.user_routes.Session') as mock_session_class:
        mock_session = MagicMock()
        mock_session_class.return_value = mock_session
        yield mock_session

@pytest.fixture
def sample_user():
    user = MagicMock(spec=User)
    user.id = 1
    user.clerk_id = 'test_clerk_id'
    user.email = 'test@example.com'
    user.preferences = {'jobType': ['Full-time'], 'location': 'San Francisco'}
    user.preferred_address = '123 Main St, San Francisco, CA'
    user.is_pro = False
    user.resume_path = '/path/to/resume.pdf'
    user.resume_text = 'This is a sample resume text'
    user.resume_keywords = ['python', 'javascript', 'react']
    user.interested_job_ids = ['job1', 'job2']
    user.not_interested_job_ids = ['job3']
    user.recommended_job_ids = ['job4', 'job5']
    user.saved_jobs_ids = ['job6', 'job7']
    return user

@pytest.fixture
def sample_job():
    job = MagicMock(spec=Job)
    job.id = 'job4'
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

def test_get_user_preferences(client, mock_db_session, sample_user):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = sample_user
    
    # Execute
    response = client.get('/api/users/test_clerk_id/preferences')
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'preferences' in data
    assert data['preferences'] == sample_user.preferences

def test_get_user_preferences_not_found(client, mock_db_session):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = None
    
    # Execute
    response = client.get('/api/users/nonexistent/preferences')
    
    # Assert
    assert response.status_code == 404
    data = json.loads(response.data)
    assert 'error' in data

def test_save_user_preferences_existing_user(client, mock_db_session, sample_user):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = sample_user
    
    # Execute
    response = client.post(
        '/api/users/test_clerk_id/preferences',
        json={
            'preferences': {'jobType': ['Part-time'], 'location': 'New York'},
            'formattedAddress': '456 Broadway, New York, NY'
        }
    )
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'message' in data
    assert sample_user.preferences == {'jobType': ['Part-time'], 'location': 'New York'}
    assert sample_user.preferred_address == '456 Broadway, New York, NY'

def test_save_user_preferences_new_user(client, mock_db_session):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = None
    
    # Execute
    response = client.post(
        '/api/users/new_clerk_id/preferences',
        json={
            'preferences': {'jobType': ['Contract'], 'location': 'Chicago'},
            'formattedAddress': '789 State St, Chicago, IL'
        }
    )
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'message' in data
    assert mock_db_session.add.called

def test_check_pro_status_existing_user(client, mock_db_session, sample_user):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = sample_user
    
    # Execute
    response = client.get('/api/users/test_clerk_id/pro-status')
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'isPro' in data
    assert data['isPro'] == sample_user.is_pro

def test_check_pro_status_new_user(client, mock_db_session):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = None
    
    # Execute
    response = client.get('/api/users/new_clerk_id/pro-status')
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'isPro' in data
    assert data['isPro'] is False
    assert mock_db_session.add.called

def test_update_pro_status_existing_user(client, mock_db_session, sample_user):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = sample_user
    
    # Execute
    response = client.post(
        '/api/users/test_clerk_id/update-pro-status',
        json={'isPro': True}
    )
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'message' in data
    assert 'isPro' in data
    assert data['isPro'] is True
    assert sample_user.is_pro is True

def test_update_pro_status_new_user(client, mock_db_session):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = None
    
    # Execute
    response = client.post(
        '/api/users/new_clerk_id/update-pro-status',
        json={'isPro': True}
    )
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'message' in data
    assert 'isPro' in data
    assert data['isPro'] is True
    assert mock_db_session.add.called

@patch('routes.user_routes.get_recommendations_for_user')
def test_get_user_recommendations_existing_user(mock_get_recommendations, client, mock_db_session, sample_user, sample_job):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = sample_user
    mock_db_session.query.return_value.filter.return_value.all.return_value = [sample_job]
    
    # Execute
    response = client.get('/api/users/test_clerk_id/recommendations')
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'recommendations' in data

@patch('routes.user_routes.get_recommendations_for_user')
def test_get_user_recommendations_new_user(mock_get_recommendations, client, mock_db_session):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = None
    mock_get_recommendations.return_value = [{'id': 'job1', 'title': 'Software Engineer'}]
    
    # Execute
    response = client.get('/api/users/new_clerk_id/recommendations')
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'recommendations' in data
    assert len(data['recommendations']) > 0

@patch('routes.user_routes.get_recommendations_for_user')
def test_get_user_recommendations_no_precomputed(mock_get_recommendations, client, mock_db_session, sample_user):
    # Setup
    sample_user.recommended_job_ids = []
    mock_db_session.query.return_value.filter.return_value.first.return_value = sample_user
    mock_get_recommendations.return_value = [{'id': 'job1', 'title': 'Software Engineer'}]
    
    # Execute
    response = client.get('/api/users/test_clerk_id/recommendations')
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'recommendations' in data
    assert len(data['recommendations']) > 0

def test_check_resume(client, mock_db_session, sample_user):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = sample_user
    
    # Execute
    response = client.get('/api/users/test_clerk_id/resume')
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'hasResume' in data
    assert data['hasResume'] is True
    assert 'resumePath' in data
    assert data['resumePath'] == sample_user.resume_path

@patch('routes.user_routes.secure_filename')
@patch('routes.user_routes.os.path.join')
@patch('routes.user_routes.extract_text_from_pdf')
@patch('routes.user_routes.is_valid_resume')
@patch('routes.user_routes.extract_resume_keywords')
def test_upload_resume_pdf(mock_extract_keywords, mock_is_valid, mock_extract_text, mock_join, mock_secure_filename, client, mock_db_session, sample_user):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = sample_user
    mock_secure_filename.return_value = 'test_clerk_id_resume.pdf'
    mock_join.return_value = '/path/to/uploads/test_clerk_id_resume.pdf'
    mock_extract_text.return_value = ('Sample resume text', None)
    mock_is_valid.return_value = True
    mock_extract_keywords.return_value = ['python', 'javascript']
    
    # Create a test PDF file
    pdf_content = b'%PDF-1.4\nTest PDF content'
    
    # Execute
    response = client.post(
        '/api/users/test_clerk_id/resume',
        data={'file': (BytesIO(pdf_content), 'resume.pdf')},
        content_type='multipart/form-data'
    )
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'message' in data
    assert 'keywords' in data

def test_get_interested_jobs(client, mock_db_session, sample_user):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = sample_user
    job1 = MagicMock(spec=Job)
    job1.id = 'job1'
    job1.title = 'Software Engineer'
    job1.__table__ = MagicMock()
    job1.__table__.columns = [MagicMock(name='id'), MagicMock(name='title')]
    
    job2 = MagicMock(spec=Job)
    job2.id = 'job2'
    job2.title = 'Data Scientist'
    job2.__table__ = MagicMock()
    job2.__table__.columns = [MagicMock(name='id'), MagicMock(name='title')]
    
    mock_db_session.query.return_value.filter.return_value.all.return_value = [job1, job2]
    
    # Execute
    response = client.get('/api/users/test_clerk_id/interested-jobs')
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'jobs' in data
    assert len(data['jobs']) == 2

def test_get_resume_text(client, mock_db_session, sample_user):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = sample_user
    
    # Execute
    with patch('builtins.open', MagicMock()):
        response = client.get('/api/users/test_clerk_id/resume-text')
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'resumeText' in data
    assert data['resumeText'] == sample_user.resume_text

def test_parse_resume_for_autofill(client):
    # Setup
    with patch('routes.user_routes.genai.GenerativeModel') as mock_model_class:
        mock_model = MagicMock()
        mock_model_class.return_value = mock_model
        
        mock_response = MagicMock()
        mock_response.text = '{"name": "John Doe", "email": "john@example.com"}'
        mock_model.generate_content.return_value = mock_response
        
        # Execute
        response = client.post(
            '/api/parse-resume-for-autofill',
            json={'resumeText': 'Sample resume text'}
        )
        
        # Assert
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'parsedData' in data
        assert data['parsedData']['name'] == 'John Doe'

def test_check_user_resume(client, mock_db_session, sample_user):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = sample_user
    
    # Execute
    response = client.get('/api/users/test_clerk_id/check-resume')
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'exists' in data
    assert data['exists'] is True
    assert 'userId' in data
    assert data['userId'] == 'test_clerk_id'

def test_get_sample_resume(client):
    # Execute
    response = client.get('/api/sample-resume')
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'resumeText' in data
    assert 'message' in data

def test_health_check(client):
    # Setup
    with patch('routes.user_routes.Session') as mock_session:
        # Execute
        response = client.get('/api/health')
        
        # Assert
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'status' in data
        assert data['status'] == 'ok'

def test_save_job(client, mock_db_session, sample_user, sample_job):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.side_effect = [sample_user, sample_job]
    
    # Execute
    response = client.post(
        '/api/save-job/job4',
        json={'clerkId': 'test_clerk_id'}
    )
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'message' in data
    assert 'job saved' in data['message'].lower()
    assert 'job4' in sample_user.saved_jobs_ids

def test_save_job_already_saved(client, mock_db_session, sample_user):
    # Setup
    sample_user.saved_jobs_ids = ['job4']
    mock_db_session.query.return_value.filter.return_value.first.return_value = sample_user
    
    # Execute
    response = client.post(
        '/api/save-job/job4',
        json={'clerkId': 'test_clerk_id'}
    )
    
    # Assert
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data
    assert 'already saved' in data['error'].lower()

def test_unsave_job(client, mock_db_session, sample_user):
    # Setup
    sample_user.saved_jobs_ids = ['job4', 'job5']
    mock_db_session.query.return_value.filter.return_value.first.return_value = sample_user
    
    # Execute
    response = client.post(
        '/api/unsave-job/job4',
        json={'clerkId': 'test_clerk_id'}
    )
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'message' in data
    assert 'job removed' in data['message'].lower()
    assert 'job4' not in sample_user.saved_jobs_ids
    assert 'job5' in sample_user.saved_jobs_ids

def test_unsave_job_not_saved(client, mock_db_session, sample_user):
    # Setup
    sample_user.saved_jobs_ids = ['job5']
    mock_db_session.query.return_value.filter.return_value.first.return_value = sample_user
    
    # Execute
    response = client.post(
        '/api/unsave-job/job4',
        json={'clerkId': 'test_clerk_id'}
    )
    
    # Assert
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data
    assert 'not saved' in data['error'].lower()

def test_get_saved_jobs(client, mock_db_session, sample_user):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = sample_user
    job1 = MagicMock(spec=Job)
    job1.id = 'job6'
    job1.title = 'Frontend Developer'
    job1.__table__ = MagicMock()
    job1.__table__.columns = [MagicMock(name='id'), MagicMock(name='title')]
    
    job2 = MagicMock(spec=Job)
    job2.id = 'job7'
    job2.title = 'Backend Developer'
    job2.__table__ = MagicMock()
    job2.__table__.columns = [MagicMock(name='id'), MagicMock(name='title')]
    
    mock_db_session.query.return_value.filter.return_value.all.return_value = [job1, job2]
    
    # Execute
    response = client.get('/api/users/test_clerk_id/saved-jobs')
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'jobs' in data
    assert len(data['jobs']) == 2
    assert data['jobs'][0]['id'] == 'job6'
    assert data['jobs'][1]['id'] == 'job7'

def test_get_saved_jobs_user_not_found(client, mock_db_session):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = None
    
    # Execute
    response = client.get('/api/users/nonexistent/saved-jobs')
    
    # Assert
    assert response.status_code == 404
    data = json.loads(response.data)
    assert 'error' in data

def test_mark_job_interested(client, mock_db_session, sample_user, sample_job):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.side_effect = [sample_user, sample_job]
    
    # Execute
    response = client.post(
        '/api/users/test_clerk_id/interested/job4'
    )
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'message' in data
    assert 'job4' in sample_user.interested_job_ids

def test_mark_job_not_interested(client, mock_db_session, sample_user, sample_job):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.side_effect = [sample_user, sample_job]
    
    # Execute
    response = client.post(
        '/api/users/test_clerk_id/not-interested/job4'
    )
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'message' in data
    assert 'job4' in sample_user.not_interested_job_ids

def test_get_not_interested_jobs(client, mock_db_session, sample_user):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = sample_user
    job = MagicMock(spec=Job)
    job.id = 'job3'
    job.title = 'QA Engineer'
    job.__table__ = MagicMock()
    job.__table__.columns = [MagicMock(name='id'), MagicMock(name='title')]
    
    mock_db_session.query.return_value.filter.return_value.all.return_value = [job]
    
    # Execute
    response = client.get('/api/users/test_clerk_id/not-interested-jobs')
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'jobs' in data
    assert len(data['jobs']) == 1
    assert data['jobs'][0]['id'] == 'job3'

@patch('routes.user_routes.extract_text_from_docx')
def test_upload_resume_docx(mock_extract_text, client, mock_db_session, sample_user):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = sample_user
    mock_extract_text.return_value = ('Sample resume text from DOCX', None)
    
    with patch('routes.user_routes.secure_filename') as mock_secure_filename:
        with patch('routes.user_routes.os.path.join') as mock_join:
            with patch('routes.user_routes.is_valid_resume') as mock_is_valid:
                with patch('routes.user_routes.extract_resume_keywords') as mock_extract_keywords:
                    mock_secure_filename.return_value = 'test_clerk_id_resume.docx'
                    mock_join.return_value = '/path/to/uploads/test_clerk_id_resume.docx'
                    mock_is_valid.return_value = True
                    mock_extract_keywords.return_value = ['python', 'javascript']
                    
                    # Create a test DOCX file
                    docx_content = b'PK\x03\x04\x14\x00\x00\x00\x08\x00Test DOCX content'
                    
                    # Execute
                    response = client.post(
                        '/api/users/test_clerk_id/resume',
                        data={'file': (BytesIO(docx_content), 'resume.docx')},
                        content_type='multipart/form-data'
                    )
                    
                    # Assert
                    assert response.status_code == 200
                    data = json.loads(response.data)
                    assert 'message' in data
                    assert 'keywords' in data

def test_upload_resume_invalid_format(client, mock_db_session, sample_user):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = sample_user
    
    # Create a test text file
    text_content = b'This is a plain text file'
    
    # Execute
    response = client.post(
        '/api/users/test_clerk_id/resume',
        data={'file': (BytesIO(text_content), 'resume.txt')},
        content_type='multipart/form-data'
    )
    
    # Assert
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data
    assert 'unsupported file format' in data['error'].lower()

def test_upload_resume_extraction_error(client, mock_db_session, sample_user):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = sample_user
    
    with patch('routes.user_routes.extract_text_from_pdf') as mock_extract_text:
        mock_extract_text.return_value = (None, 'Error extracting text')
        
        # Create a test PDF file
        pdf_content = b'%PDF-1.4\nTest PDF content'
        
        # Execute
        response = client.post(
            '/api/users/test_clerk_id/resume',
            data={'file': (BytesIO(pdf_content), 'resume.pdf')},
            content_type='multipart/form-data'
        )
        
        # Assert
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
        assert 'error extracting text' in data['error'].lower()

def test_upload_resume_invalid_resume(client, mock_db_session, sample_user):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = sample_user
    
    with patch('routes.user_routes.extract_text_from_pdf') as mock_extract_text:
        with patch('routes.user_routes.is_valid_resume') as mock_is_valid:
            mock_extract_text.return_value = ('Sample text', None)
            mock_is_valid.return_value = False
            
            # Create a test PDF file
            pdf_content = b'%PDF-1.4\nTest PDF content'
            
            # Execute
            response = client.post(
                '/api/users/test_clerk_id/resume',
                data={'file': (BytesIO(pdf_content), 'resume.pdf')},
                content_type='multipart/form-data'
            )
            
            # Assert
            assert response.status_code == 400
            data = json.loads(response.data)
            assert 'error' in data
            assert 'invalid resume' in data['error'].lower()

def test_parse_resume_for_autofill_error(client):
    # Setup
    with patch('routes.user_routes.genai.GenerativeModel') as mock_model_class:
        mock_model = MagicMock()
        mock_model_class.return_value = mock_model
        
        # Make the model raise an exception
        mock_model.generate_content.side_effect = Exception("API error")
        
        # Execute
        response = client.post(
            '/api/parse-resume-for-autofill',
            json={'resumeText': 'Sample resume text'}
        )
        
        # Assert
        assert response.status_code == 500
        data = json.loads(response.data)
        assert 'error' in data

def test_parse_resume_for_autofill_invalid_json(client):
    # Setup
    with patch('routes.user_routes.genai.GenerativeModel') as mock_model_class:
        mock_model = MagicMock()
        mock_model_class.return_value = mock_model
        
        mock_response = MagicMock()
        mock_response.text = 'This is not valid JSON'
        mock_model.generate_content.return_value = mock_response
        
        # Execute
        response = client.post(
            '/api/parse-resume-for-autofill',
            json={'resumeText': 'Sample resume text'}
        )
        
        # Assert
        assert response.status_code == 500
        data = json.loads(response.data)
        assert 'error' in data
        assert 'failed to parse' in data['error'].lower()

def test_get_user_profile(client, mock_db_session, sample_user):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = sample_user
    
    # Execute
    response = client.get('/api/users/test_clerk_id/profile')
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'profile' in data
    assert data['profile']['clerk_id'] == 'test_clerk_id'
    assert data['profile']['email'] == 'test@example.com'

def test_get_user_profile_not_found(client, mock_db_session):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = None
    
    # Execute
    response = client.get('/api/users/nonexistent/profile')
    
    # Assert
    assert response.status_code == 404
    data = json.loads(response.data)
    assert 'error' in data

def test_update_user_profile(client, mock_db_session, sample_user):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = sample_user
    
    # Execute
    response = client.put(
        '/api/users/test_clerk_id/profile',
        json={
            'email': 'updated@example.com',
            'preferences': {'jobType': ['Remote'], 'location': 'Austin'}
        }
    )
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'message' in data
    assert sample_user.email == 'updated@example.com'
    assert sample_user.preferences == {'jobType': ['Remote'], 'location': 'Austin'}

def test_delete_user_account(client, mock_db_session, sample_user):
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = sample_user
    
    # Execute
    response = client.delete('/api/users/test_clerk_id')
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'message' in data
    assert mock_db_session.delete.called
    assert mock_db_session.commit.called