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
    
    // Send the filters, pagination params, and Clerk ID in the request body
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        filters,
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
      
      // Rest of the extraReducers remain the same
  },
})

export const { toggleSaveJob, clearErrors, setPage, setPerPage, applyToJob } = jobsSlice.actions

export default jobsSlice.reducer