import React, { useState, useEffect, useCallback, memo, useMemo } from "react";
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
import { saveJob, removeJob, updateJobInterest } from "../../slices/jobsSlice";
import { useUser } from "@clerk/clerk-react";
import { useProStatusContext } from "../../contexts/ProStatusContext";
import PaymentService from "../../services/paymentService";
import { toast } from "react-hot-toast";

const API_URL_BACKEND = import.meta.env.VITE_API_URL_BACKEND;

const JobCard = memo(({ job, onNotInterested, isRecommended }) => {
  const [showActions, setShowActions] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { user, isSignedIn } = useUser();
  const dispatch = useDispatch();
  const savedJobs = useSelector((state) => state.jobs.savedJobs || []);
  const isSaved = useMemo(() => {
    return Array.isArray(savedJobs) && savedJobs.some((savedJob) => savedJob.id === job.id);
  }, [savedJobs, job.id]);
  const { isPro, refreshProStatus } = useProStatusContext();

  const [isInterested, setIsInterested] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Add payment handler function inside the component

  const handlePayment = async () => {
    try {
      if (!user) return;

      setIsProcessingPayment(true);
      setTimeout(() => {
        setShowProModal(false);
      }, 1000);

      await PaymentService.initiatePayment(
        user.id,
        user.primaryEmailAddress.emailAddress,
        user.fullName
      );

      // Refresh pro status after successful payment
      await refreshProStatus();

      toast.success("Payment successful! Pro features activated.", {
        duration: 4000,
        position: "top-center",
        icon: "🎉",
        onClose: () => {
          window.location.reload();
        },
      });
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(`Payment failed: ${error.message}`, {
        duration: 4000,
        position: "top-center",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };
  // Fix the useEffect - remove the nested useEffect
  useEffect(() => {
    console.log("JobCard mounted with job:", job?.id);
    if (isSignedIn && user?.id && job?.id) {
      fetchJobInterest();
    }
    return () => {
      console.log("JobCard unmounted:", job?.id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, user?.id, job?.id]);

  const fetchJobInterest = async () => {
    if (!job?.id) return; // Prevent fetching if job ID is undefined
    try {
      console.log(
        `Fetching job interest for user ${user.id} and job ${job.id}`
      );
      const response = await fetch(
        `${API_URL_BACKEND}/users/${user.id}/job-interest/${job.id}`
      );
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched job interest data:", data);
        setIsInterested(data.interest);
      } else {
        console.error(
          "Failed to fetch job interest:",
          response.status,
          response.statusText
        );
      }
    } catch (err) {
      console.error("Error fetching job interest:", err);
    }
  };

  const handleSaveJob = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSignedIn) {
      setShowProModal(true);
      return;
    }

    if (!isPro) {
      setShowProModal(true);
      return;
    }

    try {
      setIsLoading(true);
      if (isSaved) {
        // Remove job from database
        await dispatch(removeJob({ job, userId: user.id })).unwrap();
      } else {
        // Save job to database
        await dispatch(saveJob({ job, userId: user.id })).unwrap();
      }
    } catch (error) {
      toast.error("Failed to save job. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Add a check for onNotInterested before calling it
  const handleJobInterest = async (interested, e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("Setting job interest for job:", job.id, "to", interested);

    if (!isSignedIn) {
      setShowProModal(true);
      return;
    }

    if (!isPro) {
      setShowProModal(true);
      return;
    }

    // Optimistically update UI first for better responsiveness
    const previousInterest = isInterested;
    const newInterestValue = isInterested === interested ? null : interested;
    setIsInterested(newInterestValue);

    // If marking as not interested and onNotInterested prop exists, call it immediately
    if (newInterestValue === false && onNotInterested) {
      onNotInterested(job.id);
    }

    setIsLoading(true);

    try {
      console.log(`Setting interest for job ${job.id} to ${newInterestValue}`);

      // Dispatch the updateJobInterest action
      await dispatch(
        updateJobInterest({
          userId: user.id,
          jobId: job.id,
          interest: newInterestValue,
        })
      ).unwrap();

      console.log("Successfully updated job interest for job:", job.id);
    } catch (err) {
      // Revert to previous state if request fails
      setIsInterested(previousInterest);
      console.error("Error updating job interest:", err);
      alert("Failed to update job interest. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Get the job URL
    const jobUrl = job.job_url_direct || job.job_url || window.location.href;

    // Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: `${job.title} at ${job.company}`,
        text: `Check out this job: ${job.title} at ${job.company}`,
        url: jobUrl,
      });
    } else {
      // Copy to clipboard as fallback
      navigator.clipboard
        .writeText(jobUrl)
        .then(() => {
          alert("Job link copied to clipboard!");
        })
        .catch((err) => {
          console.error("Failed to copy link: ", err);
          alert("Failed to copy link. Please try again.");
        });
    }
  };

  // Pro upgrade modal
  const ProUpgradeModal = () => {
    if (!showProModal) return null;

    return (
      <div
        className="fixed inset-0 bg-transapernt bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-50"
        onClick={() => setShowProModal(false)}
      >
        <div
          className="bg-white p-6 rounded-lg border border-gray-200 max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Pro Feature
            </h3>
            <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-gray-600 mb-4">
              Upgrade to Pro to unlock this feature and enjoy unlimited access
              to job saving, liking and more premium features.
            </p>
            <button
              className={`block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors duration-200 ${
                isProcessingPayment ? "opacity-70 cursor-not-allowed" : ""
              }`}
              onClick={handlePayment}
              disabled={isProcessingPayment}
            >
              {isProcessingPayment ? "Processing..." : "Try for 1 Month"}
            </button>
            <button
              className="mt-3 text-sm text-gray-500 hover:text-gray-700"
              onClick={() => setShowProModal(false)}
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Rest of your component remains the same
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

    // Remove consecutive dashes that might be formatting
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

  useEffect(() => {
    console.log("JobCard mounted:", job.id);
    return () => {
      console.log("JobCard unmounted:", job.id);
    };
  }, [job.id]);

  const handleNotInterested = useCallback(() => {
    if (onNotInterested) {
      onNotInterested(job.id);
    }
  }, [job.id, onNotInterested]);

  // Log when the Pro modal is shown
  useEffect(() => {
    if (showProModal) {
      console.log("Pro modal is shown");
    }
  }, [showProModal]);

  return (
    <div
      className={`block cursor-pointer ${
        isRecommended ? "animate-fadeIn" : ""
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={(e) => {
        window.open(
          job.job_url_direct || job.job_url,
          "_blank",
          "noopener,noreferrer"
        );
      }}
      key={job.id}
    >
      <div
        className={`bg-white rounded-xl duration-200 overflow-hidden border ${
          isRecommended ? "border-amber-300" : "border-gray-200"
        }`}
      >
        {isRecommended && (
          <div className="bg-gradient-to-r from-amber-100 to-amber-50 px-4 py-1 border-b border-amber-200">
            <span className="text-xs font-medium text-amber-800 flex items-center">
              <Building className="h-3 w-3 mr-1 text-amber-500" /> Recommended
              for you
            </span>
          </div>
        )}

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

        {/* Card Actions - Modified for Pro status */}
        <div
          className={`flex justify-between items-center px-4 py-2 bg-gray-50 border-t border-gray-100 opacity-100 transition-opacity duration-200`}
        >
          <div className="flex space-x-2">
            <button
              onClick={handleSaveJob}
              className={`p-1.5 rounded-full ${
                isSaved
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              } transition-all duration-200 transform hover:scale-110 ${
                !isPro ? "opacity-60" : ""
              } ${isLoading ? "animate-pulse" : ""}`}
              title={isPro ? (isSaved ? "Unsave" : "Save") : "Pro Feature"}
              disabled={isLoading}
            >
              {!isPro && (
                <Lock className="absolute h-2 w-2 top-0 right-0 text-gray-500" />
              )}
              <Bookmark
                className="h-4 w-4"
                fill={isSaved ? "currentColor" : "none"}
              />
            </button>

            <button
              onClick={(e) => handleJobInterest(true, e)}
              className={`p-1.5 rounded-full ${
                isInterested === true
                  ? "text-green-600 bg-green-50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              } transition-all duration-200 transform hover:scale-110 ${
                !isPro ? "opacity-60" : ""
              }`}
              title={isPro ? "Interested" : "Pro Feature"}
            >
              {!isPro && (
                <Lock className="absolute h-2 w-2 top-0 right-0 text-gray-500" />
              )}
              <ThumbsUp
                className={`h-4 w-4 ${isLoading ? "opacity-50" : ""}`}
                fill={isInterested === true ? "currentColor" : "none"}
              />
            </button>

            <button
              onClick={(e) => handleJobInterest(false, e)}
              className={`p-1.5 rounded-full ${
                isInterested === false
                  ? "text-red-600 bg-red-50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              } transition-all duration-200 transform hover:scale-110 ${
                isInterested === false ? "animate-pulse" : ""
              } ${!isPro ? "opacity-60" : ""}`}
              title={isPro ? "Not for me" : "Pro Feature"}
            >
              {!isPro && (
                <Lock className="absolute h-2 w-2 top-0 right-0 text-gray-500" />
              )}
              <ThumbsDown
                className={`h-4 w-4 ${isLoading ? "opacity-50" : ""}`}
                fill={isInterested === false ? "currentColor" : "none"}
              />
            </button>

            <button
              onClick={handleShare}
              className="p-1.5 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 transform hover:scale-110"
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

      {/* Pro Upgrade Modal */}
      <ProUpgradeModal />
    </div>
  );
});

export default JobCard;
