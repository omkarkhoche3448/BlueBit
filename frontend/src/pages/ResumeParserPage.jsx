import { useState } from "react";
import { analyzeResume } from "../services/resumeService";
import { FileUploader } from "../components/resumeparser/FileUploader";
import { ErrorDisplay } from "../components/resumeparser/ErrorDisplay";
import { SubmitButton } from "../components/resumeparser/SubmitButton";
import { ScoreDisplay } from "../components/resumeparser/ScoreDisplay";
import { CollapsibleSection } from "../components/resumeparser/CollapsibleSection";
import { SubScores } from "../components/resumeparser/SubScores";
import { ImprovementTips } from "../components/resumeparser/ImprovementTips";
import { LineByLineFeedback } from "../components/resumeparser/LineByLineFeedback";
import { KeywordSuggestions } from "../components/resumeparser/KeywordSuggestions";
import { ActionVerbAlternatives } from "../components/resumeparser/ActionVerbAlternatives";

function ResumeParserPage() {
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
          <SubmitButton loading={loading} disabled={!file} />
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
            isExpanded={expandedSections.lineByLine}
            toggleExpanded={() => toggleSection("lineByLine")}
          >
            <LineByLineFeedback feedback={result.line_by_line_feedback} />
          </CollapsibleSection>
          
          <CollapsibleSection 
            title="Keyword Suggestions" 
            isExpanded={expandedSections.keywords}
            toggleExpanded={() => toggleSection("keywords")}
          >
            <KeywordSuggestions suggestions={result.keyword_suggestions} />
          </CollapsibleSection>
          
          <CollapsibleSection 
            title="Action Verb Alternatives" 
            isExpanded={expandedSections.actionVerbs}
            toggleExpanded={() => toggleSection("actionVerbs")}
          >
            <ActionVerbAlternatives alternatives={result.action_verb_alternatives} />
          </CollapsibleSection>
        </div>
      )}
    </div>
  );
}

export default ResumeParserPage;