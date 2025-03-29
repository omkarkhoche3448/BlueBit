import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Bookmark,
  User,
  Heart,
  Briefcase,
  Settings,
  HelpCircle,
} from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { useClerk } from "@clerk/clerk-react";
import { useProStatusContext } from "../../contexts/ProStatusContext";
import { useState, useEffect } from "react";

const API_URL_BACKEND = import.meta.env.VITE_API_URL_BACKEND;

function Sidebar() {
  const { user } = useUser();
  const savedJobs = useSelector((state) => state.jobs.savedJobs);
  const { openUserProfile } = useClerk();
  const { isPro } = useProStatusContext();
  const [likedJobsCount, setLikedJobsCount] = useState(0);
  
  const fetchLikedJobsCount = async () => {
    const clerkId = user?.id || null;
    if (!clerkId) return;

    try {
      const response = await fetch(`${API_URL_BACKEND}/users/${clerkId}/interested-jobs`);
      if (!response.ok) {
        throw new Error("Failed to fetch liked jobs");
      }
      const data = await response.json();
      setLikedJobsCount(data.jobs?.length || 0);
    } catch (error) {
      console.error("Error fetching liked jobs count:", error);
      setLikedJobsCount(0);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLikedJobsCount();
    }
  }, [user]);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden sticky top-20">
      {/* User Profile Section */}
      <div className="p-4 border-b border-gray-200">
        {/* Profile image */}
        <div className="flex flex-col items-center">
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt="Profile"
              className="h-14 w-14 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
              <User className="h-8 w-8 text-gray-600" />
            </div>
          )}

          {/* User info */}
          <div className="text-center mt-3">
            <h3 className="font-medium text-lg">
              {user?.fullName || user?.username || "User"}
            </h3>
            <button
              onClick={() => {
                navigator.clipboard.writeText(user?.id || '');
                alert('Clerk ID copied to clipboard!');
              }}
              className="mt-3 inline-flex items-center justify-center px-2 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
            >
              Copy ID
            </button>
            <p className="text-sm text-gray-500 mt-1">
              {user?.primaryEmailAddress?.emailAddress || ""}
            </p>

            <button
              onClick={() => openUserProfile()}
              className="mt-3 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors w-full"
            >
              View Profile
            </button>
          </div>
        </div>
      </div>

      {/* Saved Jobs Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-medium flex items-center">
            <Bookmark className="h-4 w-4 mr-2 text-gray-700" />
            Saved Jobs
          </h3>
          <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-md">
            {savedJobs.length}
          </span>
        </div>
        <Link
          to="/saved"
          className="mt-1 block text-sm text-blue-600 hover:text-blue-800"
        >
          View all saved jobs
        </Link>
      </div>

      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-medium flex items-center">
            <Heart className="h-4 w-4 mr-2 text-gray-700" />
            Liked Jobs
          </h3>
          <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-md">
            {likedJobsCount}
          </span>
        </div>
        <Link
          to="/liked"
          className="mt-1 block text-sm text-blue-600 hover:text-blue-800"
        >
          View all liked jobs
        </Link>
      </div>

      <div className="p-4 border-b border-gray-200">
        <h3 className="text-gray-700 mb-2 font-medium">Membership</h3>
        <Link
          to="/premium-access"
          className={`flex items-center text-sm py-2 px-3 rounded ${
            isPro 
              ? "bg-green-50 text-green-800 hover:bg-green-100" 
              : "bg-blue-50 text-blue-800 hover:bg-blue-100"
          }`}
        >
          <Briefcase className={`h-4 w-4 mr-2 ${isPro ? "text-green-700" : "text-blue-700"}`} />
          <span className="text-xs">{isPro ? "Pro Membership Active" : "Upgrade to Premium for ₹100"}</span>
        </Link>
      </div>

      {/* Settings & Help Section */}
      <div className="p-3">
        <div className="flex flex-col space-y-3">
          <button
            onClick={() => openUserProfile()}
            className="text-sm text-gray-600 hover:text-blue-800 flex items-center p-2 hover:bg-gray-50 rounded"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </button>
          <Link
            to="/help"
            className="text-sm text-gray-600 hover:text-blue-800 flex items-center p-2 hover:bg-gray-50 rounded"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Help Center
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;