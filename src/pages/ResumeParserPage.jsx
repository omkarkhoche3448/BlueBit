import { useState, lazy, Suspense } from "react";
import useProStatus from "../hooks/useProStatus";
import { analyzeResume } from "../services/resumeService";
import { FileUploader } from "../components/resumeparser/FileUploader";
import { ErrorDisplay } from "../components/resumeparser/ErrorDisplay";
import { SubmitButton } from "../components/resumeparser/SubmitButton";
import { ScoreDisplay } from "../components/resumeparser/ScoreDisplay";

// Lazy load less critical components
const CollapsibleSection = lazy(() => import("../components/resumeparser/CollapsibleSection"));
const SubScores = lazy(() => import("../components/resumeparser/SubScores"));
const ImprovementTips = lazy(() => import("../components/resumeparser/ImprovementTips"));
const LineByLineFeedback = lazy(() => import("../components/resumeparser/LineByLineFeedback"));
const KeywordSuggestions = lazy(() => import("../components/resumeparser/KeywordSuggestions"));
const ActionVerbAlternatives = lazy(() => import("../components/resumeparser/ActionVerbAlternatives"));

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
    } catch (err) {
      setError(err.message || "An error occurred while analyzing the resume");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Resume Parser & ATS Analyzer</h1>
        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
          Upload your resume to get an AI-powered analysis of how well it will perform with Applicant Tracking Systems
          (ATS). Our tool will score your resume and provide detailed feedback to help you improve it.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <FileUploader 
            file={file} 
            setFile={handleFileChange} 
            error={error} 
          />
          <ErrorDisplay error={error} />
          <SubmitButton loading={loading} disabled={!file} />
        </form>
      </div>

      {result && (
        <div className="space-y-4 sm:space-y-6">
          <ScoreDisplay score={result.score} assessment={result.overall_assessment} />
          
          <Suspense fallback={<div className="animate-pulse h-20 bg-gray-100 rounded-lg"></div>}>
            {/* Collapsible sections with mobile-optimized spacing */}
            <CollapsibleSection 
              title="Detailed Scores" 
              isExpanded={expandedSections.subScores}
              toggleExpanded={() => toggleSection("subScores")}
              className="transition-all duration-200 ease-in-out"
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
          </Suspense>
        </div>
      )}
    </div>
  );
}

export default ResumeParserPage;