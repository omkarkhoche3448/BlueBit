import json
import requests
from flask import Blueprint, request, jsonify
import google.generativeai as genai
from config import GEMINI_API_KEY, Session
from models import User

chrome_extension_bp = Blueprint('chrome_extension', __name__)

@chrome_extension_bp.route('/chrome-extension', methods=['POST'])
def process_chrome_extension_form():
    try:
        data = request.json
        fields = data.get('fields', [])
        
        if not fields:
            return jsonify({"success": False, "error": "No form fields provided"}), 400
        
        # Get clerk_id from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"success": False, "error": "Authorization header with Bearer token is required"}), 401
            
        clerk_id = auth_header.replace('Bearer ', '')
        
        # Fetch user's resume from the database
        session = Session()
        try:
            user = session.query(User).filter_by(clerk_id=clerk_id).first()
            
            if not user:
                return jsonify({"success": False, "error": "User not found"}), 404
            
            if not user.is_pro:
                return jsonify({"success": False, "error": "Become a pro user to activate AI extension !"}), 403
                
            if user.autofill_limit <= 0:
                return jsonify({"success": False, "error": "Autofill limit reached"}), 403
            
            if not user.resume_text:
                return jsonify({"success": False, "error": "No resume found for this user"}), 404
                
            # Store needed user data
            user_resume = user.resume_text 
            user_address = user.preferred_address
            
            # Update the limit
            user.autofill_limit -= 1
            session.commit()
            
        finally:
            session.close()
        
        # Prepare prompt for Gemini using the requested format
        prompt = f"""I'm filling out a job application form. Below is my resume information, followed by the form fields I need to fill. Please provide appropriate responses for each field based on my resume data.

RESUME INFORMATION:
{user_resume}
PREFFRED ADDRESS:
{user_address}

FORM FIELDS TO FILL:
"""
        
        # Add each field to the prompt
        for i, field in enumerate(fields):
            prompt += f"""{i + 1}. Field: "{field.get('label', '')}"
Type: {field.get('type', '')}
{field.get('required', False) and 'Required: Yes' or 'Required: No'}
{field.get('placeholder') and f'Placeholder: "{field.get("placeholder")}"' or ''}
"""

        prompt += """
Please respond with a JSON object where each key is the field number and each value is your suggested response. For example:
{
"1": "John Doe",
"2": "johndoe@example.com",
...
}

Only include the JSON in your response, no other text. Do not wrap the JSON in markdown code blocks."""
        
        # Call Gemini API
        model = genai.GenerativeModel('gemini-2.0-flash')
        response = model.generate_content(prompt)
        
        try:
            # Parse the JSON response from Gemini
            ai_response = response.text.strip()
            
            # Handle case where response is wrapped in markdown code blocks
            if ai_response.startswith("```") and "```" in ai_response:
                # Extract content between code blocks
                start_idx = ai_response.find("\n", ai_response.find("```")) + 1
                end_idx = ai_response.rfind("```")
                ai_response = ai_response[start_idx:end_idx].strip()
            
            ai_data = json.loads(ai_response)
            
            # Convert the numbered responses to the expected format
            responses = []
            for i, field in enumerate(fields):
                field_index = str(i + 1)  # Convert to string to match the keys in ai_data
                if field_index in ai_data:
                    responses.append({
                        "fieldIndex": i,
                        "label": field.get("label", ""),
                        "value": ai_data[field_index]
                    })
                else:
                    # If field is missing in the response, add an empty value
                    responses.append({
                        "fieldIndex": i,
                        "label": field.get("label", ""),
                        "value": ""
                    })
            
            return jsonify({"success": True, "responses": responses})
            
        except Exception as parsing_error:
            return jsonify({
                "success": False, 
                "error": f"Failed to parse AI response: {str(parsing_error)}",
                "raw_response": response.text
            }), 500
            
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

def register_chrome_extension_routes(app):
    app.register_blueprint(chrome_extension_bp)