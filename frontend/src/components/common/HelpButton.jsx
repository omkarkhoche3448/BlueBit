import React, { useState, useEffect } from "react";
import { HelpCircle } from "lucide-react";
import HelpCenterModal from "./HelpCenterModal";

const HelpButton = () => {
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  return (
    <>
      <button
        onClick={() => setIsHelpModalOpen(true)}
        className={`
          fixed z-50 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all
          ${isMobile ? 'bottom-16 right-4 p-2.5' : 'bottom-6 right-6 p-3'}
        `}
        aria-label="Open Help Center"
      >
        <HelpCircle className={isMobile ? "h-5 w-5" : "h-6 w-6"} />
      </button>

      <HelpCenterModal 
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </>
  );
};

export default HelpButton;