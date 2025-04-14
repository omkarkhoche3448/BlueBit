import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import requests
import dotenv
import google.generativeai as genai

# Load environment variables from .env file
dotenv.load_dotenv()

# Database Configuration
DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    raise ValueError("Database URL not properly configured")

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

# Allowed Origins for CORS
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:5173').split(',')

# File Upload Configuration
RESUME_UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'resume')
if not os.path.exists(RESUME_UPLOAD_FOLDER):
    os.makedirs(RESUME_UPLOAD_FOLDER)

# Gemini API Key
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

# Configure Gemini AI model
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash')

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