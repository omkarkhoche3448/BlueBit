export const ImprovementTips = ({ tips }) => {
    // Check if tips is a string and split it into an array by line breaks
    const tipsArray = typeof tips === 'string' 
      ? tips.split('\n').filter(tip => tip.trim() !== '')
      : Array.isArray(tips) ? tips : [];
  
    return (
      <ul className="space-y-2 list-disc pl-5">
        {tipsArray.map((tip, index) => (
          <li key={index} className="text-gray-700">
            {/* Remove numbering if it exists */}
            {tip.replace(/^\d+\.\s*\*\*/, '**')}
          </li>
        ))}
      </ul>
    );
  };