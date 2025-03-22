from flask import Flask, request, render_template, jsonify
import os
import google.generativeai as genai
from PyPDF2 import PdfReader
from docx import Document
import json

app = Flask(__name__)

# Configure Gemini API
GEMINI_API_KEY = 'AIzaSyDCSbDt2Xdd3xvvIIwqqcc9EiZfQ_mTyHM'  # Replace with your actual API key
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash')  # Ensure this is the correct model name

# Function to extract text from PDF files
def extract_text_from_pdf(file):
    try:
        reader = PdfReader(file)
        text = ''
        for page in reader.pages:
            text += page.extract_text() or ''  # Handle cases where extract_text() returns None
        return text, None
    except Exception as e:
        return None, str(e)

# Function to extract text from DOCX files
def extract_text_from_docx(file):
    try:
        doc = Document(file)
        text = ''
        for paragraph in doc.paragraphs:
            text += paragraph.text + '\n'
        return text, None
    except Exception as e:
        return None, str(e)

# Function to analyze the resume and return ATS scoring
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

    Provide an overall assessment summarizing the strengths and weaknesses of the resume, and offer specific tips for improvement.

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
        "overall_assessment": "<summary of strengths and weaknesses>",
        "improvement_tips": "<specific tips for enhancement>"
    }}

    Resume text:
    {text}
    """

    try:
        response = model.generate_content(prompt)
        response_text = response.text
        
        # Debug print - can be removed in production
        print("Raw response:", response_text)
        
        # Clean the response text to ensure it's valid JSON
        # Look for JSON content between curly braces
        import re
        json_match = re.search(r'({.*})', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
            # Parse the response as JSON
            analysis_result = json.loads(json_str)
            return analysis_result
        else:
            # If no JSON pattern found, try parsing the whole response
            try:
                analysis_result = json.loads(response_text)
                return analysis_result
            except:
                return {"error": "Failed to extract JSON from the response"}
    except json.JSONDecodeError as e:
        return {"error": f"Failed to parse analysis result as JSON: {str(e)}"}
    except Exception as e:
        return {"error": f"Analysis failed: {str(e)}"}

# Route to serve the homepage
@app.route('/')
def index():
    return render_template('index.html')

# Route to handle resume analysis
@app.route('/analyze', methods=['POST'])
def analyze():
    if 'resume' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['resume']
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
    app.run(debug=True)