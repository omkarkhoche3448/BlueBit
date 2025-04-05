import os
import sys
import pytest
import json
from unittest.mock import patch, MagicMock

# Add the parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app
from models import User, Payment
from config import Session

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

@pytest.fixture
def mock_db_session():
    with patch('routes.payment_routes.Session') as mock_session_class:
        mock_session = MagicMock()
        mock_session_class.return_value = mock_session
        yield mock_session

@pytest.fixture
def sample_user():
    user = MagicMock(spec=User)
    user.id = 1
    user.clerk_id = 'test_clerk_id'
    user.email = 'test@example.com'
    user.is_pro = False
    return user

@pytest.fixture
def sample_payment():
    payment = MagicMock(spec=Payment)
    payment.id = 1
    payment.user_id = 1
    payment.amount = 9.99
    payment.status = 'completed'
    payment.payment_method = 'credit_card'
    payment.created_at = '2023-01-01T00:00:00'
    payment.__table__ = MagicMock()
    payment.__table__.columns = [
        MagicMock(name='id'),
        MagicMock(name='user_id'),
        MagicMock(name='amount'),
        MagicMock(name='status'),
        MagicMock(name='payment_method'),
        MagicMock(name='created_at')
    ]
    return payment

@patch('routes.payment_routes.stripe.checkout.Session.create')
def test_create_checkout_session(mock_stripe_create, client):
    # Setup
    mock_stripe_create.return_value = {'id': 'test_session_id', 'url': 'https://test.com/checkout'}
    
    # Execute
    response = client.post(
        '/api/create-checkout-session',
        json={'priceId': 'price_123', 'clerkId': 'test_clerk_id'}
    )
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'sessionId' in data
    assert 'url' in data
    assert data['sessionId'] == 'test_session_id'
    assert data['url'] == 'https://test.com/checkout'

@patch('routes.payment_routes.stripe.checkout.Session.retrieve')
def test_checkout_success(mock_stripe_retrieve, client, mock_db_session, sample_user):
    # Setup
    mock_stripe_retrieve.return_value = {
        'customer_details': {'email': 'test@example.com'},
        'amount_total': 999,
        'payment_status': 'paid'
    }
    mock_db_session.query.return_value.filter.return_value.first.return_value = sample_user
    
    # Execute
    response = client.get('/api/checkout-success?session_id=test_session_id&clerk_id=test_clerk_id')
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'success' in data
    assert data['success'] is True
    assert sample_user.is_pro is True

def test_checkout_cancel(client):
    # Execute
    response = client.get('/api/checkout-cancel')
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'cancelled' in data
    assert data['cancelled'] is True

@patch('routes.payment_routes.stripe.Webhook.construct_event')
def test_stripe_webhook(mock_construct_event, client):
    # Setup
    mock_event = {
        'type': 'checkout.session.completed',
        'data': {
            'object': {
                'metadata': {'clerk_id': 'test_clerk_id'},
                'customer_details': {'email': 'test@example.com'},
                'amount_total': 999
            }
        }
    }
    mock_construct_event.return_value = mock_event
    
    with patch('routes.payment_routes.Session') as mock_session_class:
        mock_session = MagicMock()
        mock_session_class.return_value = mock_session
        mock_session.query.return_value.filter.return_value.first.return_value = sample_user()
        
        # Execute
        response = client.post(
            '/api/webhook',
            data=json.dumps(mock_event),
            headers={'Stripe-Signature': 'test_signature'}
        )
        
        # Assert
        assert response.status_code == 200
        assert response.data == b'Webhook received'

def test_get_user_payments(client, mock_db_session, sample_payment):
    # Setup
    mock_db_session.query.return_value.join.return_value.filter.return_value.all.return_value = [sample_payment]
    
    # Execute
    response = client.get('/api/users/test_clerk_id/payments')
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'payments' in data
    assert len(data['payments']) == 1
    assert data['payments'][0]['amount'] == 9.99