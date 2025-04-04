import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { FileUploader } from "../components/resumeparser/FileUploader";
import { ErrorDisplay } from "../components/resumeparser/ErrorDisplay";
import { SubmitButton } from "../components/resumeparser/SubmitButton";

const API_URL_BACKEND = import.meta.env.VITE_API_URL_BACKEND;


function ResumeUploadPage() {
  const { user, isSignedIn } = useUser();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasExistingResume, setHasExistingResume] = useState(false);
  const [processing, setProcessing] = useState(false); // New state for processing status

  useEffect(() => {
    // Check if user already has a resume
    if (isSignedIn && user?.id) {
      checkExistingResume();
    }
  }, [isSignedIn, user]);

  const checkExistingResume = async () => {
    try {
      const response = await fetch(`${API_URL_BACKEND}/users/${user.id}/resume`);
      if (response.ok) {
        const data = await response.json();
        setHasExistingResume(data.hasResume);
      }
    } catch (error) {
      console.error("Error checking existing resume:", error);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError("Please select a file to upload");
      return;
    }
    
    setLoading(true);
    setError(null);
    setProcessing(true); // Set processing to true when upload starts
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch(`${API_URL_BACKEND}/users/${user.id}/resume`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload resume");
      }
      
      // On success, navigate to home page
      navigate("/home");
    } catch (err) {
      setError(err.message || "Failed to upload resume");
      setProcessing(false); // Reset processing state on error
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate("/home");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Upload Your Resume
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {hasExistingResume 
            ? "You already have a resume uploaded. Upload a new one to replace it." 
            : "Upload your resume to help us find the best job matches for you."}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {processing ? (
            <div className="text-center py-6">
              <div className="mb-4">
                <svg className="animate-spin h-10 w-10 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Processing your resume</h3>
              <p className="mt-2 text-sm text-gray-600">Please stand by while we process your file...</p>
            </div>
          ) : (
            <form onSubmit={handleUpload} className="space-y-6">
              <div>
                <FileUploader file={file} setFile={setFile} error={error} />
              </div>

              {error && <ErrorDisplay error={error} />}

              <div className="flex flex-col space-y-3">
                <SubmitButton loading={loading} disabled={!file} />
                
                <button
                  type="button"
                  onClick={handleSkip}
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Skip for now
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResumeUploadPage;