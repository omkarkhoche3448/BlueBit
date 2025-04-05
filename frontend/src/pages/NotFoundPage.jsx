import React from 'react';
import { Link } from 'react-router-dom';
import notFoundImage from "../assets/404444.png";

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="mb-12">
          <div className="flex justify-center items-center mb-6 ">
            <img
              src={notFoundImage}
              alt="Not Found"
              className="md:h-[60vh] object-contain rounded-2xl shadow-md "
            />
          </div>
          <p className="text-lg font-medium text-blue-600">
            We're working on it!
          </p>
        </div>
        <Link 
          to="/" 
          className="bg-blue-600 hover:bg-blue-700 px-4 py-4 rounded-lg text-white font-semibold text-lg transition-all duration-200 ease-in-out"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;