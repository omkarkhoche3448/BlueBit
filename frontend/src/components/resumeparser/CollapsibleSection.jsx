import { ChevronDown, ChevronUp } from "lucide-react";

export const CollapsibleSection = ({ title, isExpanded, toggleExpanded, children }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <button className="w-full flex items-center justify-between" onClick={toggleExpanded}>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>

      {isExpanded && <div className="mt-4">{children}</div>}
    </div>
  );
};
