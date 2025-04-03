import { useState, useEffect } from "react";
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
  ThumbsUp,
  ThumbsDown,
  Lock,
} from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { useProStatusContext } from "../../contexts/ProStatusContext";
import React from "react";

function JobCard({ job, onNotInterested, isRecommended }) {
  const [showActions, setShowActions] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { user, isSignedIn } = useUser();
  const dispatch = useDispatch();
  const savedJobs = useSelector((state) => state.jobs.savedJobs);
  const isSaved = savedJobs.some((savedJob) => savedJob.id === job.id);
  const { isPro } = useProStatusContext();
  
  // Simplified state without interaction tracking
  const [isInterested, setIsInterested] = useState(null);
  const [showProModal, setShowProModal] = useState(false);

  // Simple job click handler without tracking
  const handleJobClick = () => {
    window.open(job.job_url_direct || job.job_url, '_blank', 'noopener,noreferrer');
  };

  // Local action handlers without API calls
  const handleSaveJob = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isSignedIn || !isPro) {
      if (!isPro) setShowProModal(true);
      return;
    }
    
    // Just dispatch to Redux without API calls
    dispatch({ type: 'jobs/toggleSaveJob', payload: job });
  };
  
  const handleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isSignedIn || !isPro) {
      if (!isPro) setShowProModal(true);
      return;
    }
    
    // Just update local state
    setIsInterested(isInterested === true ? null : true);
  };
  
  const handleDislike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isSignedIn || !isPro) {
      if (!isPro) setShowProModal(true);
      return;
    }
    
    // Just update local state
    setIsInterested(isInterested === false ? null : false);
    
    // If marking as not interested and onNotInterested prop exists
    if (isInterested !== false && onNotInterested) {
      onNotInterested(job.id);
    }
  };

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isPro) {
      setShowProModal(true);
      return;
    }
    
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

  // Pro upgrade modal
  const ProUpgradeModal = () => {
    if (!showProModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowProModal(false)}>
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-xl max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg md:text-xl font-bold text-gray-900">Pro Feature</h3>
            <button onClick={() => setShowProModal(false)} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div className="mb-4">
            <p className="text-gray-700 mb-2">This feature is only available for Pro users.</p>
            <p className="text-gray-600 text-sm">Upgrade to Pro to unlock:</p>
            <ul className="list-disc pl-5 mt-2 text-sm text-gray-600">
              <li>Save jobs to your favorites</li>
              <li>Mark jobs as interested or not interested</li>
              <li>Share job listings with others</li>
              <li>And many more premium features!</li>
            </ul>
          </div>
          <div className="flex justify-end">
            <button 
              onClick={() => setShowProModal(false)} 
              className="mr-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
            >
              Not now
            </button>
            <a 
              href="/pricing" 
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Upgrade to Pro
            </a>
          </div>
        </div>
      </div>
    );
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
    <div
      className="block cursor-pointer w-full"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={handleJobClick}
    >
      <div className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border ${
        isRecommended 
          ? "border-amber-300 shadow-amber-100 hover:shadow-amber-200" 
          : "border-gray-200"
      }`}>
        {isRecommended && (
          <div className="bg-gradient-to-r from-amber-100 to-amber-50 px-3 py-1 border-b border-amber-200">
            <span className="text-xs font-medium text-amber-800 flex items-center">
              <Star className="h-3 w-3 mr-1 text-amber-500" /> Recommended for you
            </span>
          </div>
        )}
        
        <div className="p-3 md:p-4">
          <div className="flex flex-col md:flex-row md:items-start">
            {/* Company Logo */}
            <div className="flex-shrink-0 h-10 w-10 md:h-12 md:w-12 rounded bg-gray-100 flex items-center justify-center mb-2 md:mb-0 md:mr-4 overflow-hidden">
              {job.company_logo ? (
                <img
                  src={job.company_logo || "/placeholder.svg"}
                  alt={`${job.company} logo`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <Briefcase className="h-5 w-5 md:h-6 md:w-6 text-gray-400" />
              )}
            </div>

            {/* Job Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col md:flex-row md:items-start justify-between">
                <div>
                  <h3 className="text-base md:text-lg font-medium text-gray-900 truncate">
                    {job.title}
                  </h3>
                  <p className="text-sm text-gray-600 truncate">{job.company}</p>
                </div>
                
                {/* Posted Date - Moved for mobile */}
                <div className="flex items-center text-xs text-gray-500 mt-1 md:mt-0 md:ml-4">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>{getTimeAgo(job.date_posted)}</span>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-y-1">
                {/* Location */}
                {job.location && (
                  <div className="flex items-center text-xs text-gray-500 mr-3 mb-1">
                    <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">
                      {job.location}
                      {job.company_addresses && ` (${job.company_addresses})`}
                    </span>
                  </div>
                )}

                {/* Remote Status */}
                {job.is_remote !== undefined && (
                  <div className="flex items-center text-xs text-gray-500 mr-3 mb-1">
                    <Home className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span>{job.is_remote ? "Remote" : "On-site"}</span>
                  </div>
                )}

                {/* Work From Home Type */}
                {job.work_from_home_type && (
                  <div className="flex items-center text-xs text-gray-500 mr-3 mb-1">
                    <Home className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span>{job.work_from_home_type}</span>
                  </div>
                )}

                {/* Job Type */}
                {job.job_type && (
                  <div className="flex items-center text-xs text-gray-500 mr-3 mb-1">
                    <Briefcase className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span>{job.job_type}</span>
                  </div>
                )}

                {/* Job Level */}
                {job.job_level && (
                  <div className="flex items-center text-xs text-gray-500 mr-3 mb-1">
                    <Award className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span>{job.job_level}</span>
                  </div>
                )}

                {/* Job Function */}
                {job.job_function && (
                  <div className="flex items-center text-xs text-gray-500 mr-3 mb-1">
                    <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span>{job.job_function}</span>
                  </div>
                )}

                {/* Salary */}
                {(job.min_amount || job.max_amount) && (
                  <div className="flex items-center text-xs text-gray-500 mr-3 mb-1">
                    <DollarSign className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{formatSalary(job)}</span>
                    {job.salary_source && (
                      <span className="ml-1 text-xs text-gray-400 truncate">
                        ({job.salary_source})
                      </span>
                    )}
                  </div>
                )}

                {/* Experience */}
                {job.experience_range && (
                  <div className="flex items-center text-xs text-gray-500 mr-3 mb-1">
                    <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span>{job.experience_range}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Company Details Row */}
          <div className="mt-2 md:mt-3 flex flex-wrap gap-y-1">
            {/* Company Industry */}
            {job.company_industry && (
              <div className="flex items-center text-xs text-gray-500 mr-3 mb-1">
                <Building className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate">{job.company_industry}</span>
              </div>
            )}

            {/* Company Size */}
            {job.company_num_employees && (
              <div className="flex items-center text-xs text-gray-500 mr-3 mb-1">
                <Users className="h-3 w-3 mr-1 flex-shrink-0" />
                <span>{job.company_num_employees}</span>
              </div>
            )}

            {/* Company Revenue */}
            {job.company_revenue && (
              <div className="flex items-center text-xs text-gray-500 mr-3 mb-1">
                <TrendingUp className="h-3 w-3 mr-1 flex-shrink-0" />
                <span>{job.company_revenue}</span>
              </div>
            )}

            {/* Company Rating */}
            {job.company_rating && (
              <div className="flex items-center text-xs text-gray-500 mr-3 mb-1">
                <Star className="h-3 w-3 mr-1 flex-shrink-0" />
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
              <div className="flex items-center text-xs text-blue-500 mr-3 mb-1 hover:underline">
                <Globe className="h-3 w-3 mr-1 flex-shrink-0" />
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
            <div className="mt-2 md:mt-3">
              <p className="text-xs md:text-sm text-gray-700 leading-relaxed">
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
            <div className="mt-2 md:mt-3 flex flex-wrap gap-1">
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

        {/* Card Actions - Responsive Design */}
        <div
          className={`flex flex-col sm:flex-row sm:justify-between items-start sm:items-center px-3 md:px-4 py-2 bg-gray-50 border-t border-gray-100 ${
            showActions ? "opacity-100" : "opacity-60 sm:opacity-100"
          } transition-opacity duration-200`}
        >
          <div className="flex space-x-2 mb-2 sm:mb-0">
            <button
              onClick={handleSaveJob}
              className={`p-1.5 rounded-full relative ${
                isSaved
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              } transition-all duration-200 transform hover:scale-110 ${!isPro ? "opacity-60" : ""}`}
              title={isPro ? (isSaved ? "Unsave" : "Save") : "Pro Feature"}
            >
              <Bookmark
                className="h-4 w-4"
                fill={isSaved ? "currentColor" : "none"}
              />
              {!isPro && <Lock className="absolute h-2 w-2 top-0 right-0 text-gray-500" />}
            </button>

            <button
              onClick={handleLike}
              className={`p-1.5 rounded-full relative ${
                isInterested === true
                  ? "text-green-600 bg-green-50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              } transition-all duration-200 transform hover:scale-110 ${!isPro ? "opacity-60" : ""}`}
              title={isPro ? "Interested" : "Pro Feature"}
            >
              <ThumbsUp
                className="h-4 w-4"
                fill={isInterested === true ? "currentColor" : "none"}
              />
              {!isPro && <Lock className="absolute h-2 w-2 top-0 right-0 text-gray-500" />}
            </button>

            <button
              onClick={handleDislike}
              className={`p-1.5 rounded-full relative ${
                isInterested === false
                  ? "text-red-600 bg-red-50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              } transition-all duration-200 transform hover:scale-110 ${isInterested === false ? "animate-pulse" : ""} ${!isPro ? "opacity-60" : ""}`}
              title={isPro ? "Not for me" : "Pro Feature"}
            >
              <ThumbsDown
                className="h-4 w-4"
                fill={isInterested === false ? "currentColor" : "none"}
              />
              {!isPro && <Lock className="absolute h-2 w-2 top-0 right-0 text-gray-500" />}
            </button>

            <button
              onClick={handleShare}
              className={`p-1.5 rounded-full relative text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 transform hover:scale-110 ${!isPro ? "opacity-60" : ""}`}
              title={isPro ? "Share" : "Pro Feature"}
            >
              <Share2 className="h-4 w-4" />
              {!isPro && <Lock className="absolute h-2 w-2 top-0 right-0 text-gray-500" />}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center w-full sm:w-auto">
            <span className="text-xs text-gray-500 mr-0 sm:mr-2 mb-1 sm:mb-0">
              Source: {job.site || "N/A"}
            </span>
            <div className="flex items-center justify-between w-full sm:w-auto">
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
      </div>
      
      {/* Pro Upgrade Modal */}
      <ProUpgradeModal />
    </div>
  );
}

export default JobCard;