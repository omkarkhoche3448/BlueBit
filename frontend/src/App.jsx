import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import JobDetailsPage from "./pages/JobDetailsPage";
import ResumeParserPage from "./pages/ResumeParserPage";
import ResumeCreater from "./pages/ResumeCreater";
import Layout from "./components/layout/Layout";
import SavedJobsPage from "./pages/SavedJobsPage";


function App() {
  return (
    <>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/job" element={<JobDetailsPage />} />
          <Route path="/resume-parser" element={<ResumeParserPage />} />
          <Route path="/create-resume" element={<ResumeCreater />} />
          <Route path="/saved" element={<SavedJobsPage />} />
        </Routes>
      </Layout>
    </>
  );
}

export default App;
