import { getScoreColor, getScoreBackgroundColor } from "../../utils/scoreUtils";

export const ScoreDisplay = ({ score, assessment }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex flex-col md:flex-row items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 mb-4 md:mb-0">ATS Score</h2>
        <div className={`text-center ${getScoreBackgroundColor(score)} rounded-full px-6 py-3`}>
          <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}/100</span>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-medium text-gray-900 mb-2">Overall Assessment</h3>
        <p className="text-gray-700">{assessment}</p>
      </div>
    </div>
  );
};