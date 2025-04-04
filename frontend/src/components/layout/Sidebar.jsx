import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Bookmark,
  User,
  Heart,
  Briefcase,
  Settings,
  HelpCircle,
  ClipboardIcon,
  LogOut,
} from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { useClerk } from "@clerk/clerk-react";
import { useProStatusContext } from "../../contexts/ProStatusContext";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import SettingsModal from "../common/SettingsModal";

const API_URL_BACKEND = import.meta.env.VITE_API_URL_BACKEND;

function Sidebar() {
  const { user } = useUser();
  const savedJobs = useSelector((state) => state.jobs.savedJobs);
  const { openUserProfile, signOut } = useClerk();
  const { isPro } = useProStatusContext();
  const [likedJobsCount, setLikedJobsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const fetchLikedJobsCount = async () => {
    const clerkId = user?.id || null;
    if (!clerkId) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_URL_BACKEND}/users/${clerkId}/interested-jobs`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch liked jobs");
      }
      const data = await response.json();
      setLikedJobsCount(data.jobs?.length || 0);
    } catch (error) {
      console.error("Error fetching liked jobs count:", error);
      setLikedJobsCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLikedJobsCount();
    }
  }, [user]);

  const copyClerkId = () => {
    navigator.clipboard.writeText(user?.id || "");
    toast.success("Clerk ID copied to clipboard!");
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-20 transition-all duration-300 hover:shadow-lg">
        {/* User Profile Section */}
        <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          {/* Profile image */}
          <div className="flex flex-col items-center">
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt="Profile"
                className="h-16 w-16 rounded-full object-cover border-2 border-white shadow-sm transition-transform duration-300 hover:scale-105"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center border-2 border-white shadow-sm">
                <User className="h-8 w-8 text-white" />
              </div>
            )}

            {/* User info */}
            <div className="text-center mt-2 w-full -space-y-1">
              <div className="flex items-center justify-center space-x-1">
                <h3 className="font-semibold text-base text-gray-800">
                  {user?.fullName || user?.username || "User"}
                </h3>
              </div>
              <div className="flex flex-row items-center justify-center">
                <p className="text-[10px] ml-4 text-gray-800">{user?.id}</p>
                <button
                  onClick={copyClerkId}
                  className=" p-1 text-gray-500 hover:text-blue-600 transition-colors rounded-full hover:bg-gray-100 cursor-pointer"
                  title="Copy Clerk ID"
                >
                  <ClipboardIcon className="h-4 w-4" />
                </button>
              </div>
              <p className="text-[12px] text-gray-500 truncate max-w-full">
                {user?.primaryEmailAddress?.emailAddress || ""}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 divide-x divide-gray-200 border-b border-gray-200">
          {/* Saved Jobs */}
          <div className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center mb-1 text-blue-600">
                <Bookmark className="h-5 w-5" />
              </div>
              <span className="text-xl font-semibold text-gray-800">
                {savedJobs.length}
              </span>
              <Link
                to="/saved"
                className="mt-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
              >
                Saved Jobs
              </Link>
            </div>
          </div>

          {/* Liked Jobs */}
          <div className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center mb-1 text-rose-500">
                <Heart className="h-5 w-5" />
              </div>
              {isLoading ? (
                <div className="h-6 w-6 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin"></div>
              ) : (
                <span className="text-xl font-semibold text-gray-800">
                  {likedJobsCount}
                </span>
              )}
              <Link
                to="/liked"
                className="mt-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
              >
                Liked Jobs
              </Link>
            </div>
          </div>
        </div>

        {/* Membership Section */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-gray-700 mb-3 font-medium">Membership</h3>
          <Link
            to="/"
            className={`flex items-center justify-between text-sm py-3 px-4 rounded-lg shadow-sm transition-all duration-300 hover:shadow ${
              isPro
                ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 "
                : "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800"
            }`}
          >
            <div className="flex items-center">
              <Briefcase
                className={`h-5 w-5 mr-2 ${
                  isPro ? "text-green-600" : "text-blue-600"
                }`}
              />
              <span>{isPro ? "Pro Membership" : "Upgrade to Premium"}</span>
            </div>
            {!isPro && (
              <span className="font-semibold text-indigo-600">₹100</span>
            )}
            {isPro && (
              <span className="text-xs px-2 py-1 bg-green-200 text-green-800 rounded-full">
                Active
              </span>
            )}
          </Link>
        </div>

        {/* Settings & Help Section */}
        <div className="p-4">
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="text-sm text-gray-700 hover:text-blue-700 flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors cursor-pointer"
            >
              <Settings className="h-4 w-4 mr-3" />
              Settings
            </button>

            <button
              onClick={() => signOut()}
              className="text-sm text-gray-700 hover:text-red-600 flex items-center p-2 rounded-md transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </>
  );
}

export default Sidebar;
