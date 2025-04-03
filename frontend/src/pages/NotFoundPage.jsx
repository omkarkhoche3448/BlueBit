import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-blue-600 mb-4">404</h1>
        <h2 className="text-3xl font-semibold mb-8">Page Not Found</h2>
        <p className="text-lg text-gray-600 mb-8">
          We're sorry! The page you're looking for doesn't exist or is temporarily unavailable.
        </p>
        <div className="mb-12">
          <div className="flex justify-center items-center mb-6">
            <div className="relative">
              {/* Engineer animation */}
              <div className="w-20 h-20 relative animate-bounce">
                <div className="w-8 h-8 rounded-full bg-blue-500 absolute top-0 left-6"></div>
                <div className="w-16 h-10 bg-gray-800 absolute top-8 left-2"></div>
                <div className="w-4 h-8 bg-gray-700 absolute top-12 left-2"></div>
                <div className="w-4 h-8 bg-gray-700 absolute top-12 left-14"></div>
                <div className="w-10 h-4 bg-yellow-400 absolute top-18 left-5 animate-pulse"></div>
              </div>
              
              {/* Gear animations */}
              <div className="w-8 h-8 rounded-full border-4 border-gray-400 border-dashed absolute top-6 left-24 animate-spin"></div>
              <div className="w-6 h-6 rounded-full border-4 border-gray-400 border-dashed absolute top-16 right-2 animate-spin-slow"></div>
            </div>
          </div>
          <p className="text-lg font-medium text-blue-600">
            We're working on it!
          </p>
        </div>
        <Link 
          to="/" 
          className="text-gray-800 hover:underline"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;