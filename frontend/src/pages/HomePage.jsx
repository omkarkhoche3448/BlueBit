import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Search, SlidersHorizontal } from "lucide-react";
import { setSearchTerm, setSortBy } from "../slices/filterSlice";
import JobList from "../components/common/JobList";
import PaymentHandler from "../components/PaymentHandler";
import { useUser } from "@clerk/clerk-react";
import RecommendedJobs from "../components/common/RecommendedJobs";

function HomePage() {
  const [searchInput, setSearchInput] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const dispatch = useDispatch();
  const { user } = useUser();

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(setSearchTerm(searchInput));
    const trimmedInput = searchInput.trim();
    const searchUrl = trimmedInput
      ? `/search?q=${encodeURIComponent(trimmedInput)}`
      : "/search";
    window.location.href = searchUrl;
  };

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        // In a real app, this would be an API call
        // For now, we'll use the sample data from the JSON
        const response = {
          recommendations: [
            {
              company: "Deloitte",
              company_logo:
                "https://media.glassdoor.com/sql/2763/deloitte-squareLogo-1674210308592.png",
              currency: "USD",
              date_posted: "Mon, 03 Mar 2025 00:00:00 GMT",
              description: "Manager, GenAI Engineering position at Deloitte...",
              id: "gd-1009657401693",
              interval: "yearly",
              is_remote: false,
              job_type: null,
              job_url:
                "https://www.glassdoor.com/job-listing/j?jl=1009657401693",
              job_url_direct: null,
              last_updated: "Thu, 27 Mar 2025 00:00:00 GMT",
              location: "Indianapolis, IN",
              max_amount: 210600.0,
              min_amount: 102500.0,
              salary_source: "direct_data",
              site: "glassdoor",
              title: "Manager, GenAI Engineering",
            },
            {
              company: "FTS Inc",
              company_logo:
                "https://media.glassdoor.com/sql/3220163/fast-tracking-solutions-squareLogo-1715011088393.png",
              currency: "USD",
              date_posted: "Thu, 20 Mar 2025 00:00:00 GMT",
              description: "Control System Software Engineer position...",
              id: "gd-1009678631516",
              interval: "hourly",
              is_remote: false,
              job_type: null,
              job_url:
                "https://www.glassdoor.com/job-listing/j?jl=1009678631516",
              job_url_direct: null,
              last_updated: "Thu, 27 Mar 2025 00:00:00 GMT",
              location: "Indianapolis, IN",
              max_amount: 57.0,
              min_amount: 54.0,
              salary_source: "direct_data",
              site: "glassdoor",
              title: "Control system software engineer",
            },
            {
              company: "Deloitte",
              company_logo: null,
              currency: null,
              date_posted: "Sat, 15 Mar 2025 00:00:00 GMT",
              description: "Full Stack-JAVA-Senior Consultant position...",
              id: "go-ZlRulavX6rkOe1jRAAAAAA==",
              interval: null,
              is_remote: false,
              job_type: null,
              job_url:
                "https://in.linkedin.com/jobs/view/full-stack-java-senior-consultant-hyderabad-bengaluru-mumbai-at-deloitte-4161439059",
              job_url_direct: null,
              last_updated: "Thu, 27 Mar 2025 00:00:00 GMT",
              location: "Mumbai, Maharashtra",
              max_amount: null,
              min_amount: null,
              salary_source: null,
              site: "google",
              title:
                "Full Stack-JAVA-Senior Consultant-Hyderabad/Bengaluru/Mumbai",
            },
            {
              company: "FTS Inc",
              company_logo:
                "https://media.glassdoor.com/sql/3220163/fast-tracking-solutions-squareLogo-1715011088393.png",
              currency: "USD",
              date_posted: "Thu, 20 Mar 2025 00:00:00 GMT",
              description:
                "Control System Senior Software Engineer position...",
              id: "gd-1009678634282",
              interval: "hourly",
              is_remote: false,
              job_type: null,
              job_url:
                "https://www.glassdoor.com/job-listing/j?jl=1009678634282",
              job_url_direct: null,
              last_updated: "Thu, 27 Mar 2025 00:00:00 GMT",
              location: "Indianapolis, IN",
              max_amount: 70.0,
              min_amount: 65.0,
              salary_source: "direct_data",
              site: "glassdoor",
              title: "control system senior software engineer",
            },
            {
              company: "Medtronic",
              company_logo: null,
              currency: null,
              date_posted: "Thu, 27 Feb 2025 00:00:00 GMT",
              description: "Senior Enterprise Software Engineer position...",
              id: "go-4p-_4dLVQQ4e13nwAAAAAA==",
              interval: null,
              is_remote: false,
              job_type: null,
              job_url:
                "https://in.linkedin.com/jobs/view/senior-enterprise-software-engineer-at-medtronic-4167966673",
              job_url_direct: null,
              last_updated: "Thu, 27 Mar 2025 00:00:00 GMT",
              location: "Hyderabad, Telangana",
              max_amount: null,
              min_amount: null,
              salary_source: null,
              site: "google",
              title: "Senior Enterprise Software Engineer",
            },
            {
              company: "Sallie Mae",
              company_logo:
                "https://media.glassdoor.com/sql/628/sallie-mae-squarelogo-1717616290075.png",
              currency: null,
              date_posted: "Wed, 12 Mar 2025 00:00:00 GMT",
              description: "Software Engineer II position...",
              id: "gd-1009669178627",
              interval: null,
              is_remote: false,
              job_type: null,
              job_url:
                "https://www.glassdoor.com/job-listing/j?jl=1009669178627",
              job_url_direct: null,
              last_updated: "Thu, 27 Mar 2025 00:00:00 GMT",
              location: "Indianapolis, IN",
              max_amount: null,
              min_amount: null,
              salary_source: null,
              site: "glassdoor",
              title: "Software Engineer II",
            },
          ],
        };
        setRecommendations(response.recommendations);
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      }
    };

    fetchRecommendations();
  }, []);

  return (
    <div className="space-y-6 max-w-[600px]">
      {/* Search  Section */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-3 md:flex-row md:items-center"
        >
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search job title, company, or keywords..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full md:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Search
          </button>
        </form>
      </div>

      <RecommendedJobs recommendations={recommendations} />

      {/* Job Listings */}
      <JobList />
    </div>
  );
}

export default HomePage;
