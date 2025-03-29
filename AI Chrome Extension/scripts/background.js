// API key for Gemini (you'll need to replace this with your actual API key)
const GEMINI_API_KEY = 'AIzaSyDCSbDt2Xdd3xvvIIwqqcc9EiZfQ_mTyHM';
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// Listen for messages from content script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'processWithAI') {
    processFieldsWithGemini(request.fields, request.resumeData)
      .then(responses => {
        sendResponse({ success: true, responses: responses });
      })
      .catch(error => {
        console.error('Error processing with Gemini:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true; // Required for async sendResponse
  }
})

/**
 * Process form fields with Gemini AI
 * @param {Array} fields - Array of form field objects
 * @param {string} resumeData - User's resume text
 * @returns {Promise<Array>} Array of AI responses for each field
 */
async function processFieldsWithGemini(fields, resumeData) {
  // Prepare the prompt for Gemini
  const prompt = createGeminiPrompt(fields, resumeData);
  
  try {
    // Call Gemini API
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    
    // Parse the AI response
    const aiText = data.candidates[0].content.parts[0].text;
    return parseGeminiResponse(aiText, fields);
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}

/**
 * Create a prompt for Gemini based on form fields and resume
 * @param {Array} fields - Array of form field objects
 * @param {string} resumeData - User's resume text
 * @returns {string} Prompt for Gemini
 */
function createGeminiPrompt(fields, resumeData) {
  let prompt = `I'm filling out a job application form. Below is my resume information, followed by the form fields I need to fill. Please provide appropriate responses for each field based on my resume data.

RESUME INFORMATION:
${resumeData}

FORM FIELDS TO FILL:
`;

  fields.forEach((field, index) => {
    prompt += `${index + 1}. Field: "${field.label}"
   Type: ${field.type}
   ${field.required ? 'Required: Yes' : 'Required: No'}
   ${field.placeholder ? `Placeholder: "${field.placeholder}"` : ''}
`;
  });

  prompt += `
Please respond with a JSON object where each key is the field number and each value is your suggested response. For example:
{
  "1": "John Doe",
  "2": "johndoe@example.com",
  ...
}

Only include the JSON in your response, no other text.`;

  return prompt;
}

/**
 * Parse the response from Gemini
 * @param {string} aiText - Text response from Gemini
 * @param {Array} fields - Array of form field objects
 * @returns {Array} Array of responses for each field
 */
function parseGeminiResponse(aiText, fields) {
  try {
    // Extract JSON from the response
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not find JSON in AI response');
    }
    
    const jsonStr = jsonMatch[0];
    const responses = JSON.parse(jsonStr);
    
    // Convert to array format
    return fields.map((field, index) => {
      const fieldNum = (index + 1).toString();
      return {
        fieldIndex: index,
        label: field.label,
        value: responses[fieldNum] || ''
      };
    });
  } catch (error) {
    console.error('Error parsing AI response:', error);
    // Fallback: try to extract responses line by line
    const lines = aiText.split('\n');
    return fields.map((field, index) => {
      const fieldNum = (index + 1).toString();
      const responseLine = lines.find(line => line.includes(`${fieldNum}:`));
      const value = responseLine ? responseLine.split(':').slice(1).join(':').trim() : '';
      
      return {
        fieldIndex: index,
        label: field.label,
        value: value.replace(/^["']|["']$/g, '') // Remove quotes if present
      };
    });
  }
}