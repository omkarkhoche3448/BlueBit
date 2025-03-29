// Initialize variables
let formFieldExtractor = null;
let extractedFields = [];

// Log that the content script is loading
console.log("AI Job Application Autofill content script loading...");

// Function to extract clerkUserId from Chrome storage or page's localStorage
function getClerkIdFromPage() {
  // First try to get the clerkUserId from Chrome storage
  return new Promise((resolve) => {
    // Check if Chrome storage API is available
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['clerkUserId'], function(result) {
        if (result.clerkUserId) {
          console.log("Found clerkUserId in Chrome storage:", result.clerkUserId);
          resolve(result.clerkUserId);
        } else {
          // Fallback to localStorage if not in Chrome storage
          try {
            const clerkUserId = localStorage.getItem('clerkUserId');
            if (clerkUserId) {
              console.log("Found clerkUserId in localStorage:", clerkUserId);
              
              // Also save it to Chrome storage for future use
              chrome.storage.local.set({ clerkUserId: clerkUserId }, function() {
                console.log("Saved clerkUserId from localStorage to Chrome storage");
              });
              
              resolve(clerkUserId);
            } else {
              console.warn("No clerk ID found in Chrome storage or localStorage");
              resolve(null);
            }
          } catch (error) {
            console.error('Error accessing page localStorage:', error);
            resolve(null);
          }
        }
      });
    } else {
      // If Chrome API is not available, just try localStorage
      try {
        const clerkUserId = localStorage.getItem('clerkUserId');
        console.log("Chrome storage API not available, using localStorage:", clerkUserId);
        resolve(clerkUserId || null);
      } catch (error) {
        console.error('Error accessing page localStorage:', error);
        resolve(null);
      }
    }
  });
}

// Function to initialize the FormFieldExtractor
function initializeExtractor() {
  try {
    console.log("Initializing FormFieldExtractor");
    
    // Check if FormFieldExtractor is already defined
    if (typeof FormFieldExtractor === 'undefined') {
      console.error("FormFieldExtractor is not defined");
      return false;
    }
    
    formFieldExtractor = new FormFieldExtractor();
    console.log("FormFieldExtractor initialized successfully");
    return true;
  } catch (error) {
    console.error("Error initializing FormFieldExtractor:", error);
    return false;
  }
}

// Try to initialize the extractor when the script loads
const extractorInitialized = initializeExtractor();

// Log that the content script has loaded
console.log("AI Job Application Autofill content script loaded, extractor initialized:", extractorInitialized);

// Let the background script know the content script is ready
chrome.runtime.sendMessage({ action: 'contentScriptReady' });

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log("Message received in content script:", request.action);
  
  if (request.action === 'getClerkId') {
    // Get the clerk ID from Chrome storage or localStorage
    getClerkIdFromPage().then(clerkId => {
      if (clerkId) {
        console.log("Sending clerkId back to popup:", clerkId);
        sendResponse({ success: true, clerkId: clerkId });
      } else {
        console.error("No clerk ID found");
        sendResponse({ success: false, error: "User not logged in. Please log in first." });
      }
    });
    return true; // Keep the message channel open for async response
  }
  
  if (request.action === 'extractFields') {
    if (!extractorInitialized) {
      // Try to initialize again
      if (!initializeExtractor()) {
        console.error("FormFieldExtractor could not be initialized");
        sendResponse({ success: false, error: "Form field extractor could not be initialized" });
        return true;
      }
    }
    
    try {
      extractedFields = formFieldExtractor.extractFields();
      console.log("Extracted fields:", extractedFields.length);
      
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
    if (!extractorInitialized) {
      // Try to initialize again
      if (!initializeExtractor()) {
        console.error("FormFieldExtractor could not be initialized");
        sendResponse({ success: false, error: "Form field extractor could not be initialized" });
        return true;
      }
    }
    
    try {
      // If fields haven't been extracted yet, do it now
      if (extractedFields.length === 0) {
        console.log("No fields extracted yet, extracting now");
        extractedFields = formFieldExtractor.extractFields();
        console.log("Extracted fields:", extractedFields.length);
      }
      
      if (extractedFields.length === 0) {
        console.error("No form fields found");
        sendResponse({ success: false, error: 'No form fields found on this page' });
        return true;
      }
      
      getClerkIdFromPage().then(clerkId => {
        const userClerkId = request.clerkId || clerkId;
        console.log("Using clerk ID for autofill:", userClerkId);
        
        if (!userClerkId) {
          console.error("No clerk ID found");
          sendResponse({ success: false, error: 'Could not find user ID. Please log in first.' });
          return;
        }
        
        // Process fields with backend API and autofill
        console.log("Calling processFieldsWithBackend");
        processFieldsWithBackend(extractedFields, userClerkId)
          .then(filledCount => {
            console.log("Form filled successfully:", filledCount);
            sendResponse({ success: true, filledCount: filledCount });
          })
          .catch(error => {
            console.error('Error autofilling form:', error);
            sendResponse({ success: false, error: error.message });
          });
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
 * Prevent form submissions to avoid losing filled data
 */
function preventFormSubmissions() {
  console.log("Setting up form submission prevention");
  
  // Find all forms on the page
  const forms = document.querySelectorAll('form');
  forms.forEach((form, index) => {
    // Skip if we've already added a submission handler
    if (form.dataset.aiAutofillHandled) {
      return;
    }
    
    console.log(`Adding submission prevention to form ${index}`);
    
    // Mark as handled
    form.dataset.aiAutofillHandled = 'true';
    
    // Add event listener to prevent accidental form submission
    form.addEventListener('submit', function(event) {
      // Only prevent if we're in the middle of filling
      if (window.aiAutofillInProgress) {
        console.log('Preventing form submission during autofill');
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    }, true);
  });
  
  // Also prevent beforeunload events during filling
  window.addEventListener('beforeunload', function(event) {
    if (window.aiAutofillInProgress) {
      console.log('Preventing page unload during autofill');
      event.preventDefault();
      event.returnValue = 'Form filling in progress. Are you sure you want to leave?';
      return event.returnValue;
    }
  });
}

/**
 * Process form fields with backend API and autofill the form
 * @param {Array} fields - Array of form field objects
 * @param {string} clerkId - Clerk user ID for authentication
 * @returns {Promise<number>} Number of fields filled
 */
async function processFieldsWithBackend(fields, clerkId) {
  // Set global flag to indicate filling is in progress
  window.aiAutofillInProgress = true;

  try {
    // Prevent form submissions while we're filling
    preventFormSubmissions();
    
    // Prepare the fields data to send to the backend
    const fieldsData = fields.map(field => ({
      label: field.label,
      type: field.type,
      name: field.name,
      placeholder: field.placeholder,
      required: field.required
    }));
    
    console.log("Sending data to background script with fields:", fieldsData);
    
    // Send the data to the background script to process with backend API
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'processWithAI',
        fields: fieldsData,
        clerkId: clerkId
      }, function(response) {
        if (chrome.runtime.lastError) {
          console.error("Error sending message to background:", chrome.runtime.lastError);
          window.aiAutofillInProgress = false; // Clear flag on error
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        if (!response || !response.success) {
          console.error("Error in response from background:", response);
          window.aiAutofillInProgress = false; // Clear flag on error
          reject(new Error(response?.error || 'Failed to process with backend'));
          return;
        }
        
        console.log("Received raw response from background:", JSON.stringify(response));
        
        // Fill the form with the AI-generated responses
        let filledCount = 0;
        let fillPromises = [];
        
        // Fill fields one by one with slight delays to avoid triggering form validation
        fields.forEach((field, index) => {
          // Add to promises array to wait for all fields to be filled
          fillPromises.push(new Promise(resolveField => {
            // Add a small incremental delay for each field to avoid overwhelming the page
            setTimeout(() => {
              console.log(`Processing field ${index}:`, field.label);
              
              // First try to match by index
              let aiResponse = response.responses[index];
              
              // If that doesn't work, try to match by label
              if (!aiResponse || !aiResponse.value) {
                aiResponse = response.responses.find(r => 
                  r.label && field.label && 
                  r.label.toLowerCase() === field.label.toLowerCase()
                );
              }
              
              if (aiResponse && aiResponse.value) {
                console.log(`Filling field ${field.label} with value:`, aiResponse.value);
                try {
                  // Make sure field has an element
                  if (!field.element) {
                    console.error(`Field ${field.label} has no element property`);
                    resolveField();
                    return; // Skip this field
                  }
                  
                  fillField(field.element, aiResponse.value);
                  filledCount++;
                  console.log(`Successfully filled field: ${field.label}`);
                  resolveField();
                } catch (error) {
                  console.error(`Error filling field ${field.label}:`, error);
                  resolveField();
                }
              } else {
                console.warn(`No AI response found for field: ${field.label}`);
                resolveField();
              }
            }, index * 100); // 100ms delay between each field
          }));
        });
        
        // Wait for all fields to be filled
        Promise.all(fillPromises).then(() => {
          console.log(`Field filling complete. Filled ${filledCount}/${fields.length} fields.`);
          
          // Store filled data to local storage as backup
          try {
            const filledData = {};
            fields.forEach(field => {
              if (field.element && field.element.value) {
                const key = field.id || field.name || field.label;
                filledData[key] = field.element.value;
              }
            });
            localStorage.setItem('aiFormAutofillBackup', JSON.stringify(filledData));
            console.log('Field values backed up to localStorage');
          } catch (error) {
            console.warn('Could not back up field values:', error);
          }
          
          // Add a finalizing delay before clearing the filling flag
          setTimeout(() => {
            window.aiAutofillInProgress = false; // Clear flag when done
            resolve(filledCount);
          }, 500);
        });
      });
    });
  } catch (error) {
    console.error('Error in processFieldsWithBackend:', error);
    window.aiAutofillInProgress = false; // Clear flag on error
    throw error;
  }
}

/**
 * Fill a form field with the given value
 * @param {Element} element - Form field DOM element
 * @param {string} value - Value to fill
 */
function fillField(element, value) {
  if (!element) {
    console.error("Cannot fill field: element is null");
    return;
  }
  
  console.log("Filling element:", element.tagName, "id:", element.id, "name:", element.name);
  
  try {
    const tagName = element.tagName.toLowerCase();
    
    // Store original value for debugging
    const originalValue = element.value;
    
    if (tagName === 'select') {
      // For select elements, find the option that best matches the value
      const options = Array.from(element.options);
      console.log("Select options:", options.map(o => o.textContent));
      const bestMatch = findBestMatchOption(options, value);
      
      if (bestMatch !== -1) {
        console.log(`Setting select to option ${bestMatch}: ${options[bestMatch].textContent}`);
        element.selectedIndex = bestMatch;
        // Trigger change event
        element.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        console.warn("No matching option found for:", value);
      }
    } else {
      // For text inputs and textareas
      console.log(`Setting value to: ${value}`);
      
      // First try using value property
      element.value = value;
      
      // Then dispatch events to trigger any listeners
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      element.dispatchEvent(new Event('blur', { bubbles: true }));
      
      // Force focus and blur as some forms require this
      element.focus();
      setTimeout(() => {
        // Check if value was actually set
        if (element.value !== value) {
          console.warn(`Value not set properly. Original: "${originalValue}", Tried to set: "${value}", Current: "${element.value}"`);
          
          // Try more aggressive approaches
          try {
            // Try using Object.defineProperty to override value getter/setter
            const descriptor = Object.getOwnPropertyDescriptor(element.__proto__, 'value');
            const originalGet = descriptor.get;
            const originalSet = descriptor.set;
            
            Object.defineProperty(element, 'value', {
              get: function() { return value; },
              set: function(newVal) { 
                console.log(`Value setter called with: ${newVal}`);
                originalSet.call(this, value);
              },
              configurable: true
            });
            
            // After a while, restore original behavior
            setTimeout(() => {
              Object.defineProperty(element, 'value', descriptor);
            }, 1000);
          } catch (e) {
            console.error('Error trying to force value:', e);
          }
        }
        
        element.blur();
      }, 100);
    }
  } catch (error) {
    console.error(`Error filling field:`, error);
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

// Debug information function - can be called from the console to check status
window.debugAutofill = function() {
  console.log("======= AUTOFILL DEBUG INFO =======");
  console.log("Content script loaded: true");
  console.log("FormFieldExtractor initialized:", typeof FormFieldExtractor !== 'undefined');
  console.log("FormFieldExtractor instance:", formFieldExtractor);
  console.log("Extracted fields count:", extractedFields.length);
  
  try {
    const clerkId = getClerkIdFromPage();
    console.log("Clerk ID:", clerkId);
  } catch (error) {
    console.log("Error getting clerk ID:", error);
  }
  
  console.log("Form fields present:", document.querySelectorAll('input, select, textarea').length);
  console.log("=================================");
  
  return "Debug info logged to console";
};

// When the content script loads, announce itself in the console
console.log("%c AI FORM AUTOFILL: Content script loaded and ready!", "background: #4CAF50; color: white; padding: 5px; border-radius: 3px; font-size: 14px;");

// Add a message to show after form filling is complete
function addCompletionMessage() {
  const messageDiv = document.createElement('div');
  messageDiv.style.position = 'fixed';
  messageDiv.style.bottom = '20px';
  messageDiv.style.right = '20px';
  messageDiv.style.backgroundColor = '#4CAF50';
  messageDiv.style.color = 'white';
  messageDiv.style.padding = '15px';
  messageDiv.style.borderRadius = '5px';
  messageDiv.style.zIndex = '9999';
  messageDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  messageDiv.style.maxWidth = '300px';
  messageDiv.style.fontSize = '14px';
  messageDiv.innerHTML = '<strong>Form Filled Successfully!</strong><br>If the page refreshes, your data should be preserved.';
  
  document.body.appendChild(messageDiv);
  
  // Remove the message after a while
  setTimeout(() => {
    if (document.body.contains(messageDiv)) {
      document.body.removeChild(messageDiv);
    }
  }, 10000);
}

// Add a function to check for form reset events
function monitorFormResets() {
  // Store form field values periodically
  let lastFormValues = {};
  
  setInterval(() => {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      const inputs = form.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        if (input.id || input.name) {
          const key = input.id || input.name;
          lastFormValues[key] = input.value;
        }
      });
    });
  }, 1000);
  
  // Check if forms were reset and restore values
  document.addEventListener('reset', function(event) {
    if (event.target.tagName === 'FORM') {
      console.log('Form reset detected, will try to restore values');
      
      setTimeout(() => {
        const inputs = event.target.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
          if ((input.id || input.name) && lastFormValues[input.id || input.name]) {
            console.log(`Restoring value for ${input.id || input.name}`);
            input.value = lastFormValues[input.id || input.name];
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      }, 10);
    }
  }, true);
}

// Call this when the script loads
monitorFormResets();