import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchJobs, setPage, setPerPage } from "../../slices/jobsSlice";
import JobCard from "./JobCard";
import { useLocation } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useProStatusContext } from "../../contexts/ProStatusContext";

const API_URL_BACKEND = import.meta.env.VITE_API_URL_BACKEND;

function JobList() {
  const dispatch = useDispatch();
  const { jobs, loading, error, pagination } = useSelector((state) => state.jobs);
  const filters = useSelector((state) => state.filters);
  const location = useLocation();
  const { user, isSignedIn } = useUser();
  const { isPro } = useProStatusContext();

  // Not interested jobs state
  const [notInterestedJobs, setNotInterestedJobs] = useState({});
  const [jobsToHide, setJobsToHide] = useState(new Set());

  // Set per_page based on pro status
  useEffect(() => {
    const jobsPerPage = isPro ? 10 : 5;
    dispatch(setPerPage(jobsPerPage));
  }, [isPro, dispatch]);

  // Fetch jobs with pagination
  useEffect(() => {
    const fetchJobsWithParams = () => {
      dispatch(fetchJobs({
        filters,
        page: pagination.page,
        per_page: pagination.per_page
      }));
    };
    
    fetchJobsWithParams();
  }, [dispatch, filters, pagination.page, pagination.per_page]);

  // Handle marking a job as not interested
  const handleNotInterested = (jobId) => {
    // Create a timer to hide the job after 5 seconds
    const timer = setTimeout(() => {
      // Add job to the set of jobs to hide
      setJobsToHide(prev => {
        const newSet = new Set(prev);
        newSet.add(jobId);
        return newSet;
      });
      
      // If user is signed in, make the API call to update interest
      if (isSignedIn && user?.id) {
        fetch(`${API_URL_BACKEND}/users/${user.id}/job-interest`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jobId: jobId,
            interest: false,
          }),
        }).catch(err => {
          console.error("Error updating job interest:", err);
        });
      }
      
      // Remove the timer reference
      setNotInterestedJobs(prev => {
        const newState = { ...prev };
        delete newState[jobId];
        return newState;
      });
    }, 5000);
    
    // Store the timer reference
    setNotInterestedJobs(prev => ({
      ...prev,
      [jobId]: timer
    }));
  };

  // Handle undoing the not interested action
  const handleUndoNotInterested = (jobId) => {
    // Clear the timer
    if (notInterestedJobs[jobId]) {
      clearTimeout(notInterestedJobs[jobId]);
    }
    
    // Remove from not interested state
    setNotInterestedJobs(prev => {
      const newState = { ...prev };
      delete newState[jobId];
      return newState;
    });
  };

  // Filter out jobs marked to hide
  const visibleJobs = jobs.filter(job => !jobsToHide.has(job.id));

  // Change page
  const handlePageChange = (pageNumber) => {
    dispatch(setPage(pageNumber));
    // Scroll to top when page changes
    window.scrollTo(0, 0);
  };

  if (loading) {
    // Number of loading skeletons based on pro status
    const skeletonCount = isPro ? 10 : 5;
    
    return (
      <div className="space-y-4">
        {[...Array(skeletonCount)].map((_, index) => (
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
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <div className="text-red-600 text-lg font-medium">
          Error loading jobs: {error}
        </div>
        <button
          onClick={() => dispatch(fetchJobs({ filters, page: 1, per_page: pagination.per_page }))}
          className="mt-2 text-sm font-medium text-red-700 hover:text-red-800"
        >
          Try again
        </button>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-lg font-medium text-gray-900">No jobs found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Try adjusting your search filters or try again later.
        </p>
        <button
          onClick={() => {
            dispatch(fetchJobs({ page: 1, per_page: pagination.per_page }));
          }}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Clear filters
        </button>
      </div>
    );
  }

  const isHomePage = location.pathname === "/";
  return (
    <div className={`space-y-6 ${isHomePage ? "max-w-xl ml-2" : ""}`}>
      <div className="space-y-4">
        {visibleJobs.map((job) => (
          <div key={job.id} className="relative">
            <JobCard 
              job={job} 
              onNotInterested={handleNotInterested} 
            />
            
            {/* Undo notification */}
            {notInterestedJobs[job.id] && (
              <div className="absolute bottom-0 left-0 right-0 bg-red-50 p-2 border-t border-red-100 flex justify-between items-center">
                <span className="text-sm text-red-600">Marked as not interested</span>
                <button 
                  onClick={() => handleUndoNotInterested(job.id)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  Undo
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination Controls - modified for server-side pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            {/* Mobile version */}
            <button
              onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
              disabled={pagination.page === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {pagination.page} of {pagination.total_pages}
            </span>
            <button
              onClick={() =>
                handlePageChange(Math.min(pagination.total_pages, pagination.page + 1))
              }
              disabled={pagination.page === pagination.total_pages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>

          {/* Desktop version */}
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {((pagination.page - 1) * pagination.per_page) + 1}
                </span> to{" "}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.per_page, pagination.total)}
                </span>{" "}
                of <span className="font-medium">{pagination.total}</span> results
                {!isPro && (
                  <span className="ml-2 text-xs text-gray-500">
                    (Upgrade to Pro for 10 results per page)
                  </span>
                )}
              </p>
            </div>
            <div>
              <nav
                className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                aria-label="Pagination"
              >
                <button
                  onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {/* Page numbers - modified for pro/non-pro users */}
                {isPro ? (
                  // Pro users can see and jump between pages
                  Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                    let pageNum;

                    if (pagination.total_pages <= 5) {
                      // If 5 or fewer pages, show all
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      // Near start, show first 5 pages
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.total_pages - 2) {
                      // Near end, show last 5 pages
                      pageNum = pagination.total_pages - 4 + i;
                    } else {
                      // In middle, show current page and 2 pages on each side
                      pageNum = pagination.page - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          pagination.page === pageNum
                            ? "bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                            : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })
                ) : (
                  // Non-pro users only see current page number
                  <button
                    className="relative inline-flex items-center px-4 py-2 text-sm font-semibold bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    {pagination.page}
                  </button>
                )}

                <button
                  onClick={() =>
                    handlePageChange(Math.min(pagination.total_pages, pagination.page + 1))
                  }
                  disabled={pagination.page === pagination.total_pages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobList;