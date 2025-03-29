// Map of common form field identifiers
const fieldMappings = {
  // Personal Info
  name: ['name', 'full_name', 'fullname'],
  firstName: ['first_name', 'firstname', 'first'],
  lastName: ['last_name', 'lastname', 'last'],
  email: ['email', 'email_address', 'emailaddress'],
  phone: ['phone', 'phone_number', 'phonenumber', 'mobile', 'cell'],
  address: ['address', 'street_address', 'streetaddress'],
  city: ['city', 'town'],
  state: ['state', 'province', 'region'],
  zip: ['zip', 'zipcode', 'postal_code', 'postalcode'],
  country: ['country', 'nation'],
  
  // Education
  education: ['education', 'educational_background'],
  degree: ['degree', 'qualification'],
  major: ['major', 'field_of_study', 'fieldofstudy', 'field'],
  gpa: ['gpa', 'grade_point_average'],
  
  // Experience
  experience: ['experience', 'work_experience', 'workexperience'],
  company: ['company', 'employer', 'organization'],
  jobTitle: ['job_title', 'jobtitle', 'position', 'title', 'role'],
  startDate: ['start_date', 'startdate', 'date_from', 'datefrom'],
  endDate: ['end_date', 'enddate', 'date_to', 'dateto'],
  
  // Skills
  skills: ['skills', 'abilities', 'competencies'],
  
  // Summary
  summary: ['summary', 'profile', 'professional_summary', 'about_me', 'aboutme', 'bio', 'biography'],
  
  // Links
  linkedin: ['linkedin', 'linkedin_url', 'linkedinurl'],
  github: ['github', 'github_url', 'githuburl'],
  website: ['website', 'personal_website', 'web_site', 'portfolio']
};

// Function to find the matching field type based on element attributes
function getFieldType(element) {
  // Check id, name, placeholder, and label text
  const attributes = [
    element.id.toLowerCase(),
    element.name.toLowerCase(),
    element.placeholder?.toLowerCase() || '',
    element.ariaLabel?.toLowerCase() || '',
    element.dataset?.field?.toLowerCase() || '',
    element.closest('label')?.textContent.toLowerCase() || '',
    element.previousElementSibling?.textContent.toLowerCase() || '',
  ];
  
  // Look for matching field type
  for (const [fieldType, patterns] of Object.entries(fieldMappings)) {
    for (const pattern of patterns) {
      if (attributes.some(attr => attr.includes(pattern))) {
        return fieldType;
      }
    }
  }
  
  return null;
}

// Create and position the autofill button
function createAutofillButton(targetElement) {
  // Remove any existing autofill buttons
  removeAutofillButton();
  
  // Create new button
  const button = document.createElement('button');
  button.id = 'profind-autofill-button';
  button.textContent = 'Autofill from ProFind';
  button.style.cssText = `
    position: absolute;
    padding: 6px 12px;
    background-color: #2563eb;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    z-index: 10000;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  `;
  
  // Position the button near the input element
  const rect = targetElement.getBoundingClientRect();
  button.style.top = `${rect.bottom + window.scrollY + 5}px`;
  button.style.left = `${rect.left + window.scrollX}px`;
  
  // Get field type and save it as a data attribute
  const fieldType = getFieldType(targetElement);
  if (fieldType) {
    button.dataset.fieldType = fieldType;
    button.dataset.targetElementId = targetElement.id;
    button.dataset.targetElementName = targetElement.name;
    
    // Add click event listener
    button.addEventListener('click', handleAutofillButtonClick);
    
    // Add to DOM
    document.body.appendChild(button);
  }
}

// Remove autofill button
function removeAutofillButton() {
  const existingButton = document.getElementById('profind-autofill-button');
  if (existingButton) {
    existingButton.remove();
  }
}

// Handle autofill button click
async function handleAutofillButtonClick(event) {
  const button = event.currentTarget;
  const fieldType = button.dataset.fieldType;
  const targetElementId = button.dataset.targetElementId;
  const targetElementName = button.dataset.targetElementName;
  
  // Find target element
  let targetElement = null;
  if (targetElementId) {
    targetElement = document.getElementById(targetElementId);
  } else if (targetElementName) {
    targetElement = document.querySelector(`[name="${targetElementName}"]`);
  }
  
  if (!targetElement || !fieldType) {
    console.error('Target element not found or field type not identified');
    return;
  }
  
  try {
    // Check if user is authenticated
    const authResponse = await chrome.runtime.sendMessage({ action: 'checkAuthentication' });
    
    if (!authResponse.isAuthenticated) {
      alert('Please log in to ProFind first to use autofill functionality.');
      return;
    }
    
    // Fetch resume data
    const resumeDataResponse = await chrome.runtime.sendMessage({ 
      action: 'fetchResumeData', 
      userId: authResponse.userId 
    });
    
    if (!resumeDataResponse.success) {
      alert('Failed to fetch your resume data. Please try again.');
      return;
    }
    
    const resumeData = resumeDataResponse.data;
    
    // Get the value for the field
    const value = resumeData[fieldType] || '';
    
    if (value) {
      // Fill the field
      targetElement.value = value;
      
      // Trigger input event for form validation
      targetElement.dispatchEvent(new Event('input', { bubbles: true }));
      targetElement.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Flash animation to indicate success
      const originalBg = targetElement.style.backgroundColor;
      targetElement.style.backgroundColor = '#e6f4ea';  // Light green
      setTimeout(() => {
        targetElement.style.backgroundColor = originalBg;
      }, 1000);
    } else {
      alert(`No data found for ${fieldType} in your resume.`);
    }
  } catch (error) {
    console.error('Error autofilling field:', error);
    alert('An error occurred while trying to autofill this field.');
  } finally {
    // Remove the button after filling
    removeAutofillButton();
  }
}

// Add event listeners to input and textarea elements
function setupFormFieldListeners() {
  const formFields = document.querySelectorAll('input:not([type="submit"]):not([type="button"]):not([type="hidden"]), textarea');
  
  formFields.forEach(field => {
    field.addEventListener('click', (event) => {
      createAutofillButton(event.currentTarget);
    });
    
    field.addEventListener('focus', (event) => {
      createAutofillButton(event.currentTarget);
    });
  });
  
  // Hide button when clicking elsewhere
  document.addEventListener('click', (event) => {
    if (!event.target.matches('input, textarea') && 
        !event.target.matches('#profind-autofill-button')) {
      removeAutofillButton();
    }
  });
}

// Initialize extension on page load
document.addEventListener('DOMContentLoaded', () => {
  setupFormFieldListeners();
  
  // Also handle dynamically added form fields
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        setupFormFieldListeners();
      }
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});

// Message listener for communication with popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'autofillForm') {
    // Full form autofill functionality
    autofillEntireForm(request.data);
    sendResponse({success: true});
  }
  return true;
});

// Function to autofill the entire form
async function autofillEntireForm(resumeData) {
  if (!resumeData) {
    const authResponse = await chrome.runtime.sendMessage({ action: 'checkAuthentication' });
    
    if (!authResponse.isAuthenticated) {
      alert('Please log in to ProFind first to use autofill functionality.');
      return;
    }
    
    const resumeDataResponse = await chrome.runtime.sendMessage({ 
      action: 'fetchResumeData', 
      userId: authResponse.userId 
    });
    
    if (!resumeDataResponse.success) {
      alert('Failed to fetch your resume data. Please try again.');
      return;
    }
    
    resumeData = resumeDataResponse.data;
  }
  
  // Get all form fields
  const formFields = document.querySelectorAll('input:not([type="submit"]):not([type="button"]):not([type="hidden"]), textarea');
  
  let filledCount = 0;
  
  // Try to fill each field
  formFields.forEach(field => {
    const fieldType = getFieldType(field);
    if (fieldType && resumeData[fieldType]) {
      field.value = resumeData[fieldType];
      
      // Trigger events
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Highlight filled field
      const originalBg = field.style.backgroundColor;
      field.style.backgroundColor = '#e6f4ea';  // Light green
      setTimeout(() => {
        field.style.backgroundColor = originalBg;
      }, 1000);
      
      filledCount++;
    }
  });
  
  // Show result to user
  if (filledCount > 0) {
    // Create a notification element
    const notification = document.createElement('div');
    notification.textContent = `Successfully filled ${filledCount} fields from your ProFind resume!`;
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 16px;
      background-color: #2563eb;
      color: white;
      border-radius: 4px;
      z-index: 10001;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      font-family: Arial, sans-serif;
    `;
    
    // Add to DOM and remove after a few seconds
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }
}

// Add this function to the content script for direct testing
async function testResumeDataAPI() {
  console.log('Testing resume data API directly...');
  
  try {
    // Get auth info
    const auth = await chrome.runtime.sendMessage({ action: 'checkAuthentication' });
    console.log('Auth status:', auth);
    
    if (!auth.isAuthenticated || !auth.userId) {
      console.error('Not authenticated');
      return;
    }
    
    // Try to get resume text directly
    const resumeResponse = await fetch(`http://localhost:8000/api/users/${auth.userId}/resume-text`);
    
    if (!resumeResponse.ok) {
      const errorText = await resumeResponse.text();
      console.error('Resume API error:', resumeResponse.status, errorText);
      return;
    }
    
    const resumeData = await resumeResponse.json();
    console.log('Resume text fetched successfully:', resumeData);
    
    if (!resumeData.resumeText) {
      console.error('No resume text returned from API');
      return;
    }
    
    // Try to parse resume
    const parseResponse = await fetch('http://localhost:8000/api/parse-resume-for-autofill', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ resumeText: resumeData.resumeText })
    });
    
    if (!parseResponse.ok) {
      const errorText = await parseResponse.text();
      console.error('Parse API error:', parseResponse.status, errorText);
      return;
    }
    
    const parseData = await parseResponse.json();
    console.log('Resume parsing successful:', parseData);
    
    // Store the parsed data
    chrome.storage.local.set({
      resumeData: resumeData.resumeText,
      parsedResumeData: parseData.parsedData
    }, () => {
      console.log('Resume data stored directly in extension storage');
      alert('Resume data successfully fetched and stored! Try autofill now.');
    });
  } catch (error) {
    console.error('Error in direct API test:', error);
  }
}

// Expose the test function to the console for debugging
window.testProFindAPI = testResumeDataAPI; 