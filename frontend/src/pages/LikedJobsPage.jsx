import { useEffect, useState } from "react"
import JobCard from "../components/common/JobCard"
import { Heart } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { fetchLikedJobs } from "../slices/jobsSlice"
import { useUser } from "@clerk/clerk-react"
import MobileNavigation from "../components/common/MobileNavigation"

const API_URL_BACKEND = import.meta.env.VITE_API_URL_BACKEND;

function LikedJobsPage() {
  const dispatch = useDispatch();
  const { user } = useUser();
  const likedJobs = useSelector((state) => state.jobs.likedJobs || []);
  const status = useSelector((state) => state.jobs.status);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      setIsLoading(true);
      dispatch(fetchLikedJobs(user.id))
        .finally(() => setIsLoading(false));
    }
  }, [dispatch, user?.id]);

  // Calculate the correct count safely
  const jobCount = Array.isArray(likedJobs) ? likedJobs.length : 0;

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 max-w-7xl mx-auto pb-16 sm:pb-0">
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
          <Heart className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
          Liked Jobs
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {isLoading ? "Loading..." : `${jobCount} ${jobCount === 1 ? "job" : "jobs"} liked`}
        </p>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 text-center">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Loading liked jobs...</h3>
        </div>
      ) : jobCount === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 text-center">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No liked jobs yet</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4">Like jobs you're interested in to view them later.</p>
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
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
      
      <MobileNavigation />
    </div>
  )
}

export default LikedJobsPage
