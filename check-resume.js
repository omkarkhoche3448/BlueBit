async function checkUserResume() {
  try {
    // Get the current user ID from the extension
    const auth = await chrome.runtime.sendMessage({ action: 'checkAuthentication' });
    console.log('Auth status:', auth);
    
    if (!auth.isAuthenticated || !auth.userId) {
      console.error('Not authenticated');
      return;
    }
    
    // Check if user has a resume
    const checkUrl = `http://localhost:8000/api/users/${auth.userId}/check-resume`;
    console.log('Checking resume at:', checkUrl);
    
    const response = await fetch(checkUrl);
    const data = await response.json();
    console.log('Resume check result:', data);
    
    if (data.exists) {
      console.log('✅ User has a resume of length:', data.resumeLength);
    } else {
      console.error('❌ No resume found for user. Please upload a resume first!');
      
      // Give advice on how to fix
      console.log('To fix this issue:');
      console.log('1. Go to http://localhost:5173/resume-upload');
      console.log('2. Upload your resume file');
      console.log('3. Return to the extension and click "Refresh Data"');
    }
    
    return data;
  } catch (error) {
    console.error('Error checking resume:', error);
  }
}

// Run the check
checkUserResume(); 