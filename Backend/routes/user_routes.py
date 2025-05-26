from flask import request, jsonify
import logging
import json
import os
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
from config import Session, RESUME_UPLOAD_FOLDER
from models import User, Job
from utils.file_utils import extract_text_from_pdf, extract_text_from_docx
from utils.resume_parser import extract_resume_keywords
from recommendation_engine import get_recommendations_for_user
from utils.jwt_middleware import jwt_required, get_current_user
import google.generativeai as genai
import re
genai.configure(api_key="AIzaSyDCSbDt2Xdd3xvvIIwqqcc9EiZfQ_mTyHM")  # Replace with your actual key

# Configure Google Generative AI with your API key
# genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

def is_valid_resume(text):
    """
    Validate if the extracted text looks like a resume using Gemini API.
    Returns True if it's a valid resume, False otherwise.
    """
    try:
        prompt = """
        Does the following text look like a resume or CV? 
        Please respond ONLY with "YES" or "NO" - nothing else.
        
        ```
        {text}
        ```
        """
        
        model = genai.GenerativeModel('gemini-2.0-flash')
        response = model.generate_content(prompt.format(text=text[:10000])) # Limit text length
        
        # Clean the response - strip whitespace and convert to uppercase
        response_text = response.text.strip().upper()
        
        # Log the response for debugging
        logging.info(f"Resume validation response: {response_text}")
        
        # Return True only if response is exactly "YES"
        return response_text == "YES"
        
    except Exception as e:
        logging.error(f"Error validating resume: {str(e)}")
        return False  # Default to False on error

def register_user_routes(app):
    @app.route('/api/users/preferences', methods=['GET', 'POST'])
    @jwt_required
    def manage_preferences(user_id):
        session = Session()
        try:
            # GET request to check if user has preferences
            if request.method == 'GET':
                user = session.query(User).filter(User.id == user_id).first()
                
                if not user:
                    return jsonify({'error': 'User not found'}), 404
                
                return jsonify({
                    'preferences': user.preferences
                })
            
            # POST request to save preferences
            elif request.method == 'POST':
                data = request.json
                preferences = data.get('preferences')
                formatted_address = data.get('formattedAddress')
                
                if not preferences:
                    return jsonify({'error': 'No preferences provided'}), 400
                
                # Save to database
                user = session.query(User).filter(User.id == user_id).first()
                
                if user:
                    # Update existing user
                    user.preferences = preferences
                    if formatted_address:
                        user.preferred_address = formatted_address
                else:
                    return jsonify({'error': 'User not found'}), 404
                
                session.commit()
                return jsonify({'message': 'Preferences saved successfully'})
        
        except Exception as e:
            session.rollback()
            logging.error(f"Error managing preferences: {str(e)}")
            return jsonify({'error': f'Failed to manage preferences: {str(e)}'}), 500
        
        finally:
            session.close()

    @app.route('/api/users/pro-status', methods=['GET'])
    @jwt_required
    def check_pro_status(user_id):
        session = Session()
        try:
            user = session.query(User).filter(User.id == user_id).first()
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            # Return the user's pro status
            return jsonify({'isPro': user.is_pro})
                
        except Exception as e:
            logging.error(f"Error checking pro status: {str(e)}")
            return jsonify({'error': str(e)}), 500
        finally:
            session.close()

    @app.route('/api/users/update-pro-status', methods=['POST'])
    @jwt_required
    def update_pro_status(user_id):
        session = Session()
        try:
            data = request.json
            is_pro = data.get('isPro', False)
            
            user = session.query(User).filter(User.id == user_id).first()
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
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

    @app.route('/api/users/recommendations', methods=['GET'])
    @jwt_required
    def get_user_recommendations(user_id):
        try:
            count = request.args.get('count', 20, type=int)
            session = Session()
            
            # Get user from database
            user = session.query(User).filter(User.id == user_id).first()
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
                
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
                recommendations = get_recommendations_for_user(user_id, count=count)
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

    @app.route('/api/users/resume', methods=['POST', 'GET'])
    @jwt_required
    def manage_resume(user_id):
        session = Session()
        try:
            # GET request to check if user has a resume
            if request.method == 'GET':
                user = session.query(User).filter(User.id == user_id).first()
                
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
                filename = secure_filename(f"{user_id}_{file.filename}")
                file_path = os.path.join(RESUME_UPLOAD_FOLDER, filename)
                file.save(file_path)
                
                # Extract text from the resume
                if file.filename.endswith('.pdf'):
                    text, error = extract_text_from_pdf(file)
                elif file.filename.endswith('.docx'):
                    text, error = extract_text_from_docx(file)
                    
                if error:
                    return jsonify({'error': f'Failed to extract text from resume: {error}'}), 400
                
                if not text or text.strip() == '':
                    return jsonify({'error': 'No text could be extracted from the file'}), 400
                
                # NEW: Validate if the extracted text is actually a resume
                if not is_valid_resume(text):
                    # Remove the uploaded file if it's not a valid resume
                    if os.path.exists(file_path):
                        os.remove(file_path)
                    return jsonify({'error': 'The uploaded file does not appear to be a valid resume. Please upload a valid resume.'}), 400
                
                # Extract keywords from the resume text
                keywords = extract_resume_keywords(text)
                
                # Store the resume info in the user record
                user = session.query(User).filter(User.id == user_id).first()
                if not user:
                    return jsonify({'error': 'User not found'}), 404
                
                user.resume_path = file_path
                user.resume_text = text
                user.resume_keywords = keywords
                
                session.commit()
                
                return jsonify({
                    'message': 'Resume uploaded successfully',
                    'path': file_path,
                    'keywords': keywords
                })
        
        except Exception as e:
            logging.error(f"Error managing resume: {str(e)}")
            return jsonify({'error': str(e)}), 500
        finally:
            session.close()

    @app.route('/api/users/interested-jobs', methods=['GET'])
    @jwt_required
    def get_interested_jobs(user_id):
        session = Session()
        try:
            user = session.query(User).filter(User.id == user_id).first()
            
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

    @app.route('/api/users/resume-text', methods=['GET'])
    @jwt_required
    def get_user_resume_text(user_id):
        session = Session()
        try:
            # Simple database query to get resume_text for the user
            user = session.query(User).filter(User.id == user_id).first()
            
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
    @jwt_required
    def parse_resume_for_autofill(user_id):
        try:
            data = request.json
            resume_text = data.get('resumeText', '')
            
            if not resume_text:
                # Try to get the resume text from the user's profile
                session = Session()
                user = session.query(User).filter(User.id == user_id).first()
                
                if user and user.resume_text:
                    resume_text = user.resume_text
                else:
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
                # If Gemini fails, use fallback parser
                logging.warning("Gemini failed to parse resume, using fallback parser")
                parsed_data = fallback_resume_parser(resume_text)
                return jsonify({'parsedData': parsed_data})
            
            json_str = response_text[json_start:json_end]
            parsed_data = json.loads(json_str)
            
            return jsonify({'parsedData': parsed_data})
        except json.JSONDecodeError:
            # If JSON parsing fails, use fallback parser
            logging.warning("JSON parsing failed, using fallback parser")
            parsed_data = fallback_resume_parser(resume_text)
            return jsonify({'parsedData': parsed_data})
        except Exception as e:
            logging.error(f"Error parsing resume: {str(e)}")
            # Use fallback parser as last resort
            try:
                parsed_data = fallback_resume_parser(resume_text)
                return jsonify({'parsedData': parsed_data})
            except Exception as fallback_error:
                logging.error(f"Fallback parser also failed: {str(fallback_error)}")
                return jsonify({'error': 'Failed to parse resume'}), 500

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

    @app.route('/api/users/check-resume', methods=['GET'])
    @jwt_required
    def check_user_resume(user_id):
        session = Session()
        try:
            user = session.query(User).filter(User.id == user_id).first()
            
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
                    'username': user.username,
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
    
    @app.route('/api/users', methods=['DELETE'])
    @jwt_required
    def delete_user(user_id):
        session = Session()
        try:
            # Find the user
            user = session.query(User).filter(User.id == user_id).first()
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            # Delete the user
            session.delete(user)
            session.commit()
            
            return jsonify({
                'message': 'User account successfully deleted',
                'user_id': user_id
            })
        
        except Exception as e:
            session.rollback()
            logging.error(f"Error deleting user account: {str(e)}")
            return jsonify({'error': f'Failed to delete user account: {str(e)}'}), 500
        finally:
            session.close()

    @app.route('/api/users/profile', methods=['GET'])
    @jwt_required
    def get_user_profile(user_id):
        """Get current user's profile information"""
        session = Session()
        try:
            user = session.query(User).filter(User.id == user_id).first()
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            # Check if pro status is expired
            is_pro_active = user.is_pro
            if user.is_pro and hasattr(user, 'pro_expiration_date') and user.pro_expiration_date:
                is_pro_active = datetime.now() < user.pro_expiration_date
                if not is_pro_active and user.is_pro:
                    # Auto-expire the pro status
                    user.is_pro = False
                    session.commit()
                    logging.info(f"User {user_id} pro status expired and set to False")
            
            profile_data = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_pro': is_pro_active,
                'has_resume': bool(user.resume_text),
                'has_preferences': bool(getattr(user, 'preferences', None)),
                'pro_expiration_date': user.pro_expiration_date.isoformat() if hasattr(user, 'pro_expiration_date') and user.pro_expiration_date else None
            }
            
            # Add optional fields if they exist
            if hasattr(user, 'phone'):
                profile_data['phone'] = user.phone
            if hasattr(user, 'preferred_address'):
                profile_data['preferred_address'] = user.preferred_address
                
            return jsonify({'profile': profile_data})
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
        finally:
            session.close()

    @app.route('/api/users/profile', methods=['PUT'])
    @jwt_required
    def update_user_profile(user_id):
        """Update current user's profile information"""
        session = Session()
        try:
            user = session.query(User).filter(User.id == user_id).first()
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            data = request.json
            if not data:
                return jsonify({'error': 'No data provided'}), 400
            
            # Update allowed fields
            updatable_fields = ['username', 'email', 'phone', 'preferred_address']
            updated_fields = []
            
            for field in updatable_fields:
                if field in data:
                    if hasattr(user, field):
                        setattr(user, field, data[field])
                        updated_fields.append(field)
                    else:
                        logging.warning(f"Field {field} not found in User model")
            
            if updated_fields:
                session.commit()
                return jsonify({
                    'message': 'Profile updated successfully',
                    'updated_fields': updated_fields
                })
            else:
                return jsonify({'message': 'No fields were updated'})
            
        except Exception as e:
            session.rollback()
            logging.error(f"Error updating user profile: {str(e)}")
            return jsonify({'error': str(e)}), 500
        finally:
            session.close()

    @app.route('/api/maintenance/clear-data', methods=['POST'])
    @jwt_required
    def clear_stale_data(user_id):
        """
        Maintenance endpoint to:
        1. Update expired pro users (set is_pro to False)
        2. Delete jobs that haven't been updated in 30+ days
        
        Requires admin privileges
        """
        session = Session()
        try:
            # Check if user has admin privileges
            user = session.query(User).filter(User.id == user_id).first()
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            # Check if user has admin privileges (if is_admin attribute exists)
            if hasattr(user, 'is_admin') and not user.is_admin:
                return jsonify({'error': 'Unauthorized. Admin privileges required'}), 403
            elif not hasattr(user, 'is_admin'):
                # If is_admin doesn't exist, for now allow any authenticated user
                # You might want to restrict this further in production
                logging.warning(f"User model doesn't have is_admin attribute. User {user_id} performing maintenance.")
            
            # Get current date for comparison
            today = datetime.now().date()
            
            # Track statistics for response
            updated_users_count = 0
            deleted_jobs_count = 0
            
            # 1. Update expired pro users
            expired_pro_users = session.query(User).filter(
                User.is_pro == True,
                User.pro_expiration_date < today
            ).all()
            
            for user in expired_pro_users:
                user.is_pro = False
                updated_users_count += 1
                logging.info(f"User {user.id} pro status expired and set to False")
            
            # 2. Find and delete stale jobs (older than 30 days)
            thirty_days_ago = today - timedelta(days=30)
            stale_jobs = session.query(Job).filter(
                Job.date_posted < thirty_days_ago
            ).all()
            
            # Store job IDs before deletion for reporting
            stale_job_ids = [job.id for job in stale_jobs]
            
            # Delete the stale jobs
            for job in stale_jobs:
                session.delete(job)
                deleted_jobs_count += 1
            
            # Commit all changes
            session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Maintenance completed successfully',
                'expired_pro_users_count': updated_users_count,
                'deleted_jobs_count': deleted_jobs_count,
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            session.rollback()
            logging.error(f"Error during maintenance clean-up: {str(e)}")
            return jsonify({'error': f'Maintenance failed: {str(e)}'}), 500
        finally:
            session.close()

