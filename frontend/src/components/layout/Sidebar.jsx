import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Bookmark,
  User,
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  Building,
  Globe,
  Award,
  Home,
} from "lucide-react";
import {
  setJobType,
  setLocation,
  setExperienceLevel,
  setSalaryRange,
  setDatePosted,
  setIsRemote,
  setCompany,  // Changed from setCompanyIndustry
  setCompanySize,
  setJobLevel,
  clearFilters,
} from "../../slices/filterSlice";

import { useUser } from "@clerk/clerk-react";
import { useClerk } from "@clerk/clerk-react";

// Updated filter options based on job data structure
const filterOptions = {
  jobType: [
    { value: "", label: "All Job Types" },
    { value: "fulltime", label: "Full Time" },
    { value: "parttime", label: "Part Time" },
    { value: "contract", label: "Contract" },
    { value: "temporary", label: "Temporary" },
    { value: "internship", label: "Internship" },
  ],
  location: [
    { value: "", label: "All Locations" },
    { value: "AZ, US", label: "Arizona, US" },
    { value: "CA, US", label: "California, US" },
    { value: "TX, US", label: "Texas, US" },
    { value: "NY, US", label: "New York, US" },
    { value: "WA, US", label: "Washington, US" },
  ],
  jobLevel: [
    { value: "", label: "All Levels" },
    { value: "entry", label: "Entry Level" },
    { value: "mid", label: "Mid Level" },
    { value: "senior", label: "Senior Level" },
    { value: "director", label: "Director" },
    { value: "executive", label: "Executive" },
  ],
  companyIndustry: [
    { value: "", label: "All Industries" },
    { value: "technology", label: "Technology" },
    { value: "healthcare", label: "Healthcare" },
    { value: "finance", label: "Finance" },
    { value: "education", label: "Education" },
    { value: "manufacturing", label: "Manufacturing" },
  ],
  companySize: [
    { value: "", label: "All Company Sizes" },
    { value: "1-10", label: "1-10 employees" },
    { value: "11-50", label: "11-50 employees" },
    { value: "51-200", label: "51-200 employees" },
    { value: "201-500", label: "201-500 employees" },
    { value: "501-1000", label: "501-1000 employees" },
    { value: "1001-5000", label: "1001-5000 employees" },
    { value: "5001-10000", label: "5001-10000 employees" },
    { value: "10000+", label: "10,000+ employees" },
  ],
  salaryRange: [
    { value: "", label: "All Salary Ranges" },
    { value: "0-50000", label: "Up to $50,000" },
    { value: "50000-100000", label: "$50,000 - $100,000" },
    { value: "100000-150000", label: "$100,000 - $150,000" },
    { value: "150000-200000", label: "$150,000 - $200,000" },
    { value: "200000-300000", label: "$200,000 - $300,000" },
    { value: "300000+", label: "$300,000+" },
  ],
  datePosted: [
    { value: "", label: "Any Time" },
    { value: "1", label: "Last 24 hours" },
    { value: "7", label: "Last 7 days" },
    { value: "14", label: "Last 14 days" },
    { value: "30", label: "Last 30 days" },
  ],
  isRemote: [
    { value: "", label: "All Work Types" },
    { value: "true", label: "Remote" },
    { value: "false", label: "On-site" },
  ],
};

function Sidebar() {
  const { user } = useUser();
  const filters = useSelector((state) => state.filters);
  const savedJobs = useSelector((state) => state.jobs.savedJobs);
  const dispatch = useDispatch();

  const handleFilterChange = (filterType) => (e) => {
    const value = e.target.value;
    switch (filterType) {
      case "jobType":
        dispatch(setJobType(value));
        break;
      case "location":
        dispatch(setLocation(value));
        break;
      case "jobLevel":
        dispatch(setJobLevel(value));
        break;
      case "salaryRange":
        dispatch(setSalaryRange(value));
        break;
      case "datePosted":
        dispatch(setDatePosted(value));
        break;
      case "isRemote":
        dispatch(setIsRemote(value));
        break;
      case "companyIndustry":
        dispatch(setCompany(value));
        break;
      case "companySize":
        dispatch(setCompanySize(value));
        break;
      default:
        break;
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    dispatch(clearFilters());
    navigate("/search")
  };

  // Reusable filter component
  const FilterSelect = ({ label, icon: Icon, value, options, onChange }) => (
    <div className="mb-4">
      <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
        <Icon className="h-4 w-4 mr-1" /> {label}
      </label>
      <select
        value={value || ""}
        onChange={onChange}
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  // Filter accordion component
  const FilterAccordion = ({ title, children }) => {
    return (
      <div className="mb-4 border-b border-gray-200 ">
        <h4 className="font-medium text-gray-800 mb-2">{title}</h4>
        {children}
      </div>
    );
  };

  const { openUserProfile } = useClerk();

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden sticky top-20">
      {/* User Profile Section */}
      <div className="p-4 border-b border-gray-300">
        <div className="flex items-center space-x-3">
          <div className=" flex items-center justify-center">
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt="Profile"
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <User className="h-6 w-6 text-blue-600" />
            )}
          </div>
          <div>
            <h3 className="font-medium">
              {user?.fullName || user?.username || "User"}
            </h3>
            <p className="text-sm text-gray-500">
              {user?.primaryEmailAddress?.emailAddress || ""}
            </p>
          </div>
        </div>
        <button
          onClick={() => openUserProfile()}
          className="mt-3 block text-sm text-blue-600 hover:text-blue-800"
        >
          View Profile
        </button>
      </div>

      {/* Saved Jobs Section */}
      <div className="p-4 border-b border-gray-300">
        <div className="flex items-center justify-between">
          <h3 className="font-medium flex items-center">
            <Bookmark className="h-4 w-4 mr-2" />
            Saved Jobs
          </h3>
          <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
            {savedJobs.length}
          </span>
        </div>
        <Link
          to="/saved"
          className="mt-2 block text-sm text-blue-600 hover:text-blue-800"
        >
          View all saved jobs
        </Link>
      </div>

      {/* Filters Section */}
      <div className="p-4 max-h-[calc(100vh-220px)] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">Filters</h3>
          <button
            onClick={handleClearFilters}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Clear all
          </button>
        </div>

        <FilterAccordion title="Job Details">
          {/* Job Type Filter */}
          <FilterSelect
            label="Job Type"
            icon={Briefcase}
            value={filters.jobType}
            options={filterOptions.jobType}
            onChange={handleFilterChange("jobType")}
          />

          {/* Remote Filter */}
          <FilterSelect
            label="Work Location"
            icon={Home}
            value={filters.isRemote}
            options={filterOptions.isRemote}
            onChange={handleFilterChange("isRemote")}
          />

          {/* Job Level Filter */}
          <FilterSelect
            label="Job Level"
            icon={Award}
            value={filters.jobLevel}
            options={filterOptions.jobLevel}
            onChange={handleFilterChange("jobLevel")}
          />
        </FilterAccordion>

        <FilterAccordion title="Location">
          {/* Location Filter */}
          <FilterSelect
            label="Location"
            icon={MapPin}
            value={filters.location}
            options={filterOptions.location}
            onChange={handleFilterChange("location")}
          />
        </FilterAccordion>

        {/* <FilterAccordion title="Company">
          <FilterSelect
            label="Industry"
            icon={Building}
            value={filters.companyIndustry}
            options={filterOptions.companyIndustry}
            onChange={handleFilterChange("companyIndustry")}
          />

       
          <FilterSelect
            label="Company Size"
            icon={Globe}
            value={filters.companySize}
            options={filterOptions.companySize}
            onChange={handleFilterChange("companySize")}
          />
        </FilterAccordion> */}

        {/* <FilterAccordion title="Salary & Date">
          <FilterSelect
            label="Salary Range"
            icon={DollarSign}
            value={filters.salaryRange}
            options={filterOptions.salaryRange}
            onChange={handleFilterChange("salaryRange")}
          />

          <FilterSelect
            label="Date Posted"
            icon={Calendar}
            value={filters.datePosted}
            options={filterOptions.datePosted}
            onChange={handleFilterChange("datePosted")}
          />
        </FilterAccordion> */}

        {/* <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none ">
          Apply Filters
        </button> */}
      </div>
    </div>
  );
}

export default Sidebar;
