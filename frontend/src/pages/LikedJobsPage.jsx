import { useEffect, useState } from "react"
import JobCard from "../components/common/JobCard"
import { Heart } from "lucide-react"

const API_URL_BACKEND = import.meta.env.VITE_API_URL_BACKEND;

function LikedJobsPage() {
  const [likedJobs, setLikedJobs] = useState([]);

  const fetchLikedJobs = async () => {
    const clerkId = window.Clerk?.user?.id || null;
    try {
      const response = await fetch(`${API_URL_BACKEND}/users/${clerkId}/interested-jobs`);
      if (!response.ok) {
        throw new Error("Failed to fetch liked jobs");
      }
      const data = await response.json();
      setLikedJobs(data.jobs);
    } catch (error) {
      console.error("Error fetching liked jobs:", error);
      setLikedJobs([]);
    }
  };
    
  useEffect(() => {
    fetchLikedJobs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Heart className="h-6 w-6 mr-2" />
          Liked Jobs
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {likedJobs.length} {likedJobs.length === 1 ? "job" : "jobs"} liked
        </p>
      </div>

      {likedJobs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No liked jobs yet</h3>
          <p className="text-gray-600 mb-4">Like jobs you're interested in to view them later.</p>
          <a
            href="/search"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Browse Jobs
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {likedJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  )
}

export default LikedJobsPage
