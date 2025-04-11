import React from "react";
import Modal from "./Modal";

/**
 * A confirmation modal component
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call when modal is closed
 * @param {string} props.title - Modal title
 * @param {string} props.titleColor - Color class for the title
 * @param {string} props.message - Confirmation message
 * @param {string} props.confirmText - Text for confirm button
 * @param {string} props.cancelText - Text for cancel button
 * @param {Function} props.onConfirm - Function to call when confirmed
 * @param {boolean} props.isLoading - Whether the confirm action is loading
 * @param {string} props.loadingText - Text to show when loading
 * @param {string} props.confirmButtonClass - Class for confirm button
 * @param {string} props.cancelButtonClass - Class for cancel button
 */
const ConfirmationModal = ({
  isOpen,
  onClose,
  title,
  titleColor = "text-red-600",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  isLoading = false,
  loadingText = "Processing...",
  confirmButtonClass = "bg-red-600 hover:bg-red-700 text-white",
  cancelButtonClass = "bg-gray-200 hover:bg-gray-300 text-gray-800",
}) => {
  const footer = (
    <div className="flex justify-end space-x-3">
      <button
        onClick={onClose}
        className={`px-4 py-2 rounded-md transition-colors ${cancelButtonClass}`}
        disabled={isLoading}
      >
        {cancelText}
      </button>
      <button
        onClick={onConfirm}
        className={`px-4 py-2 rounded-md transition-colors flex items-center ${confirmButtonClass}`}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
            {loadingText}
          </>
        ) : (
          confirmText
        )}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      titleColor={titleColor}
      footer={footer}
      size="md"
      closeOnBackdropClick={!isLoading}
      showCloseButton={!isLoading}
    >
      <p className="text-gray-700">{message}</p>
    </Modal>
  );
};

export default ConfirmationModal;