import { useState } from "react";
import { Upload, FileText } from "lucide-react";
import { toast } from "react-toastify"; // Import toast

export const FileUploader = ({ file, setFile, error }) => {
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (
        selectedFile.type === "application/pdf" ||
        selectedFile.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        setFile(selectedFile);
      } else {
        setFile(null);
        // Instead of throwing an error, we should use the setError function from parent
        // This would be passed through props in a complete implementation
        toast.error("Please upload a PDF or DOCX file");
      }
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-all hover:border-blue-500 hover:bg-blue-50">
    {file ? (
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gray-50 rounded-lg shadow-md transition-all">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <FileText className="h-10 w-10 text-blue-600 flex-shrink-0" />
          <div className="text-left overflow-hidden">
            <p className="font-semibold text-gray-900 truncate max-w-full">{file.name}</p>
            <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
          </div>
        </div>
        <button
          type="button"
          className="md:px-2 md:py-1 mx-auto rounded-full bg-red-100 hover:bg-red-200 text-red-500 transition-all focus:outline-none focus:ring-2 focus:ring-red-400 flex-shrink-0"
          onClick={() => setFile(null)}
        >
          ✕
        </button>
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center">
        <Upload className="h-14 w-14 text-gray-400 mb-3 animate-bounce" />
        <p className="text-gray-600 mb-2 text-sm font-medium">Drag and drop your resume here, or</p>
        <label className="inline-flex items-center px-5 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-all">
          Browse Files
          <input
            type="file"
            className="hidden"
            accept=".pdf,.docx"
            onChange={handleFileChange}
          />
        </label>
        <p className="text-xs text-gray-500 mt-2">Supported formats: PDF, DOCX (Max 5MB)</p>
      </div>
    )}
  </div>
  );
};