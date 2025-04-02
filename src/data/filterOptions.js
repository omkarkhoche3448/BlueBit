export const filterOptions = {
  jobType: [
    { value: "", label: "All Types" },
    { value: "fulltime", label: "Full-time" },
    { value: "parttime", label: "Part-time" },
    { value: "contract", label: "Contract" },
    { value: "internship", label: "Internship" },
  ],
  location: [
    { value: "", label: "All Locations" },
    { value: "remote", label: "Remote" },
    { value: "new york", label: "New York" },
    { value: "san francisco", label: "San Francisco" },
    { value: "london", label: "London" },
    { value: "berlin", label: "Berlin" },
  ],
  experienceLevel: [
    { value: "", label: "All Levels" },
    { value: "entry", label: "Entry Level" },
    { value: "mid", label: "Mid Level" },
    { value: "senior", label: "Senior Level" },
    { value: "executive", label: "Executive" },
  ],
  salaryRange: [
    { value: "", label: "All Ranges" },
    { value: "0-50000", label: "$0 - $50,000" },
    { value: "50000-100000", label: "$50,000 - $100,000" },
    { value: "100000-150000", label: "$100,000 - $150,000" },
    { value: "150000+", label: "$150,000+" },
  ],
  datePosted: [
    { value: "", label: "Any Time" },
    { value: "today", label: "Today" },
    { value: "week", label: "Past Week" },
    { value: "month", label: "Past Month" },
  ],
};