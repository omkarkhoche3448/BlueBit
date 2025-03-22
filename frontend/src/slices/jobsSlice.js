import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { mockJobs } from "../utils/mockData"

// Simulating API calls with mock data
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const fetchJobs = createAsyncThunk("jobs/fetchJobs", async (filters, { rejectWithValue }) => {
  try {
    // Simulate API call delay
    await delay(1000)

    // Filter jobs based on filters
    let filteredJobs = [...mockJobs]

    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase()
      filteredJobs = filteredJobs.filter(
        (job) =>
          job.title.toLowerCase().includes(searchTerm) ||
          job.company.toLowerCase().includes(searchTerm) ||
          (job.description && job.description.toLowerCase().includes(searchTerm)),
      )
    }

    if (filters.jobType) {
      filteredJobs = filteredJobs.filter((job) => job.job_type === filters.jobType)
    }

    if (filters.location) {
      filteredJobs = filteredJobs.filter((job) => {
        if (filters.location === "remote" && job.is_remote) {
          return true
        }
        return (
          job.location &&
          (job.location.city.toLowerCase().includes(filters.location.toLowerCase()) ||
            job.location.state.toLowerCase().includes(filters.location.toLowerCase()) ||
            job.location.country.toLowerCase().includes(filters.location.toLowerCase()))
        )
      })
    }

    if (filters.experienceLevel) {
      filteredJobs = filteredJobs.filter((job) => {
        // Map experience level to job_level
        const levelMap = {
          entry: ["Entry-Level", "Junior"],
          mid: ["Mid-Level", "Intermediate"],
          senior: ["Senior", "Lead"],
          executive: ["Executive", "Director", "VP", "C-Level"],
        }

        return (
          job.job_level &&
          levelMap[filters.experienceLevel] &&
          levelMap[filters.experienceLevel].some((level) => job.job_level.toLowerCase().includes(level.toLowerCase()))
        )
      })
    }

    if (filters.salaryRange) {
      const [min, max] = filters.salaryRange.split("-")
      if (min && max) {
        filteredJobs = filteredJobs.filter(
          (job) =>
            job.salary &&
            job.salary.min_amount >= Number.parseInt(min) &&
            job.salary.max_amount <= Number.parseInt(max),
        )
      } else if (min) {
        filteredJobs = filteredJobs.filter((job) => job.salary && job.salary.min_amount >= Number.parseInt(min))
      }
    }

    if (filters.datePosted) {
      const now = new Date()
      let cutoffDate

      switch (filters.datePosted) {
        case "today":
          cutoffDate = new Date(now.setDate(now.getDate() - 1))
          break
        case "week":
          cutoffDate = new Date(now.setDate(now.getDate() - 7))
          break
        case "month":
          cutoffDate = new Date(now.setMonth(now.getMonth() - 1))
          break
        default:
          cutoffDate = null
      }

      if (cutoffDate) {
        filteredJobs = filteredJobs.filter((job) => new Date(job.postedDate) >= cutoffDate)
      }
    }

    // Sort jobs
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case "date":
          filteredJobs.sort((a, b) => new Date(b.date_posted) - new Date(a.date_posted))
          break
        case "salary-high":
          filteredJobs.sort(
            (a, b) => ((b.salary && b.salary.max_amount) || 0) - ((a.salary && a.salary.max_amount) || 0),
          )
          break
        case "salary-low":
          filteredJobs.sort(
            (a, b) => ((a.salary && a.salary.min_amount) || 0) - ((b.salary && b.salary.min_amount) || 0),
          )
          break
        default:
          // Default is relevance, no sorting needed
          break
      }
    }

    return filteredJobs
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

export const fetchJobById = createAsyncThunk("jobs/fetchJobById", async (id, { rejectWithValue }) => {
  try {
    // Simulate API call delay
    await delay(800)

    const job = mockJobs.find((job) => job.id === id)

    if (!job) {
      throw new Error("Job not found")
    }

    return job
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

export const applyToJob = createAsyncThunk("jobs/applyToJob", async (id, { rejectWithValue }) => {
  try {
    // Simulate API call delay
    await delay(500)

    // In a real app, this would send application data to the server
    return id
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

const jobsSlice = createSlice({
  name: "jobs",
  initialState: {
    jobs: [],
    savedJobs: [],
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
        state.jobs = action.payload
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
      .addCase(applyToJob.fulfilled, (state, action) => {
        const jobId = action.payload
        if (!state.appliedJobs.includes(jobId)) {
          state.appliedJobs.push(jobId)
        }
      })
  },
})

export const { toggleSaveJob } = jobsSlice.actions

export default jobsSlice.reducer

