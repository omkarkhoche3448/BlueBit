import React from 'react';
import { Link } from 'react-router-dom';
import notFoundImage from "../assets/4044.png";
import mobilenotFoundImage from "../assets/404.png";

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center md:md:bg-[#f9e4c7]/50 bg-[#f9e4c7] ">
      <div className="text-center">
        <div className="">
          <div className="flex justify-center items-center mb-4">
            <img
              src={notFoundImage}
              alt="Not Found"
              className="hidden md:block md:h-[80vh]  object-contain  "
            />
            <img
              src={mobilenotFoundImage}
              alt="Not Found"
              className="block md:hidden h-fit object-contain  "
            />
          </div>
          <p className="text-lg font-medium text-[#78441c] mb-4">
            We're working on it!
          </p>
        </div>
        <Link 
          to="/" 
          className="bg-[#e2bb7e] px-4 py-3 rounded-lg text-[#78441c] font-semibold text-lg transition-all duration-200 ease-in-out"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;