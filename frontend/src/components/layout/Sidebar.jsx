import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Bookmark,
  User,
  Heart,
  Briefcase,
  Settings,
  HelpCircle,
  ClipboardIcon,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { useClerk } from "@clerk/clerk-react";
import { useProStatusContext } from "../../contexts/ProStatusContext";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import SettingsModal from "../common/SettingsModal";
import { fetchSavedJobs, fetchLikedJobs } from "../../slices/jobsSlice";


function Sidebar() {
  const { user } = useUser();
  const dispatch = useDispatch();
  const savedJobs = useSelector((state) => state.jobs.savedJobs || []);
  const savedJobsStatus = useSelector((state) => state.jobs.savedJobsStatus);
  const likedJobs = useSelector((state) => state.jobs.likedJobs || []);
  const { openUserProfile, signOut } = useClerk();
  const { isPro } = useProStatusContext();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      console.log(`Fetching saved and liked jobs for user ${user.id} in Sidebar`);
      
      // Fetch saved jobs
      dispatch(fetchSavedJobs(user.id))
        .unwrap()
        .then(jobs => {
          console.log(`Successfully fetched ${jobs.length} saved jobs in Sidebar`);
        })
        .catch(error => {
          console.error("Error fetching saved jobs in Sidebar:", error);
        });
      
      // Fetch liked jobs
      dispatch(fetchLikedJobs(user.id))
        .unwrap()
        .then(jobs => {
          console.log(`Successfully fetched ${jobs?.length || 0} liked jobs in Sidebar`);
        })
        .catch(error => {
          console.error("Error fetching liked jobs in Sidebar:", error);
        });
    }
  }, [dispatch, user?.id]);

  // Calculate counts safely
  const savedJobsCount = Array.isArray(savedJobs) ? savedJobs.length : 0;
  const likedJobsCount = Array.isArray(likedJobs) ? likedJobs.length : 0;
  const isLoadingSavedJobs = savedJobsStatus === "loading";

  const copyClerkId = () => {
    navigator.clipboard.writeText(user?.id || "");
    toast.success("Clerk ID copied to clipboard!");
  };

  return (
    <>
      <div className="bg-white rounded-xl overflow-hidden sticky top-20 transition-all duration-300 border border-gray-100">
        {/* User Profile Section */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-4">
            {/* Profile image */}
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt="Profile"
                className="h-14 w-14 rounded-full object-cover border-2 border-white transition-transform duration-300 hover:scale-105 flex-shrink-0"
              />
            ) : (
              <div className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center border-2 border-white flex-shrink-0">
                <User className="h-7 w-7 text-white" />
              </div>
            )}

            {/* User info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base text-gray-800 truncate">
                {user?.fullName || user?.username || "User"}
              </h3>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {user?.primaryEmailAddress?.emailAddress || ""}
              </p>
              <div className="flex items-center mt-1">
                <p className="text-[10px] text-gray-500 truncate">{user?.id}</p>
                <button
                  onClick={copyClerkId}
                  className="ml-1 p-1 text-gray-400 hover:text-blue-600 transition-colors rounded-full hover:bg-gray-100"
                  title="Copy Clerk ID"
                >
                  <ClipboardIcon className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 divide-x divide-gray-200 border-b border-gray-200">
          {/* Saved Jobs */}
          <Link 
            to="/saved"
            className="p-4 hover:bg-gray-50 transition-colors group"
          >
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center mb-1 text-blue-600 bg-blue-50 p-2 rounded-full group-hover:bg-blue-100 transition-colors">
                <Bookmark className="h-5 w-5" />
              </div>
              <span className="text-xl font-semibold text-gray-800 mt-1">
                {isLoadingSavedJobs ? "..." : savedJobsCount}
              </span>
              <span className="mt-1 text-xs text-blue-600 group-hover:text-blue-800 group-hover:underline">
                Saved Jobs
              </span>
            </div>
          </Link>

          {/* Liked Jobs */}
          <Link 
            to="/liked"
            className="p-4 hover:bg-gray-50 transition-colors group"
          >
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center mb-1 text-rose-500 bg-rose-50 p-2 rounded-full group-hover:bg-rose-100 transition-colors">
                <Heart className="h-5 w-5" />
              </div>
              <span className="text-xl font-semibold text-gray-800 mt-1">
                {likedJobsCount}
              </span>
              <span className="mt-1 text-xs text-blue-600 group-hover:text-blue-800 group-hover:underline">
                Liked Jobs
              </span>
            </div>
          </Link>
        </div>

        {/* Membership Section */}
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-gray-700 mb-3 font-medium text-sm uppercase tracking-wide">Membership</h3>
          <Link
            to="/"
            className={`flex items-center justify-between text-sm py-4 px-4 rounded-lg transition-all duration-300 ${
              isPro
                ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border border-green-100"
                : "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 border border-blue-100"
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-4 h-4 rounded-lg bg-gradient-to-r from-gray-50 to-blue-50">
                <Briefcase
                  className={`h-4 w-4 ${
                    isPro ? "text-emerald-600" : "text-blue-600"
                  }`}
                />
              </div>
              <span className={`font-medium text-[12px] tracking-wide ${
                isPro ? "text-emerald-700" : "text-gray-700"
              }`}>
                {isPro ? "Pro Membership" : "Upgrade to Premium"}
              </span>
            </div>
            {!isPro ? (
              <div className="flex items-center">
                <span className="font-semibold text-indigo-600 mr-1">₹100</span>
                <ChevronRight className="h-4 w-4 text-indigo-400" />
              </div>
            ) : (
              <span className="text-xs px-2 py-1 bg-green-200 text-green-800 rounded-full font-medium">
                Active
              </span>
            )}
          </Link>
        </div>

        {/* Settings & Help Section */}
        <div className="p-5">
          <h3 className="text-gray-700 mb-3 font-medium text-sm uppercase tracking-wide">Account</h3>
          <div className="flex flex-col space-y-1">
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="text-sm text-gray-700 hover:text-blue-700 flex items-center p-3 hover:bg-gray-50 rounded-md transition-colors cursor-pointer"
            >
              <Settings className="h-4 w-4 mr-3 text-gray-500" />
              Settings
            </button>

            <button
              onClick={() => signOut()}
              className="text-sm text-gray-700 hover:text-red-600 flex items-center p-3 hover:bg-red-50 rounded-md transition-colors cursor-pointer mt-2"
            >
              <LogOut className="h-4 w-4 mr-3 text-gray-500" />
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
