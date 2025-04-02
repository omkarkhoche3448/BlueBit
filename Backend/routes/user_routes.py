from flask import request, jsonify
import logging
import json
import os
from datetime import datetime
from werkzeug.utils import secure_filename
from config import Session, RESUME_UPLOAD_FOLDER
from models import User, Job
from utils.file_utils import extract_text_from_pdf, extract_text_from_docx
from utils.resume_parser import extract_resume_keywords
from recommendation_engine import get_recommendations_for_user
import google.generativeai as genai
import re
genai.configure(api_key="AIzaSyDCSbDt2Xdd3xvvIIwqqcc9EiZfQ_mTyHM")  # Replace with your actual key

# Configure Google Generative AI with your API key
# genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

def register_user_routes(app):
    @app.route('/api/users/<string:clerk_id>/preferences', methods=['GET', 'POST'])
    def manage_preferences(clerk_id):
        session = Session()
        try:
            # GET request to check if user has preferences
            if request.method == 'GET':
                user = session.query(User).filter(User.clerk_id == clerk_id).first()
                
                if not user:
                    return jsonify({'error': 'User not found'}), 404
                
                return jsonify({
                    'preferences': user.preferences
                })
            
            # POST request to save preferences
            elif request.method == 'POST':
                data = request.json
                preferences = data.get('preferences')
                
                if not preferences:
                    return jsonify({'error': 'No preferences provided'}), 400
                
                # Save to database
                user = session.query(User).filter(User.clerk_id == clerk_id).first()
                
                if user:
                    # Update existing user
                    user.preferences = preferences
                else:
                    # Create new user
                    new_user = User(
                        clerk_id=clerk_id,
                        preferences=preferences
                    )
                    session.add(new_user)
                
                session.commit()
                return jsonify({'message': 'Preferences saved successfully'})
        
        except Exception as e:
            session.rollback()
            logging.error(f"Error managing preferences: {str(e)}")
            return jsonify({'error': f'Failed to manage preferences: {str(e)}'}), 500
        
        finally:
            session.close()

    @app.route('/api/users/<string:clerk_id>/pro-status', methods=['GET'])
    def check_pro_status(clerk_id):
        session = Session()
        try:
            user = session.query(User).filter(User.clerk_id == clerk_id).first()
            
            if not user:
                # Create a new user with default non-pro status
                user = User(
                    clerk_id=clerk_id,
                    is_pro=False
                )
                session.add(user)
                session.commit()
                return jsonify({'isPro': False})
            
            # Return the user's pro status
            return jsonify({'isPro': user.is_pro})
                
        except Exception as e:
            logging.error(f"Error checking pro status: {str(e)}")
            return jsonify({'error': str(e)}), 500
        finally:
            session.close()

    @app.route('/api/users/<string:clerk_id>/update-pro-status', methods=['POST'])
    def update_pro_status(clerk_id):
        session = Session()
        try:
            data = request.json
            is_pro = data.get('isPro', False)
            
            user = session.query(User).filter(User.clerk_id == clerk_id).first()
            
            if not user:
                # Create new user if doesn't exist
                user = User(
                    clerk_id=clerk_id,
                    is_pro=is_pro
                )
                session.add(user)
            else:
                # Update existing user's pro status
                user.is_pro = is_pro
            
            session.commit()
            return jsonify({
                'message': 'Pro status updated successfully',
                'isPro': user.is_pro
            })
            
        except Exception as e:
            session.rollback()
            logging.error(f"Error updating pro status: {str(e)}")
            return jsonify({'error': str(e)}), 500
        finally:
            session.close()

    @app.route('/api/users/<string:clerk_id>/recommendations', methods=['GET'])
    def get_user_recommendations(clerk_id):
        try:
            count = request.args.get('count', 20, type=int)
            session = Session()
            
            # Get user from database
            user = session.query(User).filter(User.clerk_id == clerk_id).first()
            
            if not user:
                # Create a new user if they don't exist
                user = User(clerk_id=clerk_id, recommended_job_ids=[])
                session.add(user)
                session.commit()
                
                # For new users, we need to compute recommendations on the fly
                session.close()
                recommendations = get_recommendations_for_user(clerk_id, count=count)
                return jsonify({'recommendations': recommendations[:count]})
            
            # Get pre-computed recommendation IDs
            recommendation_ids = user.recommended_job_ids
            
            # Handle potential string representation in SQLite
            if isinstance(recommendation_ids, str):
                try:
                    recommendation_ids = json.loads(recommendation_ids)
                except:
                    recommendation_ids = []
            
            if not recommendation_ids:
                # If no pre-computed recommendations, compute them on the fly
                session.close()
                recommendations = get_recommendations_for_user(clerk_id, count=count)
                return jsonify({'recommendations': recommendations[:count]})
            
            # Fetch the actual job objects for the recommended IDs
            jobs = session.query(Job).filter(Job.id.in_(recommendation_ids[:count])).all()
            
            # Convert to dictionaries
            job_dicts = [{c.name: getattr(job, c.name) for c in job.__table__.columns} for job in jobs]
            
            session.close()
            return jsonify({'recommendations': job_dicts})
        
        except Exception as e:
            logging.error(f"Error serving recommendations: {str(e)}")
            return jsonify({'error': str(e)}), 500

    @app.route('/api/users/<string:clerk_id>/resume', methods=['POST', 'GET'])
    def manage_resume(clerk_id):
        session = Session()
        try:
            # GET request to check if user has a resume
            if request.method == 'GET':
                user = session.query(User).filter(User.clerk_id == clerk_id).first()
                
                if not user:
                    return jsonify({'error': 'User not found'}), 404
                
                return jsonify({
                    'hasResume': bool(user.resume_path),
                    'resumePath': user.resume_path,
                    'hasKeywords': bool(user.resume_keywords)
                })
            
            # POST request to upload resume
            elif request.method == 'POST':
                if 'file' not in request.files:
                    return jsonify({'error': 'No file uploaded'}), 400
                    
                file = request.files['file']
                if file.filename == '':
                    return jsonify({'error': 'No file selected'}), 400
                    
                # Validate file type (PDF or DOCX)
                if not (file.filename.endswith('.pdf') or file.filename.endswith('.docx')):
                    return jsonify({'error': 'Unsupported file format (only PDF and DOCX are supported)'}), 400
                    
                # Create a secure filename and save file
                filename = secure_filename(f"{clerk_id}_{file.filename}")
                file_path = os.path.join(RESUME_UPLOAD_FOLDER, filename)
                file.save(file_path)
                
                # Extract text from the resume
                if file.filename.endswith('.pdf'):
                    text, error = extract_text_from_pdf(file)
                elif file.filename.endswith('.docx'):
                    text, error = extract_text_from_docx(file)
                    
                # Check for extraction errors
                if error:
                    return jsonify({'error': f'Failed to extract text: {error}'}), 400
                if not text:
                    return jsonify({'error': 'No text extracted from the file'}), 400
                    
                # Extract keywords from the resume text
                keywords = extract_resume_keywords(text)
                    
                # Save to database
                user = session.query(User).filter(User.clerk_id == clerk_id).first()
                
                if user:
                    # Update existing user
                    user.resume_text = text
                    user.resume_path = file_path
                    user.resume_keywords = keywords
                else:
                    # Create new user
                    new_user = User(
                        clerk_id=clerk_id,
                        resume_text=text,
                        resume_path=file_path,
                        resume_keywords=keywords
                    )
                    session.add(new_user)
                
                session.commit()
                return jsonify({
                    'message': 'Resume uploaded successfully',
                    'keywordsExtracted': len(keywords)
                })
        
        except Exception as e:
            session.rollback()
            logging.error(f"Error managing resume: {str(e)}")
            return jsonify({'error': f'Failed to manage resume: {str(e)}'}), 500
        
        finally:
            session.close()

    @app.route('/api/users/<string:clerk_id>/interested-jobs', methods=['GET'])
    def get_interested_jobs(clerk_id):
        session = Session()
        try:
            user = session.query(User).filter(User.clerk_id == clerk_id).first()
            
            if not user or not user.interested_job_ids:
                return jsonify({'jobs': []})
                
            jobs = session.query(Job).filter(Job.id.in_(user.interested_job_ids)).all()
            job_list = [{c.name: getattr(job, c.name) for c in job.__table__.columns} for job in jobs]
            
            return jsonify({'jobs': job_list})
                
        except Exception as e:
            logging.error(f"Error getting interested jobs: {str(e)}")
            return jsonify({'error': str(e)}), 500
        finally:
            session.close()

    @app.route('/api/users/<user_id>/resume-text', methods=['GET'])
    def get_user_resume_text(user_id):
        session = Session()
        try:
            # Simple database query to get resume_text for the user
            user = session.query(User).filter(User.clerk_id == user_id).first()
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            if not user.resume_text:
                return jsonify({'error': 'No resume found for this user'}), 404
            
            # Debug: Write resume text to file
            with open(f"resume_debug_{user_id}.txt", "w") as f:
                f.write(f"Resume text for user {user_id}:\n")
                f.write("-" * 50 + "\n")
                f.write(user.resume_text)
                f.write("\n" + "-" * 50)
            
            print(f"DEBUG - Resume text written to file: resume_debug_{user_id}.txt")
            
            
            # Simply return the resume text
            return jsonify({'resumeText': user.resume_text})
        except Exception as e:
            print(f"Error retrieving resume text: {str(e)}")
            return jsonify({'error': str(e)}), 500
        finally:
            session.close()
    
    @app.route('/api/parse-resume-for-autofill', methods=['POST'])
    def parse_resume_for_autofill():
        try:
            data = request.json
            resume_text = data.get('resumeText', '')
            
            if not resume_text:
                return jsonify({'error': 'Resume text is required'}), 400
            
            # Use Gemini to parse the resume text
            model = genai.GenerativeModel('gemini-1.5-pro')
            
            prompt = f"""
            Parse the following resume text into structured data for autofilling job application forms.
            Extract the following information in JSON format:
            
            - name: Full name
            - firstName: First name
            - lastName: Last name
            - email: Email address
            - phone: Phone number
            - address: Full address
            - city: City
            - state: State/Province
            - zip: ZIP/Postal code
            - country: Country
            - education: Highest education
            - degree: Degree name
            - major: Field of study/Major
            - gpa: GPA if available
            - experience: Brief work experience summary
            - company: Most recent company
            - jobTitle: Most recent job title
            - startDate: Start date of most recent job
            - endDate: End date of most recent job
            - skills: List of skills
            - summary: Professional summary
            
            Resume text:
            {resume_text}
            
            Return only valid JSON with no additional text.
            """
            
            response = model.generate_content(prompt)
            
            # Extract JSON from response
            response_text = response.text
            
            # Find JSON in the response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            
            if json_start == -1 or json_end == 0:
                return jsonify({'error': 'Failed to parse resume'}), 500
            
            json_str = response_text[json_start:json_end]
            parsed_data = json.loads(json_str)
            
            return jsonify({'parsedData': parsed_data})
        except Exception as e:
            print(f"Error parsing resume: {str(e)}")
            return jsonify({'error': str(e)}), 500

    def fallback_resume_parser(resume_text):
        """Simple regex-based resume parser for when Gemini is unavailable"""
        data = {
            "name": "",
            "email": "",
            "phone": "",
            "skills": "",
            "education": "",
            "experience": "",
            "summary": "Resume parsing failed. Please try again later."
        }
        
        # Try to extract email
        email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', resume_text)
        if email_match:
            data["email"] = email_match.group(0)
        
        # Try to extract phone
        phone_match = re.search(r'\b(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b', resume_text)
        if phone_match:
            data["phone"] = phone_match.group(0)
        
        # Try to extract name (usually at the beginning of the resume)
        lines = resume_text.strip().split('\n')
        if lines:
            data["name"] = lines[0].strip()
        
        # Extract skills (look for a "Skills" section)
        skills_match = re.search(r'(?:SKILLS|Skills|skills)[:\s]*(.*?)(?:\n\n|\n[A-Z])', resume_text, re.DOTALL)
        if skills_match:
            data["skills"] = skills_match.group(1).strip()
        
        # Extract education
        edu_match = re.search(r'(?:EDUCATION|Education|education)[:\s]*(.*?)(?:\n\n|\n[A-Z])', resume_text, re.DOTALL)
        if edu_match:
            data["education"] = edu_match.group(1).strip()
        
        # Extract some text to use as experience
        exp_match = re.search(r'(?:EXPERIENCE|Experience|experience)[:\s]*(.*?)(?:\n\n|\n[A-Z])', resume_text, re.DOTALL)
        if exp_match:
            data["experience"] = exp_match.group(1).strip()
        
        return data

    @app.route('/api/health-check', methods=['GET'])
    def health_check():
        try:
            # Test database connection
            session = Session()
            db_status = "connected"
            try:
                session.execute("SELECT 1")
            except Exception as e:
                db_status = f"error: {str(e)}"
            finally:
                session.close()
            
            # Check Gemini API
            gemini_status = "configured"
            try:
                # Just check if API key is available
                api_key = os.getenv('GEMINI_API_KEY')
                if not api_key:
                    gemini_status = "no API key"
            except Exception as e:
                gemini_status = f"error: {str(e)}"
            
            return jsonify({
                "status": "healthy",
                "timestamp": datetime.now().isoformat(),
                "database": db_status,
                "gemini_api": gemini_status
            })
        except Exception as e:
            return jsonify({
                "status": "error",
                "error": str(e)
            }), 500

    @app.route('/api/users/<user_id>/check-resume', methods=['GET'])
    def check_user_resume(user_id):
        session = Session()
        try:
            user = session.query(User).filter(User.clerk_id == user_id).first()
            
            if not user:
                return jsonify({
                    'exists': False,
                    'error': 'User not found',
                    'userId': user_id
                }), 404
            
            has_resume = bool(user.resume_text and len(user.resume_text.strip()) > 10)
            
            return jsonify({
                'exists': has_resume,
                'userId': user_id,
                'resumeLength': len(user.resume_text) if user.resume_text else 0,
                'userDetails': {
                    'id': user.id,
                    'clerk_id': user.clerk_id,
                    'email': user.email,
                    'has_preferences': bool(user.preferences)
                }
            })
        except Exception as e:
            print(f"Error checking resume: {str(e)}")
            return jsonify({'error': str(e)}), 500
        finally:
            session.close()

    @app.route('/api/sample-resume', methods=['GET'])
    def get_sample_resume():
        sample_resume = """
        JOHN DOE
        Software Engineer
        123 Main Street, San Francisco, CA 94105
        john.doe@email.com | (555) 123-4567 | linkedin.com/in/johndoe | github.com/johndoe

        SUMMARY
        Experienced software engineer with 5+ years of expertise in web development, 
        specializing in JavaScript, React, and Node.js. Passionate about creating 
        efficient, scalable, and user-friendly applications.

        EXPERIENCE
        Senior Software Engineer, TechCorp Inc.
        January 2020 - Present
        • Led development of the company's flagship product, increasing user engagement by 35%
        • Implemented CI/CD pipelines, reducing deployment time by 60%
        • Mentored junior developers and conducted code reviews

        Software Engineer, WebSolutions LLC
        March 2018 - December 2019
        • Developed responsive web applications using React and Redux
        • Collaborated with UX designers to implement user-friendly interfaces
        • Optimized database queries, improving application performance by 40%

        EDUCATION
        Bachelor of Science in Computer Science
        University of California, Berkeley
        Graduated: May 2018
        GPA: 3.8/4.0

        SKILLS
        Programming Languages: JavaScript, Python, TypeScript, HTML/CSS
        Frameworks/Libraries: React, Node.js, Express, Redux, Jest
        Tools: Git, Docker, AWS, Webpack, Jenkins
        Database: MongoDB, PostgreSQL, MySQL
        """
        
        return jsonify({
            'resumeText': sample_resume,
            'message': 'This is a sample resume for testing. Please upload your actual resume in ProFind.'
        })