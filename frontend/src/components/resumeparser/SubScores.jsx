import { getSubScoreColor, getProgressBarColor } from "../../utils/scoreUtils";

export const SubScores = ({ subScores, comments }) => {
  const maxScores = {
    "Keyword Optimization": 20,
    "Action Verbs": 15,
    "Measurable Achievements": 15,
    "Clarity and Conciseness": 15,
    "Professional Tone": 10,
    "Section Completeness": 10,
    "Length": 10,
    "Format Indicators": 5,
  };

  return (
    <div className="space-y-4">
      {Object.entries(subScores).map(([category, score]) => {
        const maxScore = maxScores[category] || 10;

        return (
          <div key={category} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-900">{category}</span>
              <span className={`font-medium ${getSubScoreColor(score, maxScore)}`}>
                {score}/{maxScore}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full ${getProgressBarColor(score, maxScore)}`}
                style={{ width: `${(score / maxScore) * 100}%` }}
              ></div>
            </div>
            <p className="mt-2 text-sm text-gray-600">{comments[category]}</p>
          </div>
        );
      })}
    </div>
  );
};