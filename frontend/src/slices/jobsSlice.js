import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"

const API_URL_BACKEND = import.meta.env.VITE_API_URL_BACKEND;

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

// Async thunk for saving a job
export const saveJob = createAsyncThunk("jobs/saveJob", async ({ job, userId }, { rejectWithValue }) => {
  try {
    console.log(`Saving job ${job.id} for user ${userId}`);
    const response = await fetch(`${API_URL_BACKEND}/users/${userId}/bookmarks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        itemId: job.id,
        action: "add",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return rejectWithValue(errorData.error || "Failed to save job");
    }

    // Return the job that was saved
    return job;
  } catch (error) {
    console.error("Error in saveJob thunk:", error);
    return rejectWithValue(error.message || "Failed to save job");
  }
});

// Async thunk for removing a saved job
export const removeJob = createAsyncThunk("jobs/removeJob", async ({ job, userId }, { rejectWithValue }) => {
  try {
    console.log(`Removing job ${job.id} for user ${userId}`);
    const response = await fetch(`${API_URL_BACKEND}/users/${userId}/bookmarks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        itemId: job.id,
        action: "remove",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return rejectWithValue(errorData.error || "Failed to remove job");
    }

    // Return the job that was removed
    return job;
  } catch (error) {
    console.error("Error in removeJob thunk:", error);
    return rejectWithValue(error.message || "Failed to remove job");
  }
});

// Async thunk to fetch saved jobs
export const fetchSavedJobs = createAsyncThunk(
  'jobs/fetchSavedJobs',
  async (userId, { rejectWithValue }) => {
    try {
      console.log(`Fetching saved jobs for user: ${userId}`);
      const response = await fetch(`${API_URL_BACKEND}/users/${userId}/bookmarks`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error fetching saved jobs:", errorData);
        throw new Error(errorData.error || 'Failed to fetch saved jobs');
      }
      
      const data = await response.json();
      console.log(`Received ${data.length} saved jobs for user ${userId}`);
      return data;
    } catch (error) {
      console.error("Error in fetchSavedJobs thunk:", error);
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to fetch liked jobs
export const fetchLikedJobs = createAsyncThunk(
  'jobs/fetchLikedJobs',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL_BACKEND}/users/${userId}/interested-jobs`);
      if (!response.ok) {
        throw new Error('Failed to fetch liked jobs');
      }
      const data = await response.json();
      return data.jobs; // Assuming the API returns an array of jobs
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Add a new thunk for liking/unliking jobs
export const updateJobInterest = createAsyncThunk(
  'jobs/updateJobInterest',
  async ({ userId, jobId, interest }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL_BACKEND}/users/${userId}/job-interest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          interest,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update job interest');
      }
      
      return { jobId, interest };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const jobsSlice = createSlice({
  name: "jobs",
  initialState: {
    jobs: [],
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
    activeFilters: {
      jobType: [],
      location: [],
      company: [],
      searchTerm: ''
    },
    savedJobs: [],
    likedJobs: [],
    savedJobsStatus: "idle",
    savedJobsError: null
  },
  reducers: {
    clearErrors: (state) => {
      state.error = null
    },
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },
    setPerPage: (state, action) => {
      state.pagination.per_page = action.payload;
    },
    setSavedJobsLoading: (state) => {
      state.savedJobsStatus = "loading";
    },
    clearSavedJobs: (state) => {
      state.savedJobs = [];
      state.savedJobsStatus = "idle";
    },
    applyToJob: (state, action) => {
      const jobId = action.payload;
      if (!state.appliedJobs.includes(jobId)) {
        state.appliedJobs.push(jobId);
      }
    },
    updateFilters: (state, action) => {
      state.activeFilters = {
        ...state.activeFilters,
        ...action.payload
      };
      state.pagination.page = 1;
    },
    updateFilterCategory: (state, action) => {
      const { category, value } = action.payload;
      state.activeFilters[category] = value;
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
      state.pagination.page = 1;
    },
    clearAllFilters: (state) => {
      state.activeFilters = {
        jobType: [],
        location: [],
        company: [],
        searchTerm: ''
      };
      state.pagination.page = 1;
    },
    // Reducer to update saved jobs state
    updateSavedJobs: (state, action) => {
      state.savedJobs = action.payload; // Update saved jobs in state
    },
  },
  extraReducers: (builder) => {
    builder
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
      // Fix the saveJob and removeJob cases
      builder
        .addCase(saveJob.pending, (state) => {
          state.status = "loading";
        })
        .addCase(saveJob.fulfilled, (state, action) => {
          state.status = "succeeded";
          // Initialize savedJobs array if it doesn't exist
          if (!state.savedJobs) {
            state.savedJobs = [];
          }
          // Check if job already exists to avoid duplicates
          if (!state.savedJobs.some(job => job.id === action.payload.id)) {
            state.savedJobs.push(action.payload);
          }
        })
        .addCase(saveJob.rejected, (state, action) => {
          state.status = "failed";
          state.error = action.payload;
        })
        .addCase(removeJob.pending, (state) => {
          state.status = "loading";
        })
        .addCase(removeJob.fulfilled, (state, action) => {
          state.status = "succeeded";
          // Check if savedJobs exists before filtering
          if (state.savedJobs) {
            state.savedJobs = state.savedJobs.filter(job => job.id !== action.payload.id);
          }
        })
        .addCase(removeJob.rejected, (state, action) => {
          state.status = "failed";
          state.error = action.payload;
        });
    // Add cases for fetchLikedJobs
    builder
      .addCase(fetchLikedJobs.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchLikedJobs.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.likedJobs = action.payload || [];
      })
      .addCase(fetchLikedJobs.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      
      // Add cases for updateJobInterest
      .addCase(updateJobInterest.fulfilled, (state, action) => {
        const { jobId, interest } = action.payload;
        
        // If interest is true, add to likedJobs if not already there
        if (interest === true) {
          // Find the job in the jobs array
          const jobToAdd = state.jobs.find(job => job.id === jobId);
          
          if (jobToAdd && !state.likedJobs.some(job => job.id === jobId)) {
            state.likedJobs.push(jobToAdd);
          }
        } 
        // If interest is false or null, remove from likedJobs
        else {
          state.likedJobs = state.likedJobs.filter(job => job.id !== jobId);
        }
      });
  },
});

export const { 
  clearErrors, 
  setPage, 
  setPerPage, 
  applyToJob,
  updateFilters,
  updateFilterCategory,
  toggleFilter,
  clearAllFilters,
  updateSavedJobs // Export the new reducer action
} = jobsSlice.actions

export default jobsSlice.reducer