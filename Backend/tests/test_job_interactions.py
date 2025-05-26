import pytest
import json
from datetime import datetime
from unittest.mock import patch, MagicMock

from models import User, Job, JobInteractionStats

# Replace the client fixture with a mock app
@pytest.fixture
def client():
    """Create a mock client for testing"""
    from flask import Flask
    app = Flask(__name__)
    app.config['TESTING'] = True
    
    # Register the routes we want to test
    from routes.job_interactions import register_user_job_interaction_routes
    register_user_job_interaction_routes(app)
    
    with app.test_client() as client:
        yield client

@pytest.fixture
def mock_user():
    """Mock user for testing"""
    return User(
        id=1,
        username="testuser",
        email="test@example.com",
        interested_job_ids=[],
        not_interested_job_ids=[],
        saved_jobs_ids=[]
    )

@pytest.fixture
def mock_jobs():
    """Create sample jobs for testing"""
    return [
        Job(
            id="job1",
            title="Software Engineer",
            company="TechCorp",
            location="Remote",
            job_type="Full-time",
            min_amount=80000,
            max_amount=120000,
            currency="USD",
            interval="yearly",
            description="Software engineering role",
            date_posted=datetime.now().date(),
            job_url="https://example.com/job1",
            job_url_direct="https://example.com/job1/apply",
            company_logo="https://example.com/logo.png",
            is_remote=True
        ),
        Job(
            id="job2",
            title="Data Scientist",
            company="DataCorp",
            location="New York",
            job_type="Full-time",
            min_amount=90000,
            max_amount=130000,
            currency="USD",
            interval="yearly",
            description="Data science role",
            date_posted=datetime.now().date(),
            job_url="https://example.com/job2",
            job_url_direct="https://example.com/job2/apply",
            company_logo="https://example.com/logo2.png",
            is_remote=False
        )
    ]

@pytest.fixture
def auth_header():
    """Authentication header for testing"""
    return {"Authorization": "Bearer test_token"}

# Patch JWT middleware to bypass authentication
@pytest.fixture(autouse=True)
def mock_jwt_middleware(monkeypatch):
    """Mock JWT middleware for testing"""
    def mock_jwt_required(f):
        return f
    
    def mock_get_user_id():
        return 1
    
    monkeypatch.setattr("utils.jwt_middleware.jwt_required", mock_jwt_required)
    monkeypatch.setattr("utils.jwt_middleware.get_user_id_from_jwt", mock_get_user_id)


class TestJobInteractionUpdate:
    """Test cases for job interaction update endpoint"""
    
    @patch("routes.job_interactions.Session")
    def test_like_job(self, mock_session, client, mock_user, auth_header):
        """Test liking a job"""
        # Setup mock session
        session_instance = MagicMock()
        mock_session.return_value = session_instance
        
        # Mock user query
        session_instance.query.return_value.filter.return_value.first.side_effect = [
            mock_user,  # User query
            None  # Stats query (will create new)
        ]
        
        # Test request
        response = client.post(
            "/api/users/job-interaction",
            json={"jobId": "job1", "interactionType": "like", "value": True},
            headers=auth_header
        )
        
        # Assertions
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["message"] == "Job interaction updated successfully"
        assert data["interaction"]["liked"] is True
        assert "job1" in mock_user.interested_job_ids
        assert session_instance.commit.called

    @patch("routes.job_interactions.Session")
    def test_dislike_job(self, mock_session, client, mock_user, auth_header):
        """Test disliking a job"""
        # Setup mock session
        session_instance = MagicMock()
        mock_session.return_value = session_instance
        
        # Setup job stats
        stats = JobInteractionStats(job_id="job1", like_count=0, dislike_count=0, bookmark_count=0)
        
        # Mock queries
        session_instance.query.return_value.filter.return_value.first.side_effect = [
            mock_user,  # User query
            stats  # Stats query
        ]
        
        # Test request
        response = client.post(
            "/api/users/job-interaction",
            json={"jobId": "job1", "interactionType": "dislike", "value": True},
            headers=auth_header
        )
        
        # Assertions
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["interaction"]["disliked"] is True
        assert "job1" in mock_user.not_interested_job_ids
        assert stats.dislike_count == 1

    @patch("routes.job_interactions.Session")
    def test_bookmark_job(self, mock_session, client, mock_user, auth_header):
        """Test bookmarking a job"""
        # Setup mock session
        session_instance = MagicMock()
        mock_session.return_value = session_instance
        
        # Setup job stats
        stats = JobInteractionStats(job_id="job1", like_count=0, dislike_count=0, bookmark_count=0)
        
        # Mock queries
        session_instance.query.return_value.filter.return_value.first.side_effect = [
            mock_user,  # User query
            stats  # Stats query
        ]
        
        # Test request
        response = client.post(
            "/api/users/job-interaction",
            json={"jobId": "job1", "interactionType": "bookmark", "value": True},
            headers=auth_header
        )
        
        # Assertions
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["interaction"]["bookmarked"] is True
        assert "job1" in mock_user.saved_jobs_ids
        assert stats.bookmark_count == 1


class TestBookmarkManagement:
    """Test cases for bookmark management endpoints"""
    
    @patch("routes.job_interactions.Session")
    def test_add_bookmark(self, mock_session, client, mock_user, auth_header):
        """Test adding a bookmark"""
        # Setup mock session
        session_instance = MagicMock()
        mock_session.return_value = session_instance
        
        # Mock user query
        session_instance.query.return_value.filter.return_value.first.return_value = mock_user
        
        # Test request
        response = client.post(
            "/api/users/bookmarks",
            json={"itemId": "job1", "action": "add"},
            headers=auth_header
        )
        
        # Assertions
        assert response.status_code == 200
        data = json.loads(response.data)
        assert "job1" in data["bookmarks"]
        assert session_instance.commit.called

    @patch("routes.job_interactions.Session")
    def test_remove_bookmark(self, mock_session, client, mock_user, auth_header):
        """Test removing a bookmark"""
        # Setup mock session
        session_instance = MagicMock()
        mock_session.return_value = session_instance
        
        # Setup user with existing bookmark
        mock_user.saved_jobs_ids = ["job1", "job2"]
        
        # Mock user query
        session_instance.query.return_value.filter.return_value.first.return_value = mock_user
        
        # Test request
        response = client.post(
            "/api/users/bookmarks",
            json={"itemId": "job1", "action": "remove"},
            headers=auth_header
        )
        
        # Assertions
        assert response.status_code == 200
        data = json.loads(response.data)
        assert "job1" not in data["bookmarks"]
        assert "job2" in data["bookmarks"]
        assert session_instance.commit.called


class TestGetBookmarks:
    """Test cases for getting user bookmarks"""
    
    @patch("routes.job_interactions.Session")
    def test_get_bookmarks(self, mock_session, client, mock_user, mock_jobs, auth_header):
        """Test getting user bookmarks"""
        # Setup mock session
        session_instance = MagicMock()
        mock_session.return_value = session_instance
        
        # Setup user with bookmarks
        mock_user.saved_jobs_ids = ["job1", "job2"]
        
        # Mock queries
        session_instance.query.return_value.filter.return_value.first.return_value = mock_user
        session_instance.query.return_value.filter.return_value.all.return_value = mock_jobs
        
        # Test request
        response = client.get("/api/users/bookmarks", headers=auth_header)
        
        # Assertions
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data) == 2
        assert data[0]["id"] == "job1"
        assert data[1]["id"] == "job2"

    @patch("routes.job_interactions.Session")
    def test_empty_bookmarks(self, mock_session, client, mock_user, auth_header):
        """Test getting empty bookmarks"""
        # Setup mock session
        session_instance = MagicMock()
        mock_session.return_value = session_instance
        
        # Setup user with no bookmarks
        mock_user.saved_jobs_ids = []
        
        # Mock user query
        session_instance.query.return_value.filter.return_value.first.return_value = mock_user
        
        # Test request
        response = client.get("/api/users/bookmarks", headers=auth_header)
        
        # Assertions
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data) == 0


class TestTrendingJobs:
    """Test cases for trending jobs endpoint"""
    
    @patch("routes.job_interactions.Session")
    def test_get_trending_jobs(self, mock_session, client, mock_jobs):
        """Test getting trending jobs"""
        # Setup mock session
        session_instance = MagicMock()
        mock_session.return_value = session_instance
        
        # Setup job stats
        job_stats = [
            JobInteractionStats(
                job_id="job1", 
                like_count=10, 
                dislike_count=2, 
                bookmark_count=5,
                job=mock_jobs[0]
            ),
            JobInteractionStats(
                job_id="job2", 
                like_count=5, 
                dislike_count=8, 
                bookmark_count=3,
                job=mock_jobs[1]
            )
        ]
        
        # Mock query
        session_instance.query.return_value.join.return_value.all.return_value = job_stats
        
        # Test request
        response = client.get("/api/jobs/trending")
        
        # Assertions
        assert response.status_code == 200
        data = json.loads(response.data)
        assert "uptrend_jobs" in data
        assert "downtrend_jobs" in data
        assert len(data["uptrend_jobs"]) > 0
        assert len(data["downtrend_jobs"]) > 0
        assert data["uptrend_jobs"][0]["id"] == "job1"  # Most interactions
        assert data["downtrend_jobs"][0]["id"] == "job2"  # Most dislikes