import os
import sys
from pathlib import Path

def setup_gemini_api():
    try:
        # Try to import from config
        print("Checking for Gemini API key...")
        
        # Add the current directory to path if needed
        current_dir = Path(__file__).parent.absolute()
        sys.path.append(str(current_dir))
        
        # Try to import from config
        try:
            from config import GEMINI_API_KEY
            print(f"✅ Found API key in config.py: {GEMINI_API_KEY[:5]}...")
            
            # Set the environment variable
            os.environ['GEMINI_API_KEY'] = GEMINI_API_KEY
            print("✅ Set GEMINI_API_KEY environment variable")
            
            # Test importing the library
            import google.generativeai as genai
            genai.configure(api_key=GEMINI_API_KEY)
            print("✅ Successfully configured Gemini API")
            
            # Test a simple call
            try:
                model = genai.GenerativeModel('gemini-2.0-flash')
                response = model.generate_content("Hello, respond with a short greeting.")
                print(f"✅ Test call successful. Response: {response.text[:50]}...")
                return True
            except Exception as e:
                print(f"❌ Test call failed: {str(e)}")
                return False
                
        except ImportError:
            print("❌ Could not import GEMINI_API_KEY from config.py")
            return False
            
    except Exception as e:
        print(f"❌ Error setting up Gemini API: {str(e)}")
        return False

if __name__ == "__main__":
    setup_gemini_api() 