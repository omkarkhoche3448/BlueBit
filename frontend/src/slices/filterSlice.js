import { createSlice } from "@reduxjs/toolkit"

const filterSlice = createSlice({
  name: "filters",
  initialState: {
    searchTerm: "",
    jobType: "",
    location: "",
    experienceLevel: "",
    salaryRange: "",
    datePosted: "",
    sortBy: "relevance",
  },
  reducers: {
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload
    },
    setJobType: (state, action) => {
      state.jobType = action.payload
    },
    setLocation: (state, action) => {
      state.location = action.payload
    },
    setExperienceLevel: (state, action) => {
      state.experienceLevel = action.payload
    },
    setSalaryRange: (state, action) => {
      state.salaryRange = action.payload
    },
    setDatePosted: (state, action) => {
      state.datePosted = action.payload
    },
    setSortBy: (state, action) => {
      state.sortBy = action.payload
    },
    clearFilters: (state) => {
      state.jobType = ""
      state.location = ""
      state.experienceLevel = ""
      state.salaryRange = ""
      state.datePosted = ""
      state.searchTerm = ""
      state.sortBy = "relevance"
    },
  },
})

export const {
  setSearchTerm,
  setJobType,
  setLocation,
  setExperienceLevel,
  setSalaryRange,
  setDatePosted,
  setSortBy,
  clearFilters,
} = filterSlice.actions

export default filterSlice.reducer

