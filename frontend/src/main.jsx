import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./reducer";
import React from "react";
import { Toaster } from 'react-hot-toast';

const store = configureStore({
  reducer: rootReducer,
});

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

// Component to handle saving Clerk ID to Chrome storage
function ClerkStorageHandler({ children }) {
  const { userId, isLoaded, isSignedIn } = useAuth();
  
  // Save Clerk ID to Chrome storage when available
  React.useEffect(() => {
    if (isLoaded && isSignedIn && userId) {
      console.log("Saving Clerk ID to storage:", userId);
      
      // Save to localStorage for non-extension contexts
      localStorage.setItem('clerkUserId', userId);
      
      // Save to Chrome storage if extension API is available
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ clerkUserId: userId }, function() {
          console.log("Clerk ID saved to Chrome storage");
        });
      }
    }
  }, [isLoaded, isSignedIn, userId]);
  
  return children;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
          <ClerkStorageHandler>
            <App />
            <Toaster /> 
          </ClerkStorageHandler>
        </ClerkProvider>
      </BrowserRouter>
    </Provider>
  </StrictMode>
);
