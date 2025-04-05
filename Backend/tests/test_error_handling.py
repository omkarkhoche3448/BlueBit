import os
import sys
import pytest
from unittest.mock import patch, MagicMock

# Add the parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app

@pytest.fixture
def client():
    """Create a test client."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_database_connection_error():
    """Test handling of database connection errors."""
    # Mock the database session to raise an exception
    with patch('config.create_engine') as mock_create_engine:
        mock_create_engine.side_effect = Exception("Database connection error")
        
        # Import the function that uses the database
        from app import init_db_and_load_jobs
        
        # Execute
        result = init_db_and_load_jobs()
        
        # Assert
        assert result is False

def test_recommendation_engine_error():
    """Test handling of recommendation engine errors."""
    # Mock the recommendation engine to raise an exception
    with patch('app.init_recommendation_engine') as mock_init:
        mock_init.side_effect = Exception("Recommendation engine error")
        
        # Import the app module
        import app as app_module
        
        # Execute - this should not crash the application
        try:
            app_module.init_recommendation_engine()
            assert False, "Should have raised an exception"
        except Exception as e:
            assert "Recommendation engine error" in str(e)

def test_genai_configuration_error():
    """Test handling of Google Generative AI configuration errors."""
    # Mock the genai configure function to raise an exception
    with patch('app.genai.configure') as mock_configure:
        mock_configure.side_effect = Exception("Genai configuration error")
        
        # Import the app module
        import app as app_module
        
        # Execute - this should not crash the application
        try:
            app_module.genai.configure()
            assert False, "Should have raised an exception"
        except Exception as e:
            assert "Genai configuration error" in str(e)

def test_invalid_resume_format(client):
    """Test handling of invalid resume format."""
    # Create a test file with invalid format
    test_file = (b'invalid content', 'test.xyz')
    
    # Make the API request
    response = client.post(
        '/api/analyze',
        data={'file': test_file},
        content_type='multipart/form-data'
    )
    
    # Assert
    assert response.status_code == 400
    assert b'Unsupported file format' in response.data

def test_empty_resume(client):
    """Test handling of empty resume."""
    # Create an empty PDF file
    test_file = (b'%PDF-1.4\n', 'empty.pdf')
    
    # Make the API request
    with patch('app.extract_text_from_pdf') as mock_extract:
        mock_extract.return_value = ("", None)
        
        response = client.post(
            '/api/analyze',
            data={'file': test_file},
            content_type='multipart/form-data'
        )
        
        # Assert
        assert response.status_code == 400
        assert b'No text extracted' in response.data

def test_concurrent_requests():
    """Test handling of concurrent requests."""
    import threading
    import time
    
    # Mock the database session
    with patch('config.Session') as mock_session_class:
        mock_session = MagicMock()
        mock_session_class.return_value = mock_session
        
        # Import the function that uses the database
        from app import init_db_and_load_jobs
        
        # Create a function that simulates concurrent access
        def concurrent_access():
            init_db_and_load_jobs()
        
        # Create and start multiple threads
        threads = []
        for _ in range(5):
            thread = threading.Thread(target=concurrent_access)
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # Assert that the function was called multiple times
        assert mock_session_class.call_count >= 5