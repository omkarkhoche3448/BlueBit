import React from "react";
import ConfirmationModal from "./ConfirmationModal";

/**
 * A reusable sign out confirmation modal
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call when modal is closed
 * @param {Function} props.onSignOut - Function to call when sign out is confirmed
 * @param {boolean} props.isLoading - Whether the sign out action is loading
 */
const SignOutConfirmationModal = ({
  isOpen,
  onClose,
  onSignOut,
  isLoading = false,
}) => {
  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      title="Sign Out"
      titleColor="text-blue-600"
      message="Are you sure you want to sign out of your account?"
      confirmText="Sign Out"
      cancelText="Cancel"
      onConfirm={onSignOut}
      isLoading={isLoading}
      loadingText="Signing out..."
      confirmButtonClass="bg-blue-600 hover:bg-blue-700 text-white"
      cancelButtonClass="bg-gray-200 hover:bg-gray-300 text-gray-800"
    />
  );
};

export default SignOutConfirmationModal;