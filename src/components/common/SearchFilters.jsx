import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronUp, ChevronDown } from "lucide-react";
import {
  setJobType,
  setLocation,
  setExperienceLevel,
  setSalaryRange,
  setDatePosted,
  setCompany,
  clearFilters,
} from "../../slices/filterSlice";
import { useState, useEffect } from "react";

function SearchFilters() {
  const filters = useSelector((state) => state.filters);
  const jobs = useSelector((state) => state.jobs.jobs);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAllLocations, setShowAllLocations] = useState(false);
  const [showAllCompanies, setShowAllCompanies] = useState(false);

  // State for filter counts
  const [filterCounts, setFilterCounts] = useState({
    jobType: {
      fulltime: 0,
      parttime: 0,
      contract: 0,
      internship: 0,
    },
    location: {},
    experienceLevel: {
      entry: 0,
      mid: 0,
      senior: 0,
      executive: 0,
    },
    company: {},
    salaryRange: {
      "0-50000": 0,
      "50000-100000": 0,
      "100000-150000": 0,
      "150000+": 0,
    },
  });

  // State for collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    jobType: true,
    location: true,
    experience: true,
    company: true,
    salary: false,
  });

  // Calculate filter counts based on available jobs
  useEffect(() => {
    if (jobs && jobs.length > 0) {
      // Job Type counts
      const jobTypeCounts = {
        fulltime: jobs.filter((job) => job.job_type === "fulltime").length,
        parttime: jobs.filter((job) => job.job_type === "parttime").length,
        contract: jobs.filter((job) => job.job_type === "contract").length,
        internship: jobs.filter((job) => job.job_type === "internship").length,
      };

      // Location counts (dynamic)
      const locationCounts = {};
      jobs.forEach((job) => {
        if (job.location) {
          const city = job.location.split(",")[0].trim();
          locationCounts[city] = (locationCounts[city] || 0) + 1;
        }
      });

      // Experience Level counts
      const experienceLevelCounts = {
        entry: jobs.filter(
          (job) =>
            job.experience_range &&
            job.experience_range.toLowerCase().includes("entry")
        ).length,
        mid: jobs.filter(
          (job) =>
            job.experience_range &&
            job.experience_range.toLowerCase().includes("mid")
        ).length,
        senior: jobs.filter(
          (job) =>
            job.experience_range &&
            job.experience_range.toLowerCase().includes("senior")
        ).length,
        executive: jobs.filter(
          (job) =>
            job.experience_range &&
            job.experience_range.toLowerCase().includes("executive")
        ).length,
      };

      // Company counts (dynamic)
      const companyCounts = {};
      jobs.forEach((job) => {
        if (job.company) {
          companyCounts[job.company] = (companyCounts[job.company] || 0) + 1;
        }
      });

      // Salary Range counts
      const salaryRangeCounts = {
        "0-50000": jobs.filter((job) => job.min_amount <= 50000).length,
        "50000-100000": jobs.filter(
          (job) => job.min_amount > 50000 && job.max_amount <= 100000
        ).length,
        "100000-150000": jobs.filter(
          (job) => job.min_amount > 100000 && job.max_amount <= 150000
        ).length,
        "150000+": jobs.filter((job) => job.min_amount > 150000).length,
      };

      setFilterCounts({
        jobType: jobTypeCounts,
        location: locationCounts,
        experienceLevel: experienceLevelCounts,
        company: companyCounts,
        salaryRange: salaryRangeCounts,
      });
    }
  }, [jobs]);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleFilterChange = (filterType, value) => {
    // Update URL with filter
    const searchParams = new URLSearchParams(location.search);
    if (value) {
      searchParams.set(filterType, value);
    } else {
      searchParams.delete(filterType);
    }

    navigate({
      pathname: "/search",
      search: searchParams.toString(),
    });

    // Update Redux state
    switch (filterType) {
      case "jobType":
        dispatch(setJobType(value));
        break;
      case "location":
        dispatch(setLocation(value));
        break;
      case "experienceLevel":
        dispatch(setExperienceLevel(value));
        break;
      case "salaryRange":
        dispatch(setSalaryRange(value));
        break;
      case "datePosted":
        dispatch(setDatePosted(value));
        break;
      case "company":
        if (value === "") {
          // When unselecting company, reset to show all companies
          setShowAllCompanies(false);
        }
        dispatch(setCompany(value));
        break;
      default:
        break;
    }
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
    navigate("/search");
  };

  const handleApplyFilters = () => {
    // Refresh the page to apply all filters
    window.location.reload();
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden sticky top-20">
      <div className="p-4 border-b border-gray-300 flex justify-between items-center">
        <h2 className="font-medium text-lg">All Filters</h2>
        <span className="text-blue-600 text-sm">
          {Object.values(filters).filter(Boolean).length > 0 &&
            `Applied (${Object.values(filters).filter(Boolean).length})`}
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
            <div className="flex items-center">
              <input
                id="fulltime"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={filters.jobType === "fulltime"}
                onChange={(e) =>
                  handleFilterChange(
                    "jobType",
                    e.target.checked ? "fulltime" : ""
                  )
                }
              />
              <label
                htmlFor="fulltime"
                className="ml-2 block text-sm text-gray-700"
              >
                Full Time ({filterCounts.jobType.fulltime})
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="parttime"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={filters.jobType === "parttime"}
                onChange={(e) =>
                  handleFilterChange(
                    "jobType",
                    e.target.checked ? "parttime" : ""
                  )
                }
              />
              <label
                htmlFor="parttime"
                className="ml-2 block text-sm text-gray-700"
              >
                Part Time ({filterCounts.jobType.parttime})
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="contract"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={filters.jobType === "contract"}
                onChange={(e) =>
                  handleFilterChange(
                    "jobType",
                    e.target.checked ? "contract" : ""
                  )
                }
              />
              <label
                htmlFor="contract"
                className="ml-2 block text-sm text-gray-700"
              >
                Contract ({filterCounts.jobType.contract})
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="internship"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={filters.jobType === "internship"}
                onChange={(e) =>
                  handleFilterChange(
                    "jobType",
                    e.target.checked ? "internship" : ""
                  )
                }
              />
              <label
                htmlFor="internship"
                className="ml-2 block text-sm text-gray-700"
              >
                Internship ({filterCounts.jobType.internship})
              </label>
            </div>
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
            {Object.entries(filterCounts.location)
              .sort((a, b) => b[1] - a[1])
              .slice(0, showAllLocations ? undefined : 5)
              .map(([cityName, count]) => (
                <div key={cityName} className="flex items-center">
                  <input
                    id={`location-${cityName}`}
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={filters.location.includes(cityName)}
                    onChange={(e) =>
                      handleFilterChange(
                        "location",
                        e.target.checked
                          ? [...filters.location, cityName]
                          : filters.location.filter((loc) => loc !== cityName)
                      )
                    }
                  />
                  <label
                    htmlFor={`location-${cityName}`}
                    className="ml-2 block text-sm text-gray-700"
                  >
                    {cityName} ({count})
                  </label>
                </div>
              ))}
            {Object.keys(filterCounts.location).length > 5 && (
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
            {Object.entries(filterCounts.company)
              .sort((a, b) => b[1] - a[1])
              .slice(0, showAllCompanies ? undefined : 5)
              .map(([companyName, count]) => (
                <div key={companyName} className="flex items-center">
                  <input
                    id={`company-${companyName}`}
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={filters.company === companyName}
                    onChange={(e) =>
                      handleFilterChange(
                        "company",
                        e.target.checked ? companyName : ""
                      )
                    }
                  />
                  <label
                    htmlFor={`company-${companyName}`}
                    className="ml-2 block text-sm text-gray-700 truncate"
                  >
                    {companyName} ({count})
                  </label>
                </div>
              ))}
            {Object.keys(filterCounts.company).length > 5 && (
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

      {/* Experience Filter */}
      {/* <div className="border-b border-gray-300">
        <button
          className="w-full p-4 flex justify-between items-center text-left"
          onClick={() => toggleSection("experience")}
        >
          <h3 className="font-medium">Experience Level</h3>
          {expandedSections.experience ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>

        {expandedSections.experience && (
          <div className="px-4 pb-4 space-y-2">
            <div className="flex items-center">
              <input
                id="entry-level"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={filters.experienceLevel === "entry"}
                onChange={(e) => handleFilterChange("experienceLevel", e.target.checked ? "entry" : "")}
              />
              <label htmlFor="entry-level" className="ml-2 block text-sm text-gray-700">
                Entry Level ({filterCounts.experienceLevel.entry})
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="mid-level"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={filters.experienceLevel === "mid"}
                onChange={(e) => handleFilterChange("experienceLevel", e.target.checked ? "mid" : "")}
              />
              <label htmlFor="mid-level" className="ml-2 block text-sm text-gray-700">
                Mid Level ({filterCounts.experienceLevel.mid})
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="senior-level"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={filters.experienceLevel === "senior"}
                onChange={(e) => handleFilterChange("experienceLevel", e.target.checked ? "senior" : "")}
              />
              <label htmlFor="senior-level" className="ml-2 block text-sm text-gray-700">
                Senior Level ({filterCounts.experienceLevel.senior})
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="executive"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={filters.experienceLevel === "executive"}
                onChange={(e) => handleFilterChange("experienceLevel", e.target.checked ? "executive" : "")}
              />
              <label htmlFor="executive" className="ml-2 block text-sm text-gray-700">
                Executive ({filterCounts.experienceLevel.executive})
              </label>
            </div>
          </div>
        )}
      </div> */}

      {/* Salary Filter - commented out but can be enabled if needed */}
      {/* <div className="border-b border-gray-300">
        <button
          className="w-full p-4 flex justify-between items-center text-left"
          onClick={() => toggleSection("salary")}
        >
          <h3 className="font-medium">Salary Range</h3>
          {expandedSections.salary ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>

        {expandedSections.salary && (
          <div className="px-4 pb-4 space-y-2">
            <div className="flex items-center">
              <input
                id="salary-0-50k"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={filters.salaryRange === "0-50000"}
                onChange={(e) => handleFilterChange("salaryRange", e.target.checked ? "0-50000" : "")}
              />
              <label htmlFor="salary-0-50k" className="ml-2 block text-sm text-gray-700">
                $0 - $50,000 ({filterCounts.salaryRange["0-50000"]})
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="salary-50k-100k"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={filters.salaryRange === "50000-100000"}
                onChange={(e) => handleFilterChange("salaryRange", e.target.checked ? "50000-100000" : "")}
              />
              <label htmlFor="salary-50k-100k" className="ml-2 block text-sm text-gray-700">
                $50,000 - $100,000 ({filterCounts.salaryRange["50000-100000"]})
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="salary-100k-150k"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={filters.salaryRange === "100000-150000"}
                onChange={(e) => handleFilterChange("salaryRange", e.target.checked ? "100000-150000" : "")}
              />
              <label htmlFor="salary-100k-150k" className="ml-2 block text-sm text-gray-700">
                $100,000 - $150,000 ({filterCounts.salaryRange["100000-150000"]})
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="salary-150k-plus"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={filters.salaryRange === "150000+"}
                onChange={(e) => handleFilterChange("salaryRange", e.target.checked ? "150000+" : "")}
              />
              <label htmlFor="salary-150k-plus" className="ml-2 block text-sm text-gray-700">
                $150,000+ ({filterCounts.salaryRange["150000+"]})
              </label>
            </div>
          </div>
        )}
      </div> */}

      {/* Action Buttons */}
      {/* <div className="p-4 flex gap-2">
        <button
          onClick={handleClearFilters}
          className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Clear All
        </button>
        <button
          onClick={handleApplyFilters}
          className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Apply
        </button>
      </div> */}
    </div>
  );
}

export default SearchFilters;
