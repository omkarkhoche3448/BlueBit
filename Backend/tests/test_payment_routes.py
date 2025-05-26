import pytest
from unittest.mock import patch, MagicMock
from functools import wraps
from flask import Flask, json
from models import User

def mock_jwt_required(f):
    """Mock JWT decorator that bypasses authentication and injects user_id=1"""
    @wraps(f)
    def decorated(*args, **kwargs):
        kwargs['user_id'] = 1
        return f(*args, **kwargs)
    return decorated

@pytest.fixture
def mock_user():
    user = MagicMock(spec=User)
    user.id = 1
    user.email = 'test@example.com'
    user.username = 'testuser'
    user.phone = '1234567890'
    user.is_pro = False
    user.pro_expiration_date = None
    return user

class TestPaymentRoutes:
    """Test payment routes with mocked JWT middleware"""
    
    @pytest.fixture(autouse=True)
    def setup_method(self):
        """Setup test environment with mocked JWT"""
        with patch('utils.jwt_middleware.jwt_required', mock_jwt_required):
            from routes.payment_routes import register_payment_routes
            self.app = Flask(__name__)
            self.app.config['TESTING'] = True
            register_payment_routes(self.app)
            self.client = self.app.test_client()

    @patch('routes.payment_routes.Session')
    @patch('routes.payment_routes.create_cashfree_order')
    def test_create_payment_success(self, mock_create_cashfree_order, mock_Session, mock_user):
        mock_session = MagicMock()
        mock_session.query.return_value.filter.return_value.first.return_value = mock_user
        mock_Session.return_value = mock_session
        mock_create_cashfree_order.return_value = {
            'order_id': 'order_123',
            'payment_session_id': 'sess_abc',
            'cf_order_id': 'cf_456',
            'order_status': 'PENDING'
        }
        
        response = self.client.post('/api/payment', json={'phone': '1234567890'})
        data = response.get_json()
        
        assert response.status_code == 200
        assert data['order_id'] == 'order_123'
        assert data['payment_session_id'] == 'sess_abc'
        assert data['cf_order_id'] == 'cf_456'
        assert data['order_status'] == 'PENDING'

    @patch('routes.payment_routes.Session')
    @patch('routes.payment_routes.verify_cashfree_order')
    def test_payment_success_paid(self, mock_verify_cashfree_order, mock_Session, mock_user):
        mock_session = MagicMock()
        mock_session.query.return_value.filter.return_value.first.return_value = mock_user
        mock_Session.return_value = mock_session
        mock_verify_cashfree_order.return_value = {
            'order_status': 'PAID',
            'customer_details': {'customer_id': '1'}
        }
        
        response = self.client.post('/api/payment/success', json={'orderId': 'order_123'})
        data = response.get_json()
        
        assert response.status_code == 200
        assert data['message'] == 'Payment successful, pro status activated'
        assert data['is_pro'] is True

    @patch('routes.payment_routes.Session')
    @patch('routes.payment_routes.verify_cashfree_order')
    def test_payment_success_unauthorized(self, mock_verify_cashfree_order, mock_Session, mock_user):
        mock_session = MagicMock()
        mock_session.query.return_value.filter.return_value.first.return_value = mock_user
        mock_Session.return_value = mock_session
        mock_verify_cashfree_order.return_value = {
            'order_status': 'PAID',
            'customer_details': {'customer_id': '999'}  # Different user ID
        }
        
        response = self.client.post('/api/payment/success', json={'orderId': 'order_123'})
        data = response.get_json()
        
        assert response.status_code == 403
        assert 'Unauthorized' in data['error']

    @patch('routes.payment_routes.Session')
    def test_payment_webhook_paid(self, mock_Session, mock_user):
        mock_session = MagicMock()
        mock_session.query.return_value.filter.return_value.first.return_value = mock_user
        mock_Session.return_value = mock_session
        
        webhook_data = {
            'order': {
                'order_id': 'order_123',
                'order_status': 'PAID',
                'customer_details': {'customer_id': 1}
            }
        }
        
        response = self.client.post('/api/payment/webhook', json=webhook_data)
        data = response.get_json()
        
        assert response.status_code == 200
        assert data['status'] == 'success'

    @patch('routes.payment_routes.Session')
    def test_get_payment_status_pro_expired(self, mock_Session, mock_user):
        from datetime import datetime, timedelta
        mock_user.is_pro = True
        mock_user.pro_expiration_date = datetime.now() - timedelta(days=1)
        mock_session = MagicMock()
        mock_session.query.return_value.filter.return_value.first.return_value = mock_user
        mock_Session.return_value = mock_session
        
        response = self.client.get('/api/payment/status')
        data = response.get_json()
        
        assert response.status_code == 200
        assert data['is_pro'] is False
        assert data['user_id'] == mock_user.id
        assert data['username'] == mock_user.username

    @patch('routes.payment_routes.Session')
    @patch('routes.payment_routes.create_cashfree_order')
    def test_create_payment_user_not_found(self, mock_create_cashfree_order, mock_Session):
        mock_session = MagicMock()
        mock_session.query.return_value.filter.return_value.first.return_value = None
        mock_Session.return_value = mock_session
        
        response = self.client.post('/api/payment', json={'phone': '1234567890'})
        data = response.get_json()
        
        assert response.status_code == 404
        assert data['error'] == 'User not found'

    @patch('routes.payment_routes.Session')
    @patch('routes.payment_routes.create_cashfree_order')
    def test_create_payment_missing_phone(self, mock_create_cashfree_order, mock_Session, mock_user):
        mock_user.phone = None  # No phone number in user profile
        mock_session = MagicMock()
        mock_session.query.return_value.filter.return_value.first.return_value = mock_user
        mock_Session.return_value = mock_session
        
        response = self.client.post('/api/payment', json={})  # No phone in request either
        data = response.get_json()
        
        assert response.status_code == 400
        assert data['error'] == 'Phone number is required'

    @patch('routes.payment_routes.Session')
    @patch('routes.payment_routes.verify_cashfree_order')
    def test_payment_success_missing_order_id(self, mock_verify_cashfree_order, mock_Session, mock_user):
        mock_session = MagicMock()
        mock_session.query.return_value.filter.return_value.first.return_value = mock_user
        mock_Session.return_value = mock_session
        
        response = self.client.post('/api/payment/success', json={})  # Missing orderId
        data = response.get_json()
        
        assert response.status_code == 400
        assert data['error'] == 'Missing required parameters'

    @patch('routes.payment_routes.Session')
    @patch('routes.payment_routes.verify_cashfree_order')
    def test_payment_success_payment_not_captured(self, mock_verify_cashfree_order, mock_Session, mock_user):
        mock_session = MagicMock()
        mock_session.query.return_value.filter.return_value.first.return_value = mock_user
        mock_Session.return_value = mock_session
        mock_verify_cashfree_order.return_value = {
            'order_status': 'PENDING',
            'customer_details': {'customer_id': '1'}
        }
        
        response = self.client.post('/api/payment/success', json={'orderId': 'order_123'})
        data = response.get_json()
        
        assert response.status_code == 400
        assert data['error'] == 'Payment not captured'

    @patch('routes.payment_routes.Session')
    def test_payment_webhook_missing_data(self, mock_Session):
        mock_session = MagicMock()
        mock_Session.return_value = mock_session
        
        webhook_data = {
            'order': {
                'order_id': 'order_123'
                # Missing order_status and customer_details
            }
        }
        
        response = self.client.post('/api/payment/webhook', json=webhook_data)
        data = response.get_json()
        
        assert response.status_code == 400
        assert data['status'] == 'error'
        assert 'Missing required data' in data['message']

    @patch('routes.payment_routes.Session')
    def test_get_payment_status_user_not_found(self, mock_Session):
        mock_session = MagicMock()
        mock_session.query.return_value.filter.return_value.first.return_value = None
        mock_Session.return_value = mock_session
        
        response = self.client.get('/api/payment/status')
        data = response.get_json()
        
        assert response.status_code == 404
        assert data['error'] == 'User not found'

    @patch('routes.payment_routes.Session')
    def test_get_payment_status_active_pro(self, mock_Session, mock_user):
        from datetime import datetime, timedelta
        mock_user.is_pro = True
        mock_user.pro_expiration_date = datetime.now() + timedelta(days=10)  # Active pro
        mock_session = MagicMock()
        mock_session.query.return_value.filter.return_value.first.return_value = mock_user
        mock_Session.return_value = mock_session
        
        response = self.client.get('/api/payment/status')
        data = response.get_json()
        
        assert response.status_code == 200
        assert data['is_pro'] is True
        assert data['user_id'] == mock_user.id
        assert data['username'] == mock_user.username
        assert data['pro_expiration_date'] is not None
