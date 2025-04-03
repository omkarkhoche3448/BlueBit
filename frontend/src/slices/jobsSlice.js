import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"

const API_URL_BACKEND = import.meta.env.VITE_API_URL_BACKEND;

// Load savedJobs from localStorage on initial load
const loadSavedJobsFromStorage = () => {
  try {
    const savedJobs = localStorage.getItem('savedJobs')
    return savedJobs ? JSON.parse(savedJobs) : []
  } catch (error) {
    console.error('Error loading saved jobs from localStorage:', error)
    return []
  }
}

// Save jobs to localStorage
const saveJobsToStorage = (jobs) => {
  try {
    localStorage.setItem('savedJobs', JSON.stringify(jobs))
  } catch (error) {
    console.error('Error saving jobs to localStorage:', error)
  }
}

export const fetchJobs = createAsyncThunk("jobs/fetchJobs", async (params, { rejectWithValue }) => {
  try {
    // Extract filters and pagination params
    const { filters = {}, page = 1, per_page = 10 } = params || {};
    
    // Construct the API URL
    const url = `${API_URL_BACKEND}/search-jobs`
    
    // Get the user's Clerk ID
    const clerkId = window.Clerk?.user?.id || null;
    
    // Format filters for the API
    const formattedFilters = {
      jobType: filters.jobType || [],
      location: filters.location || [],
      company: filters.company || [],
      searchTerm: filters.searchTerm || '',
      // Add any other filters that might be needed
    };
    
    console.log("Sending filters to API:", formattedFilters);
    
    // Send the filters, pagination params, and Clerk ID in the request body
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        filters: formattedFilters,
        clerkId,
        page,
        per_page
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return rejectWithValue(errorData.error || "Failed to fetch jobs")
    }

    const data = await response.json()
    return data
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

export const fetchJobById = createAsyncThunk("jobs/fetchJobById", async (jobId, { rejectWithValue }) => {
  try {
    const url = `${API_URL_BACKEND}/jobs/${jobId}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      return rejectWithValue(errorData.error || "Failed to fetch job details");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

const jobsSlice = createSlice({
  name: "jobs",
  initialState: {
    jobs: [],
    savedJobs: loadSavedJobsFromStorage(), // Load from localStorage on init
    appliedJobs: [],
    currentJob: null,
    loading: false,
    error: null,
    pagination: {
      total: 0,
      page: 1,
      per_page: 10,
      total_pages: 0
    },
    // Add filters to the state so they can be accessed from any component
    activeFilters: {
      jobType: [],
      location: [],
      company: [],
      searchTerm: ''
    }
  },
  reducers: {
    // Existing reducers
    toggleSaveJob: (state, action) => {
      const job = action.payload
      const savedJobIndex = state.savedJobs.findIndex((savedJob) => savedJob.id === job.id)

      if (savedJobIndex >= 0) {
        state.savedJobs.splice(savedJobIndex, 1)
      } else {
        state.savedJobs.push(job)
      }
      
      // Update localStorage whenever savedJobs changes
      saveJobsToStorage(state.savedJobs)
    },
    clearErrors: (state) => {
      state.error = null
    },
    // New reducer for changing page
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },
    // New reducer for changing items per page
    setPerPage: (state, action) => {
      state.pagination.per_page = action.payload;
    },
    applyToJob: (state, action) => {
      const jobId = action.payload;
      if (!state.appliedJobs.includes(jobId)) {
        state.appliedJobs.push(jobId);
      }
    },
    // New reducers for managing filters
    updateFilters: (state, action) => {
      state.activeFilters = {
        ...state.activeFilters,
        ...action.payload
      };
      // Reset to page 1 when filters change
      state.pagination.page = 1;
    },
    updateFilterCategory: (state, action) => {
      const { category, value } = action.payload;
      state.activeFilters[category] = value;
      // Reset to page 1 when filters change
      state.pagination.page = 1;
    },
    toggleFilter: (state, action) => {
      const { category, value } = action.payload;
      const currentFilters = state.activeFilters[category] || [];
      
      if (currentFilters.includes(value)) {
        state.activeFilters[category] = currentFilters.filter(item => item !== value);
      } else {
        state.activeFilters[category] = [...currentFilters, value];
      }
      // Reset to page 1 when filters change
      state.pagination.page = 1;
    },
    clearAllFilters: (state) => {
      state.activeFilters = {
        jobType: [],
        location: [],
        company: [],
        searchTerm: ''
      };
      // Reset to page 1 when filters are cleared
      state.pagination.page = 1;
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchJobs
      .addCase(fetchJobs.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.loading = false
        state.jobs = action.payload.jobs
        state.pagination = action.payload.pagination
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Handle fetchJobById
      .addCase(fetchJobById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchJobById.fulfilled, (state, action) => {
        state.loading = false
        state.currentJob = action.payload
      })
      .addCase(fetchJobById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { 
  toggleSaveJob, 
  clearErrors, 
  setPage, 
  setPerPage, 
  applyToJob,
  updateFilters,
  updateFilterCategory,
  toggleFilter,
  clearAllFilters
} = jobsSlice.actions

export default jobsSlice.reducer