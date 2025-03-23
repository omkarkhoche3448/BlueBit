import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Calendar,
  Bookmark,
  Share2,
  MoreHorizontal,
  Building,
  Users,
  Globe,
  Star,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Award,
  Home,
} from "lucide-react";
import { toggleSaveJob } from "../../slices/jobsSlice";

function JobCard({ job }) {
  const [showActions, setShowActions] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const dispatch = useDispatch();
  const savedJobs = useSelector((state) => state.jobs.savedJobs);
  const isSaved = savedJobs.some((savedJob) => savedJob.id === job.id);

  const handleSaveJob = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(toggleSaveJob(job));
  };

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: `${job.title} at ${job.company}`,
        text: `Check out this job: ${job.title} at ${job.company}`,
        url: job.job_url_direct || job.job_url || window.location.href,
      });
    } else {
      // Fallback for browsers that don't support navigator.share
      alert("Share link copied to clipboard!");
    }
  };

  const toggleExpand = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const formatSalary = (job) => {
    if (!job.min_amount && !job.max_amount) return "Salary not specified";

    const formatNumber = (num) => {
      if (num >= 1000000) {
        return `$${(num / 1000000).toFixed(1)}M`;
      } else if (num >= 1000) {
        return `$${(num / 1000).toFixed(0)}K`;
      }
      return `$${num}`;
    };

    if (job.min_amount && job.max_amount) {
      return `${formatNumber(job.min_amount)} - ${formatNumber(
        job.max_amount
      )} ${job.currency || ""}/${job.interval || ""}`;
    } else if (job.min_amount) {
      return `${formatNumber(job.min_amount)}+ ${job.currency || ""}/${
        job.interval || ""
      }`;
    } else if (job.max_amount) {
      return `Up to ${formatNumber(job.max_amount)} ${job.currency || ""}/${
        job.interval || ""
      }`;
    }
    return "Salary not specified";
  };

  const getTimeAgo = (date) => {
    if (!date) return "Date not specified";

    const now = new Date();
    const postedDate = new Date(date);
    const diffInDays = Math.floor((now - postedDate) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return "Today";
    } else if (diffInDays === 1) {
      return "Yesterday";
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
    } else {
      const months = Math.floor(diffInDays / 30);
      return `${months} ${months === 1 ? "month" : "months"} ago`;
    }
  };

  const formatCompanyReviews = (rating, count) => {
    if (!rating) return null;
    return `${rating}${count ? ` (${count} reviews)` : ""}`;
  };

  const cleanDescription = (description) => {
    if (!description) return "";

    // Remove all HTML tags
    let cleanText = description.replace(/<[^>]*>/g, " ");

    // Replace markdown heading markers (##, ### etc)
    cleanText = cleanText.replace(/#{1,6}\s+/g, "");

    // Remove excessive whitespace, including newlines and tabs
    cleanText = cleanText.replace(/\s+/g, " ");

    // Remove special characters that may have been used for formatting
    cleanText = cleanText.replace(/[\\*_\-~`]/g, "");

    // Remove any consecutive dashes that might be formatting
    cleanText = cleanText.replace(/\-{2,}/g, "");

    // Remove consecutive spaces
    cleanText = cleanText.replace(/\s{2,}/g, " ");

    // Remove job description headers
    cleanText = cleanText.replace(
      /(job description|qualifications|requirements|responsibilities|about the role|key responsibilities|required experience|about us):/gi,
      ""
    );

    // Trim and properly capitalize first letter
    cleanText = cleanText.trim();

    // Handle length
    return expanded
      ? cleanText
      : cleanText.length > 160
      ? cleanText.substring(0, 160) + "..."
      : cleanText;
  };

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
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {job.title}
              </h3>
              <p className="text-sm text-gray-600 truncate">{job.company}</p>

              <div className="mt-2 flex flex-wrap gap-y-1">
                {/* Location */}
                {job.location && (
                  <div className="flex items-center text-xs text-gray-500 mr-3">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span>
                      {job.location}
                      {job.company_addresses && ` (${job.company_addresses})`}
                    </span>
                  </div>
                )}

                {/* Remote Status */}
                {job.is_remote !== undefined && (
                  <div className="flex items-center text-xs text-gray-500 mr-3">
                    <Home className="h-3 w-3 mr-1" />
                    <span>{job.is_remote ? "Remote" : "On-site"}</span>
                  </div>
                )}

                {/* Work From Home Type */}
                {job.work_from_home_type && (
                  <div className="flex items-center text-xs text-gray-500 mr-3">
                    <Home className="h-3 w-3 mr-1" />
                    <span>{job.work_from_home_type}</span>
                  </div>
                )}

                {/* Job Type */}
                {job.job_type && (
                  <div className="flex items-center text-xs text-gray-500 mr-3">
                    <Briefcase className="h-3 w-3 mr-1" />
                    <span>{job.job_type}</span>
                  </div>
                )}

                {/* Job Level */}
                {job.job_level && (
                  <div className="flex items-center text-xs text-gray-500 mr-3">
                    <Award className="h-3 w-3 mr-1" />
                    <span>{job.job_level}</span>
                  </div>
                )}

                {/* Job Function */}
                {job.job_function && (
                  <div className="flex items-center text-xs text-gray-500 mr-3">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{job.job_function}</span>
                  </div>
                )}

                {/* Salary */}
                {(job.min_amount || job.max_amount) && (
                  <div className="flex items-center text-xs text-gray-500 mr-3">
                    <DollarSign className="h-3 w-3 mr-1" />
                    <span>{formatSalary(job)}</span>
                    {job.salary_source && (
                      <span className="ml-1 text-xs text-gray-400">
                        ({job.salary_source})
                      </span>
                    )}
                  </div>
                )}

                {/* Experience */}
                {job.experience_range && (
                  <div className="flex items-center text-xs text-gray-500 mr-3">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{job.experience_range}</span>
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

          {/* Company Details Row */}
          <div className="mt-3 flex flex-wrap gap-y-1">
            {/* Company Industry */}
            {job.company_industry && (
              <div className="flex items-center text-xs text-gray-500 mr-3">
                <Building className="h-3 w-3 mr-1" />
                <span>{job.company_industry}</span>
              </div>
            )}

            {/* Company Size */}
            {job.company_num_employees && (
              <div className="flex items-center text-xs text-gray-500 mr-3">
                <Users className="h-3 w-3 mr-1" />
                <span>{job.company_num_employees}</span>
              </div>
            )}

            {/* Company Revenue */}
            {job.company_revenue && (
              <div className="flex items-center text-xs text-gray-500 mr-3">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>{job.company_revenue}</span>
              </div>
            )}

            {/* Company Rating */}
            {job.company_rating && (
              <div className="flex items-center text-xs text-gray-500 mr-3">
                <Star className="h-3 w-3 mr-1" />
                <span>
                  {formatCompanyReviews(
                    job.company_rating,
                    job.company_reviews_count
                  )}
                </span>
              </div>
            )}

            {/* Company Website */}
            {(job.company_url_direct || job.company_url) && (
              <div className="flex items-center text-xs text-blue-500 mr-3 hover:underline">
                <Globe className="h-3 w-3 mr-1" />
                <a
                  href={job.company_url_direct || job.company_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  Company Website
                </a>
              </div>
            )}
          </div>

          {/* Company Description */}
          {job.company_description && (
            <div className="mt-2 p-2 bg-gray-50 rounded-md">
              <p className="text-xs italic text-gray-600 line-clamp-2">
                {job.company_description}
              </p>
            </div>
          )}

          {/* Job Description Preview - CLEANED */}
          {job.description && (
            <div className="mt-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                {cleanDescription(job.description)}
              </p>
              {job.description.length > 160 && (
                <button
                  onClick={toggleExpand}
                  className="mt-1 text-xs text-blue-600 flex items-center hover:underline"
                >
                  {expanded ? (
                    <>
                      Show less <ChevronUp className="h-3 w-3 ml-1" />
                    </>
                  ) : (
                    <>
                      Show more <ChevronDown className="h-3 w-3 ml-1" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Skills/Tags */}
          {job.skills && job.skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {job.skills
                .slice(0, expanded ? job.skills.length : 3)
                .map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700"
                  >
                    {skill}
                  </span>
                ))}
              {!expanded && job.skills.length > 3 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-600">
                  +{job.skills.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Listing Type & Vacancy Count */}
          <div className="mt-2 flex flex-wrap">
            {job.listing_type && (
              <span className="text-xs text-gray-500 mr-2">
                Listing type: {job.listing_type}
              </span>
            )}
            {job.vacancy_count && (
              <span className="text-xs text-gray-500">
                Vacancies: {job.vacancy_count}
              </span>
            )}
          </div>
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
                isSaved
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
              title={isSaved ? "Unsave" : "Save"}
            >
              <Bookmark
                className="h-4 w-4"
                fill={isSaved ? "currentColor" : "none"}
              />
            </button>

            <button
              onClick={handleShare}
              className="p-1.5 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              title="Share"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center">
            <span className="text-xs text-gray-500 mr-2">
              Source: {job.site || "N/A"}
            </span>
            <a
              href={job.job_url_direct || job.job_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-blue-600 hover:underline mr-2"
            >
              View Original
            </a>
            <button className="p-1.5 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default JobCard;
