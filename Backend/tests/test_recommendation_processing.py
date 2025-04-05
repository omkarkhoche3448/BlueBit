import os
import sys
import pytest
import json
from unittest.mock import patch, MagicMock

# Add the parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import batch_process_recommendations
from models import User
from config import Session

@pytest.fixture
def mock_db_session():
    session = MagicMock()
    return session

@pytest.fixture
def sample_users():
    user1 = MagicMock(spec=User)
    user1.clerk_id = 'user1'
    user1.not_interested_job_ids = ['job3', 'job4']
    
    user2 = MagicMock(spec=User)
    user2.clerk_id = 'user2'
    user2.not_interested_job_ids = []
    
    user3 = MagicMock(spec=User)
    user3.clerk_id = 'user3'
    user3.not_interested_job_ids = json.dumps(['job5', 'job6'])  # Test string representation
    
    return [user1, user2, user3]

@patch('app.get_recommendations_for_user')
def test_batch_process_recommendations(mock_get_recommendations, mock_db_session, sample_users):
    # Setup
    mock_db_session.query.return_value.all.return_value = sample_users
    
    # Mock recommendations for each user
    mock_get_recommendations.side_effect = [
        [{'id': 'job1'}, {'id': 'job2'}, {'id': 'job3'}, {'id': 'job4'}],  # For user1
        [{'id': 'job5'}, {'id': 'job6'}, {'id': 'job7'}],                  # For user2
        [{'id': 'job7'}, {'id': 'job8'}, {'id': 'job5'}, {'id': 'job6'}]   # For user3
    ]
    
    # Execute
    batch_process_recommendations(mock_db_session)
    
    # Assert
    assert mock_get_recommendations.call_count == 3
    
    # Check that not_interested jobs were filtered out
    assert sample_users[0].recommended_job_ids == ['job1', 'job2']
    assert sample_users[1].recommended_job_ids == ['job5', 'job6', 'job7']
    assert sample_users[2].recommended_job_ids == ['job7', 'job8']
    
    # Verify commit was called
    assert mock_db_session.commit.called

@patch('app.get_recommendations_for_user')
def test_batch_process_recommendations_with_error(mock_get_recommendations, mock_db_session, sample_users):
    # Setup
    mock_db_session.query.return_value.all.return_value = sample_users
    
    # Make the second user raise an exception
    def side_effect(clerk_id, count):
        if clerk_id == 'user2':
            raise Exception("Test error")
        elif clerk_id == 'user1':
            return [{'id': 'job1'}, {'id': 'job2'}]
        else:
            return [{'id': 'job7'}, {'id': 'job8'}]
    
    mock_get_recommendations.side_effect = side_effect
    
    # Execute
    batch_process_recommendations(mock_db_session)
    
    # Assert
    assert mock_get_recommendations.call_count == 3
    
    # Check that recommendations were processed for users 1 and 3 despite error with user 2
    assert sample_users[0].recommended_job_ids == ['job1', 'job2']
    assert sample_users[2].recommended_job_ids == ['job7', 'job8']
    
    # Verify commit was called
    assert mock_db_session.commit.called

@patch('app.get_recommendations_for_user')
def test_batch_process_recommendations_global_error(mock_get_recommendations, mock_db_session):
    # Setup
    mock_db_session.query.return_value.all.side_effect = Exception("Database error")
    
    # Execute
    batch_process_recommendations(mock_db_session)
    
    # Assert
    assert not mock_get_recommendations.called
    assert mock_db_session.rollback.called