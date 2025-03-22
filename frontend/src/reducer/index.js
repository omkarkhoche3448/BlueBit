import { combineReducers } from "@reduxjs/toolkit";
import jobsReducer from "../slices/jobsSlice"
import filterReducer from "../slices/filterSlice"

const rootReducer = combineReducers({
    jobs: jobsReducer,
    filters: filterReducer,
})

export default rootReducer;