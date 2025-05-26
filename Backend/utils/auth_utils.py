import os
import jwt
import bcrypt
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import smtplib
from models import User
from config import Session
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# JWT Configuration
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRY_HOURS = 24  # Token valid for 24 hours

# Email configuration
SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
SMTP_USERNAME = os.getenv('SMTP_USERNAME', 'teamhandjobs.co.in@gmail.com')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', 'jdivjssishevmaxa')
FROM_EMAIL = os.getenv('FROM_EMAIL', 'teamhandjobs.co.in@gmail.com')

def hash_password(password):
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password, hashed_password):
    """Verify a password against its hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def generate_jwt_token(user_id, username, expiry_hours=JWT_EXPIRY_HOURS):
    """Generate a JWT token for a user"""
    payload = {
        'user_id': user_id,
        'username': username,
        'exp': datetime.utcnow() + timedelta(hours=expiry_hours)
    }
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token

def validate_jwt_token(token):
    """Validate a JWT token and return the payload if valid"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None  # Token has expired
    except jwt.InvalidTokenError:
        return None  # Invalid token

def get_user_from_token(token):
    """Get a user from a JWT token"""
    payload = validate_jwt_token(token)
    if not payload:
        return None
    
    session = Session()
    try:
        user = session.query(User).filter(User.id == payload['user_id']).first()
        return user
    except Exception as e:
        logging.error(f"Error getting user from token: {str(e)}")
        return None
    finally:
        session.close()

def generate_password_reset_token(user_id, expiry_hours=1):
    """Generate a password reset token"""
    payload = {
        'user_id': user_id,
        'purpose': 'password_reset',
        'exp': datetime.utcnow() + timedelta(hours=expiry_hours)
    }
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token

def generate_email_verification_token(user_id):
    """Generate an email verification token"""
    payload = {
        'user_id': user_id,
        'purpose': 'email_verification',
        'exp': datetime.utcnow() + timedelta(days=7)  # Valid for 7 days
    }
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token

def send_email(to_email, subject, html_content):
    """Send an email using SMTP"""
    msg = MIMEMultipart()
    msg['From'] = FROM_EMAIL
    msg['To'] = to_email
    msg['Subject'] = subject
    
    msg.attach(MIMEText(html_content, 'html'))
    
    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        logging.error(f"Error sending email: {str(e)}")
        return False

def send_password_reset_email(user, token, base_url):
    """Send a password reset email to a user"""
    reset_link = f"{base_url}/api/auth/reset-password?token={token}"
    html_content = f"""
    <html>
    <body>
        <h2>Password Reset Request</h2>
        <p>Hello {user.username},</p>
        <p>We received a request to reset your password. Click the link below to reset your password:</p>
        <p><a href="{reset_link}">Reset Password</a></p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
    </body>
    </html>
    """
    return send_email(user.email, "Password Reset Request", html_content)

def send_verification_email(user, token, base_url):
    """Send an email verification email to a user"""
    verify_link = f"{base_url}/api/auth/verify-email?token={token}"
    html_content = f"""
    <html>
    <body>
        <h2>Email Verification</h2>
        <p>Hello {user.username},</p>
        <p>Thank you for signing up! Please click the link below to verify your email address:</p>
        <p><a href="{verify_link}">Verify Email</a></p>
        <p>If you didn't sign up for an account, please ignore this email.</p>
    </body>
    </html>
    """
    return send_email(user.email, "Verify Your Email", html_content)

def authenticate_user(username_or_email, password):
    """Authenticate a user with username/email and password"""
    session = Session()
    try:
        # Try to find user by username or email
        user = session.query(User).filter(
            (User.username == username_or_email) | (User.email == username_or_email)
        ).first()
        
        if not user:
            return None
        
        # Verify password
        if verify_password(password, user.password_hash):
            return user
        
        return None
    except Exception as e:
        logging.error(f"Error authenticating user: {str(e)}")
        return None
    finally:
        session.close()