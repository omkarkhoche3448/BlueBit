import pytest
import os
from flask import Flask
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from models import User, Base
from routes.auth_routes import register_auth_routes
from utils.auth_utils import hash_password, generate_jwt_token, generate_email_verification_token
import json
import jwt  # Add this import
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock
import uuid

# Use test database - prefer test database over production
@pytest.fixture(scope="session")
def engine():
    # For CI/CD: Use in-memory SQLite if no database URL is specified
    test_db_url = os.environ.get('TEST_DATABASE_URL') 
    
    if test_db_url:
        engine = create_engine(test_db_url)
    else:
        # Fallback to in-memory SQLite for isolated testing
        engine = create_engine('sqlite:///:memory:')
    
    Base.metadata.create_all(engine)
    return engine

@pytest.fixture(scope="function")
def db_session(engine):
    """Creates a new database session for each test"""
    connection = engine.connect()
    transaction = connection.begin()
    
    # Create a session factory bound to the connection
    Session = scoped_session(sessionmaker(bind=connection))
    
    # Replace the Session in your application with our test session
    from routes import auth_routes
    old_session = auth_routes.Session
    auth_routes.Session = Session
    
    # Also patch the session in utils if needed
    from utils import auth_utils
    if hasattr(auth_utils, 'Session'):
        old_utils_session = auth_utils.Session
        auth_utils.Session = Session
    
    yield Session
    
    # Rollback the transaction and restore the original session
    if transaction.is_active:
        transaction.rollback()
    connection.close()
    Session.remove()
    
    auth_routes.Session = old_session
    if hasattr(auth_utils, 'Session'):
        auth_utils.Session = old_utils_session

@pytest.fixture
def app(engine, db_session):
    app = Flask(__name__)
    app.config.update({
        'TESTING': True,
        'SECRET_KEY': os.environ.get('API_SECRET_KEY', 'test_secret_key'),
        'MAIL_SERVER': os.environ.get('SMTP_SERVER', 'smtp.gmail.com'),
        'MAIL_PORT': int(os.environ.get('SMTP_PORT', 587)),
        'MAIL_USERNAME': os.environ.get('SMTP_USERNAME', ''),
        'MAIL_PASSWORD': os.environ.get('SMTP_PASSWORD', ''),
        'MAIL_DEFAULT_SENDER': os.environ.get('FROM_EMAIL', ''),
        'MAIL_USE_TLS': True,
        'CASHFREE_APP_ID': os.environ.get('CASHFREE_APP_ID', ''),
        'CASHFREE_SECRET_KEY': os.environ.get('CASHFREE_SECRET_KEY', ''),
        'CASHFREE_ENV': os.environ.get('CASHFREE_ENV', 'TEST')
    })
    
    # Register routes
    register_auth_routes(app)
    
    return app

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def sample_user():
    # Generate unique email and username to avoid conflicts
    unique_id = uuid.uuid4().hex[:8]
    return {
        'email': f'test_{unique_id}@example.com',
        'username': f'testuser_{unique_id}',
        'password': 'TestPass123',
        'phoneNumber': '1234567890'
    }

@pytest.fixture
def mock_email_sender():
    # Use the exact import path from your routes
    # This path might need adjustment based on your actual code structure
    with patch('routes.auth_routes.send_verification_email') as mock:
        yield mock

class TestAuthRoutesWithEmailVerification:
    def setup_method(self, method):
        """Setup before each test method"""
        # Any setup code needed

    def teardown_method(self, method):
        """Cleanup after each test method"""
        # Any cleanup code needed
    
    def test_signup_sends_verification_email(self, client, sample_user, mock_email_sender):
        """Test that signup sends verification email"""
        response = client.post(
            '/api/auth/signup',
            json=sample_user
        )
        
        # Check if the status code is 201 (CREATED) or adjust to match your API
        assert response.status_code in [200, 201], f"Unexpected status code: {response.status_code}, response: {response.data}"
        
        # Verify email was sent (if your mock is correctly patched)
        assert mock_email_sender.called, "Email sender was not called"

    def test_login_without_verification(self, client, sample_user, db_session):
        """Test that unverified users cannot login"""
        # First register the user
        signup_response = client.post('/api/auth/signup', json=sample_user)
        assert signup_response.status_code in [200, 201], f"Failed to create test user: {signup_response.data}"
        
        # Try to login without verifying
        response = client.post(
            '/api/auth/login',
            json={
                'usernameOrEmail': sample_user['email'],
                'password': sample_user['password']
            }
        )
        
        # Adjust expected status code to match your actual API behavior
        assert response.status_code in [401, 403], f"Unexpected status code: {response.status_code}"
        
        # Check for indication that verification is needed (adjust based on your API response)
        data = json.loads(response.data)
        assert 'error' in data or 'needsVerification' in data

    def test_verify_email_success(self, client, sample_user, db_session):
        """Test successful email verification"""
        # Register user
        signup_response = client.post('/api/auth/signup', json=sample_user)
        assert signup_response.status_code in [200, 201], f"Failed to create test user: {signup_response.data}"
        
        # Get user from database
        user = db_session.query(User).filter_by(email=sample_user['email']).first()
        assert user is not None, "User not found in database"
        user_id = user.id  # Store the ID for later
        
        # Generate verification token
        token = generate_email_verification_token(user_id)
        
        # Verify email
        response = client.get(f'/api/auth/verify-email?token={token}')
        assert response.status_code == 200
        
        # Query for the user again instead of refreshing
        updated_user = db_session.query(User).filter_by(id=user_id).first()
        assert updated_user.email_verified == True

    def test_verify_email_invalid_token(self, client):
        """Test email verification with invalid token"""
        response = client.get('/api/auth/verify-email?token=invalid_token')
        assert response.status_code == 400

    def test_resend_verification_email(self, client, sample_user, mock_email_sender):
        """Test resending verification email"""
        # First register the user
        client.post('/api/auth/signup', json=sample_user)
        
        # Reset mock to clear first verification email
        mock_email_sender.reset_mock()
        
        # Request new verification email
        response = client.post(
            '/api/auth/resend-verification',
            json={'email': sample_user['email']}
        )
        
        assert response.status_code == 200
        mock_email_sender.assert_called_once()

    def test_verification_status_check(self, client, sample_user):
        """Test checking email verification status"""
        # Register user
        client.post('/api/auth/signup', json=sample_user)
        
        # Check status
        response = client.get(f'/api/auth/verification-status/{sample_user["email"]}')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['exists'] == True
        assert data['verified'] == False

    def test_login_after_verification(self, client, sample_user, db_session):
        """Test successful login after email verification"""
        # Register user
        client.post('/api/auth/signup', json=sample_user)
        
        # Get user from database and mark as verified
        user = db_session.query(User).filter_by(email=sample_user['email']).first()
        user.email_verified = True
        db_session.commit()
        
        # Try login
        response = client.post(
            '/api/auth/login',
            json={
                'usernameOrEmail': sample_user['email'],
                'password': sample_user['password']
            }
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'token' in data
        assert data['user']['email'] == sample_user['email']

    def test_verification_link_expiration(self, client, sample_user, db_session):
        """Test that verification links expire"""
        # Register user
        client.post('/api/auth/signup', json=sample_user)
        
        # Get user from database
        user = db_session.query(User).filter_by(email=sample_user['email']).first()
        
        # Mock the token verification function to simulate an expired token
        with patch('utils.auth_utils.jwt.decode') as mock_decode:
            mock_decode.side_effect = jwt.ExpiredSignatureError("Token has expired")
            
            # Generate a token (it doesn't matter what it is since we're mocking the verification)
            token = generate_email_verification_token(user.id)
            
            # Try to verify with the token that will trigger our mocked exception
            response = client.get(f'/api/auth/verify-email?token={token}')
            assert response.status_code == 400
            data = json.loads(response.data)
            assert 'Invalid' in data.get('error', '') or 'expired' in data.get('error', '')

    @pytest.mark.parametrize('missing_field', ['email', 'username', 'password'])
    def test_signup_missing_required_fields(self, client, sample_user, missing_field):
        """Test signup validation for required fields"""
        data = sample_user.copy()
        del data[missing_field]
        
        response = client.post('/api/auth/signup', json=data)
        assert response.status_code == 400