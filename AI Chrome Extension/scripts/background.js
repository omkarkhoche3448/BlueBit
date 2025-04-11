// background.js
// Track which tabs have the content script injected
const injectedTabs = new Set();

// When a tab is updated (page load completes), inject our content script
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    // Always inject the website detector script first (lightweight)
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['scripts/website-detector.js']
    })
    .catch(err => {
      console.error('Error injecting website detector script:', err);
    });
    
    // Avoid re-injecting the main script if it's already injected
    if (!injectedTabs.has(tabId)) {
      console.log('Injecting content script into tab:', tabId);
      
      // Inject FormFieldExtractor first
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['utils/formFieldExtractor.js']
      })
      .then(() => {
        // Then inject the content script
        return chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['scripts/content.js']
        });
      })
      .then(() => {
        console.log('Scripts injected successfully into tab:', tabId);
        injectedTabs.add(tabId);
      })
      .catch(err => {
        console.error('Error injecting scripts:', err);
      });
    }
  }
});

// Remove tab from injected set when it's closed
chrome.tabs.onRemoved.addListener((tabId) => {
  injectedTabs.delete(tabId);
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // New message type for saving clerk token
  if (request.action === 'saveClerkToken') {
    console.log('Saving clerk token to extension storage');
    chrome.storage.local.set({ 'clerkUserId': request.token }, function() {
      if (chrome.runtime.lastError) {
        console.error('Error saving token:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('Clerk token saved to extension storage');
        sendResponse({ success: true });
      }
    });
    return true; // Keep the channel open for async response
  }
  
  if (request.action === 'processWithAI') {
    processFieldsWithBackend(request.fields, request.clerkId)
      .then(responses => {
        sendResponse({ success: true, responses: responses });
      })
      .catch(error => {
        console.error('Error processing with backend:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true; // Required for async sendResponse
  }
  
  // Message to check if content script is already injected
  if (request.action === 'isContentScriptInjected') {
    const tabId = request.tabId;
    const isInjected = injectedTabs.has(tabId);
    
    sendResponse({ injected: isInjected });
    
    // If not injected, inject it now
    if (!isInjected) {
      // Inject FormFieldExtractor first
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['utils/formFieldExtractor.js']
      })
      .then(() => {
        // Then inject the content script
        return chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['scripts/content.js']
        });
      })
      .then(() => {
        console.log('Scripts injected successfully into tab:', tabId);
        injectedTabs.add(tabId);
      })
      .catch(err => {
        console.error('Error injecting scripts:', err);
      });
    }
    
    return true;
  }
});

/**
 * Process form fields with backend API
 * @param {Array} fields - Array of form field objects
 * @param {string} clerkId - Clerk user ID for authentication
 * @returns {Promise<Array>} Array of AI responses for each field
 */
async function processFieldsWithBackend(fields, clerkId) {
  const BACKEND_URL = "https://handjobs-backend-2ceb83f7e7a2.herokuapp.com/chrome-extension";
  
  try {
    console.log("Sending request to backend with clerk ID:", clerkId);
    console.log("Fields being sent:", fields);
    
    // Call backend API
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${clerkId}`
      },
      body: JSON.stringify({
        fields: fields
      }),
      mode: 'cors'  // Explicitly set CORS mode
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend response error:", response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
    }
    
    const data = await response.json();
    console.log("Backend response:", data);
    
    if (!data.success) {
      throw new Error(data.error || 'Unknown error from backend');
    }
    
    return data.responses;
  } catch (error) {
    console.error('Error calling backend API:', error);
    // Try a simpler implementation if the backend fails
    return fields.map((field, index) => ({
      fieldIndex: index,
      label: field.label,
      value: "Error connecting to AI service. Please try again later."
    }));
  }
}