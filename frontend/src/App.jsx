import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  SignIn,
  ClerkProvider,
  useUser,
} from "@clerk/clerk-react";
import HomePage from "./pages/HomePage";
import JobDetailsPage from "./pages/JobDetailsPage";
import ResumeParserPage from "./pages/ResumeParserPage";
import ResumeCreater from "./pages/ResumeCreater";
import PreferencesPage from "./pages/PreferencesPage";
import ResumeUploadPage from "./pages/ResumeUploadPage";
import NotFoundPage from "./pages/NotFoundPage";
import Layout from "./components/layout/Layout";
import SavedJobsPage from "./pages/SavedJobsPage";
import SearchPage from "./pages/SearchPage";
import LandingPage from "./pages/LandingPage";
import RecommendationsPage from "./pages/RecommendationsPage";
import { ProStatusProvider } from './contexts/ProStatusContext';
import LikedJobsPage from "./pages/LikedJobsPage";
import { FiltersProvider } from "./contexts/FiltersContext";

const API_URL_BACKEND = import.meta.env.VITE_API_URL_BACKEND

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <Navigate to="/error" replace />;
    }

    return this.props.children;
  }
}

// Auth wrapper component to handle preferences check
function AuthenticatedRoute({ children }) {
  const { user, isSignedIn, isLoaded } = useUser();
  const navigate = useNavigate();
  const [preferencesChecked, setPreferencesChecked] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Only proceed if Clerk has loaded the user
    if (!isLoaded) return;

    // If user is signed in, check if they have preferences
    if (isSignedIn && user?.id) {
      checkUserPreferences();
    }
  }, [isSignedIn, isLoaded, user]);

  const checkUserPreferences = async () => {
    try {
      const response = await fetch(
        `${API_URL_BACKEND}/users/${user.id}/preferences`
      );

      if (response.ok) {
        const data = await response.json();
        // If user doesn't have preferences, redirect them to preferences page
        if (!data.preferences) {
          navigate("/preferences");
        }
      } else if (response.status === 404) {
        // User not found or no preferences, redirect to preferences page
        navigate("/preferences");
      } else {
        // Other API errors
        setError(true);
      }
    } catch (error) {
      console.error("Error checking preferences:", error);
      setError(true);
    } finally {
      setPreferencesChecked(true);
    }
  };

  // Show loading state while checking preferences
  if (isSignedIn && !preferencesChecked && !error) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <div className="spinner"></div>
      </div>
    );
  }

  // // Show error page if there was a problem
  // if (error) {
  //   return <Navigate to="/error" replace />;
  // }

  return children;
}

// Route tracker for analytics and error monitoring
function RouteTracker() {
  const location = useLocation();
  
  useEffect(() => {
    // Log route changes for analytics or monitoring
    console.log("Route changed:", location.pathname);
    
    // Reset any global error state if needed
    // You could add error state management here
    
    // Track page view (you can implement this with your analytics tool)
    // trackPageView(location.pathname);
    
  }, [location]);
  
  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <ProStatusProvider>
        <FiltersProvider>
          <RouteTracker />
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <SignedOut>
                    <LandingPage />
                  </SignedOut>
                  <SignedIn>
                    <Navigate to="/home" replace />
                  </SignedIn>
                </>
              }
            />
      
            <Route
              path="/preferences"
              element={
                <SignedIn>
                  <PreferencesPage />
                </SignedIn>
              }
            />
      
            <Route
              path="/resume-upload"
              element={
                <SignedIn>
                  <ResumeUploadPage />
                </SignedIn>
              }
            />
      
            <Route
              element={
                <>
                  <SignedIn>
                    <AuthenticatedRoute>
                      <Layout />
                    </AuthenticatedRoute>
                  </SignedIn>
                  <SignedOut>
                    <Navigate to="/" replace />
                  </SignedOut>
                </>
              }
            >
              <Route path="/home" element={<HomePage />} />
              <Route path="/job/:id" element={<JobDetailsPage />} />
              <Route path="/resume-parser" element={<ResumeParserPage />} />
              <Route path="/create-resume" element={<ResumeCreater />} />
              <Route path="/saved" element={<SavedJobsPage />} />
              <Route path="/liked" element={<LikedJobsPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/recommendations" element={<RecommendationsPage />} />
            </Route>
      
            <Route
              path="/sign-in"
              element={
                <SignedOut>
                  <SignIn />
                </SignedOut>
              }
            />
      
            {/* Dedicated error routes */}
            {/* <Route path="/error" element={<NotFoundPage />} /> */}
      
            {/* Catch-all route for both signed-in and signed-out users */}
            {/* <Route
              path="*"
              element={
                <>
                  <SignedIn>
                    <NotFoundPage />
                  </SignedIn>
                  <SignedOut>
                    <NotFoundPage />
                  </SignedOut>
                </>
              }
            /> */}
          </Routes>
        </FiltersProvider>
      </ProStatusProvider>
    </ErrorBoundary>
  );
}

export default App;