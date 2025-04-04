import { Search, SlidersHorizontal, ChevronDown, SlidersHorizontalIcon } from "lucide-react";
import { useFilters } from "../../contexts/FiltersContext";
import { useState, useEffect, useRef } from "react";

function MobileFiltersToggle({ onClick }) {
    return (
      <div className="md:hidden mb-4">
        <button
          onClick={onClick}
          className="w-full flex items-center justify-between px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200"
        >
          <span className="font-medium">Filters</span>
          <SlidersHorizontalIcon className="h-4 w-4" />
        </button>
      </div>
    );
}
  
function SearchHeader({
    searchInput,
    onSearchInputChange,
    onSearchSubmit,
    sortBy,
    onSortChange,
    jobs,
    loading,
    searchTerm,
}) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <form onSubmit={onSearchSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search job title, company, or keywords..."
              value={searchInput}
              onChange={onSearchInputChange}
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Search
          </button>
        </form>
  
        {!loading && (
          <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
            <span>{jobs?.length} jobs found</span>
            <div className="flex items-center">
              <span className="mr-2">Sort by:</span>
              <SortDropdown
                sortBy={sortBy}
                onSortChange={onSortChange}
              />
            </div>
          </div>
        )}
      </div>
    );
}
  
function SortDropdown({ sortBy, onSortChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    
    // Handle clicks outside the dropdown to close it
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        
        // Add event listener
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            // Cleanup event listener
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);
    
    // Toggle dropdown visibility
    const toggleDropdown = () => setIsOpen(!isOpen);
    
    // Handle sort option selection
    const handleSortChange = (value) => {
        onSortChange(value);
        setIsOpen(false); // Close dropdown after selection
    };
    
    return (
      <div className="relative inline-block text-left" ref={dropdownRef}>
        <div>
          <button
            type="button"
            className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-blue-500"
            id="options-menu"
            aria-expanded={isOpen}
            aria-haspopup="true"
            onClick={toggleDropdown}
          >
            {sortBy === "relevance" ? "Relevance" : 
             sortBy === "date" ? "Date Posted" : 
             sortBy === "salary" ? "Salary" : "Relevance"}
            <ChevronDown className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {isOpen && (
          <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
            <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
              <button
                className={`${
                  sortBy === "relevance" ? "bg-gray-100 text-gray-900" : "text-gray-700"
                } block px-4 py-2 text-sm w-full text-left hover:bg-gray-100`}
                onClick={() => handleSortChange("relevance")}
                role="menuitem"
              >
                Relevance
              </button>
              <button
                className={`${
                  sortBy === "date" ? "bg-gray-100 text-gray-900" : "text-gray-700"
                } block px-4 py-2 text-sm w-full text-left hover:bg-gray-100`}
                onClick={() => handleSortChange("date")}
                role="menuitem"
              >
                Date Posted
              </button>
              <button
                className={`${
                  sortBy === "salary" ? "bg-gray-100 text-gray-900" : "text-gray-700"
                } block px-4 py-2 text-sm w-full text-left hover:bg-gray-100`}
                onClick={() => handleSortChange("salary")}
                role="menuitem"
              >
                Salary
              </button>
            </div>
          </div>
        )}
      </div>
    );
}
  
function AppliedFilters() {
  const { selectedFilters, clearFilters, appliedFiltersCount } = useFilters();
  
  // Don't render if no filters are applied
  if (appliedFiltersCount === 0) {
    return null;
  }
  
  // Map filter names to display labels
  const filterLabels = {
    jobType: 'Job Type',
    location: 'Location',
    company: 'Company'
  };
  
  return (
    <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-gray-700">Applied Filters</h3>
        <button 
          onClick={clearFilters}
          className="text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Clear all
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(selectedFilters).map(
          ([key, values]) => 
            values && 
            values.length > 0 && 
            values.map(value => (
              <FilterBadge 
                key={`${key}-${value}`} 
                label={`${filterLabels[key] || key}: ${value}`} 
              />
            ))
        )}
      </div>
    </div>
  );
}

function FilterBadge({ label }) {
  return (
    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
      {label}
    </div>
  );
}

export { MobileFiltersToggle, SearchHeader, SortDropdown, AppliedFilters, FilterBadge };

// export default {
//   MobileFiltersToggle,
//   SearchHeader,
//   SortDropdown,
//   AppliedFilters,
//   FilterBadge
// };