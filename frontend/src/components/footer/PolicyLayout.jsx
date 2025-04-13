
import Footer from "./Footer";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PolicyLayout = ({ title, children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        <div className={`${location.pathname === '/contact' ? 'max-w-6xl' : 'max-w-3xl'} mx-auto px-4 py-8 sm:px-6 sm:py-12`}>
          <Link 
            to="/" 
            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
          
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">{title}</h1>
          
          <div className="prose prose-blue max-w-none">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PolicyLayout;