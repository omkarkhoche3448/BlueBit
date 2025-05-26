import pytest
import json
import jwt
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock
from functools import wraps
from models import User
from utils.auth_utils import generate_jwt_token
from utils.jwt_middleware import jwt_required, get_user_id_from_jwt

@pytest.fixture
def test_jwt_token():
    """Create a valid JWT token for testing"""
    return generate_jwt_token(1, 'testuser')

@pytest.fixture
def client(monkeypatch):
    """Create a test client for the Flask app with Chrome extension routes registered"""
    from flask import Flask, g
    app = Flask(__name__)
    app.config['TESTING'] = True
    app.config['SECRET_KEY'] = 'test_secret'
    
    # Override the jwt_required decorator for testing
    def mock_jwt_required(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            # Simulate a successful JWT validation without adding user_id parameter
            # This matches the actual function behavior which gets user_id from get_user_id_from_jwt()
            return f(*args, **kwargs)
        return decorated
    
    # Override the get_user_id_from_jwt function
    def mock_get_user_id():
        return 1
    
    # Apply the monkey patches
    monkeypatch.setattr('routes.chrome_extension_routes.jwt_required', mock_jwt_required)
    monkeypatch.setattr('routes.chrome_extension_routes.get_user_id_from_jwt', mock_get_user_id)
    
    # Register the routes
    from routes.chrome_extension_routes import register_chrome_extension_routes
    register_chrome_extension_routes(app)
    
    # Create a test client
    with app.test_client() as client:
        yield client

@pytest.fixture
def mock_user():
    """Create a mock user for testing"""
    return User(
        id=1,
        username='testuser',
        email='test@example.com',
        password_hash='hashed_password',
        is_pro=True,
        autofill_limit=10,
        resume_text='Test resume content with skills and experience',
        preferred_address='123 Test Street, Test City, Test Country'
    )

@pytest.fixture
def mock_gemini_response():
    """Mock response from Gemini API"""
    class MockResponse:
        @property
        def text(self):
            return json.dumps({
                "1": "John Doe",
                "2": "john.doe@example.com",
                "3": "123 Test Street, Test City, Test Country"
            })
    
    return MockResponse()

class TestChromeExtensionRoutes:
    """Tests for Chrome extension routes"""
    
    @patch('routes.chrome_extension_routes.Session')
    @patch('routes.chrome_extension_routes.genai.GenerativeModel')
    def test_process_chrome_extension_form_success(self, mock_genai_model, mock_session, client, mock_user, mock_gemini_response, test_jwt_token):
        """Test successful form processing with valid input and user"""
        # Setup session mock to return our test user
        session_instance = mock_session.return_value
        session_instance.query.return_value.filter_by.return_value.first.return_value = mock_user
        
        # Setup Gemini API mock
        mock_model_instance = MagicMock()
        mock_model_instance.generate_content.return_value = mock_gemini_response
        mock_genai_model.return_value = mock_model_instance
        
        # Test data
        test_fields = [
            {"label": "Full Name", "type": "text", "required": True},
            {"label": "Email", "type": "email", "required": True},
            {"label": "Address", "type": "text", "required": False}
        ]
        
        # Make request
        response = client.post(
            '/chrome-extension',
            json={"fields": test_fields},
            headers={'Authorization': f'Bearer {test_jwt_token}'}
        )
        
        # Verify response
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["success"] is True
        assert len(data["responses"]) == 3
        
        # Verify user's autofill limit was decremented
        assert mock_user.autofill_limit == 9
        assert session_instance.commit.called
        
        # Verify the responses have the expected structure
        assert data["responses"][0]["fieldIndex"] == 0
        assert data["responses"][0]["label"] == "Full Name"
        assert data["responses"][0]["value"] == "John Doe"
        
    @patch('routes.chrome_extension_routes.Session')
    def test_no_fields_provided(self, mock_session, client, test_jwt_token):
        """Test that appropriate error is returned when no fields are provided"""
        response = client.post(
            '/chrome-extension',
            json={"fields": []},
            headers={'Authorization': f'Bearer {test_jwt_token}'}
        )
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert data["success"] is False
        assert "No form fields provided" in data["error"]
    
    @patch('routes.chrome_extension_routes.Session')
    def test_user_not_found(self, mock_session, client, test_jwt_token):
        """Test that appropriate error is returned when user is not found"""
        # Setup session mock to return None for user
        session_instance = mock_session.return_value
        session_instance.query.return_value.filter_by.return_value.first.return_value = None
        
        test_fields = [{"label": "Full Name", "type": "text", "required": True}]
        
        response = client.post(
            '/chrome-extension',
            json={"fields": test_fields},
            headers={'Authorization': f'Bearer {test_jwt_token}'}
        )
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert data["success"] is False
        assert "User not found" in data["error"]
    
    @patch('routes.chrome_extension_routes.Session')
    def test_user_not_pro(self, mock_session, client, mock_user, test_jwt_token):
        """Test that appropriate error is returned when user is not a pro user"""
        # Modify user to not be a pro
        mock_user.is_pro = False
        
        # Setup session mock
        session_instance = mock_session.return_value
        session_instance.query.return_value.filter_by.return_value.first.return_value = mock_user
        
        test_fields = [{"label": "Full Name", "type": "text", "required": True}]
        
        response = client.post(
            '/chrome-extension',
            json={"fields": test_fields},
            headers={'Authorization': f'Bearer {test_jwt_token}'}
        )
        
        assert response.status_code == 403
        data = json.loads(response.data)
        assert data["success"] is False
        assert "Become a pro user" in data["error"]
    
    @patch('routes.chrome_extension_routes.Session')
    def test_autofill_limit_reached(self, mock_session, client, mock_user, test_jwt_token):
        """Test that appropriate error is returned when autofill limit is reached"""
        # Modify user to have zero autofill limit
        mock_user.autofill_limit = 0
        
        # Setup session mock
        session_instance = mock_session.return_value
        session_instance.query.return_value.filter_by.return_value.first.return_value = mock_user
        
        test_fields = [{"label": "Full Name", "type": "text", "required": True}]
        
        response = client.post(
            '/chrome-extension',
            json={"fields": test_fields},
            headers={'Authorization': f'Bearer {test_jwt_token}'}
        )
        
        assert response.status_code == 403
        data = json.loads(response.data)
        assert data["success"] is False
        assert "Autofill limit reached" in data["error"]
    
    @patch('routes.chrome_extension_routes.Session')
    def test_no_resume_found(self, mock_session, client, mock_user, test_jwt_token):
        """Test that appropriate error is returned when user has no resume"""
        # Modify user to have no resume
        mock_user.resume_text = None
        
        # Setup session mock
        session_instance = mock_session.return_value
        session_instance.query.return_value.filter_by.return_value.first.return_value = mock_user
        
        test_fields = [{"label": "Full Name", "type": "text", "required": True}]
        
        response = client.post(
            '/chrome-extension',
            json={"fields": test_fields},
            headers={'Authorization': f'Bearer {test_jwt_token}'}
        )
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert data["success"] is False
        assert "No resume found" in data["error"]
    
    @patch('routes.chrome_extension_routes.Session')
    @patch('routes.chrome_extension_routes.genai.GenerativeModel')
    def test_gemini_api_failure(self, mock_genai_model, mock_session, client, mock_user, test_jwt_token):
        """Test handling of Gemini API failures"""
        # Setup session mock
        session_instance = mock_session.return_value
        session_instance.query.return_value.filter_by.return_value.first.return_value = mock_user
        
        # Setup Gemini API mock to raise an exception
        mock_model_instance = MagicMock()
        mock_model_instance.generate_content.side_effect = Exception("API Error")
        mock_genai_model.return_value = mock_model_instance
        
        test_fields = [{"label": "Full Name", "type": "text", "required": True}]
        
        response = client.post(
            '/chrome-extension',
            json={"fields": test_fields},
            headers={'Authorization': f'Bearer {test_jwt_token}'}
        )
        
        assert response.status_code == 500
        data = json.loads(response.data)
        assert data["success"] is False
        assert "API Error" in data["error"]
    
    @patch('routes.chrome_extension_routes.Session')
    @patch('routes.chrome_extension_routes.genai.GenerativeModel')
    def test_json_parsing_error(self, mock_genai_model, mock_session, client, mock_user, test_jwt_token):
        """Test handling of JSON parsing errors from Gemini response"""
        # Setup session mock
        session_instance = mock_session.return_value
        session_instance.query.return_value.filter_by.return_value.first.return_value = mock_user
        
        # Setup Gemini API mock to return invalid JSON
        mock_response = MagicMock()
        mock_response.text = "This is not valid JSON"
        
        mock_model_instance = MagicMock()
        mock_model_instance.generate_content.return_value = mock_response
        mock_genai_model.return_value = mock_model_instance
        
        test_fields = [{"label": "Full Name", "type": "text", "required": True}]
        
        response = client.post(
            '/chrome-extension',
            json={"fields": test_fields},
            headers={'Authorization': f'Bearer {test_jwt_token}'}
        )
        
        assert response.status_code == 500
        data = json.loads(response.data)
        assert data["success"] is False
        assert "Failed to parse AI response" in data["error"]
        assert "raw_response" in data
    
    @patch('routes.chrome_extension_routes.Session')
    @patch('routes.chrome_extension_routes.genai.GenerativeModel')
    def test_code_block_parsing(self, mock_genai_model, mock_session, client, mock_user, test_jwt_token):
        """Test parsing of code blocks in Gemini response"""
        # Setup session mock
        session_instance = mock_session.return_value
        session_instance.query.return_value.filter_by.return_value.first.return_value = mock_user
        
        # Setup Gemini API mock to return JSON in code blocks
        mock_response = MagicMock()
        mock_response.text = '''```json
{
  "1": "John Doe",
  "2": "john.doe@example.com"
}
```'''
        
        mock_model_instance = MagicMock()
        mock_model_instance.generate_content.return_value = mock_response
        mock_genai_model.return_value = mock_model_instance
        
        test_fields = [
            {"label": "Full Name", "type": "text", "required": True},
            {"label": "Email", "type": "email", "required": True}
        ]
        
        response = client.post(
            '/chrome-extension',
            json={"fields": test_fields},
            headers={'Authorization': f'Bearer {test_jwt_token}'}
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["success"] is True
        assert len(data["responses"]) == 2
        assert data["responses"][0]["value"] == "John Doe"
        assert data["responses"][1]["value"] == "john.doe@example.com"
    
    @patch('routes.chrome_extension_routes.Session')
    @patch('routes.chrome_extension_routes.genai.GenerativeModel')
    def test_missing_fields_in_response(self, mock_genai_model, mock_session, client, mock_user, test_jwt_token):
        """Test handling of missing fields in Gemini response"""
        # Setup session mock
        session_instance = mock_session.return_value
        session_instance.query.return_value.filter_by.return_value.first.return_value = mock_user
        
        # Setup Gemini API mock to return incomplete response
        mock_response = MagicMock()
        mock_response.text = json.dumps({
            "1": "John Doe"
            # Missing field 2
        })
        
        mock_model_instance = MagicMock()
        mock_model_instance.generate_content.return_value = mock_response
        mock_genai_model.return_value = mock_model_instance
        
        test_fields = [
            {"label": "Full Name", "type": "text", "required": True},
            {"label": "Email", "type": "email", "required": True}
        ]
        
        response = client.post(
            '/chrome-extension',
            json={"fields": test_fields},
            headers={'Authorization': f'Bearer {test_jwt_token}'}
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["success"] is True
        assert len(data["responses"]) == 2
        assert data["responses"][0]["value"] == "John Doe"
        assert data["responses"][1]["value"] == ""  # Empty value for missing field
