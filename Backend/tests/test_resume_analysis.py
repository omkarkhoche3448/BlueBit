import os
import sys
import pytest
import json
from unittest.mock import patch, MagicMock
from flask import Flask
from werkzeug.datastructures import FileStorage
from io import BytesIO

# Add the parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app, extract_text_from_pdf, extract_text_from_docx, analyze_resume

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

@pytest.fixture
def mock_pdf_reader():
    with patch('app.PdfReader') as mock_reader_class:
        mock_reader = MagicMock()
        mock_reader_class.return_value = mock_reader
        
        # Mock pages
        page1 = MagicMock()
        page1.extract_text.return_value = "Page 1 content"
        page2 = MagicMock()
        page2.extract_text.return_value = "Page 2 content"
        mock_reader.pages = [page1, page2]
        
        yield mock_reader

@pytest.fixture
def mock_docx_document():
    with patch('app.Document') as mock_document_class:
        mock_document = MagicMock()
        mock_document_class.return_value = mock_document
        
        # Mock paragraphs
        paragraph1 = MagicMock()
        paragraph1.text = "Paragraph 1 content"
        paragraph2 = MagicMock()
        paragraph2.text = "Paragraph 2 content"
        mock_document.paragraphs = [paragraph1, paragraph2]
        
        yield mock_document

@pytest.fixture
def mock_genai_model():
    with patch('app.model.generate_content') as mock_generate:
        mock_response = MagicMock()
        mock_response.text = json.dumps({
            "score": 75,
            "sub_scores": {
                "Keyword Optimization": 15,
                "Action Verbs": 12,
                "Measurable Achievements": 10,
                "Clarity and Conciseness": 12,
                "Professional Tone": 8,
                "Section Completeness": 8,
                "Length": 7,
                "Format Indicators": 3
            },
            "comments": {
                "Keyword Optimization": "Good use of industry keywords",
                "Action Verbs": "Strong action verbs used"
            },
            "overall_assessment": "Good resume with some areas for improvement"
        })
        mock_generate.return_value = mock_response
        yield mock_generate

def test_extract_text_from_pdf(mock_pdf_reader):
    # Create a test PDF file
    pdf_file = BytesIO(b'%PDF-1.4\nTest PDF content')
    pdf_file.name = 'test.pdf'
    
    # Execute
    text, error = extract_text_from_pdf(pdf_file)
    
    # Assert
    assert error is None
    assert text == "Page 1 contentPage 2 content"

def test_extract_text_from_pdf_error():
    # Setup - no mock, so it will raise an exception
    pdf_file = BytesIO(b'Invalid PDF content')
    pdf_file.name = 'test.pdf'
    
    # Execute
    with patch('app.PdfReader', side_effect=Exception("PDF Error")):
        text, error = extract_text_from_pdf(pdf_file)
    
    # Assert
    assert text is None
    assert error is not None

def test_extract_text_from_docx(mock_docx_document):
    # Create a test DOCX file
    docx_file = BytesIO(b'PK\x03\x04\x14\x00\x00\x00\x08\x00Test DOCX content')
    docx_file.name = 'test.docx'
    
    # Execute
    text, error = extract_text_from_docx(docx_file)
    
    # Assert
    assert error is None
    assert text == "Paragraph 1 content\nParagraph 2 content\n"

def test_extract_text_from_docx_error():
    # Setup - no mock, so it will raise an exception
    docx_file = BytesIO(b'Invalid DOCX content')
    docx_file.name = 'test.docx'
    
    # Execute
    with patch('app.Document', side_effect=Exception("DOCX Error")):
        text, error = extract_text_from_docx(docx_file)
    
    # Assert
    assert text is None
    assert error is not None

def test_analyze_resume(mock_genai_model):
    # Execute
    result = analyze_resume("Sample resume text")
    
    # Assert
    assert mock_genai_model.called
    assert result["score"] == 75
    assert "sub_scores" in result
    assert "comments" in result

def test_analyze_resume_json_error():
    # Setup
    with patch('app.model.generate_content') as mock_generate:
        mock_response = MagicMock()
        mock_response.text = "Invalid JSON response"
        mock_generate.return_value = mock_response
        
        # Execute
        result = analyze_resume("Sample resume text")
        
        # Assert
        assert "error" in result

def test_analyze_endpoint_success(client, mock_pdf_reader, mock_genai_model):
    # Create a test PDF file
    pdf_content = b'%PDF-1.4\nTest PDF content'
    
    # Execute
    response = client.post(
        '/api/analyze',
        data={'file': (BytesIO(pdf_content), 'test.pdf')},
        content_type='multipart/form-data'
    )
    
    # Assert
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "score" in data
    assert "sub_scores" in data

def test_analyze_endpoint_no_file(client):
    # Execute
    response = client.post('/api/analyze')
    
    # Assert
    assert response.status_code == 400
    data = json.loads(response.data)
    assert "error" in data
    assert "No file uploaded" in data["error"]

def test_analyze_endpoint_empty_filename(client):
    # Execute
    response = client.post(
        '/api/analyze',
        data={'file': (BytesIO(b''), '')},
        content_type='multipart/form-data'
    )
    
    # Assert
    assert response.status_code == 400
    data = json.loads(response.data)
    assert "error" in data
    assert "No file selected" in data["error"]

def test_analyze_endpoint_unsupported_format(client):
    # Execute
    response = client.post(
        '/api/analyze',
        data={'file': (BytesIO(b'Test content'), 'test.txt')},
        content_type='multipart/form-data'
    )
    
    # Assert
    assert response.status_code == 400
    data = json.loads(response.data)
    assert "error" in data
    assert "Unsupported file format" in data["error"]