import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Bookmark, User, Briefcase, MapPin, Clock, DollarSign, Calendar } from "lucide-react";
import {
  setJobType,
  setLocation,
  setExperienceLevel,
  setSalaryRange,
  setDatePosted,
  clearFilters,
} from "../../slices/filterSlice";
import {filterOptions} from "../../data/filterOptions"

function Sidebar() {
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
      case "experienceLevel":
        dispatch(setExperienceLevel(value));
        break;
      case "salaryRange":
        dispatch(setSalaryRange(value));
        break;
      case "datePosted":
        dispatch(setDatePosted(value));
        break;
      default:
        break;
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    dispatch(clearFilters());
  };

  // Reusable filter component
  const FilterSelect = ({ label, icon: Icon, value, options, onChange }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
        <Icon className="h-4 w-4 mr-1" /> {label}
      </label>
      <select
        value={value}
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

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden sticky top-20">
      {/* User Profile Section */}
      <div className="p-4 border-b border-gray-300">
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium">Omkar Khoche</h3>
            <p className="text-sm text-gray-500">Software Engineer</p>
          </div>
        </div>
        <Link to="/profile" className="mt-3 block text-sm text-blue-600 hover:text-blue-800">
          View profile
        </Link>
      </div>

      {/* Saved Jobs Section */}
      <div className="p-4  border-b border-gray-300">
        <div className="flex items-center justify-between">
          <h3 className="font-medium flex items-center">
            <Bookmark className="h-4 w-4 mr-2" />
            Saved Jobs
          </h3>
          <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">{savedJobs.length}</span>
        </div>
        <Link to="/saved" className="mt-2 block text-sm text-blue-600 hover:text-blue-800">
          View all saved jobs
        </Link>
      </div>

      {/* Filters Section */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">Filters</h3>
          <button onClick={handleClearFilters} className="text-xs text-blue-600 hover:text-blue-800">
            Clear all
          </button>
        </div>

        {/* Job Type Filter */}
        <FilterSelect
          label="Job Type"
          icon={Briefcase}
          value={filters.jobType}
          options={filterOptions.jobType}
          onChange={handleFilterChange("jobType")}
        />

        {/* Location Filter */}
        <FilterSelect
          label="Location"
          icon={MapPin}
          value={filters.location}
          options={filterOptions.location}
          onChange={handleFilterChange("location")}
        />

        {/* Experience Level Filter */}
        <FilterSelect
          label="Experience Level"
          icon={Clock}
          value={filters.experienceLevel}
          options={filterOptions.experienceLevel}
          onChange={handleFilterChange("experienceLevel")}
        />

        {/* Salary Range Filter */}
        <FilterSelect
          label="Salary Range"
          icon={DollarSign}
          value={filters.salaryRange}
          options={filterOptions.salaryRange}
          onChange={handleFilterChange("salaryRange")}
        />

        {/* Date Posted Filter */}
        <FilterSelect
          label="Date Posted"
          icon={Calendar}
          value={filters.datePosted}
          options={filterOptions.datePosted}
          onChange={handleFilterChange("datePosted")}
        />

        {/* <button
          onClick={() => window.location.reload()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Apply Filters
        </button> */}
      </div>
    </div>
  );
}

export default Sidebar;