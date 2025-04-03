import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  setSearchTerm,
  setSortBy,
  setCompany,
  clearFilters
} from "../slices/filterSlice";
import JobList from "../components/common/JobList";
import SearchFilters from "../components/common/SearchFilters";
import {
  AppliedFilters,
  MobileFiltersToggle,
  SearchHeader,
} from "../components/searchpage";

function SearchPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { jobs, loading } = useSelector((state) => state.jobs);
  const filters = useSelector((state) => state.filters);

  const [searchInput, setSearchInput] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Parse search params from URL - Memoize URL parsing logic
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    
    // Handle search term
    const query = searchParams.get("q") || "";
    if (query && query !== filters.searchTerm) {
      dispatch(setSearchTerm(query));
    }
    setSearchInput(query);
    
    // Handle company filter
    const company = searchParams.get("company") || "";
    if (company && company !== filters.company) {
      dispatch(setCompany(company));
    }
  }, [location.search, dispatch, filters.searchTerm, filters.company]);

  // Memoize search params with useMemo
  const currentSearchParams = useMemo(() => {
    return new URLSearchParams(location.search);
  }, [location.search]);

  // Handle search form submission with useCallback
  const handleSearch = useCallback((e) => {
    e.preventDefault();
    
    const searchParams = new URLSearchParams(currentSearchParams);
    if (searchInput) {
      searchParams.set("q", searchInput);
    } else {
      searchParams.delete("q");
    }
    
    navigate({
      pathname: "/search",
      search: searchParams.toString(),
    });
    
    dispatch(setSearchTerm(searchInput));
  }, [searchInput, currentSearchParams, navigate, dispatch]);

  // Handle sort change with useCallback
  const handleSortChange = useCallback((e) => {
    dispatch(setSortBy(e.target.value));
  }, [dispatch]);

  // Toggle mobile filters with useCallback
  const toggleMobileFilters = useCallback(() => {
    setShowMobileFilters(prev => !prev);
  }, []);

  // Handle clear filters with useCallback
  const handleClearFilters = useCallback(() => {
    dispatch(clearFilters());
    navigate("/search");
  }, [dispatch, navigate]);

  // Memoize searchInput change handler
  const handleSearchInputChange = useCallback((e) => {
    setSearchInput(e.target.value);
  }, []);

  return (
    <div className="flex flex-col md:flex-row md:gap-6 md:p-4 max-w-7xl mx-auto">
      {/* Mobile Filters Toggle - Enhanced styling */}
      <MobileFiltersToggle 
        onClick={toggleMobileFilters}
        isOpen={showMobileFilters}
        className="md:hidden sticky top-0 z-10 bg-white py-2"
      />
      
      {/* Filters Sidebar - Enhanced mobile transition */}
      <aside
        className={`
          fixed md:static top-0 left-0 h-full w-full md:w-64 
          transform transition-transform duration-300 ease-in-out
          ${showMobileFilters ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 bg-white md:bg-transparent
          z-20 md:z-auto p-4 md:p-0
        `}
      >
        <button 
          className="md:hidden absolute top-4 right-4 text-gray-500"
          onClick={toggleMobileFilters}
        >
          ✕
        </button>
        <SearchFilters />
      </aside>
      
      {/* Overlay for mobile filter background */}
      {showMobileFilters && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={toggleMobileFilters}
        />
      )}
      
      {/* Main Content - Enhanced mobile spacing */}
      <main className="flex-1 space-y-4 md:space-y-6 w-full">
        <SearchHeader
          searchInput={searchInput}
          onSearchInputChange={handleSearchInputChange}
          onSearchSubmit={handleSearch}
          sortBy={filters.sortBy}
          onSortChange={handleSortChange}
          jobs={jobs}
          loading={loading}
          searchTerm={filters.searchTerm}
          className="sticky top-0 z-10 bg-white py-2"
        />
        
        <AppliedFilters 
          filters={filters} 
          onClearFilters={handleClearFilters} 
        />
        
        <JobList />
      </main>
    </div>
  );
}

export default SearchPage;