import { useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import { Search, SlidersHorizontal } from "lucide-react"
import { setSearchTerm, setSortBy } from "../slices/filterSlice"
import JobList from "../components/common/JobList"
import PaymentHandler from '../components/PaymentHandler';
import { useUser } from "@clerk/clerk-react";
import RecommendedJobs from "../components/common/RecommendedJobs"

function HomePage() {
  const [searchInput, setSearchInput] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [recommendations, setRecommendations] = useState([])
  const dispatch = useDispatch()
  const { user } = useUser()

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(setSearchTerm(searchInput));
    const trimmedInput = searchInput.trim();
    const searchUrl = trimmedInput ? `/search?q=${encodeURIComponent(trimmedInput)}` : "/search";
    window.location.href = searchUrl;
  }
  
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        // In a real app, this would be an API call
        // For now, we'll use the sample data from the JSON
        const response = {
          recommendations: [
            {
              company: "Deloitte",
              company_logo: "https://media.glassdoor.com/sql/2763/deloitte-squareLogo-1674210308592.png",
              currency: "USD",
              date_posted: "Mon, 03 Mar 2025 00:00:00 GMT",
              description: "Manager, GenAI Engineering position at Deloitte...",
              id: "gd-1009657401693",
              interval: "yearly",
              is_remote: false,
              job_type: null,
              job_url: "https://www.glassdoor.com/job-listing/j?jl=1009657401693",
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
              job_url: "https://www.glassdoor.com/job-listing/j?jl=1009678631516",
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
              title: "Full Stack-JAVA-Senior Consultant-Hyderabad/Bengaluru/Mumbai",
            },
            {
              company: "FTS Inc",
              company_logo:
                "https://media.glassdoor.com/sql/3220163/fast-tracking-solutions-squareLogo-1715011088393.png",
              currency: "USD",
              date_posted: "Thu, 20 Mar 2025 00:00:00 GMT",
              description: "Control System Senior Software Engineer position...",
              id: "gd-1009678634282",
              interval: "hourly",
              is_remote: false,
              job_type: null,
              job_url: "https://www.glassdoor.com/job-listing/j?jl=1009678634282",
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
              job_url: "https://in.linkedin.com/jobs/view/senior-enterprise-software-engineer-at-medtronic-4167966673",
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
              company_logo: "https://media.glassdoor.com/sql/628/sallie-mae-squarelogo-1717616290075.png",
              currency: null,
              date_posted: "Wed, 12 Mar 2025 00:00:00 GMT",
              description: "Software Engineer II position...",
              id: "gd-1009669178627",
              interval: null,
              is_remote: false,
              job_type: null,
              job_url: "https://www.glassdoor.com/job-listing/j?jl=1009669178627",
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
        }
        setRecommendations(response.recommendations)
      } catch (error) {
        console.error("Error fetching recommendations:", error)
      } 
    }

    fetchRecommendations()
  }, [])

  return (
    <div className="space-y-6 max-w-[600px]">
      {/* Search and Filters Section */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search job title, company, or keywords..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none  focus:ring-blue-500"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none  focus:ring-blue-500"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
          </button>
        </form>

        {/* Mobile Filters */}
        {showFilters && <div className="mt-4 md:hidden">{/* Filter controls would go here */}</div>}

        {/* Sort Options */}
        {/* <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">20</span> results
          </div>
          <div className="flex items-center">
            <label htmlFor="sort" className="text-sm font-medium text-gray-700 mr-2 w-fit">
              Sort:
            </label>
            <select
              id="sort"
              name="sort"
              className="block w-full pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              onChange={handleSortChange}
            >
              <option value="relevance">Relevance</option>
              <option value="date">Most Recent</option>
              <option value="salary-high">Salary (High to Low)</option>
              <option value="salary-low">Salary (Low to High)</option>
            </select>
          </div>
        </div> */}
      </div>

      <RecommendedJobs recommendations={recommendations} />

      {/* Job Listings */}
      <JobList />
    </div>
  )
}

export default HomePage

