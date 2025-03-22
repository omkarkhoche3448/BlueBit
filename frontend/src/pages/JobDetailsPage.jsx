import { useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { fetchJobById, toggleSaveJob, applyToJob } from "../slices/jobsSlice"
import {
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Calendar,
  Bookmark,
  Share2,
  ExternalLink,
  Building,
  Users,
  ChevronLeft,
} from "lucide-react"

function JobDetailsPage() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const { currentJob, loading, error, savedJobs } = useSelector((state) => state.jobs)
  const isSaved = savedJobs.some((job) => job.id === id)

  useEffect(() => {
    if (id) {
      dispatch(fetchJobById(id))
    }
  }, [dispatch, id])

  const handleSaveJob = () => {
    if (currentJob) {
      dispatch(toggleSaveJob(currentJob))
    }
  }

  const handleApply = () => {
    if (currentJob) {
      dispatch(applyToJob(currentJob.id))
      // Redirect to application form or external site
      if (currentJob.applicationUrl) {
        window.open(currentJob.applicationUrl, "_blank")
      }
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${currentJob.title} at ${currentJob.company}`,
        text: `Check out this job: ${currentJob.title} at ${currentJob.company}`,
        url: window.location.href,
      })
    } else {
      // Fallback for browsers that don't support navigator.share
      alert("Share link copied to clipboard!")
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p>Error loading job details: {error}</p>
        <button
          onClick={() => dispatch(fetchJobById(id))}
          className="mt-2 text-sm font-medium text-red-700 hover:text-red-800"
        >
          Try again
        </button>
      </div>
    )
  }

  if (!currentJob) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Job not found</h3>
        <p className="text-gray-600 mb-4">The job you're looking for doesn't exist or has been removed.</p>
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Browse Jobs
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to="/" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800">
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to jobs
      </Link>

      {/* Job Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-start">
          {/* Company Logo */}
          <div className="flex-shrink-0 h-16 w-16 rounded bg-gray-100 flex items-center justify-center mb-4 md:mb-0 md:mr-6 overflow-hidden">
            {currentJob.company_logo ? (
              <img
                src={currentJob.company_logo || "/placeholder.svg"}
                alt={`${currentJob.company} logo`}
                className="h-full w-full object-contain"
              />
            ) : (
              <Building className="h-8 w-8 text-gray-400" />
            )}
          </div>

          {/* Job Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{currentJob.title}</h1>
            <p className="text-lg text-gray-600">{currentJob.company}</p>

            <div className="mt-3 flex flex-wrap gap-y-2 gap-x-4">
              {currentJob.location && (
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>
                    {currentJob.is_remote
                      ? "Remote"
                      : `${currentJob.location.city}${currentJob.location.state ? `, ${currentJob.location.state}` : ""}${currentJob.location.country ? `, ${currentJob.location.country}` : ""}`}
                  </span>
                </div>
              )}

              {currentJob.job_type && (
                <div className="flex items-center text-sm text-gray-500">
                  <Briefcase className="h-4 w-4 mr-1" />
                  <span>{currentJob.job_type}</span>
                </div>
              )}

              {currentJob.job_level && (
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{currentJob.job_level}</span>
                </div>
              )}

              {currentJob.salary && (
                <div className="flex items-center text-sm text-gray-500">
                  <DollarSign className="h-4 w-4 mr-1" />
                  <span>
                    {currentJob.salary.min_amount && currentJob.salary.max_amount
                      ? `${currentJob.salary.min_amount.toLocaleString()} - ${currentJob.salary.max_amount.toLocaleString()} ${currentJob.salary.currency}/${currentJob.salary.interval}`
                      : currentJob.salary.min_amount
                        ? `${currentJob.salary.min_amount.toLocaleString()}+ ${currentJob.salary.currency}/${currentJob.salary.interval}`
                        : `Up to ${currentJob.salary.max_amount.toLocaleString()} ${currentJob.salary.currency}/${currentJob.salary.interval}`}
                  </span>
                </div>
              )}

              {currentJob.date_posted && (
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Posted {new Date(currentJob.date_posted).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 md:mt-0 md:ml-6 flex flex-col gap-2">
            <button
              onClick={handleApply}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Apply Now
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleSaveJob}
                className={`flex-1 inline-flex items-center justify-center px-4 py-2 border ${
                  isSaved ? "border-blue-600 text-blue-600" : "border-gray-300 text-gray-700"
                } text-sm font-medium rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                <Bookmark className="h-4 w-4 mr-2" fill={isSaved ? "currentColor" : "none"} />
                {isSaved ? "Saved" : "Save"}
              </button>
              <button
                onClick={handleShare}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Job Description */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Job Description</h2>
        <div className="prose max-w-none">
          {currentJob.description ? (
            <div dangerouslySetInnerHTML={{ __html: currentJob.description }} />
          ) : (
            <p>No description provided.</p>
          )}
        </div>
      </div>

      {/* Skills/Requirements */}
      {currentJob.skills && currentJob.skills.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Skills & Requirements</h2>
          <div className="flex flex-wrap gap-2">
            {currentJob.skills.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Company Info */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">About {currentJob.company}</h2>

        {currentJob.company_description ? (
          <div className="prose max-w-none mb-4">
            <div dangerouslySetInnerHTML={{ __html: currentJob.company_description }} />
          </div>
        ) : (
          <p className="text-gray-600 mb-4">No company description available.</p>
        )}

        {currentJob.company_employees_count && (
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <Users className="h-4 w-4 mr-2" />
            <span>{currentJob.company_employees_count} employees</span>
          </div>
        )}

        {currentJob.company_industry && (
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <Briefcase className="h-4 w-4 mr-2" />
            <span>Industry: {currentJob.company_industry}</span>
          </div>
        )}

        {currentJob.company_url && (
          <a
            href={currentJob.company_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Visit company website
          </a>
        )}
      </div>

      {/* Similar Jobs */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Similar Jobs</h2>
        <p className="text-gray-600">Loading similar jobs...</p>
      </div>
    </div>
  )
}

export default JobDetailsPage