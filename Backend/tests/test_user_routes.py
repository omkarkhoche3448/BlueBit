import pytest
import os
import json
from datetime import datetime, timedelta
from flask import Flask
from unittest.mock import patch, MagicMock
from werkzeug.datastructures import FileStorage
from io import BytesIO
from models import User, Job, Base
from routes.user_routes import register_user_routes
from utils.auth_utils import generate_jwt_token
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session

@pytest.fixture(scope="session")
def engine():
    """Create test database engine"""
    test_db_url = os.environ.get('TEST_DATABASE_URL') or 'sqlite:///:memory:'
    engine = create_engine(test_db_url)
    Base.metadata.create_all(engine)
    return engine

@pytest.fixture(scope="function")
def db_session(engine):
    """Creates a new database session for each test"""
    connection = engine.connect()
    transaction = connection.begin()
    
    Session = scoped_session(sessionmaker(bind=connection))
    
    # Replace the Session in your application with our test session
    from routes import user_routes
    old_session = user_routes.Session
    user_routes.Session = Session
    
    yield Session
    
    # Rollback the transaction and restore the original session
    if transaction.is_active:
        transaction.rollback()
    connection.close()
    Session.remove()
    
    user_routes.Session = old_session

@pytest.fixture
def app(engine, db_session):
    """Create test Flask app"""
    app = Flask(__name__)
    app.config['TESTING'] = True
    app.config['SECRET_KEY'] = 'test_secret'
    app.config['RESUME_UPLOAD_FOLDER'] = '/tmp/test_uploads'
    
    # Create upload folder if it doesn't exist
    os.makedirs(app.config['RESUME_UPLOAD_FOLDER'], exist_ok=True)
    
    # Register routes
    register_user_routes(app)
    
    return app

@pytest.fixture
def client(app):
    """Create test client"""
    return app.test_client()

@pytest.fixture
def test_user(db_session):
    """Create test user"""
    # Generate a unique username using timestamp
    import time
    unique_suffix = str(int(time.time() * 1000))
    
    user = User(
        username=f"testuser_{unique_suffix}",
        email=f"test_{unique_suffix}@example.com",
        password_hash="hashed_password",  # Corrected field name based on User model
        preferences=json.dumps({"jobType": "Full-time", "location": "Remote"}),
        is_pro=False,
        resume_path=None,
        resume_text=None,
        resume_keywords=None,
        recommended_job_ids=None,
        interested_job_ids=None
    )
    db_session.add(user)
    db_session.commit()
    
    user_id = user.id
    db_session.close()
    
    return user_id

@pytest.fixture
def auth_headers(test_user, db_session):
    """Create auth headers with JWT token"""
    # Get the username for the test_user
    user = db_session.query(User).filter_by(id=test_user).first()
    token = generate_jwt_token(test_user, user.username)
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def sample_job(db_session):
    """Create a sample job"""
    import uuid
    job = Job(
        id=str(uuid.uuid4()),  # Add a UUID as the ID
        title="Software Engineer",
        company="Test Company",
        location="Remote",
        description="Test job description",
        salary="$100,000",
        url="https://example.com/job",
        date_posted=datetime.now(),
        job_type="Full-time",
        site="test",  # Add required field
        job_url="https://example.com/job"  # Add required field
    )
    db_session.add(job)
    db_session.commit()
    
    job_id = job.id
    db_session.close()
    
    return job_id

@pytest.fixture
def mock_gemini():
    """Mock Gemini API responses"""
    with patch('google.generativeai.GenerativeModel') as mock_model:
        model_instance = MagicMock()
        mock_model.return_value = model_instance
        
        # Mock generate_content
        response = MagicMock()
        response.text = "YES"
        model_instance.generate_content.return_value = response
        
        yield mock_model

class TestUserPreferences:
    def test_get_preferences(self, client, test_user, auth_headers, db_session):
        """Test getting user preferences"""
        response = client.get('/api/users/preferences', headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'preferences' in data
        
        # Verify preferences format (from JSON string to object)
        preferences = json.loads(data['preferences'])
        assert preferences['jobType'] == 'Full-time'
        assert preferences['location'] == 'Remote'
    
    def test_set_preferences(self, client, test_user, auth_headers, db_session):
        """Test setting user preferences"""
        new_preferences = {
            "jobType": "Part-time",
            "location": "New York",
            "salary": "$150,000"
        }
        
        response = client.post(
            '/api/users/preferences',
            headers=auth_headers,
            json={
                'preferences': json.dumps(new_preferences),
                'formattedAddress': 'New York, NY'
            }
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Preferences saved successfully'
        
        # Verify in database
        user = db_session.query(User).filter_by(id=test_user).first()
        saved_preferences = json.loads(user.preferences)
        assert saved_preferences['jobType'] == 'Part-time'
        assert saved_preferences['location'] == 'New York'
        assert user.preferred_address == 'New York, NY'
    
    def test_get_preferences_not_found(self, client, auth_headers, db_session):
        """Test getting preferences for non-existent user"""
        # Generate token for non-existent user
        non_existent_user_id = 9999
        token = generate_jwt_token(non_existent_user_id, "nonexistent_user")  # Add username parameter
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.get('/api/users/preferences', headers=headers)
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'error' in data
        assert data['error'] == 'User not found'

class TestProStatus:
    def test_get_pro_status(self, client, test_user, auth_headers, db_session):
        """Test getting pro status"""
        response = client.get('/api/users/pro-status', headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'isPro' in data
        assert data['isPro'] is False
    
    def test_update_pro_status(self, client, test_user, auth_headers, db_session):
        """Test updating pro status"""
        response = client.post(
            '/api/users/update-pro-status',
            headers=auth_headers,
            json={'isPro': True}
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Pro status updated successfully'
        assert data['isPro'] is True
        
        # Verify in database
        user = db_session.query(User).filter_by(id=test_user).first()
        assert user.is_pro is True

class TestResumeManagement:
    def test_check_resume_status_no_resume(self, client, test_user, auth_headers):
        """Test checking resume status when no resume exists"""
        response = client.get('/api/users/resume', headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['hasResume'] is False
        assert data['hasKeywords'] is False
    
    @patch('routes.user_routes.extract_text_from_pdf')
    @patch('routes.user_routes.extract_resume_keywords')
    @patch('routes.user_routes.is_valid_resume')
    def test_upload_resume_pdf(self, mock_validate, mock_keywords, mock_extract, 
                               client, test_user, auth_headers, db_session):
        """Test uploading a PDF resume"""
        # Configure mocks
        mock_extract.return_value = ("Sample resume text", None)
        mock_keywords.return_value = ["python", "javascript", "react"]
        mock_validate.return_value = True
        
        # Use the correct path to the test resume file
        import os
        resume_path = os.path.join("resume", "TestResume.pdf")
        
        # Check if file exists before opening
        if not os.path.exists(resume_path):
            pytest.skip(f"Test resume file not found at {resume_path}")
            
        with open(resume_path, "rb") as resume_file:
            resume_content = resume_file.read()
        
        mock_pdf = BytesIO(resume_content)
        
        response = client.post(
            '/api/users/resume',
            headers=auth_headers,
            data={
                'file': (mock_pdf, 'TestResume.pdf')
            },
            content_type='multipart/form-data'
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Resume uploaded successfully'
        assert 'keywords' in data
        assert 'python' in data['keywords']
        
        # Verify in database
        user = db_session.query(User).filter_by(id=test_user).first()
        assert user.resume_text == "Sample resume text"  # This will be the mocked text
        assert "python" in user.resume_keywords
    
    def test_get_sample_resume(self, client):
        """Test getting sample resume"""
        response = client.get('/api/sample-resume')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'resumeText' in data
        assert 'JOHN DOE' in data['resumeText']

class TestUserRecommendations:
    @patch('routes.user_routes.get_recommendations_for_user')
    def test_get_recommendations_no_precomputed(self, mock_recs, client, test_user, auth_headers):
        """Test getting recommendations when none are precomputed"""
        # Mock the recommendation engine
        mock_jobs = [
            {"id": 1, "title": "Software Engineer", "company": "Google"},
            {"id": 2, "title": "Data Scientist", "company": "Amazon"}
        ]
        mock_recs.return_value = mock_jobs
        
        response = client.get('/api/users/recommendations', headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'recommendations' in data
        assert len(data['recommendations']) == 2
        assert data['recommendations'][0]['title'] == 'Software Engineer'
    
    def test_get_recommendations_precomputed(self, client, test_user, auth_headers, 
                                             db_session, sample_job):
        """Test getting recommendations that are precomputed"""
        # Set precomputed recommendations
        user = db_session.query(User).filter_by(id=test_user).first()
        user.recommended_job_ids = [sample_job]
        db_session.commit()
        
        response = client.get('/api/users/recommendations', headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'recommendations' in data
        assert len(data['recommendations']) == 1
        assert data['recommendations'][0]['title'] == 'Software Engineer'

class TestUserProfile:
    def test_get_profile(self, client, test_user, auth_headers, db_session):
        """Test getting user profile"""
        # Get the actual user from the database
        user = db_session.query(User).filter_by(id=test_user).first()  # Corrected query
        
        response = client.get('/api/users/profile', headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'profile' in data
        assert data['profile']['username'] == user.username
        assert data['profile']['email'] == user.email
        assert data['profile']['is_pro'] is False
    
    def test_update_profile(self, client, test_user, auth_headers, db_session):
        """Test updating user profile"""
        response = client.put(
            '/api/users/profile',
            headers=auth_headers,
            json={
                'username': 'newusername',
                'email': 'newemail@example.com'
            }
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Profile updated successfully'
        assert 'username' in data['updated_fields']
        assert 'email' in data['updated_fields']
        
        # Verify in database
        user = db_session.query(User).filter_by(id=test_user).first()
        assert user.username == 'newusername'
        assert user.email == 'newemail@example.com'

class TestMaintenance:
    def test_maintenance_clear_data(self, client, test_user, auth_headers, db_session):
        """Test maintenance endpoint for clearing stale data"""
        # Create expired pro user
        import time
        unique_suffix = str(int(time.time() * 1000))
        
        # Store the dynamic email
        expired_email = f"expired_{unique_suffix}@example.com"
        
        expired_user = User(
            username=f"expireduser_{unique_suffix}",
            email=expired_email,  # Use variable for consistency
            password_hash="hashed_password",
            is_pro=True,
            pro_expiration_date=datetime.now() - timedelta(days=10)
        )
        db_session.add(expired_user)
        
        # Create stale job
        import uuid
        stale_job = Job(
            id=str(uuid.uuid4()),
            site="test",
            job_url="https://example.com/stale-job",
            title="Stale Job",
            company="Old Company",
            date_posted=datetime.now() - timedelta(days=45)
        )
        db_session.add(stale_job)
        db_session.commit()
        
        # Run maintenance
        response = client.post('/api/maintenance/clear-data', headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True
        assert data['expired_pro_users_count'] == 1
        # Since there may be other stale jobs in the database, we need to
        # check that at least our added job was deleted
        assert data['deleted_jobs_count'] >= 1
        
        # Verify deletions in database
        updated_user = db_session.query(User).filter_by(email=expired_email).first()  # Use the correct email
        assert updated_user.is_pro is False
        
        # Check stale job was deleted
        stale_job_exists = db_session.query(Job).filter_by(title="Stale Job").first()
        assert stale_job_exists is None

class TestHealthCheck:
    def test_health_check(self, client):
        """Test health check endpoint"""
        response = client.get('/api/health-check')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'healthy'
        assert 'database' in data
        assert 'gemini_api' in data
        assert 'timestamp' in data