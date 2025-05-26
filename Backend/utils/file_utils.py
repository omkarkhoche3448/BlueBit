import os
import zipfile
from xml.etree.ElementTree import XML
from pypdf import PdfReader
from docx import Document as DocxDocument
import logging
from config import RESUME_UPLOAD_FOLDER

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

# Alternative DOCX extraction function using textract
def extract_text_from_docx(file):
    try:
        # Save the file temporarily
        temp_path = os.path.join(RESUME_UPLOAD_FOLDER, "temp.docx")
        file.save(temp_path)
        
        # Use a simpler approach - read as a zip file and extract content
        WORD_NAMESPACE = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
        PARA = WORD_NAMESPACE + 'p'
        TEXT = WORD_NAMESPACE + 't'
        
        with zipfile.ZipFile(temp_path) as docx_file:
            content = docx_file.read('word/document.xml')
            tree = XML(content)
            
            paragraphs = []
            for paragraph in tree.iter(PARA):
                texts = [node.text for node in paragraph.iter(TEXT) if node.text]
                if texts:
                    paragraphs.append(''.join(texts))
            
            text = '\n'.join(paragraphs)
        
        # Remove temp file
        os.remove(temp_path)
        return text, None
        
    except Exception as e:
        return None, str(e)