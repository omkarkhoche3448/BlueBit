import { useSelector } from "react-redux"
import JobCard from "../components/common/JobCard"
import { Bookmark } from "lucide-react"

function SavedJobsPage() {
  const savedJobs = useSelector((state) => state.jobs.savedJobs)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Bookmark className="h-6 w-6 mr-2" />
          Saved Jobs
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {savedJobs.length} {savedJobs.length === 1 ? "job" : "jobs"} saved
        </p>
      </div>

      {savedJobs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No saved jobs yet</h3>
          <p className="text-gray-600 mb-4">Save jobs you're interested in to view them later.</p>
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
    </div>
  )
}

export default SavedJobsPage

