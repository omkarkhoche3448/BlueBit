document.addEventListener('DOMContentLoaded', function() {
  const resumeTextarea = document.getElementById('resumeData');
  const saveResumeButton = document.getElementById('saveResume');
  const extractFieldsButton = document.getElementById('extractFields');
  const autofillFormButton = document.getElementById('autofillForm');
  const statusMessage = document.getElementById('statusMessage');

  // Load saved resume data if available
  chrome.storage.local.get(['resumeData'], function(result) {
    if (result.resumeData) {
      resumeTextarea.value = result.resumeData;
      statusMessage.textContent = 'Resume loaded from storage.';
    }
  });

  // Save resume data
  saveResumeButton.addEventListener('click', function() {
    const resumeData = resumeTextarea.value.trim();
    
    if (!resumeData) {
      statusMessage.textContent = 'Please enter your resume data.';
      return;
    }
    
    chrome.storage.local.set({ resumeData: resumeData }, function() {
      statusMessage.textContent = 'Resume saved successfully!';
    });
  });

  // Extract form fields from the current page
  extractFieldsButton.addEventListener('click', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'extractFields' }, function(response) {
        if (response && response.success) {
          statusMessage.textContent = `Found ${response.fieldCount} form fields.`;
        } else {
          statusMessage.textContent = 'Failed to extract form fields.';
        }
      });
    });
  });

  // Autofill the form using AI
  autofillFormButton.addEventListener('click', function() {
    chrome.storage.local.get(['resumeData'], function(result) {
      if (!result.resumeData) {
        statusMessage.textContent = 'Please save your resume data first.';
        return;
      }

      statusMessage.textContent = 'Processing form fields with AI...';
      
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(
          tabs[0].id, 
          { 
            action: 'autofillForm',
            resumeData: result.resumeData
          }, 
          function(response) {
            if (response && response.success) {
              statusMessage.textContent = `Successfully filled ${response.filledCount} fields.`;
            } else {
              statusMessage.textContent = 'Failed to autofill the form.';
            }
          }
        );
      });
    });
  });
});