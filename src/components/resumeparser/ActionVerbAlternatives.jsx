export const ActionVerbAlternatives = ({ alternatives }) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(alternatives).map(([verb, options]) => (
          <div key={verb} className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Instead of "{verb}"</h3>
            <div className="flex flex-wrap gap-2">
              {options.map((alternative, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700"
                >
                  {alternative}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };