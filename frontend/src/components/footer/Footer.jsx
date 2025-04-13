
import { Briefcase } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { companyInfo, footerLinks, socialLinks } from "./data/footerSectionData";

const Footer = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [location.pathname]);

  return (
    <footer className="bg-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Logo & About Section */}
          <div className="space-y-6">
            <div className="flex items-center">
              <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-r from-${companyInfo.logo.gradientFrom} to-${companyInfo.logo.gradientTo} flex items-center justify-center mr-2`}>
                <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <span className="text-xl sm:text-2xl font-bold text-gray-800">
                {companyInfo.name}
              </span>
            </div>
            <p className="text-gray-600 text-sm sm:text-base">
              {companyInfo.slogan}
              <br />
              {companyInfo.subSlogan}
            </p>
            <div className="flex space-x-6">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="text-gray-500 hover:text-blue-600 transition duration-200"
                >
                  <span className="sr-only">{social.name}</span>
                  <svg
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    {/* Add corresponding SVG path here */}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {footerLinks.map((section, index) => (
              <div key={index}>
                <h3 className="text-sm font-semibold text-gray-600 tracking-wider uppercase">
                  {section.title}
                </h3>
                <ul className="mt-4 space-y-4">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      {link.href.startsWith("#") ? (
                        <a
                          href={link.href}
                          className="text-sm sm:text-base text-gray-500 hover:text-gray-900 transition duration-200"
                        >
                          {link.name}
                        </a>
                      ) : (
                        <Link
                          to={link.href}
                          className="text-sm sm:text-base text-gray-500 hover:text-gray-900 transition duration-200"
                        >
                          {link.name}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Copyright Section */}
        <div className="mt-12 border-t border-gray-200 pt-8 text-center">
          <p className="text-sm sm:text-base text-gray-500">
            &copy; {new Date().getFullYear()} {companyInfo.copyright}. All
            rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
