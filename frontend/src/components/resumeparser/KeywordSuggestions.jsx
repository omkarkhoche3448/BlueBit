export const KeywordSuggestions = ({ suggestions }) => {
    return (
      <div className="space-y-6">
        {suggestions.map((category, index) => (
          <div key={index} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
            <h3 className="font-medium text-gray-900 mb-2">{category.category}</h3>
            <div className="flex flex-wrap gap-2">
              {category.missing_keywords.map((keyword, keywordIndex) => (
                <span
                  key={keywordIndex}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };