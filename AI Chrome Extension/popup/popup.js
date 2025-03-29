document.addEventListener('DOMContentLoaded', function() {
  const autofillFormButton = document.getElementById('autofillForm');
  const statusMessage = document.getElementById('statusMessage');

  if (!autofillFormButton) {
    console.error('Fill Form button not found in the document');
    if (statusMessage) {
      statusMessage.textContent = 'Error: UI elements not found. Please reload the extension.';
    }
    return;
  }

  // Autofill the form using the backend API
  autofillFormButton.addEventListener('click', function() {
    statusMessage.textContent = 'Processing form fields...';
    
    // First, get the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs || tabs.length === 0) {
        statusMessage.textContent = 'Error: Cannot access the current tab.';
        return;
      }
      
      const currentTab = tabs[0];
      
      // Inject scripts directly when the button is clicked
      statusMessage.textContent = 'Injecting scripts...';
      
      // First inject FormFieldExtractor
      chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        files: ['utils/formFieldExtractor.js']
      })
      .then(() => {
        // Then inject content script
        return chrome.scripting.executeScript({
          target: { tabId: currentTab.id },
          files: ['scripts/content.js']
        });
      })
      .then(() => {
        console.log('Scripts injected successfully');
        statusMessage.textContent = 'Scripts injected, getting clerk ID...';
        
        // Add a small delay to ensure the content script is fully initialized
        setTimeout(() => {
          // Now try to get the clerk ID
          getClerkId(currentTab.id);
        }, 1000);
      })
      .catch(err => {
        console.error('Error injecting scripts:', err);
        statusMessage.textContent = 'Error: Could not inject scripts. Make sure you have allowed this extension to run on this site.';
      });
    });
  });
  
  // Function to get clerk ID from the page
  function getClerkId(tabId) {
    try {
      statusMessage.textContent = 'Getting user ID...';
      
      chrome.tabs.sendMessage(
        tabId, 
        { action: 'getClerkId' }, 
        function(response) {
          if (chrome.runtime.lastError) {
            console.error("Error sending getClerkId message:", chrome.runtime.lastError.message);
            statusMessage.textContent = 'Error: Cannot communicate with the page. Try refreshing and make sure you have allowed this extension to run on this site.';
            return;
          }
          
          if (response && response.success && response.clerkId) {
            // Got the clerkId, now proceed with form filling
            console.log("Received clerk ID:", response.clerkId);
            statusMessage.textContent = 'User ID found, extracting form fields...';
            processFormWithClerkId(tabId, response.clerkId);
          } else {
            statusMessage.textContent = 'Error: Could not find user ID. Please log in first.';
          }
        }
      );
    } catch (error) {
      console.error("Error in getClerkId:", error);
      statusMessage.textContent = 'Error: Failed to communicate with the page.';
    }
  }
  
  // Function to process the form with a valid clerkId
  function processFormWithClerkId(tabId, clerkId) {
    try {
      chrome.tabs.sendMessage(
        tabId, 
        { 
          action: 'autofillForm',
          clerkId: clerkId
        }, 
        function(response) {
          if (chrome.runtime.lastError) {
            console.error("Error sending autofillForm message:", chrome.runtime.lastError.message);
            statusMessage.textContent = 'Error: Cannot communicate with the page. Please refresh and try again.';
            return;
          }
          
          if (response && response.success) {
            statusMessage.textContent = `Successfully filled ${response.filledCount} fields.`;
          } else {
            statusMessage.textContent = `Error: ${response?.error || 'Failed to autofill the form'}`;
          }
        }
      );
    } catch (error) {
      console.error("Error in processFormWithClerkId:", error);
      statusMessage.textContent = 'Error: Failed to communicate with the page.';
    }
  }
});