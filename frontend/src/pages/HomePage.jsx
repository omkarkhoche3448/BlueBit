import { useState } from "react";
import { useDispatch } from "react-redux";
import { setSearchTerm } from "../slices/filterSlice";
import JobList from "../components/common/JobList";
import RecommendedJobs from "../components/common/RecommendedJobs";
import { useUser } from "@clerk/clerk-react";

function HomePage() {
  const [searchInput, setSearchInput] = useState("");
  const dispatch = useDispatch();
  const { user } = useUser();

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(setSearchTerm(searchInput));
    const trimmedInput = searchInput.trim();
    const searchUrl = trimmedInput
      ? `/search?q=${encodeURIComponent(trimmedInput)}`
      : "/search";
    window.location.href = searchUrl;
  };

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
