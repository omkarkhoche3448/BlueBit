import os
import sys
import pytest
import json
import tempfile
from unittest.mock import patch
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app
from models import Base, User, Job
from config import DATABASE_URL

@pytest.fixture
def client():
    """Create a test client."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

@pytest.fixture
def test_db():
    """Create a test database and populate it with test data."""
    # Create a temporary file for SQLite database
    db_fd, db_path = tempfile.mkstemp()
    test_db_url = f"sqlite:///{db_path}"
    
    # Create the engine and tables
    engine = create_engine(test_db_url)
    Base.metadata.create_all(engine)
    
    # Create a session factory
    TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestSessionLocal()
    
    # Add test data
    test_user = User(
        clerk_id="test_clerk_id",
        email="test@example.com",
        is_pro=False,
        preferences={"jobType": ["Full-time"], "location": "Remote"},
        saved_jobs_ids=["job1"],
        interested_job_ids=["job2"],
        not_interested_job_ids=["job3"],
        recommended_job_ids=["job4", "job5"]
    )
    
    test_jobs = [
        Job(
            id="job1",
            title="Software Engineer",
            company="Tech Co",
            location="Remote",
            job_type="Full-time",
            description="Job 1 description",
            url="https://example.com/job1",
            date_posted="2023-01-01"
        ),
        Job(
            id="job2",
            title="Data Scientist",
            company="Data Co",
            location="New York",
            job_type="Full-time",
            description="Job 2 description",
            url="https://example.com/job2",
            date_posted="2023-01-02"
        ),
        Job(
            id="job3",
            title="Product Manager",
            company="Product Co",
            location="San Francisco",
            job_type="Full-time",
            description="Job 3 description",
            url="https://example.com/job3",
            date_posted="2023-01-03"
        ),
        Job(
            id="job4",
            title="UX Designer",
            company="Design Co",
            location="Remote",
            job_type="Contract",
            description="Job 4 description",
            url="https://example.com/job4",
            date_posted="2023-01-04"
        ),
        Job(
            id="job5",
            title="DevOps Engineer",
            company="Cloud Co",
            location="Seattle",
            job_type="Full-time",
            description="Job 5 description",
            url="https://example.com/job5",
            date_posted="2023-01-05"
        )
    ]
    
    session.add(test_user)
    for job in test_jobs:
        session.add(job)
    
    session.commit()
    
    # Patch the DATABASE_URL and Session in config
    with patch('config.DATABASE_URL', test_db_url):
        with patch('config.Session', TestSessionLocal):
            with patch('routes.user_routes.Session', TestSessionLocal):
                with patch('routes.job_routes.session_scope') as mock_session_scope:
                    # Configure the mock to return our test session
                    mock_session_scope.return_value.__enter__.return_value = session
                    yield session
    
    # Teardown - close and remove the temporary database
    session.close()
    os.close(db_fd)
    os.unlink(db_path)

def test_get_user_recommendations_integration(client, test_db):
    """Test getting user recommendations through the API."""
    # Mock the recommendation engine to return fixed recommendations
    with patch('routes.user_routes.get_recommendations_for_user') as mock_get_recommendations:
        mock_get_recommendations.return_value = [
            {"id": "job4", "title": "UX Designer", "company": "Design Co"},
            {"id": "job5", "title": "DevOps Engineer", "company": "Cloud Co"}
        ]
        
        # Make the API request
        response = client.get('/api/users/test_clerk_id/recommendations')
        
        # Assert
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'recommendations' in data
        assert len(data['recommendations']) == 2
        assert data['recommendations'][0]['id'] == 'job4'
        assert data['recommendations'][1]['id'] == 'job5'

def test_search_jobs_integration(client, test_db):
    """Test searching jobs through the API."""
    # Make the API request
    response = client.post(
        '/api/search-jobs',
        json={
            'page': 1,
            'per_page': 10,
            'filters': {
                'searchTerm': 'engineer',
                'jobType': ['Full-time'],
                'location': ['Remote']
            }
        }
    )
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'jobs' in data
    assert 'pagination' in data
    
    # Check that the search term filter worked
    for job in data['jobs']:
        assert 'engineer' in job['title'].lower() or 'engineer' in job['description'].lower()

def test_update_user_preferences_integration(client, test_db):
    """Test updating user preferences through the API."""
    # Make the API request
    response = client.post(
        '/api/users/test_clerk_id/preferences',
        json={
            'preferences': {
                'jobType': ['Part-time', 'Contract'],
                'location': 'New York',
                'minSalary': 80000
            },
            'formattedAddress': 'New York, NY'
        }
    )
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'message' in data
    assert 'preferences' in data
    assert data['preferences']['jobType'] == ['Part-time', 'Contract']
    assert data['preferences']['location'] == 'New York'
    assert data['preferences']['minSalary'] == 80000
    
    # Verify the database was updated
    user = test_db.query(User).filter(User.clerk_id == 'test_clerk_id').first()
    assert user.preferences['jobType'] == ['Part-time', 'Contract']
    assert user.preferences['location'] == 'New York'
    assert user.preferences['minSalary'] == 80000
    assert user.preferred_address == 'New York, NY'

def test_edge_case_nonexistent_user(client, test_db):
    """Test API behavior with a nonexistent user."""
    # Make the API request
    response = client.get('/api/users/nonexistent_user/recommendations')
    
    # Assert
    assert response.status_code == 404
    data = json.loads(response.data)
    assert 'error' in data
    assert 'User not found' in data['error']

def test_edge_case_invalid_job_id(client, test_db):
    """Test API behavior with an invalid job ID."""
    # Make the API request
    response = client.get('/api/job/nonexistent_job')
    
    # Assert
    assert response.status_code == 404
    data = json.loads(response.data)
    assert 'error' in data
    assert 'Job not found' in data['error']

def test_edge_case_malformed_request(client, test_db):
    """Test API behavior with a malformed request."""
    # Make the API request with invalid JSON
    response = client.post(
        '/api/search-jobs',
        data='invalid json',
        content_type='application/json'
    )
    
    # Assert
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data