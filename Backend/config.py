import os
from dotenv import load_dotenv
import razorpay
import google.generativeai as genai
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session

# Load environment variables
load_dotenv(dotenv_path="./.env")

# Set up SQLAlchemy with Neon PostgreSQL
# Update this line to use NEON_CONNECTION_STRING from .env
engine = create_engine(os.getenv('NEON_CONNECTION_STRING'))
session_factory = sessionmaker(bind=engine)
Session = scoped_session(session_factory)

# Razorpay Configuration
RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID')
RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET')
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# Configure Gemini API for resume parsing
GEMINI_API_KEY = 'AIzaSyDCSbDt2Xdd3xvvIIwqqcc9EiZfQ_mTyHM'  
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash', generation_config={
    'temperature': 0
})

# Create resume directory if it doesn't exist
RESUME_UPLOAD_FOLDER = 'resume'
os.makedirs(RESUME_UPLOAD_FOLDER, exist_ok=True)

# Add this line to your config.py file if it doesn't exist
DATABASE_URL = os.environ.get('DATABASE_URL', 'sqlite:///jobs.db')