import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Briefcase,
  User,
  Bell,
  MessageSquare,
  Menu,
  Search,
  X,
  Award,
  Settings,
} from "lucide-react";
import Logo from "../../assets/Logo2.png";
import { UserButton } from "@clerk/clerk-react";
import { useClerk } from "@clerk/clerk-react";
import SettingsModal from "../common/SettingsModal";
import { useUser } from "@clerk/clerk-react";


function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const { openUserProfile, signOut } = useClerk();
  const { user } = useUser();

  const location = useLocation();
  const navigate = useNavigate();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const isHomePage = location.pathname === "/home";
  // const isResumeParserPage = location.pathname === "/resume-parser";
  const isSearchPage = location.pathname === "/search";
  // const isResumeCreater = location.pathname === "/create-resume";
  // const isPreferences = location.pathname === "/preferences";

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    } else {
      navigate("/search");
    }
  };

  const navLinks = [
    { to: "/home", label: "Jobs", icon: Briefcase, active: isHomePage },
    { to: "/search", label: "Search Jobs", icon: Search, active: isSearchPage },
    { to: "/create-resume", label: "Create Resume", icon: Bell },
    { to: "/recommendations", label: "Recommend Jobs", icon: Award },
    { to: "/resume-parser", label: "Resume Analyzer", icon: MessageSquare },
  ];

  const getLinkClasses = (isActive) =>
    `flex items-center px-1 pt-1 text-sm md:text-[15px] font-medium ${
      isActive
        ? "text-blue-600 border-b-2 border-blue-600"
        : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
    }`;

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0">
                <img src={Logo} className="w-fit h-10 md:mr-36" alt="Logo" />
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex ml-3 space-x-6 ">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={getLinkClasses(link.active)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* {!isSearchPage &&
            !isHomePage &&
            !isResumeParserPage &&
            !isResumeCreater &&
            !isPreferences && (
              <div className="hidden md:block flex-1 max-w-[240px] mx-auto">
                <form onSubmit={handleSearch} className="w-full">
                  <div className="relative w-full max-w-md mx-auto">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Search jobs, skills, companies..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                    />
                  </div>
                </form>
              </div>
            )} */}

            {/* Desktop Icons */}
            <div className="hidden md:flex items-center space-x-4">
              {/* <Link
              to="/messages"
              className="text-gray-500 hover:text-gray-700"
              title="Messages"
            >
              <MessageSquare className="h-6 w-6" />
            </Link> */}
              {/* <Link to="/notifications" className="text-gray-500 hover:text-gray-700" title="Notifications">
              <Bell className="h-6 w-6" />
            </Link> */}
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                <img
                  src={user.imageUrl}
                  alt="User Profile"
                  className="h-8 w-8 object-contain rounded-full"
                />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden">
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 outline-none"
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                    link.active
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <link.icon className="mr-3 h-5 w-5" />
                  <span>{link.label}</span>
                </Link>
              ))}
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <User className="mr-3 h-5 w-5" />
                View Profile
              </button>
            </div>
          </div>
        )}
      </header>
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </>
  );
}

export default Header;
