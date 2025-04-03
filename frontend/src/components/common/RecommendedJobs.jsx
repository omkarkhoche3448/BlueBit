import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  MapPin,
  Clock,
  Building,
  Briefcase,
  Zap,
  ThumbsUp,
  BookmarkPlus,
} from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import axios from "axios";
import { useProStatusContext } from "../../contexts/ProStatusContext";

const API_URL_BACKEND = import.meta.env.VITE_API_URL_BACKEND;

function RecommendedJobs() {
  const [recommendations, setRecommendations] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();
  const { isPro } = useProStatusContext();
  const itemsPerPage = 3;
  const carouselInterval = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const response = await axios.get(
          `${API_URL_BACKEND}/users/${user.id}/recommendations`
        );
        // Fix: Access the recommendations array from the response data
        setRecommendations(response.data.recommendations || []);
      } catch (error) {
        console.error("Error fetching recommendations:", error);
        setRecommendations([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [user]);

  // Auto-sliding carousel functionality
  useEffect(() => {
    // Only start auto-sliding if we have enough items
    if (recommendations.length > itemsPerPage && isPro) {
      carouselInterval.current = setInterval(() => {
        if (!isPaused) {
          setCurrentIndex((prevIndex) => {
            // Calculate next index with wraparound
            const maxStartIndex = recommendations.length - itemsPerPage;
            const nextIndex = prevIndex + itemsPerPage;
            return nextIndex > maxStartIndex ? 0 : nextIndex;
          });
        }
      }, 5000); // 5 seconds interval
    }

    // Cleanup function to clear interval when component unmounts
    return () => {
      if (carouselInterval.current) {
        clearInterval(carouselInterval.current);
      }
    };
  }, [recommendations, isPro, isPaused, itemsPerPage]);

  // Pause auto-sliding when user interacts with the carousel
  const pauseCarousel = () => {
    setIsPaused(true);
    // Resume auto-sliding after 10 seconds of inactivity
    setTimeout(() => setIsPaused(false), 10000);
  };

  // Handle sliding through recommendations
  const handleNext = () => {
    pauseCarousel();
    if (isPro && currentIndex + itemsPerPage < recommendations.length) {
      setCurrentIndex(currentIndex + itemsPerPage);
    } else if (isPro) {
      // Wrap around to the beginning
      setCurrentIndex(0);
    }
  };

  const handlePrev = () => {
    pauseCarousel();
    if (isPro && currentIndex > 0) {
      setCurrentIndex(currentIndex - itemsPerPage);
    } else if (isPro) {
      // Wrap around to the end
      const maxStartIndex = Math.max(0, recommendations.length - itemsPerPage);
      setCurrentIndex(maxStartIndex);
    }
  };

  // Format recommendations to match JobCard expected format
  const formatRecommendations = () => {
    if (!Array.isArray(recommendations)) {
      return [];
    }

    return recommendations.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      company_logo: job.company_logo,
      location: job.location,
      date_posted: job.date_posted,
      is_remote: job.is_remote,
      salary:
        job.min_amount || job.max_amount
          ? {
              min_amount: job.min_amount,
              max_amount: job.max_amount,
              currency: job.currency || "USD",
              interval: job.interval || "yearly",
            }
          : null,
      description: job.description,
      job_url: job.job_url,
    }));
  };

  // If recommendations array is empty, show enhanced interaction message
  if (!isLoading && recommendations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-6 border border-gray-100 max-w-sm mx-auto">
        <div className="text-center">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-4">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-left">
                <h2 className="text-blue-800 font-semibold text-sm mb-1">
                  Unlock Your Perfect Job Match
                </h2>
                <p className="text-gray-600 text-xs">
                  Help us understand your preferences to deliver tailored
                  recommendations.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-1 gap-2 mt-3 mx-auto">
              <div className="bg-white rounded p-2 border border-blue-100">
                <div className="flex items-center justify-center text-blue-500 mb-1">
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  <span className="text-xs font-medium">Like Jobs</span>
                </div>
              </div>

              <div className="bg-white rounded p-2 border border-blue-100">
                <div className="flex items-center justify-center text-blue-500 mb-1">
                  <BookmarkPlus className="w-4 h-4 mr-1" />
                  <span className="text-xs font-medium">Save Jobs</span>
                </div>
              </div>

              <div className="bg-white rounded p-2 border border-blue-100 col-span-2 flex justify-center">
                <div className="flex items-center justify-center text-blue-500 mb-1">
                  <Briefcase className="w-4 h-4 mr-1" />
                  <span className="text-xs font-medium">Apply</span>
                </div>
              </div>
            </div>
          </div>

          <Link
            to="/search"
            className=" inline-block mt-3 md:mt-0 md:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700 outline-none "
          >
            Explore Jobs
          </Link>
        </div>
      </div>
    );
  }

  const formattedJobs = formatRecommendations();
  const currentJobs = formattedJobs.slice(
    currentIndex,
    currentIndex + itemsPerPage
  );
  const hasNext = isPro && recommendations.length > itemsPerPage;
  const hasPrev = isPro && recommendations.length > itemsPerPage;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-lg font-semibold text-gray-900">
          Recommended jobs for you
        </h2>
        <Link
          to="/recommendations"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
        >
          View all
          <ChevronRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      <div 
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {hasPrev && (
          <button
            onClick={handlePrev}
            className="absolute -left-3 top-1/2 transform -translate-y-1/2 bg-white shadow-md rounded-full w-7 h-7 flex items-center justify-center border border-gray-200 text-gray-600 hover:text-gray-900 z-10"
            aria-label="Previous jobs"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        <div className="overflow-hidden px-1">
          <div
            className="flex space-x-4 transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * (220 + 16)}px)` }}
          >
            {formattedJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>

        {hasNext && (
          <button
            onClick={handleNext}
            className="absolute -right-3 top-1/2 transform -translate-y-1/2 bg-white shadow-md rounded-full w-7 h-7 flex items-center justify-center border border-gray-200 text-gray-600 hover:text-gray-900 z-10"
            aria-label="Next jobs"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {!isPro && recommendations.length > itemsPerPage && (
        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-md p-3 text-xs text-center">
          <p className="text-blue-800 font-medium mb-1">
            Upgrade to Pro to see more recommendations
          </p>
          <p className="text-gray-600">
            Pro users can access all job recommendations tailored to their
            profile.
          </p>
        </div>
      )}

      {isPro && recommendations.length > itemsPerPage && (
        <div className="flex justify-center mt-4 space-x-1">
          {Array.from({
            length: Math.ceil(recommendations.length / itemsPerPage),
          }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                pauseCarousel();
                setCurrentIndex(idx * itemsPerPage);
              }}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                Math.floor(currentIndex / itemsPerPage) === idx
                  ? "bg-blue-600 w-5"
                  : "bg-gray-300"
              }`}
              aria-label={`Page ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function JobCard({ job }) {
  return (
    <div className="flex-shrink-0 w-[220px] group">
      {/* Card with hover effect */}
      <div className="rounded-lg border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden h-full">
        {/* Company header with logo and time */}
        <div className="flex items-center justify-between p-3 border-b border-gray-50">
          <div className="w-10 h-10 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
            {job.company_logo ? (
              <img
                src={job.company_logo}
                alt={job.company}
                className="w-8 h-8 object-contain"
              />
            ) : (
              <Briefcase className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <div className="flex items-center text-gray-400 text-xs">
            <Clock className="w-3 h-3 mr-1" />
            <span>1 day ago</span>
          </div>
        </div>

        {/* Job content */}
        <div className="p-3">
          <h3 className="font-medium text-gray-900 text-sm mb-1.5 line-clamp-2 h-10 group-hover:text-blue-600 transition-colors">
            {job.title}
          </h3>

          <div className="flex items-center text-gray-500 text-xs mb-1.5">
            <Building className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="truncate">{job.company}</span>
          </div>

          <div className="flex items-center text-gray-500 text-xs">
            <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="truncate">{job.location}</span>
            {job.is_remote && (
              <span className="ml-1 text-green-600 font-medium">• Remote</span>
            )}
          </div>
        </div>

        {/* Card footer with actions */}
        <div className="flex items-center justify-between p-3 pt-2 border-t border-gray-50 mt-auto">
          <Link
            to={job.job_url || `/jobs/${job.id}`}
            className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded font-medium hover:bg-blue-100 transition-colors"
          >
            View Job
          </Link>

          <button
            className="text-gray-300 hover:text-yellow-400 transition-colors"
            aria-label="Save job"
          >
            <Star className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default RecommendedJobs;