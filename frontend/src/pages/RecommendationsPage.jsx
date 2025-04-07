import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import JobCard from "../components/common/JobCard";
import RecommendationsSidebar from "../components/common/RecommendationsSidebar";

const API_URL_BACKEND = import.meta.env.VITE_API_URL_BACKEND;

function RecommendationsPage() {
  const { user, isSignedIn } = useUser();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isSignedIn && user?.id) {
      fetchRecommendations();
    }
  }, [isSignedIn, user]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL_BACKEND}/users/${user.id}/recommendations`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch recommendations");
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error("Error fetching recommendations:", err);
      setError("Failed to fetch job recommendations. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Handle when a job is marked as not interested
  const handleNotInterested = (jobId) => {
    setRecommendations((prev) => prev.filter((job) => job.id !== jobId));
  };

  return (
    <div className="container mx-auto max-w-6xl md:px-4 md:py-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Recommended Jobs
        </h1>
        <p className="text-gray-600">
          Jobs that match your skills, experience, and preferences
        </p>
      </div>

      {/* Two-column layout container */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Main content column */}
        <div className="w-full md:w-2/3">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-sm p-4 animate-pulse"
                >
                  <div className="flex items-start">
                    <div className="h-12 w-12 bg-gray-200 rounded mr-4"></div>
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                      <div className="flex space-x-2">
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <div className="text-red-600 text-lg font-medium">
                {error}
              </div>
              <button
                onClick={fetchRecommendations}
                className="mt-2 text-sm font-medium text-red-700 hover:text-red-800"
              >
                Try again
              </button>
            </div>
          ) : recommendations.length > 0 ? (
            <div className="space-y-6">
              {recommendations.map((job) => (
                <div
                  key={job.id}
                  className="bg-amber-200 rounded-lg p-2 shadow-md"
                >
                  <JobCard
                    job={job}
                    onNotInterested={handleNotInterested}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-lg shadow-sm">
              <h3 className="text-lg font-medium text-gray-900">
                No recommendations found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                We couldn't find job recommendations for you at this time.
              </p>
              <div className="mt-6 space-y-2">
                <button
                  onClick={fetchRecommendations}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Refresh recommendations
                </button>
                <div>
                  <a
                    href="/edit-preferences"
                    className="mt-2 inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    Update your preferences
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar column */}
        <div className="w-full md:w-1/3 md:block hidden">
          <RecommendationsSidebar />
        </div>
      </div>
    </div>
  );
}

export default RecommendationsPage;