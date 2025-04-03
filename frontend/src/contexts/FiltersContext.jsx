import { createContext, useContext, useState } from "react";

// Create context
const FiltersContext = createContext();

// Custom hook to use the filters context
export const useFilters = () => {
  const context = useContext(FiltersContext);
  if (!context) {
    throw new Error("useFilters must be used within a FiltersProvider");
  }
  return context;
};

// Provider component
export const FiltersProvider = ({ children }) => {
  // State for selected filters (all are arrays to support multiple selections)
  const [selectedFilters, setSelectedFilters] = useState({
    jobType: [],
    location: [],
    company: [],
  });

  // Generic handler for toggling filter selections
  const handleFilterChange = (filterType, value) => {
    setSelectedFilters((prev) => {
      const currentValues = prev[filterType];
      const valueIndex = currentValues.indexOf(value);
      
      if (valueIndex > -1) {
        // Remove the value if already selected
        return {
          ...prev,
          [filterType]: currentValues.filter(item => item !== value)
        };
      } else {
        // Add the value if not already selected
        return {
          ...prev,
          [filterType]: [...currentValues, value]
        };
      }
    });
  };

  const clearFilters = () => {
    setSelectedFilters({
      jobType: [],
      location: [],
      company: [],
    });
  };

  // Calculate total number of applied filters
  const appliedFiltersCount = 
    selectedFilters.jobType.length + 
    selectedFilters.location.length + 
    selectedFilters.company.length;

  const value = {
    selectedFilters,
    setSelectedFilters,
    handleFilterChange,
    clearFilters,
    appliedFiltersCount
  };

  return (
    <FiltersContext.Provider value={value}>
      {children}
    </FiltersContext.Provider>
  );
};