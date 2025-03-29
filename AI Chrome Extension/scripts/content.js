// Initialize the form field extractor
let formFieldExtractor = new FormFieldExtractor();
let extractedFields = [];

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'extractFields') {
    try {
      extractedFields = formFieldExtractor.extractFields();
      sendResponse({ 
        success: true, 
        fieldCount: extractedFields.length,
        fields: extractedFields.map(field => ({
          type: field.type,
          label: field.label,
          name: field.name,
          placeholder: field.placeholder,
          required: field.required
        }))
      });
    } catch (error) {
      console.error('Error extracting fields:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true;
  }
  
  if (request.action === 'autofillForm') {
    try {
      // If fields haven't been extracted yet, do it now
      if (extractedFields.length === 0) {
        extractedFields = formFieldExtractor.extractFields();
      }
      
      if (extractedFields.length === 0) {
        sendResponse({ success: false, error: 'No form fields found' });
        return true;
      }
      
      // Process fields with AI and autofill
      processFieldsWithAI(extractedFields, request.resumeData)
        .then(filledCount => {
          sendResponse({ success: true, filledCount: filledCount });
        })
        .catch(error => {
          console.error('Error autofilling form:', error);
          sendResponse({ success: false, error: error.message });
        });
      
      return true;
    } catch (error) {
      console.error('Error in autofill process:', error);
      sendResponse({ success: false, error: error.message });
      return true;
    }
  }
});

/**
 * Process form fields with AI and autofill the form
 * @param {Array} fields - Array of form field objects
 * @param {string} resumeData - User's resume text
 * @returns {Promise<number>} Number of fields filled
 */
async function processFieldsWithAI(fields, resumeData) {
  // Prepare the fields data to send to the AI
  const fieldsData = fields.map(field => ({
    label: field.label,
    type: field.type,
    name: field.name,
    placeholder: field.placeholder,
    required: field.required
  }));
  
  // Send the data to the background script to process with Gemini API
  const response = await chrome.runtime.sendMessage({
    action: 'processWithAI',
    fields: fieldsData,
    resumeData: resumeData
  });
  
  if (!response || !response.success) {
    throw new Error(response?.error || 'Failed to process with AI');
  }
  
  // Fill the form with the AI-generated responses
  let filledCount = 0;
  
  fields.forEach((field, index) => {
    const aiResponse = response.responses[index];
    if (aiResponse && aiResponse.value) {
      fillField(field.element, aiResponse.value);
      filledCount++;
    }
  });
  
  return filledCount;
}

/**
 * Fill a form field with the given value
 * @param {Element} element - Form field DOM element
 * @param {string} value - Value to fill
 */
function fillField(element, value) {
  const tagName = element.tagName.toLowerCase();
  
  if (tagName === 'select') {
    // For select elements, find the option that best matches the value
    const options = Array.from(element.options);
    const bestMatch = findBestMatchOption(options, value);
    
    if (bestMatch !== -1) {
      element.selectedIndex = bestMatch;
      // Trigger change event
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  } else {
    // For text inputs and textareas
    element.value = value;
    // Trigger input and change events
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

/**
 * Find the best matching option in a select element
 * @param {Array} options - Array of option elements
 * @param {string} value - Value to match
 * @returns {number} Index of the best matching option or -1 if none found
 */
function findBestMatchOption(options, value) {
  const valueLower = value.toLowerCase();
  
  // First try exact match
  for (let i = 0; i < options.length; i++) {
    if (options[i].value.toLowerCase() === valueLower || 
        options[i].textContent.toLowerCase() === valueLower) {
      return i;
    }
  }
  
  // Then try contains match
  for (let i = 0; i < options.length; i++) {
    if (options[i].value.toLowerCase().includes(valueLower) || 
        options[i].textContent.toLowerCase().includes(valueLower)) {
      return i;
    }
  }
  
  // Then try if value contains option
  for (let i = 0; i < options.length; i++) {
    if (valueLower.includes(options[i].value.toLowerCase()) || 
        valueLower.includes(options[i].textContent.toLowerCase())) {
      return i;
    }
  }
  
  return -1;
}