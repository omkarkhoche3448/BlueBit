from flask import request, jsonify
from models import User
from config import Session
from datetime import datetime, timedelta
import logging
from utils.auth_utils import (
    hash_password, verify_password, generate_jwt_token,
    validate_jwt_token, generate_password_reset_token,
    generate_email_verification_token, send_password_reset_email,
    send_verification_email, authenticate_user
)
import re

def validate_email(email):
    """Validate email format"""
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """
    Validate password strength
    - At least 8 characters
    - Contains at least one digit
    - Contains at least one uppercase letter
    - Contains at least one lowercase letter
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one digit"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    return True, ""

def register_auth_routes(app):
    @app.route('/api/auth/signup', methods=['POST'])
    def signup():
        session = Session()
        try:
            data = request.json
            email = data.get('email')
            username = data.get('username')
            password = data.get('password')
            phone_number = data.get('phoneNumber')
            
            # Validate inputs
            if not all([email, username, password]):
                return jsonify({'error': 'Email, username, and password are required'}), 400
            
            if not validate_email(email):
                return jsonify({'error': 'Invalid email format'}), 400
            
            is_valid_password, password_error = validate_password(password)
            if not is_valid_password:
                return jsonify({'error': password_error}), 400
            
            # Check if user with email or username already exists
            existing_user = session.query(User).filter(
                (User.email == email) | (User.username == username)
            ).first()
            
            if existing_user:
                if existing_user.email == email:
                    return jsonify({'error': 'Email already registered'}), 409
                else:
                    return jsonify({'error': 'Username already taken'}), 409
            
            # Hash password
            hashed_password = hash_password(password)
            
            # Create new user
            new_user = User(
                email=email,
                username=username,
                password_hash=hashed_password,
                phone_number=phone_number,
                email_verified=False
            )
            
            session.add(new_user)
            session.commit()
            
            # Generate verification token
            token = generate_email_verification_token(new_user.id)
            
            # Use the correct base URL for emails
            base_url = "http://127.0.0.1:8000"
            
            # Send verification email
            send_verification_email(new_user, token, base_url)
            
            return jsonify({
                'message': 'User registered successfully. Please check your email to verify your account.',
                'userId': new_user.id,
                'username': new_user.username
            }), 201
            
        except Exception as e:
            session.rollback()
            logging.error(f"Error during signup: {str(e)}")
            return jsonify({'error': str(e)}), 500
        finally:
            session.close()
    
    @app.route('/api/auth/login', methods=['POST'])
    def login():
        try:
            data = request.json
            username_or_email = data.get('usernameOrEmail')
            password = data.get('password')
            
            # Validate inputs
            if not all([username_or_email, password]):
                return jsonify({'error': 'Username/email and password are required'}), 400
            
            # Authenticate user
            user = authenticate_user(username_or_email, password)
            
            if not user:
                return jsonify({'error': 'Invalid credentials'}), 401
            
            # Check if email is verified
            if not user.email_verified:
                return jsonify({'error': 'Please verify your email before logging in', 'needsVerification': True}), 403
            
            # Generate JWT token
            token = generate_jwt_token(user.id, user.username)
            
            return jsonify({
                'message': 'Login successful',
                'token': token,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'isPro': user.is_pro
                }
            })
            
        except Exception as e:
            logging.error(f"Error during login: {str(e)}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/auth/verify-email', methods=['GET'])
    def verify_email():
        try:
            token = request.args.get('token')
            
            if not token:
                return jsonify({'error': 'Verification token is required'}), 400
            
            # Validate token
            payload = validate_jwt_token(token)
            
            if not payload or payload.get('purpose') != 'email_verification':
                return jsonify({'error': 'Invalid or expired verification token'}), 400
            
            # Update user
            session = Session()
            user = session.query(User).filter(User.id == payload['user_id']).first()
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            # Mark email as verified
            user.email_verified = True
            session.commit()
            
            # Return HTML response for better user experience
            html_response = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>Email Verified</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        text-align: center;
                        margin-top: 50px;
                    }
                    .success {
                        color: #4CAF50;
                        font-size: 24px;
                        margin-bottom: 20px;
                    }
                    .message {
                        font-size: 18px;
                        margin-bottom: 30px;
                    }
                    .button {
                        background-color: #4CAF50;
                        color: white;
                        padding: 14px 20px;
                        border: none;
                        cursor: pointer;
                        font-size: 16px;
                        border-radius: 4px;
                        text-decoration: none;
                    }
                    .button:hover {
                        background-color: #45a049;
                    }
                </style>
            </head>
            <body>
                <div class="success">✅ Email Verification Successful!</div>
                <div class="message">Your email has been verified. You can now log in to your account.</div>
                <a href="http://127.0.0.1:3000/login" class="button">Go to Login</a>
            </body>
            </html>
            """
            return html_response
            
        except Exception as e:
            logging.error(f"Error during email verification: {str(e)}")
            return jsonify({'error': str(e)}), 500
        finally:
            if 'session' in locals():
                session.close()
    
    @app.route('/api/auth/forgot-password', methods=['POST'])
    def forgot_password():
        try:
            data = request.json
            email = data.get('email')
            
            if not email:
                return jsonify({'error': 'Email is required'}), 400
            
            session = Session()
            user = session.query(User).filter(User.email == email).first()
            
            if not user:
                # Don't reveal if user exists for security reasons
                return jsonify({'message': 'If your email is registered, you will receive a password reset link'}), 200
            
            # Generate reset token
            token = generate_password_reset_token(user.id)
            
            # Use the correct base URL for emails
            base_url = "http://127.0.0.1:8000"
            
            # Send reset email
            send_password_reset_email(user, token, base_url)
            
            return jsonify({'message': 'Password reset email sent'})
            
        except Exception as e:
            logging.error(f"Error during forgot password: {str(e)}")
            return jsonify({'error': str(e)}), 500
        finally:
            if 'session' in locals():
                session.close()
    
    @app.route('/api/auth/reset-password', methods=['GET', 'POST'])
    def reset_password():
        # Handle GET request for displaying the password reset form
        if request.method == 'GET':
            token = request.args.get('token')
            
            if not token:
                return jsonify({'error': 'Reset token is required'}), 400
            
            # Validate token
            payload = validate_jwt_token(token)
            
            if not payload or payload.get('purpose') != 'password_reset':
                return """
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Invalid Token</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            text-align: center;
                            margin-top: 50px;
                        }
                        .error {
                            color: #f44336;
                            font-size: 24px;
                            margin-bottom: 20px;
                        }
                        .message {
                            font-size: 18px;
                            margin-bottom: 30px;
                        }
                        .button {
                            background-color: #2196F3;
                            color: white;
                            padding: 14px 20px;
                            border: none;
                            cursor: pointer;
                            font-size: 16px;
                            border-radius: 4px;
                            text-decoration: none;
                        }
                        .button:hover {
                            background-color: #0b7dda;
                        }
                    </style>
                </head>
                <body>
                    <div class="error">❌ Invalid or Expired Token</div>
                    <div class="message">Your password reset link is invalid or has expired.</div>
                    <a href="http://127.0.0.1:3000/forgot-password" class="button">Request a New Link</a>
                </body>
                </html>
                """
            
            # Return HTML form for password reset
            html_form = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Reset Password</title>
                <style>
                    body {{
                        font-family: Arial, sans-serif;
                        max-width: 500px;
                        margin: 0 auto;
                        padding: 20px;
                    }}
                    h1 {{
                        text-align: center;
                        color: #333;
                    }}
                    .form-group {{
                        margin-bottom: 15px;
                    }}
                    label {{
                        display: block;
                        margin-bottom: 5px;
                        font-weight: bold;
                    }}
                    input[type="password"] {{
                        width: 100%;
                        padding: 10px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        box-sizing: border-box;
                        font-size: 16px;
                    }}
                    button {{
                        background-color: #4CAF50;
                        color: white;
                        padding: 12px 20px;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 16px;
                        width: 100%;
                    }}
                    button:hover {{
                        background-color: #45a049;
                    }}
                    .error {{
                        color: red;
                        margin-top: 5px;
                        display: none;
                    }}
                    .success {{
                        color: green;
                        text-align: center;
                        margin-top: 20px;
                        display: none;
                    }}
                </style>
            </head>
            <body>
                <h1>Reset Your Password</h1>
                <div id="form-container">
                    <div class="form-group">
                        <label for="password">New Password</label>
                        <input type="password" id="password" placeholder="Enter new password">
                        <div class="error" id="password-error"></div>
                    </div>
                    <div class="form-group">
                        <label for="confirm-password">Confirm Password</label>
                        <input type="password" id="confirm-password" placeholder="Confirm new password">
                        <div class="error" id="confirm-error"></div>
                    </div>
                    <input type="hidden" id="token" value="{token}">
                    <button onclick="resetPassword()">Reset Password</button>
                </div>
                <div class="success" id="success-message">
                    Password has been reset successfully! You will be redirected to the login page shortly.
                </div>
                
                <script>
                    function resetPassword() {{
                        // Reset errors
                        document.getElementById('password-error').style.display = 'none';
                        document.getElementById('confirm-error').style.display = 'none';
                        
                        // Get values
                        const password = document.getElementById('password').value;
                        const confirmPassword = document.getElementById('confirm-password').value;
                        const token = document.getElementById('token').value;
                        
                        // Validate
                        let isValid = true;
                        
                        if (password.length < 8) {{
                            document.getElementById('password-error').textContent = 'Password must be at least 8 characters long';
                            document.getElementById('password-error').style.display = 'block';
                            isValid = false;
                        }} else if (!/\\d/.test(password)) {{
                            document.getElementById('password-error').textContent = 'Password must contain at least one digit';
                            document.getElementById('password-error').style.display = 'block';
                            isValid = false;
                        }} else if (!/[A-Z]/.test(password)) {{
                            document.getElementById('password-error').textContent = 'Password must contain at least one uppercase letter';
                            document.getElementById('password-error').style.display = 'block';
                            isValid = false;
                        }} else if (!/[a-z]/.test(password)) {{
                            document.getElementById('password-error').textContent = 'Password must contain at least one lowercase letter';
                            document.getElementById('password-error').style.display = 'block';
                            isValid = false;
                        }}
                        
                        if (password !== confirmPassword) {{
                            document.getElementById('confirm-error').textContent = 'Passwords do not match';
                            document.getElementById('confirm-error').style.display = 'block';
                            isValid = false;
                        }}
                        
                        if (!isValid) return;
                        
                        // Send request to API
                        fetch('/api/auth/reset-password', {{
                            method: 'POST',
                            headers: {{
                                'Content-Type': 'application/json',
                            }},
                            body: JSON.stringify({{
                                token: token,
                                newPassword: password
                            }}),
                        }})
                        .then(response => response.json())
                        .then(data => {{
                            if (data.error) {{
                                alert('Error: ' + data.error);
                            }} else {{
                                // Show success message and redirect
                                document.getElementById('form-container').style.display = 'none';
                                document.getElementById('success-message').style.display = 'block';
                                
                                // Redirect after 3 seconds
                                setTimeout(() => {{
                                    window.location.href = 'http://127.0.0.1:3000/login';
                                }}, 3000);
                            }}
                        }})
                        .catch(error => {{
                            alert('An error occurred. Please try again.');
                            console.error('Error:', error);
                        }});
                    }}
                </script>
            </body>
            </html>
            """
            return html_form
            
        # Handle POST request for submitting the password reset
        elif request.method == 'POST':
            try:
                data = request.json
                token = data.get('token')
                new_password = data.get('newPassword')
                
                if not all([token, new_password]):
                    return jsonify({'error': 'Token and new password are required'}), 400
                
                # Validate password
                is_valid_password, password_error = validate_password(new_password)
                if not is_valid_password:
                    return jsonify({'error': password_error}), 400
                
                # Validate token
                payload = validate_jwt_token(token)
                
                if not payload or payload.get('purpose') != 'password_reset':
                    return jsonify({'error': 'Invalid or expired reset token'}), 400
                
                # Update user's password
                session = Session()
                user = session.query(User).filter(User.id == payload['user_id']).first()
                
                if not user:
                    return jsonify({'error': 'User not found'}), 404
                
                # Hash new password
                hashed_password = hash_password(new_password)
                user.password_hash = hashed_password
                
                # Clear reset token if stored in database
                user.reset_token = None
                user.reset_token_expires = None
                
                session.commit()
                
                return jsonify({'message': 'Password reset successful'})
                
            except Exception as e:
                if 'session' in locals():
                    session.rollback()
                logging.error(f"Error during password reset: {str(e)}")
                return jsonify({'error': str(e)}), 500
            finally:
                if 'session' in locals():
                    session.close()
    
    @app.route('/api/auth/resend-verification', methods=['POST'])
    def resend_verification():
        try:
            data = request.json
            email = data.get('email')
            
            if not email:
                return jsonify({'error': 'Email is required'}), 400
            
            session = Session()
            user = session.query(User).filter(User.email == email).first()
            
            if not user:
                # Don't reveal if user exists for security reasons
                return jsonify({'message': 'If your email is registered and not verified, you will receive a verification link'}), 200
            
            if user.email_verified:
                return jsonify({'message': 'Email is already verified'}), 200
            
            # Generate verification token
            token = generate_email_verification_token(user.id)
            
            # Use the correct base URL for emails
            base_url = "http://127.0.0.1:8000"
            
            # Send verification email
            send_verification_email(user, token, base_url)
            
            return jsonify({'message': 'Verification email sent'})
            
        except Exception as e:
            logging.error(f"Error during resend verification: {str(e)}")
            return jsonify({'error': str(e)}), 500
        finally:
            if 'session' in locals():
                session.close()
    
    @app.route('/api/auth/verification-status/<string:email>', methods=['GET'])
    def check_verification_status(email):
        try:
            session = Session()
            user = session.query(User).filter(User.email == email).first()
            
            if not user:
                # Don't reveal if user exists for security reasons
                return jsonify({'exists': False}), 200
            
            return jsonify({
                'exists': True,
                'verified': user.email_verified
            }), 200
            
        except Exception as e:
            logging.error(f"Error checking verification status: {str(e)}")
            return jsonify({'error': str(e)}), 500
        finally:
            if 'session' in locals():
                session.close()
