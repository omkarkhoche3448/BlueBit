document.addEventListener('DOMContentLoaded', function() {
  const autofillFormButton = document.getElementById('autofillForm');
  const statusMessage = document.getElementById('statusMessage');
  const clerkIdInput = document.getElementById('clerk-id-input');
  let manualClerkId = null;

  if (!autofillFormButton) {
    console.error('Fill Form button not found in the document');
    if (statusMessage) {
      statusMessage.textContent = 'Error: UI elements not found. Please reload the extension.';
    }
    return;
  }

  // Update manualClerkId when input changes
  clerkIdInput.addEventListener('input', function() {
    manualClerkId = clerkIdInput.value.trim();
  });

  // Autofill the form using the backend API
  autofillFormButton.addEventListener('click', function() {
    // Check if Clerk ID is entered
    if (!manualClerkId) {
      statusMessage.textContent = 'Please enter your Clerk ID first.';
      clerkIdInput.focus();
      return;
    }
    
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
        statusMessage.textContent = 'Scripts injected, processing form...';
        
        // Use the manually entered Clerk ID
        processFormWithClerkId(currentTab.id, manualClerkId);
      })
      .catch(err => {
        console.error('Error injecting scripts:', err);
        statusMessage.textContent = 'Error: Could not inject scripts. Make sure you have allowed this extension to run on this site.';
      });
    });
  });
  
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