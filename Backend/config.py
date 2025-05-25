import os
from dotenv import load_dotenv
import razorpay
import google.generativeai as genai
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session

# Load environment variables
load_dotenv()

# Database Configuration
DATABASE_URL = os.getenv('NEON_DB_URL')
if not DATABASE_URL:
    raise ValueError("NEON_DB_URL environment variable is not set")

engine = create_engine(DATABASE_URL)
session_factory = sessionmaker(bind=engine)
Session = scoped_session(session_factory)

# Razorpay Configuration
RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID')
RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET')

if not all([RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET]):
    raise ValueError("Razorpay credentials not properly configured")

razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# Gemini API Configuration
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is not set")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash', generation_config={
    'temperature': 0
})

# Resume upload configuration
RESUME_UPLOAD_FOLDER = os.getenv('RESUME_UPLOAD_FOLDER', 'resume')
os.makedirs(RESUME_UPLOAD_FOLDER, exist_ok=True)

# Environment-specific settings
ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', 'http://localhost:5173').split(',')