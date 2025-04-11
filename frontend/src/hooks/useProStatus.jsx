import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { toast } from 'react-toastify';

const API_URL_BACKEND = import.meta.env.VITE_API_URL_BACKEND;

const useProStatus = () => {
  const { user, isSignedIn } = useUser();
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(0);
  const [expiryDate, setExpiryDate] = useState(null);
  
  // Cache duration in milliseconds (10 minutes)
  const CACHE_DURATION = 10 * 60 * 1000;

  const checkProStatus = async (forceRefresh = false) => {
    if (!isSignedIn || !user) {
      setIsPro(false);
      setIsLoading(false);
      return;
    }

    // Check if we need to refresh the pro status
    const currentTime = Date.now();
    if (!forceRefresh && currentTime - lastChecked < CACHE_DURATION && lastChecked !== 0) {
      // Use cached value if within cache duration
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      // Replace with your actual API endpoint to check pro status
      const response = await fetch(`${API_URL_BACKEND}/users/${user.id}/pro-status`);
      if (response.ok) {
        const data = await response.json();
        setIsPro(data.isPro || false);
        setExpiryDate(data.expiryDate || null);
      } else {
        setIsPro(false);
      }
      // Update the last checked timestamp
      setLastChecked(currentTime);
    } catch (error) {
      console.error("Error checking pro status:", error);
      setIsPro(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to manually refresh pro status
  const refreshProStatus = async () => {
    return await checkProStatus(true);
  };

  useEffect(() => {
    checkProStatus();
  }, [user, isSignedIn]); // Removed lastChecked and isLoading from dependencies

  // Higher-order component to protect premium features
  const withProCheck = (Component) => (props) => {
    if (isLoading) {
      return <div className="text-sm text-gray-500">Loading...</div>;
    }

    if (!isPro) {
      return (
        <div className="text-sm text-gray-500 p-2 bg-gray-50 rounded border border-gray-200">
          <p>This feature is available only for Pro users.</p>
          <a href="/pricing" className="text-blue-600 hover:underline">Upgrade to Pro</a>
        </div>
      );
    }

    return <Component {...props} />;
  };

  // Function to use directly in components for conditional rendering
  const requirePro = (callback) => {
    return (...args) => {
      if (!isPro) {
        // Show upgrade modal or notification
        toast.error("This feature is only available for Pro users. Please upgrade to Pro!"); 
        return;
      }
      return callback(...args);
    };
  };

  return { isPro, isLoading, withProCheck, requirePro, refreshProStatus, expiryDate };
};

export default useProStatus;