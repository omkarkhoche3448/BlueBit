import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { setSearchTerm } from "../slices/filterSlice";
import JobList from "../components/common/JobList";
import RecommendedJobs from "../components/common/RecommendedJobs";
import { useUser } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import MobileNavigation from "../components/common/MobileNavigation";
import { Search } from "lucide-react";

function HomePage() {
  const [searchInput, setSearchInput] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const dispatch = useDispatch();
  const { user } = useUser();
  const greetings = [
    "Good morning",
    "Good afternoon",
    "Good evening",
    "Hello",
    "Hi there",
    "Welcome back",
    "Nice to see you",
    "Greetings",
    "Hey",
    "How's it going"
  ];
  
  // Randomly select a greeting
  const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];

  useEffect(() => {
    // Check if the device is mobile
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(setSearchTerm(searchInput));
    const trimmedInput = searchInput.trim();
    const searchUrl = trimmedInput
      ? `/search?q=${encodeURIComponent(trimmedInput)}`
      : "/search";
    window.location.href = searchUrl;
  };

  // Mobile view
  if (isMobile) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-white flex flex-col"
      >
        {/* Top Search Bar */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="sticky top-0 z-10 py-3"
        >
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              className="block w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-full bg-gray-50 placeholder-gray-500 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="Search jobs, skills, companies..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </form>
        </motion.div>
        
        {/* Main Content */}
        <div className="flex-grow px-1 md:py-5">
          <motion.div 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mb-6"
          >
            <h1 className="text-2xl font-bold text-black">
              {randomGreeting}, <span className="text-black">{user?.fullName || "User"}</span>
            </h1>
            <p className="text-gray-600 mt-1 text-base">
              Discover opportunities tailored for you
            </p>
          </motion.div>
          
          {/* Job Content */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mb-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Recommended for you</h2>
            <RecommendedJobs />
          </motion.div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent job listings</h2>
            <JobList />
          </motion.div>
        </div>
        
        {/* Bottom Navigation */}
        <MobileNavigation />
      </motion.div>
    );
  }

  // Desktop view (original layout)
  return (
    <div className="space-y-6 max-w-[600px]">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Welcome, {user?.fullName || "User"}!
        </h1>
        <p className="text-gray-600 mb-4">
          Find your next opportunity with these tools:
        </p>
        <div className="grid grid-cols-2 gap-3 md:flex md:flex-wrap md:gap-3">
          <button className="px-4 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors flex items-center justify-center cursor-pointer">
            Jobs Search
          </button>
          <button className="px-4 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors flex items-center justify-center cursor-pointer">
            Resume Analyzer
          </button>
          <button className="px-4 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors flex items-center justify-center cursor-pointer">
            Create Resume
          </button>
          <button className="px-4 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors flex items-center justify-center cursor-pointer">
            Edit Preferences
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-3 md:flex-row md:items-center"
        >
          <div className="relative flex-1">
            <input
              type="text"
              className="block w-full pl-4 pr-20 py-2.5 text-sm border border-gray-300 rounded-full bg-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-gray-300 focus:border-transparent transition-all"
              placeholder="Search job title, company, or keywords..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button
              type="submit"
              className="absolute inset-y-0 right-0 flex items-center justify-center cursor-pointer rounded-full 
              px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors outline-none m-[2px]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </div>
        </form>
      </div>

      {/* Recommended Jobs */}
      <RecommendedJobs />

      {/* Job Listings */}
      <JobList />
    </div>
  );
}

export default HomePage;
