import { Search, SlidersHorizontal, ChevronDown, SlidersHorizontalIcon } from "lucide-react";

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
  
        {/* Search Results Info & Sort */}
        <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="text-sm text-gray-500">
            {loading ? (
              "Searching..."
            ) : (
              <>
                {jobs.length > 0 ? (
                  <>
                    <span className="font-medium">1-{Math.min(20, jobs.length)}</span> of{" "}
                    <span className="font-medium">{jobs.length}</span> {searchTerm ? `results for "${searchTerm}"` : "jobs"}
                  </>
                ) : (
                  "No results found"
                )}
              </>
            )}
          </div>
          <SortDropdown sortBy={sortBy} onSortChange={onSortChange} />
        </div>
      </div>
    );
}
  
function SortDropdown({ sortBy, onSortChange }) {
    return (
      <div className="flex items-center">
        <label htmlFor="sort" className="text-sm font-medium text-gray-700 mr-2">
          Sort by:
        </label>
        <div className="relative">
          <select
            id="sort"
            name="sort"
            className="block w-full pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md appearance-none"
            onChange={onSortChange}
            value={sortBy}
          >
            <option value="relevance">Relevance</option>
            <option value="date">Most Recent</option>
            <option value="salary-high">Salary (High to Low)</option>
            <option value="salary-low">Salary (Low to High)</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </div>
    );
}
  
function AppliedFilters({ filters, onClearFilters }) {
  const filterLabels = {
    searchTerm: "Search",
    jobType: "Job Type",
    location: "Location",
    experienceLevel: "Experience",
    salaryRange: "Salary",
    datePosted: "Posted",
    companyIndustry: "Company",
    companySize: "Company Size",
    jobLevel: "Job Level",
    isRemote: "Remote",
  };

  // Check if any filter is applied (excluding sortBy and defaults)
  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) => 
      value && 
      key !== "sortBy" && 
      value !== "relevance" && 
      value !== ""
  );

  return (
    hasActiveFilters && (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700">Applied Filters</h3>
          <button 
            className="text-xs text-blue-600 hover:text-blue-800" 
            onClick={onClearFilters}
          >
            Clear all
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(filters).map(
            ([key, value]) => 
              value && 
              key !== "sortBy" && 
              value !== "relevance" && 
              value !== "" && (
                <FilterBadge 
                  key={key} 
                  label={`${filterLabels[key] || key}: ${value}`} 
                />
              )
          )}
        </div>
      </div>
    )
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