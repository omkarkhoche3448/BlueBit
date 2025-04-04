import { motion } from "framer-motion";
import { Home, Search, FileText, Bookmark, User } from "lucide-react";

function MobileNavigation() {
  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.9, duration: 0.5 }}
      className="sticky bottom-0 bg-white border-t border-gray-200 px-2 py-3 flex justify-around items-center"
    >
      {[
        { text: "Home", Icon: Home, href: "/home" },
        { text: "Search", Icon: Search, href: "/search" },
        { text: "Resume", Icon: FileText, href: "/resume-parser" },
        { text: "Saved", Icon: Bookmark, href: "/saved" },
        { text: "Profile", Icon: User, href: "/edit-preferences" }
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
            <item.Icon
              className={`w-6 h-6 ${isActive ? 'text-blue-600' : 'text-gray-600'}`}
              strokeWidth={isActive ? 2.5 : 2}
            />
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