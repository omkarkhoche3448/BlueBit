// This script runs on the ProFind app pages to detect authentication
(function() {
  console.log("ProFind Auth Detection script loaded");

  // Function to check if user is logged in on ProFind
  function checkAuthenticationStatus() {
    try {
      // Check for Clerk userId directly
      const clerkUserId = localStorage.getItem('clerkUserId');
      if (clerkUserId) {
        console.log('ProFind Auth: Found clerkUserId in localStorage:', clerkUserId);
        
        // Send message to background script
        chrome.runtime.sendMessage({
          action: 'setAuthentication',
          userId: clerkUserId,
          isAuthenticated: true
        }, response => {
          if (response) {
            console.log('Authentication set successfully:', response);
          } else {
            console.error('Failed to set authentication state', chrome.runtime.lastError);
          }
        });
        
        return;
      }
      
      // Fallback checks
      const isLoggedIn = document.body.classList.contains('signed-in') || 
                        !!localStorage.getItem('clerk-db') ||
                        !!document.querySelector('[data-clerk-user-id]');
      
      console.log('ProFind Auth: isLoggedIn status:', isLoggedIn);
                        
      if (isLoggedIn) {
        // Try to get the user ID
        let userId = null;
        
        // Method 1: Check for data attribute
        const userElement = document.querySelector('[data-clerk-user-id]');
        if (userElement) {
          userId = userElement.getAttribute('data-clerk-user-id');
          console.log('ProFind Auth: Found userId from data attribute:', userId);
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
              console.log('ProFind Auth: Found userId from clerk-db:', userId);
            }
          } catch (e) {
            console.error('Error parsing Clerk data:', e);
          }
        }
        
        // Send message to background script about authentication
        if (userId) {
          chrome.runtime.sendMessage({
            action: 'setAuthentication',
            userId: userId,
            isAuthenticated: true
          }, response => {
            if (response) {
              console.log('Authentication set successfully:', response);
            } else {
              console.error('Failed to set authentication state', chrome.runtime.lastError);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error in checkAuthenticationStatus:', error);
    }
  }
  
  // Run the check when page loads
  setTimeout(checkAuthenticationStatus, 1000);
  
  // Check again after any potential login activity
  setInterval(checkAuthenticationStatus, 5000);
})(); 