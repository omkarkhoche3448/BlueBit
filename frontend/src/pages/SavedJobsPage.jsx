import { useEffect, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { fetchSavedJobs } from "../slices/jobsSlice"
import JobCard from "../components/common/JobCard"
import { Bookmark } from "lucide-react"
import { AutoSizer, List } from 'react-virtualized'
import MobileNavigation from "../components/common/MobileNavigation"
import { useUser } from "@clerk/clerk-react";

function SavedJobsPage() {
  const dispatch = useDispatch()
  const savedJobs = useSelector((state) => state.jobs.savedJobs || [])
  const savedJobsStatus = useSelector((state) => state.jobs.savedJobsStatus);
  const {user} = useUser();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      // Only set local loading state if we don't have any saved jobs yet
      if (savedJobs.length === 0) {
        setIsLoading(true);
      }
      
      console.log(`Fetching saved jobs for user ${user.id} in SavedJobsPage`);
      dispatch(fetchSavedJobs(user.id))
        .unwrap()
        .then(jobs => {
          console.log(`Successfully fetched ${jobs.length} saved jobs`);
        })
        .catch(error => {
          console.error("Error fetching saved jobs:", error);
        })
        .finally(() => setIsLoading(false));
    }
  }, [dispatch, user?.id]);

  // Calculate the correct count safely
  const jobCount = Array.isArray(savedJobs) ? savedJobs.length : 0;
  const isLoadingData = isLoading || savedJobsStatus === "loading";

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 max-w-7xl mx-auto pb-16 sm:pb-0">
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
          <Bookmark className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
          Saved Jobs
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {isLoadingData && jobCount === 0 ? "Loading..." : `${jobCount} ${jobCount === 1 ? "job" : "jobs"} saved`}
        </p>
      </div>

      {isLoadingData && jobCount === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 text-center">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Loading saved jobs...</h3>
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
        <div className="h-[calc(100vh-250px)]"> {/* Adjusted height to account for mobile nav */}
          <AutoSizer>
            {({ height, width }) => (
              <List
                height={height}
                width={width}
                rowCount={Array.isArray(savedJobs) ? savedJobs.length : 0}
                rowHeight={250} // Adjusted height to accommodate margin
                rowRenderer={({ index, style }) => {
                  const job = savedJobs[index]
                  return (
                    <div style={{ ...style, marginBottom: '16px' }}> {/* Added margin bottom for gap between job cards */}
                      {job ? <JobCard key={job.id} job={job} /> : null} {/* Ensure job is defined */}
                    </div>
                  )
                }}
              />
            )}
          </AutoSizer>
        </div>
      )}
      
      <MobileNavigation />
    </div>
  );
}

export default SavedJobsPage
