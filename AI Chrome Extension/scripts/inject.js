// This script injects the content script and utils into the page
function injectContentScript(tabId) {
  // Inject the form field extractor utility first
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['utils/formFieldExtractor.js']
  })
  .then(() => {
    // After the utility is injected, inject the content script
    return chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['scripts/content.js']
    });
  })
  .then(() => {
    console.log('Content script injected successfully');
  })
  .catch(err => {
    console.error('Error injecting content script:', err);
  });
}

// Export the function for use in other scripts
window.injectContentScript = injectContentScript; 