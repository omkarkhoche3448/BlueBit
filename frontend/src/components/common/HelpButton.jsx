import React, { useState } from "react";
import { HelpCircle } from "lucide-react";
import HelpCenterModal from "./HelpCenterModal";

const HelpButton = () => {
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsHelpModalOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all"
        aria-label="Open Help Center"
      >
        <HelpCircle className="h-6 w-6" />
      </button>

      <HelpCenterModal 
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </>
  );
};

export default HelpButton;