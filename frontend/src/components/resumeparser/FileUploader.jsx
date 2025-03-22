import { useState } from "react";
import { Upload, FileText } from "lucide-react";

export const FileUploader = ({ file, setFile, error }) => {
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (
        selectedFile.type === "application/pdf" ||
        selectedFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        setFile(selectedFile);
      } else {
        setFile(null);
        // Instead of throwing an error, we should use the setError function from parent
        // This would be passed through props in a complete implementation
        alert("Please upload a PDF or DOCX file");
      }
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
      {file ? (
        <div className="flex items-center justify-center space-x-2">
          <FileText className="h-8 w-8 text-blue-500" />
          <div className="text-left">
            <p className="font-medium text-gray-900">{file.name}</p>
            <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
          </div>
          <button type="button" className="ml-4 text-red-600 hover:text-red-800" onClick={() => setFile(null)}>
            Remove
          </button>
        </div>
      ) : (
        <div>
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 mb-1">Drag and drop your resume here, or</p>
          <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
            Browse Files
            <input type="file" className="hidden" accept=".pdf,.docx" onChange={handleFileChange} />
          </label>
          <p className="text-xs text-gray-500 mt-2">Supported formats: PDF, DOCX</p>
        </div>
      )}
    </div>
  );
};