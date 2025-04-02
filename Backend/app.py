import threading
import logging
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from PyPDF2 import PdfReader
from docx import Document
import json
import re
from config import GEMINI_API_KEY
from models import User, Job
from recommendation_engine import get_recommendations_for_user
# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)

# Configure Gemini API
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash', generation_config={
    'temperature': 0
})

# Import route handlers
from routes.payment_routes import register_payment_routes
from routes.job_routes import register_job_routes
from routes.user_routes import register_user_routes
from routes.chrome_extension_routes import register_chrome_extension_routes  # Add this line
from routes.job_interactions import register_user_job_interaction_routes
# Import utility functions
from utils.db_utils import init_db_and_load_jobs
from recommendation_engine import init_recommendation_engine

# Initialize database FIRST
if init_db_and_load_jobs():
    # Only initialize recommendation engine after successful DB setup
    init_recommendation_engine()
else:
    logging.error("Failed to initialize database - recommendation engine not started")
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
from flask import Flask
from flask_cors import CORS
from routes.job_routes import register_job_routes
app = Flask(__name__)

CORS(app)

# Register routes
register_job_routes(app)
register_user_routes(app)
register_chrome_extension_routes(app)
register_user_job_interaction_routes(app)
register_payment_routes(app)

def extract_text_from_pdf(file):
    try:
        reader = PdfReader(file)
        text = ''
        for page in reader.pages:
            text += page.extract_text() or ''  # Handle cases where extract_text() returns None
        return text, None
    except Exception as e:
        return None, str(e)
    
def extract_text_from_docx(file):
    try:
        doc = Document(file)
        text = ''
        for paragraph in doc.paragraphs:
            text += paragraph.text + '\n'
        return text, None
    except Exception as e:
        return None, str(e)

def analyze_resume(text):
    prompt = f"""
    Analyze this resume and provide an ATS score out of 100, along with detailed feedback. Consider the following criteria, each with the specified weight:

    1. Keyword Optimization (20): Check for the presence of relevant skills, job titles, and industry terms. Look for keywords commonly expected in resumes for the field or industry mentioned.
    2. Action Verbs (15): Evaluate the use of strong action verbs in bullet points, such as "led," "developed," "implemented," etc.
    3. Measurable Achievements (15): Look for quantifiable results in the experience section, e.g., "increased sales by 20%" or "managed a team of 10."
    4. Clarity and Conciseness (15): Assess the clarity and brevity of the writing. Check for concise sentences and avoidance of unnecessary jargon.
    5. Professional Tone (10): Ensure the language is formal and professional, without informal expressions or slang.
    6. Section Completeness (10): Verify the presence of standard sections like Experience, Education, and Skills.
    7. Length (10): Count the words in the resume. For a one-page resume, the ideal word count is 450-600 words. For two pages, the ideal range is 800-1200 words. Score based on adherence to these ranges.
    8. Format Indicators (5): Look for textual signs of poor formatting, such as excessive symbols, unusual characters, or inconsistent spacing.

    For each criterion, provide a sub-score out of the specified weight and a brief comment explaining the score. Calculate the total score by summing the sub-scores.

    Additionally, provide line-by-line improvement suggestions by:
    1. Identifying weak or vague phrases and suggesting stronger alternatives
    2. Highlighting missing important keywords or skills
    3. Pointing out formatting issues or inconsistencies
    4. Suggesting ways to make achievements more quantifiable
    5. Recommending better action verbs where applicable

    Return the analysis results strictly in the following JSON format without any additional text or explanations:

    {{
        "score": <total score out of 100>,
        "sub_scores": {{
            "Keyword Optimization": <score out of 20>,
            "Action Verbs": <score out of 15>,
            "Measurable Achievements": <score out of 15>,
            "Clarity and Conciseness": <score out of 15>,
            "Professional Tone": <score out of 10>,
            "Section Completeness": <score out of 10>,
            "Length": <score out of 10>,
            "Format Indicators": <score out of 5>
        }},
        "comments": {{
            "Keyword Optimization": "<comment>",
            "Action Verbs": "<comment>",
            "Measurable Achievements": "<comment>",
            "Clarity and Conciseness": "<comment>",
            "Professional Tone": "<comment>",
            "Section Completeness": "<comment>",
            "Length": "<comment>",
            "Format Indicators": "<comment>"
        }},
        "line_by_line_feedback": [
            {{
                "line_number": <line number>,
                "original_text": "<original text>",
                "suggestion": "<improvement suggestion>",
                "reason": "<reason for suggestion>"
            }}
        ],
        "overall_assessment": "<summary of strengths and weaknesses>",
        "improvement_tips": "<specific tips for enhancement>",
        "keyword_suggestions": [
            {{
                "category": "<category name>",
                "missing_keywords": ["<keyword1>", "<keyword2>", ...]
            }}
        ],
        "action_verb_alternatives": {{
            "<weak_verb>": ["<strong_alternative1>", "<strong_alternative2>", ...]
        }}
    }}

    Resume text:
    {text}
    """

    try:
        response = model.generate_content(prompt)
        response_text = response.text
        
        json_match = re.search(r'({.*})', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
            analysis_result = json.loads(json_str)
        else:
            try:
                analysis_result = json.loads(response_text)
            except:
                return {"error": "Failed to extract JSON from the response"}
        
        if "score" in analysis_result:
            analysis_result["score"] = round(analysis_result["score"])
            
            if "sub_scores" in analysis_result:
                for key in analysis_result["sub_scores"]:
                    analysis_result["sub_scores"][key] = round(analysis_result["sub_scores"][key], 1)
                    
                total = sum(analysis_result["sub_scores"].values())
                analysis_result["score"] = round(total)
        
        return analysis_result
        
    except json.JSONDecodeError as e:
        return {"error": f"Failed to parse analysis result as JSON: {str(e)}"}
    except Exception as e:
        return {"error": f"Analysis failed: {str(e)}"}

# Add the recommendation scheduler functions directly in app.py
def batch_process_recommendations(session):
    """
    Process recommendations for all users and store them in the database.
    This function is meant to be called periodically (e.g., once per hour).
    """
    logging.info("Starting batch processing of recommendations")
    try:
        # Get all users
        users = session.query(User).all()
        
        for user in users:
            try:
                # Get recommendations for this user
                recommendations = get_recommendations_for_user(user.clerk_id, count=50)  # Get more than needed
                
                # Filter out not interested jobs
                not_interested_ids = user.not_interested_job_ids
                if isinstance(not_interested_ids, str):
                    try:
                        not_interested_ids = json.loads(not_interested_ids)
                    except:
                        not_interested_ids = []
                
                if not_interested_ids:
                    recommendations = [job for job in recommendations if job['id'] not in not_interested_ids]
                
                # Store only the job IDs in the user record
                recommendation_ids = [job['id'] for job in recommendations]
                user.recommended_job_ids = recommendation_ids
                
                logging.info(f"Updated recommendations for user {user.clerk_id}: {len(recommendation_ids)} jobs")
            except Exception as e:
                logging.error(f"Error processing recommendations for user {user.clerk_id}: {str(e)}")
                continue
        
        session.commit()
        logging.info("Completed batch processing of recommendations")
    except Exception as e:
        session.rollback()
        logging.error(f"Error in batch recommendation processing: {str(e)}")

def start_recommendation_scheduler_internal(session):
    import time
    import schedule
    
    # Schedule the batch processing to run every hour
    def run_batch_process():
        batch_process_recommendations(session)
    
    schedule.every(2).minutes.do(run_batch_process)
    
    # Run once immediately on startup
    batch_process_recommendations(session)
    
    # Keep running the scheduler
    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute

# Add the resume analysis endpoint
@app.route('/api/analyze', methods=['POST'])
def analyze():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    try:
        # Determine file type and extract text
        if file.filename.endswith('.pdf'):
            text, error = extract_text_from_pdf(file)
        elif file.filename.endswith('.docx'):
            text, error = extract_text_from_docx(file)
        else:
            return jsonify({'error': 'Unsupported file format (only PDF and DOCX are supported)'}), 400

        # Check for extraction errors
        if error:
            return jsonify({'error': f'Failed to extract text: {error}'}), 400
        if not text:
            return jsonify({'error': 'No text extracted from the file'}), 400

        # Analyze the resume
        analysis_result = analyze_resume(text)
        if "error" in analysis_result:
            return jsonify(analysis_result), 500
        return jsonify(analysis_result)

    except Exception as e:
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500

if __name__ == '__main__':
    # Initialize database and load initial jobs in a separate thread
    db_thread = threading.Thread(target=init_db_and_load_jobs)
    db_thread.daemon = True
    db_thread.start()
    
    # Initialize recommendation engine in a separate thread
    # rec_thread = threading.Thread(target=init_recommendation_engine)
    # rec_thread.daemon = True
    # rec_thread.start()
    
    # # Start the recommendation scheduler in a separate thread
    # def start_scheduler():
    #     session = Session()
    #     start_recommendation_scheduler_internal(session)
    
    # scheduler_thread = threading.Thread(target=start_scheduler)
    # scheduler_thread.daemon = True
    # scheduler_thread.start()
    
    app.run(debug=True, port=8000)