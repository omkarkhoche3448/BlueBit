import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import JobDetailsPage from "./pages/JobDetailsPage";
import ResumeParserPage from "./pages/ResumeParserPage";
import ResumeCreater from "./pages/ResumeCreater";
import Layout from "./components/layout/Layout";


function App() {
  return (
    <>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/job" element={<JobDetailsPage />} />
          <Route path="/resume-parser" element={<ResumeParserPage />} />
          <Route path="/create-resume" element={<ResumeCreater />} />
        </Routes>
      </Layout>
    </>
  );
}

export default App;
