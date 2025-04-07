import { useState, useEffect } from "react";
import useProStatus from "../hooks/useProStatus";
import { analyzeResume } from "../services/resumeService";
import { FileUploader } from "../components/resumeparser/FileUploader";
import { ErrorDisplay } from "../components/resumeparser/ErrorDisplay";
import { SubmitButton } from "../components/resumeparser/SubmitButton";
import { ScoreDisplay } from "../components/resumeparser/ScoreDisplay";
import CollapsibleSection from "../components/resumeparser/CollapsibleSection";
import { SubScores } from "../components/resumeparser/SubScores";
import { ImprovementTips } from "../components/resumeparser/ImprovementTips";
import { LineByLineFeedback } from "../components/resumeparser/LineByLineFeedback";
import { KeywordSuggestions } from "../components/resumeparser/KeywordSuggestions";
import { ActionVerbAlternatives } from "../components/resumeparser/ActionVerbAlternatives";
import MobileNavigation from "../components/common/MobileNavigation";
import ResumeRightSidebar from "../components/resumeparser/ResumeRightSidebar";
import { Delete } from 'lucide-react';

// Constants
const INITIAL_EXPANDED_SECTIONS = {
  overview: true,
  subScores: true,
  comments: true,
  lineByLine: false,
  keywords: false,
  actionVerbs: false,
};

const STORAGE_KEYS = {
  analysisResult: "resumeAnalysisResult",
  expandedSections: "resumeExpandedSections"
};

// Pro Feature Content Component
const ProFeatureContent = ({ title, description }) => (
  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
    <p className="text-gray-700 font-medium mb-2">Pro Feature</p>
    <p className="text-gray-600 mb-3">{description}</p>
    <a
      href="/pricing"
      className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
    >
      Upgrade to Pro
    </a>
  </div>
);

function ResumeParserPage() {
  const { isPro, isLoading: proStatusLoading } = useProStatus();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [expandedSections, setExpandedSections] = useState(INITIAL_EXPANDED_SECTIONS);

  // Load saved data from localStorage
  useEffect(() => {
    try {
      const savedResult = localStorage.getItem(STORAGE_KEYS.analysisResult);
      const savedExpandedSections = localStorage.getItem(STORAGE_KEYS.expandedSections);

      if (savedResult) setResult(JSON.parse(savedResult));
      if (savedExpandedSections) setExpandedSections(JSON.parse(savedExpandedSections));
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    if (result) {
      localStorage.setItem(STORAGE_KEYS.analysisResult, JSON.stringify(result));
    }
    localStorage.setItem(STORAGE_KEYS.expandedSections, JSON.stringify(expandedSections));
  }, [result, expandedSections]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleFileChange = (selectedFile) => {
    setFile(selectedFile);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await analyzeResume(file);
      setResult(data);
    } catch (err) {
      setError(err.message || "An error occurred while analyzing the resume");
    } finally {
      setLoading(false);
    }
  };

  const handleClearResults = () => {
    setResult(null);
    localStorage.removeItem(STORAGE_KEYS.analysisResult);
  };

  // Render pro feature section content
  const renderProFeatureSection = (title, Component, props) => (
    <CollapsibleSection
      title={title}
      isExpanded={expandedSections[props.sectionKey] && isPro}
      toggleExpanded={() => isPro && toggleSection(props.sectionKey)}
      disabled={!isPro}
      className={!isPro ? "opacity-50 cursor-not-allowed group" : ""}
      titleClassName={!isPro ? 'group-hover:after:content-["Pro_Only"] group-hover:after:ml-2 group-hover:after:text-sm group-hover:after:text-blue-500 group-hover:after:font-normal' : ""}
    >
      {proStatusLoading ? (
        <div className="text-sm text-gray-500 p-4">Loading...</div>
      ) : !isPro ? (
        <ProFeatureContent title={title} description={props.description} />
      ) : (
        <Component {...props} />
      )}
    </CollapsibleSection>
  );

  return (
    <div className="w-full mx-auto pb-20 md:pb-6 px-4 md:px-6">
      <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
        {/* Main Content */}
        <div className="w-full lg:w-2/3">
          {/* Upload Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Resume Parser & ATS Analyzer
            </h1>
            <p className="text-gray-600 mb-6">
              Upload your resume to get an AI-powered analysis of how well it
              will perform with Applicant Tracking Systems (ATS). Our tool will
              score your resume and provide detailed feedback to help you
              improve it.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <FileUploader
                file={file}
                setFile={handleFileChange}
                error={error}
              />
              <ErrorDisplay error={error} />
              <div className="flex space-x-4 h-10 items-center justify-center">
                <SubmitButton loading={loading} disabled={!file} />
                {result && (
                  <button
                    type="button"
                    onClick={handleClearResults}
                    className="px-4 py-2 bg-blue-200 text-gray-700 rounded-md h-10 flex items-center justify-center gap-2"
                  >
                    <Delete />
                    Clear
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Results Section */}
          {result && (
            <div className="space-y-6">
              <ScoreDisplay
                score={result.score}
                assessment={result.overall_assessment}
              />

              {/* Basic Sections */}
              <CollapsibleSection
                title="Detailed Scores"
                isExpanded={expandedSections.subScores}
                toggleExpanded={() => toggleSection("subScores")}
              >
                <SubScores
                  subScores={result.sub_scores}
                  comments={result.comments}
                />
              </CollapsibleSection>

              <CollapsibleSection
                title="Improvement Tips"
                isExpanded={expandedSections.comments}
                toggleExpanded={() => toggleSection("comments")}
              >
                <ImprovementTips tips={result.improvement_tips} />
              </CollapsibleSection>

              {/* Pro Feature Sections */}
              {renderProFeatureSection("Line-by-Line Feedback", LineByLineFeedback, {
                sectionKey: "lineByLine",
                feedback: result.line_by_line_feedback,
                description: "Get detailed line-by-line feedback to perfect every part of your resume."
              })}

              {renderProFeatureSection("Keyword Suggestions", KeywordSuggestions, {
                sectionKey: "keywords",
                suggestions: result.keyword_suggestions,
                description: "Access industry-specific keyword suggestions to boost your resume's ATS score."
              })}

              {renderProFeatureSection("Action Verb Alternatives", ActionVerbAlternatives, {
                sectionKey: "actionVerbs",
                alternatives: result.action_verb_alternatives,
                description: "Get access to powerful Action Verb suggestions to make your resume stand out."
              })}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-1/3 lg:sticky lg:top-6 h-fit md:block hidden">
          <ResumeRightSidebar score={result?.score} />
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 w-full">
        <MobileNavigation />
      </div>
    </div>
  );
}

export default ResumeParserPage;
