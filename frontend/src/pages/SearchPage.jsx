import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
import MobileNavigation from "../components/common/MobileNavigation"; // Import the MobileNavigation component

function SearchPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { jobs, loading } = useSelector((state) => state.jobs);
  const filters = useSelector((state) => state.filters);

  const [searchInput, setSearchInput] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const initialLoad = useRef(true);
  const searchTimeout = useRef(null);

  // Unified search param handler
  useEffect(() => {
    if (initialLoad.current) {
      initialLoad.current = false;
      return;
    }

    // Clear any existing timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Debounce the search execution
    searchTimeout.current = setTimeout(() => {
      const searchParams = new URLSearchParams(location.search);
      const currentQuery = searchParams.get("q") || "";
      
      if (currentQuery !== filters.searchTerm) {
        dispatch(fetchJobs()); // Replace with actual job fetch action
      }
    }, 300);
    
    return () => clearTimeout(searchTimeout.current);
  }, [location.search, filters.searchTerm, dispatch]);

  // Update URL sync effect
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const query = searchParams.get("q") || "";
    setSearchInput(query);
    dispatch(setSearchTerm(query));
  }, [location.search, dispatch]);

  // Memoize search params with useMemo
  const currentSearchParams = useMemo(() => {
    return new URLSearchParams(location.search);
  }, [location.search]);

  // Simplified search handler
  const handleSearch = useCallback((e) => {
    e.preventDefault();
    const searchParams = new URLSearchParams(location.search);
    
    if (searchInput) {
      searchParams.set("q", searchInput);
    } else {
      searchParams.delete("q");
    }
    
    navigate({
      pathname: "/search",
      search: searchParams.toString(),
    });
  }, [searchInput, navigate, location.search]);

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
  // Unified debounced search handler
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      const searchParams = new URLSearchParams(location.search);
      const currentQuery = searchParams.get("q") || "";
      
      if (currentQuery !== filters.searchTerm) {
        dispatch(fetchJobs());
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [location.search, filters.searchTerm, dispatch]);

  // Update URL with debounce
  const handleSearchInputChange = useCallback((e) => {
    setSearchInput(e.target.value);
    const debounceTimer = setTimeout(() => {
      const searchParams = new URLSearchParams(location.search);
      searchParams.set("q", e.target.value);
      navigate({ pathname: "/search", search: searchParams.toString() });
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [navigate, location.search]);

  // Add useEffect to clear filters when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearFilters());
      dispatch(setSearchTerm(''));
    };
  }, [dispatch]);

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
      <main className="flex-1 space-y-4 md:space-y-6 w-full pb-16 md:pb-0"> {/* Added padding bottom for mobile navigation */}
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

      {/* Mobile Navigation - Fixed to bottom of viewport */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30">
        <MobileNavigation />
      </div>
    </div>
  );
}

export default SearchPage;