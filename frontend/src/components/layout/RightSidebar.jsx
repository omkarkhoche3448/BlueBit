import { ExternalLink, TrendingUp } from "lucide-react"

function RightSidebar() {
  const trendingJobs = [
    {
      title: "Software Engineer",
      company: "Tech Giants",
      location: "Remote",
      growth: "+15% YoY",
    },
    {
      title: "Data Scientist",
      company: "Analytics Co",
      location: "New York",
      growth: "+24% YoY",
    },
    {
      title: "Product Manager",
      company: "Product Innovators",
      location: "San Francisco",
      growth: "+18% YoY",
    },
    {
      title: "UX Designer",
      company: "Design Studio",
      location: "Remote",
      growth: "+12% YoY",
    },
  ]

  const resources = [
    { title: "Resume Builder", link: "/resources/resume" },
    { title: "Interview Preparation", link: "/resources/interview" },
    { title: "Salary Insights", link: "/resources/salary" },
    { title: "Career Advice", link: "/resources/career" },
  ]

  return (
    <div className="space-y-4">
      {/* Trending Jobs Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-medium flex items-center">
            <TrendingUp className="h-4 w-4 mr-2 text-blue-600" />
            Trending Jobs
          </h3>
        </div>
        <div className="p-4">
          <ul className="space-y-3">
            {trendingJobs.map((job, index) => (
              <li key={index} className="text-sm">
                <a href="#" className="block hover:bg-gray-50 -m-2 p-2 rounded-md">
                  <p className="font-medium text-gray-900">{job.title}</p>
                  <p className="text-gray-500">
                    {job.company} • {job.location}
                  </p>
                  <p className="text-green-600 text-xs mt-1">{job.growth}</p>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Resources Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-medium">Resources</h3>
        </div>
        <div className="p-4">
          <ul className="space-y-2">
            {resources.map((resource, index) => (
              <li key={index}>
                <a href={resource.link} className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                  <ExternalLink className="h-3 w-3 mr-2" />
                  {resource.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Ad Section */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
        <p className="text-xs text-gray-500 mb-2">Sponsored</p>
        <h4 className="font-medium text-sm mb-2">Upgrade to Premium</h4>
        <p className="text-sm text-gray-600 mb-3">Get access to exclusive job listings and advanced search features.</p>
        <button className="w-full bg-blue-600 text-white text-sm py-1.5 px-3 rounded-md hover:bg-blue-700">
          Try Free for 1 Month
        </button>
      </div>
    </div>
  )
}

export default RightSidebar

