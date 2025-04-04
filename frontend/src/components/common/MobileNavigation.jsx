import { motion } from "framer-motion";

function MobileNavigation() {
  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.9, duration: 0.5 }}
      className="sticky bottom-0 bg-white border-t border-gray-200 px-2 py-3 flex justify-around items-center"
    >
      {[
        { text: "Home", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", href: "/home" },
        { text: "Search", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", href: "/search" },
        { text: "Resume", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", href: "/resume-parser" },
        { text: "Saved", icon: "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z", href: "/saved" },
        { text: "Profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", href: "/edit-preferences" }
      ].map((item, index) => {
        // Check if this is the active page
        const isActive = window.location.pathname === item.href || 
                        (window.location.pathname === '/' && item.href === '/home');
        
        return (
          <a 
            key={index} 
            href={item.href} 
            className="flex flex-col items-center"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = item.href;
            }}
          >
            <svg 
              className={`w-6 h-6 ${isActive ? 'text-blue-600 fill-blue-600' : 'text-gray-600'}`} 
              fill={isActive ? "currentColor" : "none"} 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}></path>
            </svg>
            <span className={`mt-1 text-xs font-medium ${isActive ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}>
              {item.text}
            </span>
          </a>
        );
      })}
    </motion.div>
  );
}

export default MobileNavigation;