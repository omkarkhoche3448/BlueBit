import os
import sys
import pytest
import json
from unittest.mock import patch, MagicMock
from io import BytesIO

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
        
        # Also patch other modules that use Session
        with patch('routes.job_routes.session_scope') as mock_job_session:
            mock_job_session.return_value.__enter__.return_value = mock_session
            
            with patch('routes.job_interactions.Session') as mock_interactions_session:
                mock_interactions_session.return_value = mock_session
                
                with patch('routes.payment_routes.Session') as mock_payment_session:
                    mock_payment_session.return_value = mock_session
                    
                    with patch('routes.chrome_extension_routes.Session') as mock_extension_session:
                        mock_extension_session.return_value = mock_session
                        
                        yield mock_session

@pytest.fixture
def sample_user():
    user = MagicMock(spec=User)
    user.id = 1
    user.clerk_id = 'test_clerk_id'
    user.email = 'test@example.com'
    user.preferences = {'jobType': ['Full-time'], 'location': 'San Francisco'}
    user.preferred_address = '123 Main St, San Francisco, CA'
    user.is_pro = True
    user.resume_path = '/path/to/resume.pdf'
    user.resume_text = 'This is a sample resume text'
    user.resume_keywords = ['python', 'javascript', 'react']
    user.interested_job_ids = ['job1', 'job2']
    user.not_interested_job_ids = ['job3']
    user.recommended_job_ids = ['job4', 'job5']
    user.saved_jobs_ids = ['job6', 'job7']
    user.applied_job_ids = ['job8', 'job9']
    return user

@pytest.fixture
def sample_jobs():
    job1 = MagicMock(spec=Job)
    job1.id = 'job1'
    job1.title = 'Software Engineer'
    job1.company = 'Tech Company'
    job1.location = 'San Francisco, CA'
    job1.job_type = 'Full-time'
    job1.description = 'This is a job description'
    job1.url = 'https://example.com/job1'
    job1.__table__ = MagicMock()
    job1.__table__.columns = [
        MagicMock(name='id'),
        MagicMock(name='title'),
        MagicMock(name='company'),
        MagicMock(name='location'),
        MagicMock(name='job_type'),
        MagicMock(name='description'),
        MagicMock(name='url')
    ]
    
    job2 = MagicMock(spec=Job)
    job2.id = 'job4'
    job2.title = 'Data Scientist'
    job2.company = 'AI Company'
    job2.location = 'New York, NY'
    job2.job_type = 'Full-time'
    job2.description = 'This is another job description'
    job2.url = 'https://example.com/job4'
    job2.__table__ = MagicMock()
    job2.__table__.columns = [
        MagicMock(name='id'),
        MagicMock(name='title'),
        MagicMock(name='company'),
        MagicMock(name='location'),
        MagicMock(name='job_type'),
        MagicMock(name='description'),
        MagicMock(name='url')
    ]
    
    return [job1, job2]

def test_user_workflow(client, mock_db_session, sample_user, sample_jobs):
    """Test a complete user workflow from preferences to job application"""
    # Setup
    mock_db_session.query.return_value.filter.return_value.first.return_value = sample_user
    mock_db_session.query.return_value.filter.return_value.all.return_value = sample_jobs
    
    # 1. Set user preferences
    preferences_response = client.post(
        '/api/users/test_clerk_id/preferences',
        json={
            'preferences': {'jobType': ['Full-time'], 'location': 'San Francisco'},
            'formattedAddress': '123 Main St, San Francisco, CA'
        }
    )
    assert preferences_response.status_code == 200
    
    # 2. Upload resume
    with patch('routes.user_routes.secure_filename') as mock_secure_filename:
        with patch('routes.user_routes.os.path.join') as mock_join:
            with patch('routes.user_routes.extract_text_from_pdf') as mock_extract_text:
                with patch('routes.user_routes.is_valid_resume') as mock_is_valid:
                    with patch('routes.user_routes.extract_resume_keywords') as mock_extract_keywords:
                        mock_secure_filename.return_value = 'test_clerk_id_resume.pdf'
                        mock_join.return_value = '/path/to/uploads/test_clerk_id_resume.pdf'
                        mock_extract_text.return_value = ('Sample resume text', None)
                        mock_is_valid.return_value = True
                        mock_extract_keywords.return_value = ['python', 'javascript']
                        
                        pdf_content = b'%PDF-1.4\nTest PDF content'
                        
                        resume_response = client.post(
                            '/api/users/test_clerk_id/resume',
                            data={'file': (BytesIO(pdf_content), 'resume.pdf')},
                            content_type='multipart/form-data'
                        )
                        assert resume_response.status_code == 200
    
    # 3. Get job recommendations
    with patch('routes.user_routes.get_recommendations_for_user') as mock_get_recommendations:
        mock_get_recommendations.return_value = [{'id': 'job4', 'title': 'Data Scientist'}]
        
        recommendations_response = client.get('/api/users/test_clerk_id/recommendations')
        assert recommendations_response.status_code == 200
        recommendations_data = json.loads(recommendations_response.data)
        assert 'recommendations' in recommendations_data
    
    # 4. Save a job
    save_job_response = client.post(
        '/api/save-job/job4',
        json={'clerkId': 'test_clerk_id'}
    )
    assert save_job_response.status_code == 200
    
    # 5. Apply to a job
    with patch('routes.job_interactions.JobApplication') as mock_job_application:
        apply_response = client.post(
            '/api/users/test_clerk_id/apply-job/job4',
            json={'notes': 'Test application'}
        )
        assert apply_response.status_code == 200
        assert mock_db_session.add.called
    
    # 6. Get applied jobs
    applied_jobs_response = client.get('/api/users/test_clerk_id/applied-jobs')
    assert applied_jobs_response.status_code == 200
    applied_jobs_data = json.loads(applied_jobs_response.data)
    assert 'applications' in applied_jobs_data

def test_job_search_and_details_workflow(client, mock_db_session, sample_jobs):
    """Test a complete job search workflow"""
    # Setup
    mock_db_session.execute.return_value.scalar.return_value = len(sample_jobs)
    mock_db_session.execute.return_value.scalars.return_value.all.return_value = sample_jobs
    mock_db_session.query.return_value.filter.return_value.first.side_effect = lambda: sample_jobs[0]
    
    # 1. Search for jobs
    search_response = client.get('/api/search-jobs?page=1&per_page=10')
    assert search_response.status_code == 200
    search_data = json.loads(search_response.data)
    assert 'jobs' in search_data
    assert 'pagination' in search_data
    
    # 2. Search with filters
    filtered_search_response = client.post(
        '/api/search-jobs',
        json={
            'page': 1,
            'per_page': 10,
            'filters': {
                'searchTerm': 'engineer',
                'jobType': ['Full-time'],
                'location': ['San Francisco']
            }
        }
    )
    assert filtered_search_response.status_code == 200
    
    # 3. Get job details
    job_details_response = client.get('/api/job/job1')
    assert job_details_response.status_code == 200
    job_details_data = json.loads(job_details_response.data)
    assert job_details_data['id'] == 'job1'

@patch('app.model.generate_content')
def test_resume_analysis_workflow(mock_generate_content, client):
    """Test the resume analysis workflow"""
    # Setup
    mock_response = MagicMock()
    mock_response.text = json.dumps({
        "score": 75,
        "sub_scores": {
            "Keyword Optimization": 15,
            "Action Verbs": 12,
            "Measurable Achievements": 10,
            "Clarity and Conciseness": 12,
            "Professional Tone": 8,
            "Section Completeness": 8,
            "Length": 7,
            "Format Indicators": 3
        },
        "comments": {
            "Keyword Optimization": "Good use of industry keywords",
            "Action Verbs": "Strong action verbs used",
            "Measurable Achievements": "Some achievements quantified",
            "Clarity and Conciseness": "Clear writing style",
            "Professional Tone": "Professional tone maintained",
            "Section Completeness": "All major sections present",
            "Length": "Appropriate length",
            "Format Indicators": "Good formatting"
        },
        "line_by_line_feedback": [],
        "overall_assessment": "Good resume with some areas for improvement"
    })
    mock_generate_content.return_value = mock_response
    
    # Create a test PDF file
    with patch('app.PdfReader') as mock_reader_class:
        mock_reader = MagicMock()
        mock_reader_class.return_value = mock_reader
        
        # Mock pages
        page = MagicMock()
        page.extract_text.return_value = "Sample resume text"
        mock_reader.pages = [page]
        
        pdf_content = b'%PDF-1.4\nTest PDF content'
        
        # Execute
        response = client.post(
            '/api/analyze',
            data={'file': (BytesIO(pdf_content), 'test.pdf')},
            content_type='multipart/form-data'
        )
        
        # Assert
        assert response.status_code == 200
        data = json.loads(response.data)
        assert "score" in data
        assert data["score"] == 75