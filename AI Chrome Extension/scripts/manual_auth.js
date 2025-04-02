// manual_auth.js - Adds a manual connection button to ProFind app pages
(function() {
  console.log("AI Job Application Manual Auth initializing");
  
  // Only run on the ProFind app
  if (!window.location.href.includes('localhost:5173')) return;
  
  // Check if Clerk ID is already detected before showing the button
  function checkForClerkIdAndCreateButton() {
    // Check if notification is already showing
    if (document.getElementById('ai-autofill-notification')) {
      return; // Don't show button if notification is active
    }
    
    // Check if we already have a stored Clerk ID
    chrome.storage.local.get(['clerkUserId'], function(result) {
      if (result.clerkUserId) {
        console.log("Clerk ID already stored, not showing manual button");
        return; // Already have ID, no need for button
      }
      
      // Check if localStorage has Clerk ID
      const clerkIdInLocalStorage = localStorage.getItem('clerkUserId');
      if (clerkIdInLocalStorage) {
        // If ID exists in localStorage but not in extension storage, save it
        chrome.runtime.sendMessage({
          action: 'saveClerkToken',
          token: clerkIdInLocalStorage
        });
        return; // No need to show button
      }
      
      // If we get here, no Clerk ID was detected, so create the button
      createAuthButton();
    });
  }
  
  // Create the manual auth button
  function createAuthButton() {
    // Don't add button if it already exists
    if (document.getElementById('ai-autofill-auth-button')) return;
    
    // Create floating button
    const button = document.createElement('button');
    button.id = 'ai-autofill-auth-button';
    button.innerHTML = 'Connect to AI Autofill';
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 10px 15px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
      z-index: 10000;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    
    // Add click handler
    button.addEventListener('click', function() {
      const userId = localStorage.getItem('clerkUserId');
      
      if (userId) {
        // Send auth message to background script
        chrome.runtime.sendMessage({
          action: 'saveClerkToken',
          token: userId
        }, function(response) {
          if (response && response.success) {
            alert('Successfully connected to the AI Job Application Autofill extension!');
            // Change button appearance
            button.innerHTML = 'Connected ✓';
            button.style.backgroundColor = '#2e7d32';
            // Hide button after 3 seconds
            setTimeout(() => {
              button.style.display = 'none';
            }, 3000);
          } else {
            alert('Failed to connect to the extension.');
          }
        });
      } else {
        alert('Please log in to your account first.');
      }
    });
    
    // Add to DOM
    document.body.appendChild(button);
  }
  
  // Wait for page to fully load
  window.addEventListener('load', function() {
    setTimeout(checkForClerkIdAndCreateButton, 2000);
  });
})(); 