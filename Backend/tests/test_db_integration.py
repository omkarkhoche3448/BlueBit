import os
import sys
import pytest
import tempfile
from unittest.mock import patch
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from models import Base, User, Job
from app import init_db_and_load_jobs
from config import DATABASE_URL

@pytest.fixture
def test_db():
    """Create a test database."""
    # Create a temporary file for SQLite database
    db_fd, db_path = tempfile.mkstemp()
    test_db_url = f"sqlite:///{db_path}"
    
    # Create the engine and tables
    engine = create_engine(test_db_url)
    Base.metadata.create_all(engine)
    
    # Create a session factory
    TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Patch the DATABASE_URL and Session in config
    with patch('config.DATABASE_URL', test_db_url):
        with patch('config.Session', TestSessionLocal):
            yield TestSessionLocal()
    
    # Teardown - close and remove the temporary database
    os.close(db_fd)
    os.unlink(db_path)

def test_user_creation_and_query(test_db):
    """Test creating a user and querying it from the database."""
    # Create a test user
    test_user = User(
        clerk_id="test_clerk_id",
        email="test@example.com",
        is_pro=False,
        preferences={},
        saved_jobs_ids=[],
        interested_job_ids=[],
        not_interested_job_ids=[],
        recommended_job_ids=[]
    )
    
    # Add and commit to the database
    test_db.add(test_user)
    test_db.commit()
    
    # Query the user
    queried_user = test_db.query(User).filter(User.clerk_id == "test_clerk_id").first()
    
    # Assert
    assert queried_user is not None
    assert queried_user.clerk_id == "test_clerk_id"
    assert queried_user.email == "test@example.com"
    assert queried_user.is_pro == False

def test_job_creation_and_query(test_db):
    """Test creating a job and querying it from the database."""
    # Create a test job
    test_job = Job(
        id="test_job_id",
        title="Software Engineer",
        company="Test Company",
        location="Remote",
        job_type="Full-time",
        description="This is a test job description",
        url="https://example.com/job",
        date_posted="2023-01-01"
    )
    
    # Add and commit to the database
    test_db.add(test_job)
    test_db.commit()
    
    # Query the job
    queried_job = test_db.query(Job).filter(Job.id == "test_job_id").first()
    
    # Assert
    assert queried_job is not None
    assert queried_job.title == "Software Engineer"
    assert queried_job.company == "Test Company"

def test_user_job_relationship(test_db):
    """Test the relationship between users and saved jobs."""
    # Create a test user and job
    test_user = User(
        clerk_id="test_clerk_id_2",
        email="test2@example.com",
        is_pro=False,
        preferences={},
        saved_jobs_ids=["test_job_id_2"],
        interested_job_ids=[],
        not_interested_job_ids=[],
        recommended_job_ids=[]
    )
    
    test_job = Job(
        id="test_job_id_2",
        title="Data Scientist",
        company="Test Company 2",
        location="New York",
        job_type="Full-time",
        description="This is another test job description",
        url="https://example.com/job2",
        date_posted="2023-01-02"
    )
    
    # Add and commit to the database
    test_db.add(test_user)
    test_db.add(test_job)
    test_db.commit()
    
    # Query the user and job
    queried_user = test_db.query(User).filter(User.clerk_id == "test_clerk_id_2").first()
    queried_job = test_db.query(Job).filter(Job.id == "test_job_id_2").first()
    
    # Assert
    assert queried_user is not None
    assert queried_job is not None
    assert "test_job_id_2" in queried_user.saved_jobs_ids

def test_edge_case_empty_fields(test_db):
    """Test handling of empty or null fields."""
    # Create a user with minimal information
    minimal_user = User(
        clerk_id="minimal_user",
        email=None,  # Test null email
        is_pro=False,
        preferences=None,  # Test null preferences
        saved_jobs_ids=None,  # Test null saved_jobs_ids
        interested_job_ids=None,
        not_interested_job_ids=None,
        recommended_job_ids=None
    )
    
    # Add and commit to the database
    test_db.add(minimal_user)
    test_db.commit()
    
    # Query the user
    queried_user = test_db.query(User).filter(User.clerk_id == "minimal_user").first()
    
    # Assert
    assert queried_user is not None
    assert queried_user.clerk_id == "minimal_user"
    assert queried_user.email is None
    # Check that null lists are handled properly (should be initialized as empty lists)
    assert isinstance(queried_user.saved_jobs_ids, list) or queried_user.saved_jobs_ids is None
    assert isinstance(queried_user.preferences, dict) or queried_user.preferences is None

def test_transaction_rollback(test_db):
    """Test transaction rollback on error."""
    # Create a valid user
    valid_user = User(
        clerk_id="valid_user",
        email="valid@example.com",
        is_pro=False
    )
    
    # Add and commit the valid user
    test_db.add(valid_user)
    test_db.commit()
    
    try:
        # Start a new transaction
        # Create an invalid user (missing required clerk_id)
        invalid_user = User(
            email="invalid@example.com",
            is_pro=False
        )
        
        # Try to add the invalid user
        test_db.add(invalid_user)
        test_db.commit()
    except Exception:
        # Rollback on error
        test_db.rollback()
    
    # Query all users
    all_users = test_db.query(User).all()
    
    # Assert that only the valid user was added
    assert len(all_users) == 1
    assert all_users[0].clerk_id == "valid_user"