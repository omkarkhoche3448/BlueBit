import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"

const API_BASE_URL = "http://localhost:8000/api"

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

export const fetchJobs = createAsyncThunk("jobs/fetchJobs", async (filters, { rejectWithValue }) => {
  try {
    // Construct the API URL
    const url = `${API_BASE_URL}/search-jobs`
    
    // Send the filters in the request body
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ filters }),
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

export const fetchJobById = createAsyncThunk("jobs/fetchJobById", async (id, { rejectWithValue }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/job/${id}`)
    
    if (!response.ok) {
      const errorData = await response.json()
      return rejectWithValue(errorData.error || "Failed to fetch job details")
    }

    const data = await response.json()
    return data
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

export const applyToJob = createAsyncThunk("jobs/applyToJob", async (id, { rejectWithValue }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/apply-job/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      return rejectWithValue(errorData.error || "Failed to apply to job")
    }

    return id
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

const jobsSlice = createSlice({
  name: "jobs",
  initialState: {
    jobs: [],
    savedJobs: loadSavedJobsFromStorage(), // Load from localStorage on init
    appliedJobs: [],
    currentJob: null,
    loading: false,
    error: null,
  },
  reducers: {
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
        state.jobs = action.payload
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
      
      // Handle applyToJob
      .addCase(applyToJob.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(applyToJob.fulfilled, (state, action) => {
        state.loading = false
        const jobId = action.payload
        if (!state.appliedJobs.includes(jobId)) {
          state.appliedJobs.push(jobId)
        }
      })
      .addCase(applyToJob.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { toggleSaveJob, clearErrors } = jobsSlice.actions

export default jobsSlice.reducer