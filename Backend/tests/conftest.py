import os
import sys
import pytest
from unittest.mock import patch, MagicMock

# Add the parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Mock imports that might cause issues in testing
@pytest.fixture(autouse=True)
def mock_dependencies():
    """Mock dependencies that might cause issues in testing."""
    mocks = {
        'scipy': MagicMock(),
        'scipy.optimize': MagicMock(),
        'scipy.optimize._highspy': MagicMock(),
        'scipy.optimize._highspy._core': MagicMock(),
        'google.generativeai': MagicMock(),
    }
    
    with patch.dict('sys.modules', {**sys.modules, **mocks}):
        yield

@pytest.fixture
def app():
    """Create a Flask app for testing."""
    with patch('flask.Flask.test_client') as mock_test_client:
        from app import app
        app.config['TESTING'] = True
        app.config['DEBUG'] = False
        app.config['DATABASE_URL'] = 'sqlite:///:memory:'
        
        # Return the app
        yield app

@pytest.fixture
def client(app):
    """Create a test client."""
    with app.test_client() as client:
        yield client

