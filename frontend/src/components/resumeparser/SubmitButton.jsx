import { Loader } from "lucide-react";

export const SubmitButton = ({ loading, disabled }) => {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className={`w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
        disabled || loading
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      }`}
    >
      {loading ? (
        <>
          <Loader className="animate-spin h-5 w-5 mr-2" />
          Analyzing Resume...
        </>
      ) : (
        "Analyze Resume"
      )}
    </button>
  );
};
