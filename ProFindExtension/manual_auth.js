// Create a popup button on ProFind app pages for manual authentication
(function() {
  console.log("ProFind Manual Auth initializing");
  
  // Only run on the ProFind app
  if (!window.location.href.includes('localhost:5173')) return;
  
  // Create the manual auth button
  function createAuthButton() {
    // Don't add button if it already exists
    if (document.getElementById('profind-auth-button')) return;
    
    // Create floating button
    const button = document.createElement('button');
    button.id = 'profind-auth-button';
    button.innerHTML = 'Connect to Extension';
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 10px 15px;
      background-color: #2563eb;
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
          action: 'setAuthentication',
          userId: userId,
          isAuthenticated: true
        }, function(response) {
          if (response && response.success) {
            alert('Successfully connected to the ProFind extension!');
            // Change button appearance
            button.innerHTML = 'Connected ✓';
            button.style.backgroundColor = '#16a34a';
            // Hide button after 3 seconds
            setTimeout(() => {
              button.style.display = 'none';
            }, 3000);
          } else {
            alert('Failed to connect to the extension.');
          }
        });
      } else {
        alert('Please log in to ProFind first.');
      }
    });
    
    // Add to DOM
    document.body.appendChild(button);
  }
  
  // Wait for page to fully load
  window.addEventListener('load', function() {
    setTimeout(createAuthButton, 2000);
  });
})(); 