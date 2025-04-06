import { useEffect, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { fetchSavedJobs } from "../slices/jobsSlice"
import JobCard from "../components/common/JobCard"
import { Bookmark } from "lucide-react"
import MobileNavigation from "../components/common/MobileNavigation"
import { useUser } from "@clerk/clerk-react"
import { toast } from "react-hot-toast"

function SavedJobsPage() {
  const dispatch = useDispatch()
  const { user } = useUser()
  const savedJobs = useSelector((state) => state.jobs.savedJobs || [])
  const status = useSelector((state) => state.jobs.savedJobsStatus)
  const error = useSelector((state) => state.jobs.savedJobsError)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadSavedJobs = async () => {
      if (user?.id) {
        setIsLoading(true)
        try {
          await dispatch(fetchSavedJobs(user.id)).unwrap()
          console.log("Saved jobs loaded successfully")
        } catch (err) {
          console.error("Failed to load saved jobs:", err)
          toast.error("Failed to load saved jobs. Please try again.")
        } finally {
          setIsLoading(false)
        }
      }
    }
    
    loadSavedJobs()
  }, [dispatch, user?.id])

  // Calculate the correct count safely
  const jobCount = Array.isArray(savedJobs) ? savedJobs.length : 0

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 max-w-7xl mx-auto pb-16 sm:pb-0">
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
          <Bookmark className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
          Saved Jobs
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {isLoading ? "Loading..." : `${jobCount} ${jobCount === 1 ? "job" : "jobs"} saved`}
        </p>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 text-center">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Loading saved jobs...</h3>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 text-center text-red-600">
          <h3 className="text-base sm:text-lg font-medium mb-2">Error loading saved jobs</h3>
          <p>{error}</p>
          <button 
            onClick={() => dispatch(fetchSavedJobs(user?.id))}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      ) : jobCount === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 text-center">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No saved jobs yet</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4">Save jobs you're interested in to view them later.</p>
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            Browse Jobs
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {savedJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
      
      <MobileNavigation />
    </div>
  )
}

export default SavedJobsPage
