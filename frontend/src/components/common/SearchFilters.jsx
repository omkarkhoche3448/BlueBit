import { useState, useCallback } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useFilters } from "../../contexts/FiltersContext";
import { useDispatch, useSelector } from "react-redux";
import { fetchJobs, setPage } from "../../slices/jobsSlice";

// Export the clear filters function separately
export const handleClearFilters = (dispatch, pagination, clearFilters) => {
  clearFilters();
  dispatch(setPage(1));
  dispatch(fetchJobs({
    filters: {},
    page: 1,
    per_page: pagination.per_page
  }));
};

function SearchFilters() {
  const dispatch = useDispatch();
  const { pagination } = useSelector((state) => state.jobs);
  
  // Use the global filters context
  const { 
    selectedFilters, 
    handleFilterChange, 
    clearFilters, 
    appliedFiltersCount 
  } = useFilters();

  // State for expand/collapse sections
  const [expandedSections, setExpandedSections] = useState({
    jobType: true,
    location: false,
    company: false,
  });

  // State for "show more" toggles
  const [showAllLocations, setShowAllLocations] = useState(false);
  const [showAllCompanies, setShowAllCompanies] = useState(false);

  // Static filter options
  const staticFilters = {
    jobType: [
      { id: "fulltime", label: "Full Time" },
      { id: "parttime", label: "Part Time" },
      { id: "contract", label: "Contract" },
      { id: "internship", label: "Internship" },
    ],
    location: [
      { id: "new-york", label: "New York" },
      { id: "san-francisco", label: "San Francisco" },
      { id: "los-angeles", label: "Los Angeles" },
      { id: "chicago", label: "Chicago" },
      { id: "seattle", label: "Seattle" },
      { id: "austin", label: "Austin" },
      { id: "boston", label: "Boston" },
      { id: "denver", label: "Denver" },
    ],
    company: [
      { id: "google", label: "Google" },
      { id: "microsoft", label: "Microsoft" },
      { id: "amazon", label: "Amazon" },
      { id: "apple", label: "Apple" },
      { id: "meta", label: "Meta" },
      { id: "netflix", label: "Netflix" },
      { id: "uber", label: "Uber" },
      { id: "airbnb", label: "Airbnb" },
    ],
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };
  
  // Function to handle filter application and trigger job search
  const applyFilters = useCallback(() => {
    const debounceTimer = setTimeout(() => {
      dispatch(setPage(1));
      dispatch(fetchJobs({
        filters: selectedFilters,
        page: 1,
        per_page: pagination.per_page
      }));
    }, 900);

    return () => clearTimeout(debounceTimer);
  }, [dispatch, selectedFilters, pagination.per_page]);
  
  // Clear filters and reset jobs search - use the exported function
  const handleClearFiltersLocal = () => {
    handleClearFilters(dispatch, pagination, clearFilters);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden sticky top-20">
      <div className="p-4 border-b border-gray-300 flex justify-between items-center">
        <h2 className="font-medium text-lg">All Filters</h2>
        <span className="text-blue-600 text-sm">
          {appliedFiltersCount > 0 && `Applied (${appliedFiltersCount})`}
        </span>
      </div>

      {/* Job Type Filter */}
      <div className="border-b border-gray-300">
        <button
          className="w-full p-4 flex justify-between items-center text-left"
          onClick={() => toggleSection("jobType")}
        >
          <h3 className="font-medium">Job Type</h3>
          {expandedSections.jobType ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>

        {expandedSections.jobType && (
          <div className="px-4 pb-4 space-y-2">
            {staticFilters.jobType.map((jobType) => (
              <div key={jobType.id} className="flex items-center">
                <input
                  id={jobType.id}
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={selectedFilters.jobType.includes(jobType.id)}
                  onChange={() => handleFilterChange("jobType", jobType.id)}
                />
                <label
                  htmlFor={jobType.id}
                  className="ml-2 block text-sm text-gray-700"
                >
                  {jobType.label}
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Location Filter */}
      <div className="border-b border-gray-300">
        <button
          className="w-full p-4 flex justify-between items-center text-left"
          onClick={() => toggleSection("location")}
        >
          <h3 className="font-medium">Location</h3>
          {expandedSections.location ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>
        {expandedSections.location && (
          <div className="px-4 pb-4 space-y-2 max-h-48 overflow-y-auto">
            {staticFilters.location
              .slice(0, showAllLocations ? undefined : 5)
              .map((location) => (
                <div key={location.id} className="flex items-center">
                  <input
                    id={`location-${location.id}`}
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={selectedFilters.location.includes(location.id)}
                    onChange={() => handleFilterChange("location", location.id)}
                  />
                  <label
                    htmlFor={`location-${location.id}`}
                    className="ml-2 block text-sm text-gray-700"
                  >
                    {location.label}
                  </label>
                </div>
              ))}
            {staticFilters.location.length > 5 && (
              <button
                className="text-blue-600 text-sm mt-2"
                onClick={() => setShowAllLocations(!showAllLocations)}
              >
                {showAllLocations ? "Show Less" : "View More"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Company Filter */}
      <div className="border-b border-gray-300">
        <button
          className="w-full p-4 flex justify-between items-center text-left"
          onClick={() => toggleSection("company")}
        >
          <h3 className="font-medium">Company</h3>
          {expandedSections.company ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>

        {expandedSections.company && (
          <div className="px-4 space-y-2 max-h-48 overflow-y-auto pb-4">
            {staticFilters.company
              .slice(0, showAllCompanies ? undefined : 5)
              .map((company) => (
                <div key={company.id} className="flex items-center">
                  <input
                    id={`company-${company.id}`}
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={selectedFilters.company.includes(company.id)}
                    onChange={() => handleFilterChange("company", company.id)}
                  />
                  <label
                    htmlFor={`company-${company.id}`}
                    className="ml-2 block text-sm text-gray-700 truncate"
                  >
                    {company.label}
                  </label>
                </div>
              ))}
            {staticFilters.company.length > 5 && (
              <button
                className="text-blue-600 text-sm mt-2"
                onClick={() => setShowAllCompanies(!showAllCompanies)}
              >
                {showAllCompanies ? "Show Less" : "View More"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 flex gap-2">
        <button
          onClick={handleClearFiltersLocal}
          className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Clear All
        </button>
        <button
          onClick={applyFilters}
          className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

export default SearchFilters;