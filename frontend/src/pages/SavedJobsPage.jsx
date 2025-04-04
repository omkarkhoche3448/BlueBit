import { useSelector } from "react-redux"
import JobCard from "../components/common/JobCard"
import { Bookmark } from "lucide-react"
import { AutoSizer, List } from 'react-virtualized'
import MobileNavigation from "../components/common/MobileNavigation" // Import the MobileNavigation component

function SavedJobsPage() {
  const savedJobs = useSelector((state) => state.jobs.savedJobs)

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 max-w-7xl mx-auto pb-16"> {/* Added pb-16 to create space for the mobile nav */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
          <Bookmark className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
          Saved Jobs
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {savedJobs.length} {savedJobs.length === 1 ? "job" : "jobs"} saved
        </p>
      </div>

      {savedJobs.length === 0 ? (
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
        <div className="h-[calc(100vh-250px)]"> {/* Adjusted height to account for mobile nav */}
          <AutoSizer>
            {({ height, width }) => (
              <List
                height={height}
                width={width}
                rowCount={savedJobs.length}
                rowHeight={200}
                rowRenderer={({ index, style }) => (
                  <div style={style}>
                    <JobCard key={savedJobs[index].id} job={savedJobs[index]} />
                  </div>
                )}
              />
            )}
          </AutoSizer>
        </div>
      )}
      
      {/* Add the MobileNavigation component */}
      <MobileNavigation />
    </div>
  )
}

export default SavedJobsPage

