import { useState } from "react"
import { Link } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { MapPin, Briefcase, Clock, DollarSign, Calendar, Bookmark, Share2, MoreHorizontal } from "lucide-react"
import { toggleSaveJob } from "../../slices/jobsSlice"

function JobCard({ job }) {
  const [showActions, setShowActions] = useState(false)
  const dispatch = useDispatch()
  const savedJobs = useSelector((state) => state.jobs.savedJobs)
  const isSaved = savedJobs.some((savedJob) => savedJob.id === job.id)

  const handleSaveJob = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dispatch(toggleSaveJob(job))
  }

  const handleShare = (e) => {
    e.preventDefault()
    e.stopPropagation()
    // Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: `${job.title} at ${job.company}`,
        text: `Check out this job: ${job.title} at ${job.company}`,
        url: job.job_url || window.location.href,
      })
    } else {
      // Fallback for browsers that don't support navigator.share
      alert("Share link copied to clipboard!")
    }
  }

  const formatSalary = (salary) => {
    if (!salary) return "Salary not specified"

    const formatNumber = (num) => {
      if (num >= 1000000) {
        return `$${(num / 1000000).toFixed(1)}M`
      } else if (num >= 1000) {
        return `$${(num / 1000).toFixed(0)}K`
      }
      return `$${num}`
    }

    if (salary.min_amount && salary.max_amount) {
      return `${formatNumber(salary.min_amount)} - ${formatNumber(salary.max_amount)} ${salary.currency}/${salary.interval}`
    } else if (salary.min_amount) {
      return `${formatNumber(salary.min_amount)}+ ${salary.currency}/${salary.interval}`
    } else if (salary.max_amount) {
      return `Up to ${formatNumber(salary.max_amount)} ${salary.currency}/${salary.interval}`
    }
    return "Salary not specified"
  }

  const getTimeAgo = (date) => {
    const now = new Date()
    const postedDate = new Date(date)
    const diffInDays = Math.floor((now - postedDate) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) {
      return "Today"
    } else if (diffInDays === 1) {
      return "Yesterday"
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7)
      return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`
    } else {
      const months = Math.floor(diffInDays / 30)
      return `${months} ${months === 1 ? "month" : "months"} ago`
    }
  }

  return (
    <Link
      to={`/job/${job.id}`}
      className="block"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-200">
        <div className="p-4">
          <div className="flex items-start">
            {/* Company Logo */}
            <div className="flex-shrink-0 h-12 w-12 rounded bg-gray-100 flex items-center justify-center mr-4 overflow-hidden">
              {job.company_logo ? (
                <img
                  src={job.company_logo || "/placeholder.svg"}
                  alt={`${job.company} logo`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <Briefcase className="h-6 w-6 text-gray-400" />
              )}
            </div>

            {/* Job Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium text-gray-900 truncate">{job.title}</h3>
              <p className="text-sm text-gray-600 truncate">{job.company}</p>

              <div className="mt-2 flex flex-wrap gap-y-1">
                {job.location && (
                  <div className="flex items-center text-xs text-gray-500 mr-3">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span>
                      {job.is_remote
                        ? "Remote"
                        : `${job.location.city}${job.location.state ? `, ${job.location.state}` : ""}`}
                    </span>
                  </div>
                )}

                {job.job_type && (
                  <div className="flex items-center text-xs text-gray-500 mr-3">
                    <Briefcase className="h-3 w-3 mr-1" />
                    <span>{job.job_type}</span>
                  </div>
                )}

                {job.job_level && (
                  <div className="flex items-center text-xs text-gray-500 mr-3">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{job.job_level}</span>
                  </div>
                )}

                {job.salary && (
                  <div className="flex items-center text-xs text-gray-500 mr-3">
                    <DollarSign className="h-3 w-3 mr-1" />
                    <span>{formatSalary(job.salary)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Posted Date */}
            <div className="ml-4 flex-shrink-0 flex items-center text-xs text-gray-500">
              <Calendar className="h-3 w-3 mr-1" />
              <span>{getTimeAgo(job.date_posted)}</span>
            </div>
          </div>

          {/* Job Description Preview */}
          {job.description && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 line-clamp-2">{job.description.replace(/<[^>]*>/g, " ")}</p>
            </div>
          )}

          {/* Skills/Tags */}
          {job.skills && job.skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {job.skills.slice(0, 3).map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700"
                >
                  {skill}
                </span>
              ))}
              {job.skills.length > 3 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-600">
                  +{job.skills.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Card Actions */}
        <div
          className={`flex justify-between items-center px-4 py-2 bg-gray-50 border-t border-gray-100 ${
            showActions ? "opacity-100" : "opacity-0 md:opacity-100"
          } transition-opacity duration-200`}
        >
          <div className="flex space-x-2">
            <button
              onClick={handleSaveJob}
              className={`p-1.5 rounded-full ${
                isSaved ? "text-blue-600 bg-blue-50" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
              title={isSaved ? "Unsave" : "Save"}
            >
              <Bookmark className="h-4 w-4" fill={isSaved ? "currentColor" : "none"} />
            </button>

            <button
              onClick={handleShare}
              className="p-1.5 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              title="Share"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>

          <button className="p-1.5 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Link>
  )
}

export default JobCard

