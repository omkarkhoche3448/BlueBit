// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('ProFind Autofill extension installed');
  
  // Initialize storage with empty values
  chrome.storage.local.set({
    userId: null,
    isAuthenticated: false,
    resumeData: null,
    parsedResumeData: null
  });
});

// Function to extract structured data from resume text using Gemini API
async function parseResumeWithGemini(resumeText) {
  try {
    console.log('Parsing resume with Gemini API, resume length:', resumeText.length);
    
    const response = await fetch('http://localhost:8000/api/parse-resume-for-autofill', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ resumeText })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resume parsing API error:', response.status, errorText);
      throw new Error(`Failed to parse resume: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Resume parsing successful, received data:', data);
    
    if (!data.parsedData) {
      throw new Error('No parsed data returned from API');
    }
    
    return data.parsedData;
  } catch (error) {
    console.error('Error parsing resume with Gemini:', error);
    // Return a basic structure instead of null to prevent downstream errors
    return {
      name: "Error retrieving data",
      email: "",
      phone: "",
      skills: "Could not parse resume. Please try refreshing data."
    };
  }
}

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkAuthentication') {
    chrome.storage.local.get(['userId', 'isAuthenticated'], (result) => {
      sendResponse({
        isAuthenticated: result.isAuthenticated,
        userId: result.userId
      });
    });
    return true; // Required for async response
  }
  
  if (request.action === 'fetchResumeData') {
    const userId = request.userId;
    console.log('Fetching resume data for user:', userId);
    
    try {
      // Directly fetch from backend - no need for complex checks now
      const response = await fetch(`http://localhost:8000/api/users/${userId}/resume-text`);
      
      if (!response.ok) {
        console.error('Error fetching resume text:', response.status);
        throw new Error(`Failed to fetch resume: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Resume text fetched successfully');
      
      // Parse with Gemini API
      const parsedData = await parseResumeWithGemini(data.resumeText);
      
      // Store in extension
      chrome.storage.local.set({
        parsedResumeData: parsedData,
        lastUpdated: Date.now()
      });
      
      sendResponse({ success: true, data: parsedData });
    } catch (error) {
      console.error('Error in fetchResumeData:', error);
      sendResponse({ success: false, error: error.message });
    }
    
    return true; // Required for async response
  }
  
  if (request.action === 'logout') {
    chrome.storage.local.set({
      userId: null,
      isAuthenticated: false,
      resumeData: null,
      parsedResumeData: null
    }, () => {
      sendResponse({ success: true });
    });
    return true; // Required for async response
  }
  
  // New handler for authentication status updates from app
  if (request.action === 'setAuthentication') {
    try {
      console.log('Received setAuthentication request:', request);
      
      chrome.storage.local.set({
        userId: request.userId,
        isAuthenticated: request.isAuthenticated
      }, () => {
        const lastError = chrome.runtime.lastError;
        if (lastError) {
          console.error('Error setting authentication state:', lastError);
          if (sendResponse) sendResponse({ success: false, error: lastError.message });
        } else {
          console.log('Authentication state updated successfully:', request.isAuthenticated);
          if (sendResponse) sendResponse({ success: true });
        }
      });
    } catch (error) {
      console.error('Error in setAuthentication handler:', error);
      if (sendResponse) sendResponse({ success: false, error: error.message });
    }
    return true;
  }
}); 