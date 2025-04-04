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

function ResumeParserPage() {
  const { isPro, isLoading } = useProStatus();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    subScores: true,
    comments: true,
    lineByLine: false,
    keywords: false,
    actionVerbs: false,
  });

  // Load saved results from localStorage when component mounts
  useEffect(() => {
    const savedResult = localStorage.getItem('resumeAnalysisResult');
    const savedExpandedSections = localStorage.getItem('resumeExpandedSections');
    
    if (savedResult) {
      setResult(JSON.parse(savedResult));
    }
    
    if (savedExpandedSections) {
      setExpandedSections(JSON.parse(savedExpandedSections));
    }
  }, []);

  // Save results to localStorage whenever they change
  useEffect(() => {
    if (result) {
      localStorage.setItem('resumeAnalysisResult', JSON.stringify(result));
    }
  }, [result]);

  // Save expanded sections state to localStorage
  useEffect(() => {
    localStorage.setItem('resumeExpandedSections', JSON.stringify(expandedSections));
  }, [expandedSections]);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
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
      // Result will be saved to localStorage via the useEffect
    } catch (err) {
      setError(err.message || "An error occurred while analyzing the resume");
    } finally {
      setLoading(false);
    }
  };

  // Add a function to clear saved results
  const handleClearResults = () => {
    setResult(null);
    localStorage.removeItem('resumeAnalysisResult');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Resume Parser & ATS Analyzer</h1>
        <p className="text-gray-600 mb-6">
          Upload your resume to get an AI-powered analysis of how well it will perform with Applicant Tracking Systems
          (ATS). Our tool will score your resume and provide detailed feedback to help you improve it.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FileUploader 
            file={file} 
            setFile={handleFileChange} 
            error={error} 
          />
          <ErrorDisplay error={error} />
          <div className="flex space-x-4">
            <SubmitButton loading={loading} disabled={!file} />
            {result && (
              <button
                type="button"
                onClick={handleClearResults}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Clear Results
              </button>
            )}
          </div>
        </form>
      </div>

      {result && (
        <div className="space-y-6">
          <ScoreDisplay score={result.score} assessment={result.overall_assessment} />
          
          <CollapsibleSection 
            title="Detailed Scores" 
            isExpanded={expandedSections.subScores}
            toggleExpanded={() => toggleSection("subScores")}
          >
            <SubScores subScores={result.sub_scores} comments={result.comments} />
          </CollapsibleSection>
          
          <CollapsibleSection 
            title="Improvement Tips" 
            isExpanded={expandedSections.comments}
            toggleExpanded={() => toggleSection("comments")}
          >
            <ImprovementTips tips={result.improvement_tips} />
          </CollapsibleSection>
          
          <CollapsibleSection 
            title="Line-by-Line Feedback"
            isExpanded={expandedSections.lineByLine && isPro}
            toggleExpanded={() => isPro && toggleSection("lineByLine")}
            disabled={!isPro}
            className={!isPro ? 'opacity-50 cursor-not-allowed group' : ''}
            titleClassName={!isPro ? 'group-hover:after:content-["Pro_Only"] group-hover:after:ml-2 group-hover:after:text-sm group-hover:after:text-blue-500 group-hover:after:font-normal' : ''}
          >
            {isLoading ? (
              <div className="text-sm text-gray-500 p-4">Loading...</div>
            ) : !isPro ? (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-700 font-medium mb-2">Pro Feature</p>
                <p className="text-gray-600 mb-3">
                  Get detailed line-by-line feedback to perfect every part of your resume.
                </p>
                <a 
                  href="/pricing" 
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Upgrade to Pro
                </a>
              </div>
            ) : (
              <LineByLineFeedback feedback={result.line_by_line_feedback} />
            )}
          </CollapsibleSection>
          
          <CollapsibleSection 
            title="Keyword Suggestions"
            isExpanded={expandedSections.keywords && isPro}
            toggleExpanded={() => isPro && toggleSection("keywords")}
            disabled={!isPro}
            className={!isPro ? 'opacity-50 cursor-not-allowed group' : ''}
            titleClassName={!isPro ? 'group-hover:after:content-["Pro_Only"] group-hover:after:ml-2 group-hover:after:text-sm group-hover:after:text-blue-500 group-hover:after:font-normal' : ''}
          >
            {isLoading ? (
              <div className="text-sm text-gray-500 p-4">Loading...</div>
            ) : !isPro ? (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-700 font-medium mb-2">Pro Feature</p>
                <p className="text-gray-600 mb-3">
                  Access industry-specific keyword suggestions to boost your resume's ATS score.
                </p>
                <a 
                  href="/pricing" 
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Upgrade to Pro
                </a>
              </div>
            ) : (
              <KeywordSuggestions suggestions={result.keyword_suggestions} />
            )}
          </CollapsibleSection>
          
          <CollapsibleSection 
            title="Action Verb Alternatives"
            isExpanded={expandedSections.actionVerbs && isPro}
            toggleExpanded={() => isPro && toggleSection("actionVerbs")}
            disabled={!isPro}
            className={!isPro ? 'opacity-50 cursor-not-allowed group' : ''}
            titleClassName={!isPro ? 'group-hover:after:content-["Pro_Only"] group-hover:after:ml-2 group-hover:after:text-sm group-hover:after:text-blue-500 group-hover:after:font-normal' : ''}
          >
            {isLoading ? (
              <div className="text-sm text-gray-500 p-4">Loading...</div>
            ) : !isPro ? (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-700 font-medium mb-2">Pro Feature</p>
                <p className="text-gray-600 mb-3">
                  Get access to powerful Action Verb suggestions to make your resume stand out.
                </p>
                <a 
                  href="/pricing" 
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Upgrade to Pro
                </a>
              </div>
            ) : (
              <ActionVerbAlternatives alternatives={result.action_verb_alternatives} />
            )}
          </CollapsibleSection>
        </div>
      )}
    </div>
  );
}

export default ResumeParserPage;