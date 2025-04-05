import React from "react";
import { X } from "lucide-react";

/**
 * A reusable modal component
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call when modal is closed
 * @param {string} props.title - Modal title
 * @param {string} props.titleColor - Color class for the title (default: text-gray-800)
 * @param {React.ReactNode} props.children - Modal content
 * @param {React.ReactNode} props.footer - Modal footer content
 * @param {string} props.size - Modal size (sm, md, lg, xl)
 * @param {boolean} props.showCloseButton - Whether to show the close button
 * @param {boolean} props.closeOnBackdropClick - Whether to close the modal when clicking outside
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  titleColor = "text-gray-800",
  children,
  footer,
  size = "md",
  showCloseButton = true,
  closeOnBackdropClick = true,
}) => {
  if (!isOpen) return null;

  // Define size classes
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    full: "max-w-full",
  };

  const handleBackdropClick = (e) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-transparent bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-[9999]" // Changed z-50 to z-[9999]
      onClick={handleBackdropClick}
    >
      <div className={`bg-white rounded-lg p-6 w-full ${sizeClasses[size]} animate-in fade-in zoom-in-95 duration-200 relative z-[10000]`}> {/* Added relative and z-[10000] */}
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-xl font-bold ${titleColor}`}>{title}</h3>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div>{children}</div>

        {/* Footer */}
        {footer && <div className="mt-6">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;