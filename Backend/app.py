import threading
import logging
import os
from flask import Flask
from flask_cors import CORS
import google.generativeai as genai
from config import GEMINI_API_KEY

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)

# Import route handlers
from routes.payment_routes import register_payment_routes
from routes.job_routes import register_job_routes
from routes.user_routes import register_user_routes

# Import utility functions
from utils.db_utils import init_db_and_load_jobs
from recommendation_engine import init_recommendation_engine
from recommendation_scheduler import start_recommendation_scheduler
from config import Session

# Import configuration
try:
    from config import GEMINI_API_KEY
    # Set environment variable
    os.environ['GEMINI_API_KEY'] = GEMINI_API_KEY
    # Configure Gemini
    genai.configure(api_key=GEMINI_API_KEY)
    print("✅ Gemini API configured successfully")
except Exception as e:
    print(f"❌ Error configuring Gemini API: {str(e)}")

# Create Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Register all routes
register_payment_routes(app)
register_job_routes(app)
register_user_routes(app)

if __name__ == '__main__':
    # # Initialize database and load initial jobs in a separate thread
    db_thread = threading.Thread(target=init_db_and_load_jobs)
    db_thread.daemon = True
    db_thread.start()
    
    # Initialize recommendation engine in a separate thread
    rec_thread = threading.Thread(target=init_recommendation_engine)
    rec_thread.daemon = True
    rec_thread.start()
    
    # Start the recommendation scheduler in a separate thread
    def start_scheduler():
        session = Session()
        start_recommendation_scheduler(session)
    
    # scheduler_thread = threading.Thread(target=start_scheduler)
    # scheduler_thread.daemon = True
    # scheduler_thread.start()
    
    app.run(debug=True, port=8000)