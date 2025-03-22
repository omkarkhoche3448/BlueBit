import { useState } from "react"
import { useDispatch } from "react-redux"
import { Search, SlidersHorizontal } from "lucide-react"
import { setSearchTerm, setSortBy } from "../slices/filterSlice"
import JobList from "../components/common/JobList"

function HomePage() {
  const [searchInput, setSearchInput] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const dispatch = useDispatch()

  const handleSearch = (e) => {
    e.preventDefault()
    dispatch(setSearchTerm(searchInput))
  }

  const handleSortChange = (e) => {
    dispatch(setSortBy(e.target.value))
  }

  return (
    <div className="space-y-6">
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
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
          </button>
        </form>

        {/* Mobile Filters */}
        {showFilters && <div className="mt-4 md:hidden">{/* Filter controls would go here */}</div>}

        {/* Sort Options */}
        <div className="mt-4 flex justify-between items-center">
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
        </div>
      </div>

      {/* Job Listings */}
      <JobList />
    </div>
  )
}

export default HomePage

