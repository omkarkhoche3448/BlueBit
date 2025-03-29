import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { 
  setSearchTerm, 
  setSortBy, 
  setCompany,  // Changed from setCompanyIndustry
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

  // Parse search params from URL
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
    if (company && company !== filters.company) {  // Changed from companyIndustry
      dispatch(setCompany(company));  // Changed from setCompanyIndustry
    }
  }, [location.search, dispatch, filters.searchTerm, filters.company]);  // Changed dependency

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();

    // Update URL with search query
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

    dispatch(setSearchTerm(searchInput));
  };

  // Handle sort change
  const handleSortChange = (e) => {
    dispatch(setSortBy(e.target.value));
  };

  // Toggle mobile filters
  const toggleMobileFilters = () => {
    setShowMobileFilters(!showMobileFilters);
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
    navigate("/search");
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Mobile Filters Toggle */}
      <MobileFiltersToggle onClick={toggleMobileFilters} />

      {/* Filters Sidebar - Hidden on mobile unless toggled */}
      <div
        className={`${
          showMobileFilters ? "block" : "hidden"
        } md:block w-full md:w-64 flex-shrink-0`}
      >
        <SearchFilters />
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Search Header */}
        <SearchHeader
          searchInput={searchInput}
          onSearchInputChange={(e) => setSearchInput(e.target.value)}
          onSearchSubmit={handleSearch}
          sortBy={filters.sortBy}
          onSortChange={handleSortChange}
          jobs={jobs}
          loading={loading}
          searchTerm={filters.searchTerm}
        />

        {/* Applied Filters */}
        <AppliedFilters filters={filters} onClearFilters={handleClearFilters} />

        {/* Job Listings */}
        <JobList />
      </div>
    </div>
  );
}

export default SearchPage;