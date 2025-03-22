export const LineByLineFeedback = ({ feedback }) => {
    return (
      <div className="space-y-6">
        {feedback.map((item, index) => (
          <div key={index} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
            <div className="mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mr-2">
                Line {item.line_number}
              </span>
            </div>
            <div className="mb-2">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Original Text:</h4>
              <p className="text-gray-700 bg-gray-50 p-2 rounded">{item.original_text}</p>
            </div>
            <div className="mb-2">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Suggestion:</h4>
              <p className="text-green-700 bg-green-50 p-2 rounded">{item.suggestion}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Reason:</h4>
              <p className="text-gray-600 italic">{item.reason}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };
  