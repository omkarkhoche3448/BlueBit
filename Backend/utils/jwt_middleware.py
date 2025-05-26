from flask import request, jsonify
from functools import wraps
from utils.auth_utils import validate_jwt_token, get_user_from_token

def jwt_required(f):
    """Decorator for routes that require JWT authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        # Check if Authorization header is present
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({'error': 'Missing Authorization header'}), 401
        
        # Get token from header
        try:
            # Format: "Bearer <token>"
            token_parts = auth_header.split()
            
            if token_parts[0].lower() != 'bearer' or len(token_parts) != 2:
                return jsonify({'error': 'Invalid Authorization header format'}), 401
            
            token = token_parts[1]
        except:
            return jsonify({'error': 'Invalid Authorization header format'}), 401
        
        # Validate token
        payload = validate_jwt_token(token)
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Add user_id to kwargs so the route can use it
        kwargs['user_id'] = payload['user_id']
        
        return f(*args, **kwargs)
    
    return decorated

def get_user_id_from_jwt():
    """Helper function to extract user_id from JWT token in request headers"""
    auth_header = request.headers.get('Authorization')
    
    if not auth_header:
        return None
    
    try:
        token_parts = auth_header.split()
        
        if token_parts[0].lower() != 'bearer' or len(token_parts) != 2:
            return None
        
        token = token_parts[1]
        payload = validate_jwt_token(token)
        
        if payload:
            return payload['user_id']
        return None
    except:
        return None

def get_current_user():
    """Helper function to get the current authenticated user"""
    auth_header = request.headers.get('Authorization')
    
    if not auth_header:
        return None
    
    try:
        token_parts = auth_header.split()
        
        if token_parts[0].lower() != 'bearer' or len(token_parts) != 2:
            return None
        
        token = token_parts[1]
        user = get_user_from_token(token)
        return user
    except:
        return None
