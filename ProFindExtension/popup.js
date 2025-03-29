// DOM Elements
const loginState = document.getElementById('login-state');
const loggedInState = document.getElementById('logged-in-state');
const resumeDataView = document.getElementById('resume-data-view');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const userEmail = document.getElementById('user-email');
const resumeDataContent = document.getElementById('resume-data-content');

// Buttons
const autofillPageBtn = document.getElementById('autofill-page');
const viewResumeDataBtn = document.getElementById('view-resume-data');
const refreshDataBtn = document.getElementById('refresh-data');
const logoutBtn = document.getElementById('logout');
const backToMainBtn = document.getElementById('back-to-main');
const retryBtn = document.getElementById('retry');

// State variables
let currentUserId = null;
let parsedResumeData = null;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  showLoadingState();
  await checkAuthStatus();
});

// Check authentication status
async function checkAuthStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'checkAuthentication' });
    
    if (response.isAuthenticated && response.userId) {
      currentUserId = response.userId;
      await fetchUserData();
      await fetchResumeData();
      showLoggedInState();
    } else {
      // Try to detect if we're on the ProFind app
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];
      
      if (activeTab && activeTab.url && activeTab.url.includes('localhost:5173')) {
        // We're on the app, show a message to refresh after login
        showLoginState();
        document.getElementById('login-state').innerHTML = `
          <p>It looks like you're on the ProFind app but not logged in or your session wasn't detected.</p>
          <p>Please log in and then click the button below:</p>
          <button id="refresh-auth" class="button primary-button">Refresh Authentication</button>
        `;
        
        document.getElementById('refresh-auth').addEventListener('click', async () => {
          showLoadingState();
          
          // Execute script to check auth status in the current tab
          await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            function: () => {
              // Look for user-specific elements or data in the page
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
                    }
                  } catch (e) {
                    console.error('Error parsing Clerk data:', e);
                  }
                }
                
                // Return the result
                return { isLoggedIn, userId };
              }
              
              return { isLoggedIn: false, userId: null };
            }
          });
          
          // Check auth status again
          await checkAuthStatus();
        });
      } else {
        showLoginState();
      }
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
    showErrorState('Failed to check authentication status.');
  }
}

// Fetch user data
async function fetchUserData() {
  try {
    const response = await fetch(`http://localhost:8000/api/users/${currentUserId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }
    
    const userData = await response.json();
    userEmail.textContent = userData.email || 'Unknown';
  } catch (error) {
    console.error('Error fetching user data:', error);
    // Continue anyway, just show unknown email
    userEmail.textContent = 'Unknown';
  }
}

// Fetch resume data
async function fetchResumeData() {
  try {
    const response = await chrome.runtime.sendMessage({ 
      action: 'fetchResumeData', 
      userId: currentUserId 
    });
    
    // Check if we received data, even if success is false
    if (response.data) {
      parsedResumeData = response.data;
      
      // Show a warning in the main view if using sample data
      if (response.isSampleData) {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'warning-message';
        warningDiv.innerHTML = '⚠️ Using sample resume data. Please upload your resume.';
        document.querySelector('.status-message').after(warningDiv);
      }
      
      // Show a warning if there was an error but we're using cached data
      if (response.fromCache) {
        console.warn('Using cached data due to API error:', response.error);
      }
      
      if (!response.success) {
        console.error('Resume data issue:', response.error, response.errorDetails);
      }
      
      return;
    }
    
    if (!response.success) {
      console.error('Resume data fetch failed:', response.error, response.errorDetails);
      throw new Error(response.error || 'Failed to fetch resume data');
    }
    
    console.log('Resume data fetched successfully:', parsedResumeData);
  } catch (error) {
    console.error('Error fetching resume data:', error);
    parsedResumeData = null;
  }
}

// Show login state UI
function showLoginState() {
  loginState.classList.remove('hidden');
  loggedInState.classList.add('hidden');
  resumeDataView.classList.add('hidden');
  loadingState.classList.add('hidden');
  errorState.classList.add('hidden');
}

// Show logged in state UI
function showLoggedInState() {
  loginState.classList.add('hidden');
  loggedInState.classList.remove('hidden');
  resumeDataView.classList.add('hidden');
  loadingState.classList.add('hidden');
  errorState.classList.add('hidden');
  
  // Check if we're using sample data
  chrome.storage.local.get(['isSampleData'], (result) => {
    if (result.isSampleData) {
      const statusMessage = document.querySelector('.status-message');
      statusMessage.innerHTML = '⚠️ Using sample resume data. <a href="http://localhost:5173/resume-upload" target="_blank" style="color: #2563eb;">Upload your resume</a>.';
    }
  });
}

// Show resume data view UI
function showResumeDataView() {
  loginState.classList.add('hidden');
  loggedInState.classList.add('hidden');
  resumeDataView.classList.remove('hidden');
  loadingState.classList.add('hidden');
  errorState.classList.add('hidden');
  
  resumeDataContent.innerHTML = '';
  
  if (parsedResumeData && Object.keys(parsedResumeData).length > 0) {
    // Check if this is sample data
    if (parsedResumeData.note && parsedResumeData.note.includes("sample data")) {
      resumeDataContent.innerHTML = `
        <div class="sample-data-notice">
          <p style="color: #f59e0b; font-weight: bold; margin-bottom: 10px;">
            ⚠️ This is sample data. Please upload your resume in ProFind.
          </p>
        </div>
      `;
    }
    
    for (const [key, value] of Object.entries(parsedResumeData)) {
      if (!value || key === 'note') continue; // Skip empty values and note field
      
      const row = document.createElement('div');
      row.className = 'data-row';
      
      const label = document.createElement('div');
      label.className = 'data-label';
      label.textContent = formatLabel(key);
      
      const dataValue = document.createElement('div');
      dataValue.className = 'data-value';
      dataValue.textContent = value;
      
      row.appendChild(label);
      row.appendChild(dataValue);
      resumeDataContent.appendChild(row);
    }
    
    // Add a button to test on form
    resumeDataContent.innerHTML += `
      <div style="margin-top: 20px; text-align: center;">
        <a href="http://localhost:5173/resume-upload" target="_blank" class="button secondary-button">
          Upload New Resume
        </a>
      </div>
    `;
  } else {
    resumeDataContent.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <p>No resume data available.</p>
        <p>Please upload a resume to your ProFind account.</p>
        <a href="http://localhost:5173/resume-upload" target="_blank" class="button primary-button">
          Upload Resume
        </a>
        <p style="margin-top: 15px;">Or use sample data for testing:</p>
        <button id="fetch-sample-data" class="button secondary-button">Use Sample Resume Data</button>
      </div>
    `;
    
    // Add event listener for the sample data button
    setTimeout(() => {
      const sampleButton = document.getElementById('fetch-sample-data');
      if (sampleButton) {
        sampleButton.addEventListener('click', () => {
          showLoadingState();
          
          // Sample resume data
          const sampleResumeData = {
            name: "John Doe",
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@example.com",
            phone: "555-123-4567",
            address: "123 Main St, Anytown, CA",
            city: "Anytown",
            state: "CA",
            zip: "12345",
            country: "USA",
            education: "Bachelor of Science in Computer Science",
            degree: "B.S.",
            major: "Computer Science",
            gpa: "3.8",
            experience: "5 years of software development experience",
            company: "TechCorp Inc.",
            jobTitle: "Senior Software Engineer",
            startDate: "January 2018",
            endDate: "Present",
            skills: "JavaScript, Python, React, Node.js, SQL, Git",
            summary: "Experienced software engineer with a focus on web development.",
            linkedin: "linkedin.com/in/johndoe",
            github: "github.com/johndoe",
            website: "johndoe.dev",
            note: "This is sample data. Please upload your resume in ProFind."
          };
          
          // Store in extension storage
          chrome.storage.local.set({
            parsedResumeData: sampleResumeData,
            isSampleData: true,
            lastUpdated: Date.now()
          }, () => {
            parsedResumeData = sampleResumeData;
            showResumeDataView();
          });
        });
      }
    }, 0);
  }
}

// Show loading state UI
function showLoadingState() {
  loginState.classList.add('hidden');
  loggedInState.classList.add('hidden');
  resumeDataView.classList.add('hidden');
  loadingState.classList.remove('hidden');
  errorState.classList.add('hidden');
}

// Show error state UI
function showErrorState(message) {
  loginState.classList.add('hidden');
  loggedInState.classList.add('hidden');
  resumeDataView.classList.add('hidden');
  loadingState.classList.add('hidden');
  errorState.classList.remove('hidden');
  
  errorMessage.textContent = message || 'An error occurred.';
  
  // Add a new button for using test data
  errorState.innerHTML += `
    <button id="use-test-data" class="button secondary-button" style="margin-top: 10px;">
      Use Sample Resume Data
    </button>
  `;
  
  document.getElementById('use-test-data').addEventListener('click', () => {
    showLoadingState();
    
    // Sample resume data that will be used when backend fails
    const sampleResumeData = {
      name: "John Doe",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phone: "555-123-4567",
      address: "123 Main St, Anytown, CA",
      city: "Anytown",
      state: "CA",
      zip: "12345",
      country: "USA",
      education: "Bachelor of Science in Computer Science",
      degree: "B.S.",
      major: "Computer Science",
      gpa: "3.8",
      experience: "5 years of software development experience",
      company: "TechCorp Inc.",
      jobTitle: "Senior Software Engineer",
      startDate: "January 2018",
      endDate: "Present",
      skills: "JavaScript, Python, React, Node.js, SQL, Git",
      summary: "Experienced software engineer with a focus on web development.",
      linkedin: "linkedin.com/in/johndoe",
      github: "github.com/johndoe",
      website: "johndoe.dev"
    };
    
    // Store in extension storage
    chrome.storage.local.set({
      parsedResumeData: sampleResumeData
    }, () => {
      parsedResumeData = sampleResumeData;
      showLoggedInState();
    });
  });
}

// Format label for display
function formatLabel(key) {
  return key
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
    .trim();
}

// Event Listeners
autofillPageBtn.addEventListener('click', async () => {
  // Get the active tab
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const activeTab = tabs[0];
  
  if (activeTab) {
    try {
      // Send message to content script to autofill the form
      await chrome.tabs.sendMessage(activeTab.id, {
        action: 'autofillForm',
        data: parsedResumeData
      });
      
      // Close popup after autofill
      window.close();
    } catch (error) {
      console.error('Error autofilling form:', error);
      showErrorState('Failed to autofill the form. Please try again.');
    }
  }
});

viewResumeDataBtn.addEventListener('click', () => {
  showResumeDataView();
});

refreshDataBtn.addEventListener('click', async () => {
  showLoadingState();
  
  // Clear cached data
  chrome.storage.local.remove(['resumeData', 'parsedResumeData'], async () => {
    await fetchResumeData();
    showLoggedInState();
  });
});

logoutBtn.addEventListener('click', async () => {
  showLoadingState();
  
  try {
    await chrome.runtime.sendMessage({ action: 'logout' });
    currentUserId = null;
    parsedResumeData = null;
    showLoginState();
  } catch (error) {
    console.error('Error logging out:', error);
    showErrorState('Failed to log out. Please try again.');
  }
});

backToMainBtn.addEventListener('click', () => {
  showLoggedInState();
});

retryBtn.addEventListener('click', async () => {
  showLoadingState();
  await checkAuthStatus();
});

// Add a function to test the backend API
async function testBackendAPI() {
  try {
    showLoadingState();
    
    // Try a simple health check endpoint
    const healthCheck = await fetch('http://localhost:8000/api/health-check')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }
        return response.json();
      })
      .catch(error => {
        throw new Error(`Backend server not reachable: ${error.message}`);
      });
    
    console.log('Backend health check:', healthCheck);
    
    // Now test resume API if we have a user ID
    if (currentUserId) {
      // Test resume text API
      const resumeResponse = await fetch(`http://localhost:8000/api/users/${currentUserId}/resume-text`)
        .then(response => {
          if (!response.ok) {
            if (response.status === 404) {
              throw new Error('No resume found for your account. Please upload a resume first.');
            }
            throw new Error(`Resume API error: ${response.status}`);
          }
          return response.json();
        });
      
      console.log('Resume API test:', resumeResponse);
      
      if (!resumeResponse.resumeText) {
        throw new Error('Resume text is empty. Please upload a resume with content.');
      }
      
      // Test parse API
      const parseResponse = await fetch('http://localhost:8000/api/parse-resume-for-autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: resumeResponse.resumeText.substring(0, 500) }) // Just test with a snippet
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Parse API error: ${response.status}`);
          }
          return response.json();
        });
      
      console.log('Parse API test:', parseResponse);
      
      // Show test results
      errorState.classList.remove('hidden');
      loadingState.classList.add('hidden');
      
      errorMessage.innerHTML = `
        <h3>API Test Results</h3>
        <p style="color: #16a34a;">✓ Backend server is online</p>
        <p style="color: #16a34a;">✓ Resume text API is working</p>
        <p style="color: #16a34a;">✓ Resume parser API is working</p>
        <p>Your resume has ${resumeResponse.resumeText.length} characters.</p>
        <p>Please click "Try Again" to fetch your data, or "Use Sample Data" for testing.</p>
      `;
    } else {
      errorMessage.innerHTML = `
        <h3>API Test Results</h3>
        <p style="color: #16a34a;">✓ Backend server is online</p>
        <p style="color: #dc2626;">✗ Cannot test resume API - no user ID</p>
        <p>Please log in to ProFind app first.</p>
      `;
    }
  } catch (error) {
    console.error('API test failed:', error);
    errorState.classList.remove('hidden');
    loadingState.classList.add('hidden');
    
    errorMessage.innerHTML = `
      <h3>API Test Failed</h3>
      <p style="color: #dc2626;">✗ Error: ${error.message}</p>
      <p>Please make sure the backend server is running at http://localhost:8000</p>
      <p>You can use sample data for testing until the server is available.</p>
    `;
  }
}

// Add event listener for the test API button
document.getElementById('test-api').addEventListener('click', testBackendAPI);

// Add event listener for the sample data button
document.getElementById('use-sample-data').addEventListener('click', () => {
  showLoadingState();
  
  // Sample resume data
  const sampleResumeData = {
    name: "John Doe",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "555-123-4567",
    address: "123 Main St, Anytown, CA",
    city: "Anytown",
    state: "CA",
    zip: "12345",
    country: "USA",
    education: "Bachelor of Science in Computer Science",
    degree: "B.S.",
    major: "Computer Science",
    gpa: "3.8",
    experience: "5 years of software development experience",
    company: "TechCorp Inc.",
    jobTitle: "Senior Software Engineer",
    startDate: "January 2018",
    endDate: "Present",
    skills: "JavaScript, Python, React, Node.js, SQL, Git",
    summary: "Experienced software engineer with a focus on web development.",
    linkedin: "linkedin.com/in/johndoe",
    github: "github.com/johndoe",
    website: "johndoe.dev"
  };
  
  // Store in extension storage
  chrome.storage.local.set({
    parsedResumeData: sampleResumeData
  }, () => {
    parsedResumeData = sampleResumeData;
    showLoggedInState();
  });
}); 