function CollapsibleSection({ 
  title, 
  children, 
  isExpanded, 
  toggleExpanded, 
  disabled,
  className = '',
  titleClassName = ''
}) {
  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      <button
        onClick={toggleExpanded}
        disabled={disabled}
        className={`w-full px-6 py-4 text-left font-semibold flex items-center justify-between ${titleClassName}`}
      >
        <span>{title}</span>
        <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {isExpanded && (
        <div className="px-6 py-4 border-t">
          {children}
        </div>
      )}
    </div>
  );
}

export default CollapsibleSection;
