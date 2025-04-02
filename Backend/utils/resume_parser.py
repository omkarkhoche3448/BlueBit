import json
import re
import logging
from config import model

def extract_resume_keywords(resume_text):
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