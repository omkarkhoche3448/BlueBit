import React from 'react';
import { useUser } from "@clerk/clerk-react";

export default function ExtensionConnector() {
  const { user, isSignedIn } = useUser();
  
  if (!isSignedIn) return null;
  
  const connectToExtension = () => {
    try {
      if (window.chrome && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage('llmlegnoggpclfcgphbjjacdohmcdehf', {
          action: 'setAuthentication',
          userId: user.id,
          isAuthenticated: true
        }, response => {
          if (response) {
            alert('Successfully connected to the ProFind extension!');
          } else {
            alert('Could not connect to the extension. Please make sure it is installed.');
          }
        });
      } else {
        alert('Chrome extension API not available. Please make sure you are using Chrome and have installed the ProFind extension.');
      }
    } catch (e) {
      alert('Error connecting to extension: ' + e.message);
    }
  };
  
  return (
    <button 
      onClick={connectToExtension}
      className="text-sm text-blue-600 hover:text-blue-800"
    >
      Connect to Chrome Extension
    </button>
  );
} 