// This function runs on the frontend to sync Clerk auth with the extension
export function syncAuthWithExtension() {
  try {
    // Check if the extension API is available (extension is installed)
    if (window.chrome && chrome.runtime && chrome.runtime.sendMessage) {
      const userId = localStorage.getItem('clerkUserId');
      
      if (userId) {
        chrome.runtime.sendMessage(
          // Extension ID - you need to fill this in after loading the extension
          // You can get it from chrome://extensions when in developer mode
          'llmlegnoggpclfcgphbjjacdohmcdehf',
          {
            action: 'setAuthentication',
            userId: userId,
            isAuthenticated: true
          },
          (response) => {
            console.log('Authentication synced with extension:', response);
          }
        );
      }
    }
  } catch (error) {
    console.log('Extension not available or sync failed:', error);
  }
} 