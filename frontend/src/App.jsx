import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import JobDetailsPage from "./pages/JobDetailsPage";
import ResumeParserPage from "./pages/ResumeParserPage"


function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/job" element={<JobDetailsPage/>}/>
        <Route path="/resume-parser" element={<ResumeParserPage />} />
      </Routes>
    </>
  );
}

export default App;
