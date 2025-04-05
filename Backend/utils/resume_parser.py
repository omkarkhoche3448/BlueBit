import json
import re
import logging
from config import model
from PyPDF2 import PdfReader
from docx import Document
from collections import Counter
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords

# Download required NLTK data if not already present
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

# Make sure we download the correct resources
nltk.download('punkt')
nltk.download('stopwords')

def extract_text_from_pdf(pdf_file):
    """Extract text from a PDF file."""
    try:
        reader = PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            text += page.extract_text()
        return text, None
    except Exception as e:
        logging.error(f"Error extracting text from PDF: {str(e)}")
        return None, str(e)

def extract_text_from_docx(docx_file):
    """Extract text from a DOCX file."""
    try:
        doc = Document(docx_file)
        text = ""
        for para in doc.paragraphs:
            text += para.text + "\n"
        return text, None
    except Exception as e:
        logging.error(f"Error extracting text from DOCX: {str(e)}")
        return None, str(e)

def extract_resume_keywords(resume_text, use_gemini=False):
    """Extract keywords from resume text using Gemini or fallback to basic NLP."""
    if use_gemini:
        return extract_resume_keywords_with_gemini(resume_text)
    else:
        return extract_resume_keywords_with_nlp(resume_text)

def extract_resume_keywords_with_nlp(resume_text):
    """Extract keywords using basic NLP techniques as fallback."""
    try:
        # Tokenize the text
        tokens = word_tokenize(resume_text.lower())
        
        # Remove stopwords
        stop_words = set(stopwords.words('english'))
        filtered_tokens = [token for token in tokens if token.isalnum() and token not in stop_words]
        
        # Count word frequencies
        word_freq = Counter(filtered_tokens)
        
        # Get the most common words
        common_words = word_freq.most_common(20)
        
        # Extract technical keywords (programming languages, frameworks, etc.)
        tech_keywords = [
            "python", "javascript", "java", "c++", "c#", "ruby", "php", "swift", 
            "kotlin", "go", "rust", "typescript", "html", "css", "sql", "nosql",
            "react", "angular", "vue", "node.js", "django", "flask", "spring", 
            "express", "tensorflow", "pytorch", "pandas", "numpy", "scikit-learn",
            "machine learning", "deep learning", "ai", "artificial intelligence",
            "data science", "aws", "azure", "gcp", "docker", "kubernetes", "devops"
        ]
        
        # Extract keywords from the text
        keywords = []
        for word, _ in common_words:
            if word in tech_keywords:
                keywords.append(word)
        
        # Add any tech keywords that appear in the text but might not be in the most common words
        for keyword in tech_keywords:
            if keyword in resume_text.lower() and keyword not in keywords:
                keywords.append(keyword)
        
        # If no keywords were found, add some default ones based on the text
        if not keywords:
            # Simple pattern matching for common tech terms
            if "python" in resume_text.lower():
                keywords.append("python")
            if "javascript" in resume_text.lower():
                keywords.append("javascript")
            if "react" in resume_text.lower():
                keywords.append("react")
            if "node.js" in resume_text.lower() or "node" in resume_text.lower():
                keywords.append("node.js")
            if "tensorflow" in resume_text.lower():
                keywords.append("tensorflow")
            if "machine learning" in resume_text.lower():
                keywords.append("machine learning")
        
        return keywords
        
    except Exception as e:
        logging.error(f"Error extracting resume keywords with NLP: {str(e)}")
        # Fallback to simple pattern matching if NLTK fails
        keywords = []
        if "python" in resume_text.lower():
            keywords.append("python")
        if "javascript" in resume_text.lower():
            keywords.append("javascript")
        if "react" in resume_text.lower():
            keywords.append("react")
        if "node.js" in resume_text.lower() or "node" in resume_text.lower():
            keywords.append("node.js")
        if "tensorflow" in resume_text.lower():
            keywords.append("tensorflow")
        if "machine learning" in resume_text.lower():
            keywords.append("machine learning")
        return keywords

def extract_resume_keywords_with_gemini(resume_text):
    """Extract keywords from resume text using Gemini."""
    try:
        # Truncate text if it's very long to fit Gemini's input limits
        if len(resume_text) > 30000:
            resume_text = resume_text[:30000]
            
        # Define the improved prompt for job matching keyword extraction
        prompt = """
        Extract job matching keywords from the resume text. Focus only on the following categories:
        
        1. Technical skills (programming languages, frameworks, libraries)
        2. Tools and platforms
        3. Job titles and roles
        4. Industries and domains
        5. Methodologies and practices
        6. Certifications and qualifications
        
        Guidelines for extraction:
        - Extract single-word or compound technical terms only (e.g., "Python", "Machine Learning", "AWS")
        - Remove any personal pronouns, articles, or conjunctions
        - Exclude generic soft skills like "Communication" or "Teamwork"
        - Normalize terms (lowercase, remove special characters)
        - For technologies, include major versions only if specified (e.g., "Python 3")
        - Standardize abbreviations (e.g., "JS" to "JavaScript", "ML" to "Machine Learning")
        - Include common acronyms if present (e.g., "AI" for "Artificial Intelligence", SQL for "Structured Query Language")
        - Focus on specific, measurable technical capabilities 
        - Avoid duplicates and near-duplicates
        
        Return ONLY a JSON array of strings, with each string being a keyword or key phrase.
        DO NOT include any markdown formatting, code blocks, or backticks in your response.
        Format your response as a valid JSON array like this: ["keyword1", "keyword2", "keyword3"]
        
        Resume text:
        ```
        {resume_text}
        ```
        """
        
        # Generate response from Gemini
        response = model.generate_content(prompt.format(resume_text=resume_text))
        response_text = response.text
        
        logging.info(f"Raw Gemini response: {response_text[:500]}...")  # Log first 500 chars of response
        
        # Clean the response - remove markdown code blocks and backticks
        cleaned_response = re.sub(r'```(?:json)?\s*|\s*```', '', response_text)
        
        # Try to parse the cleaned response as JSON directly
        try:
            keywords = json.loads(cleaned_response)
            if isinstance(keywords, list):
                logging.info(f"Successfully parsed JSON response after cleaning")
            else:
                logging.warning("Response was valid JSON but not a list, falling back to regex")
                keywords = []
        except json.JSONDecodeError:
            # Fallback: Extract JSON array using regex
            logging.warning("Failed to parse cleaned response as JSON, trying regex extraction")
            json_match = re.search(r'\[\s*"[^"]+(?:",\s*"[^"]+")*\s*\]', cleaned_response)
            if json_match:
                keywords_json = json_match.group(0)
                try:
                    keywords = json.loads(keywords_json)
                    logging.info(f"Successfully extracted JSON with regex")
                except json.JSONDecodeError:
                    keywords = []
                    logging.error("Failed to parse extracted JSON")
            else:
                # Last resort: try to extract any strings that look like keywords
                keywords = re.findall(r'"([^"]+)"', cleaned_response)
                logging.info(f"Extracted {len(keywords)} keywords using string pattern matching")
        
        # Deduplicate and clean
        keywords = list(set(keywords))
        keywords = [k.strip() for k in keywords if k.strip()]
        
        logging.info(f"Extracted {len(keywords)} keywords from resume")
        return keywords
        
    except Exception as e:
        logging.error(f"Error extracting resume keywords: {str(e)}")
        logging.exception("Full exception details:")
        return []