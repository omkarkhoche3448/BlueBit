import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
import requests
import dotenv
import google.generativeai as genai

# Load environment variables from .env file
dotenv.load_dotenv()

# Database Configuration
DATABASE_URL = os.getenv('DATABASE_URL')
NEON_CONNECTION_STRING = os.getenv('NEON_CONNECTION_STRING')
if not DATABASE_URL and not NEON_CONNECTION_STRING:
    raise ValueError("Either DATABASE_URL or NEON_CONNECTION_STRING must be set")

# Use NEON_CONNECTION_STRING if available, otherwise fallback to DATABASE_URL
connection_string = NEON_CONNECTION_STRING or DATABASE_URL
engine = create_engine(connection_string)
session_factory = sessionmaker(bind=engine)
Session = scoped_session(session_factory)

# Email Configuration
SMTP_SERVER = os.getenv('SMTP_SERVER')
SMTP_PORT = os.getenv('SMTP_PORT')
SMTP_USERNAME = os.getenv('SMTP_USERNAME')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD')
FROM_EMAIL = os.getenv('FROM_EMAIL')

if not all([SMTP_SERVER, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, FROM_EMAIL]):
    raise ValueError("Email configuration is incomplete. Please check your .env file.")

# Cashfree Payment Configuration
CASHFREE_APP_ID = os.getenv('CASHFREE_APP_ID')
CASHFREE_SECRET_KEY = os.getenv('CASHFREE_SECRET_KEY')
CASHFREE_ENV = os.getenv('CASHFREE_ENV', 'TEST')  # Default to TEST if not specified

if not all([CASHFREE_APP_ID, CASHFREE_SECRET_KEY]):
    raise ValueError("Cashfree credentials not properly configured")

# Gemini API Configuration
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is not set")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash', generation_config={
    'temperature': 0
})

# API Configuration
API_SECRET_KEY = os.getenv('API_SECRET_KEY')
if not API_SECRET_KEY:
    raise ValueError("API_SECRET_KEY must be set in environment variables")

# Resume upload configuration
RESUME_UPLOAD_FOLDER = os.getenv('RESUME_UPLOAD_FOLDER', 'resume')
os.makedirs(RESUME_UPLOAD_FOLDER, exist_ok=True)

# Environment-specific settings
ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', 'http://localhost:5173').split(',')

# Application ports and URLs
APP_PORT = int(os.getenv('APP_PORT', 8000))
MICROSERVICE_PORT = int(os.getenv('MICROSERVICE_PORT', 5000))
BASE_URL = os.getenv('BASE_URL', f'http://127.0.0.1:{APP_PORT}')

# Cashfree Configuration
CASHFREE_APP_ID = os.getenv('CASHFREE_APP_ID')
CASHFREE_SECRET_KEY = os.getenv('CASHFREE_SECRET_KEY')
CASHFREE_ENV = os.getenv('CASHFREE_ENV', 'PRODUCTION')  # 'TEST' or 'PRODUCTION'

if not all([CASHFREE_APP_ID, CASHFREE_SECRET_KEY]):
    raise ValueError("Cashfree credentials not properly configured")

# Define Cashfree API endpoints based on environment
if CASHFREE_ENV == 'PRODUCTION':
    CASHFREE_BASE_URL = "https://api.cashfree.com/pg"
else:
    CASHFREE_BASE_URL = "https://sandbox.cashfree.com/pg"

# Cashfree helper functions
def get_cashfree_headers():
    """Get headers for Cashfree API requests"""
    return {
        'x-api-version': '2023-08-01',
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
        'Content-Type': 'application/json'
    }

def create_cashfree_order(order_data):
    """Create a Cashfree payment order"""
    url = f"{CASHFREE_BASE_URL}/orders"
    headers = get_cashfree_headers()
    response = requests.post(url, json=order_data, headers=headers)
    response.raise_for_status()  # Raise exception for 4XX/5XX errors
    return response.json()

def verify_cashfree_order(order_id):
    """Verify the status of a Cashfree order"""
    url = f"{CASHFREE_BASE_URL}/orders/{order_id}"
    headers = get_cashfree_headers()
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()