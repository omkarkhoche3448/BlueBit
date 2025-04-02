// content-script-website-detector.js
// This script is injected into all web pages but only activates on your website

(function() {
    // Replace with your actual website domain
    const YOUR_WEBSITE_DOMAIN = "localhost:5173";
    
    // Check if we're on the target website
    if (window.location.href.includes(YOUR_WEBSITE_DOMAIN)) {
      console.log("Token extractor activated on your website");
      
      // Function to extract clerk token from localStorage
      function extractClerkToken() {
        try {
          // Get clerk token from localStorage
          const clerkUserId = localStorage.getItem('clerkUserId');
          
          if (clerkUserId) {
            console.log("Found clerkUserId in localStorage:", clerkUserId);
            
            // Send token to background script for storage
            chrome.runtime.sendMessage({
              action: 'saveClerkToken',
              token: clerkUserId
            }, function(response) {
              if (chrome.runtime.lastError) {
                console.error("Error sending token to background script:", chrome.runtime.lastError);
              } else if (response && response.success) {
                console.log("Token successfully saved to extension storage");
                
                // Show success message to the user
                showTokenSavedMessage();
              }
            });
            
            return clerkUserId;
          } else {
            // Try with fallback methods (similar to ProFind's auth_detection.js)
            console.log("No clerk ID found in localStorage, trying fallback methods");
            
            // Check if user is logged in through other methods
            const isLoggedIn = document.body.classList.contains('signed-in') || 
                             !!localStorage.getItem('clerk-db') ||
                             !!document.querySelector('[data-clerk-user-id]');
            
            if (isLoggedIn) {
              // Try to get the user ID
              let userId = null;
              
              // Method 1: Check for data attribute
              const userElement = document.querySelector('[data-clerk-user-id]');
              if (userElement) {
                userId = userElement.getAttribute('data-clerk-user-id');
                console.log('Found userId from data attribute:', userId);
              }
              
              // Method 2: Check localStorage data
              if (!userId) {
                try {
                  const clerkData = localStorage.getItem('clerk-db');
                  if (clerkData) {
                    const parsedData = JSON.parse(clerkData);
                    // Extract user ID from clerk data structure
                    userId = parsedData?.userSettings?.identifier || 
                           parsedData?.sessions?.[0]?.userId;
                    console.log('Found userId from clerk-db:', userId);
                  }
                } catch (e) {
                  console.error('Error parsing Clerk data:', e);
                }
              }
              
              // If we found a userId through alternative methods, save it
              if (userId) {
                console.log("Found clerkUserId through alternative method:", userId);
                
                // Send token to background script for storage
                chrome.runtime.sendMessage({
                  action: 'saveClerkToken',
                  token: userId
                }, function(response) {
                  if (chrome.runtime.lastError) {
                    console.error("Error sending token to background script:", chrome.runtime.lastError);
                  } else if (response && response.success) {
                    console.log("Token successfully saved to extension storage");
                    
                    // Show success message to the user
                    showTokenSavedMessage();
                  }
                });
                
                return userId;
              }
            }
            
            console.warn("No clerk token found after trying all methods");
            return null;
          }
        } catch (error) {
          console.error("Error accessing localStorage:", error);
          return null;
        }
      }
      
      // Function to show a message that token was saved
      function showTokenSavedMessage() {
        // First, check if our manual auth button exists and remove it
        const existingManualButton = document.getElementById('ai-autofill-auth-button');
        if (existingManualButton) {
          existingManualButton.remove();
        }
        
        // Create and style the notification element
        const notification = document.createElement('div');
        notification.id = 'ai-autofill-notification';
        notification.textContent = 'AI Job Application Helper: Login detected! Ready to help you fill forms.';
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.backgroundColor = '#4CAF50';
        notification.style.color = 'white';
        notification.style.padding = '12px 20px';
        notification.style.borderRadius = '5px';
        notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        notification.style.zIndex = '9999';
        notification.style.fontFamily = 'Arial, sans-serif';
        notification.style.fontSize = '14px';
        notification.style.transition = 'opacity 0.5s ease';
        
        // Add to the DOM
        document.body.appendChild(notification);
        
        // Remove after a delay
        setTimeout(() => {
          notification.style.opacity = '0';
          setTimeout(() => {
            if (document.body.contains(notification)) {
              document.body.removeChild(notification);
            }
          }, 500);
        }, 5000);
      }
      
      // Observe localStorage changes using a timer
      let previousToken = null;
      setInterval(() => {
        const currentToken = localStorage.getItem('clerkUserId');
        if (currentToken && currentToken !== previousToken) {
          extractClerkToken();
          previousToken = currentToken;
        }
      }, 2000);
      
      // Also extract the token when the page loads
      document.addEventListener('DOMContentLoaded', extractClerkToken);
      
      // If the DOM is already loaded, extract token now
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        extractClerkToken();
      }
    }
  })();