import { useState, useRef, useEffect } from "react"
import {
  X,
  Search,
  MessageSquare,
  FileText,
  BookOpen,
  Video,
  Calendar,
  Link,
  Plus,
  ArrowRight,
  Mail,
  Upload,
  Play,
  Sparkles,
  LifeBuoy,
  Clock,
  Zap,
  ArrowUpRight,
  ChevronDown,
  Minus,
} from "lucide-react"

// Sample data
const videoTutorialsData = [
  {
    id: "getting-started",
    title: "Getting Started with HandJobs",
    description:
      "Learn how to set up your profile and start finding job opportunities that match your skills and preferences.",
    duration: "4:32",
    videoUrl: "https://example.com/videos/getting-started",
    thumbnail:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "advanced-search",
    title: "Advanced Search Techniques",
    description: "Discover how to use filters and advanced search options to find the perfect job opportunities.",
    duration: "3:45",
    videoUrl: "https://example.com/videos/advanced-search",
    thumbnail:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "ml-recommendations",
    title: "Understanding ML Recommendations",
    description: "See how our machine learning algorithm finds job matches tailored to your skills and preferences.",
    duration: "5:12",
    videoUrl: "https://example.com/videos/ml-recommendations",
    thumbnail:
      "https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "pro-features",
    title: "Pro Features Overview",
    description: "Learn about all the advanced features available with our Pro membership.",
    duration: "6:18",
    videoUrl: "https://example.com/videos/pro-features",
    thumbnail:
      "https://images.unsplash.com/photo-1553877522-43269d4ea984?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "resume-tips",
    title: "Resume Building Tips",
    description: "Get expert advice on how to optimize your resume for better job matches.",
    duration: "7:24",
    videoUrl: "https://example.com/videos/resume-tips",
    thumbnail:
      "https://images.unsplash.com/photo-1586281380349-632531db7ed4?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "interview-prep",
    title: "Interview Preparation",
    description: "Prepare for your interviews with our comprehensive guide.",
    duration: "8:45",
    videoUrl: "https://example.com/videos/interview-prep",
    thumbnail:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  },
]

const helpTopicsData = {
  preferences: [
    {
      id: "job-preferences",
      title: "Job Preferences",
      content:
        "Job preferences help us match you with relevant positions. Select all job areas you're interested in exploring. You can always update these later from your profile settings.",
      videoId: "getting-started",
    },
    {
      id: "cultural-fit",
      title: "Cultural Preferences",
      content:
        "Cultural preferences determine the type of workplace that suits you best. These help us match you with companies that align with your values and preferred working style.",
    },
    {
      id: "location",
      title: "Country & Work Preferences",
      content:
        "Specify countries you're open to working in and your preferred work arrangement (remote, hybrid, in-person). This helps us filter opportunities based on your location preferences.",
      videoId: "advanced-search",
    },
  ],
  account: [
    {
      id: "profile-setup",
      title: "Setting Up Your Profile",
      content:
        "Complete your profile with preferences, resume, and other details to get personalized job recommendations. A complete profile increases your visibility to recruiters.",
      videoId: "getting-started",
    },
    {
      id: "updating-info",
      title: "Updating Your Information",
      content:
        "You can update your preferences anytime by visiting the Edit Preferences page. Changes will be reflected in your future job recommendations.",
    },
    {
      id: "pro-membership",
      title: "Pro Membership Benefits",
      content:
        "Learn about all the exclusive features available to Pro members, including advanced filtering, unlimited saved jobs, and premium career resources.",
      videoId: "pro-features",
    },
  ],
  technical: [
    {
      id: "browser-issues",
      title: "Browser Compatibility",
      content:
        "Our platform works best on Chrome, Firefox, Safari, and Edge. If you're experiencing issues, try clearing your cache or using a different browser.",
    },
    {
      id: "privacy",
      title: "Privacy & Data Security",
      content:
        "Your data is encrypted and secure. We only share relevant information with employers when you apply for a position or opt-in to being discovered.",
    },
    {
      id: "api-access",
      title: "API Integration",
      content:
        "Enterprise customers can access our API for custom integrations. Contact our support team to learn more about API documentation and access.",
      videoId: "pro-features",
    },
  ],
  features: [
    {
      id: "ml-recommendations",
      title: "ML Job Recommendations",
      content:
        "Our machine learning algorithm analyzes your profile, preferences, and behavior to suggest jobs that match your unique skills and career aspirations.",
      videoId: "ml-recommendations",
    },
    {
      id: "job-aggregation",
      title: "Unified Job Search",
      content:
        "We aggregate job listings from multiple platforms including LinkedIn, Indeed, and ZipRecruiter, saving you time and providing more opportunities.",
      videoId: "advanced-search",
    },
    {
      id: "resume-analyzer",
      title: "Resume Analysis Tool",
      content:
        "Our AI-powered resume analyzer provides feedback on your resume and suggests improvements to help you stand out to employers.",
      videoId: "resume-tips",
    },
  ],
}

const faqsData = [
  {
    id: 1,
    question: "How do I change my preferences after saving them?",
    answer:
      "You can edit your preferences anytime by clicking on your profile icon in the top right and selecting 'Edit Preferences' from the dropdown menu. Alternatively, you can navigate directly to the Edit Preferences page.",
    category: "account",
  },
  {
    id: 2,
    question: "Are my preferences visible to employers?",
    answer:
      "Yes, but only the preferences relevant to the job will be visible to employers. Your preferences help us match you with suitable job opportunities and help employers find candidates who match their requirements.",
    category: "privacy",
  },
  {
    id: 3,
    question: "Can I select multiple job types and locations?",
    answer:
      "You can select as many preferences as you like in each category. This gives you more opportunities to match with potential employers.",
    category: "preferences",
  },
  {
    id: 4,
    question: "Why should I upload my resume?",
    answer:
      "Uploading your resume helps us extract relevant skills and experience to enhance your profile. This improves job matching and makes it easier for employers to find you.",
    category: "features",
  },
  {
    id: 5,
    question: "What's the difference between 'Skip for now' and 'Save Preferences'?",
    answer:
      "Clicking 'Save Preferences' will save your current selections and take you to the next step. 'Skip for now' allows you to proceed without saving preferences, but you might get less relevant job recommendations.",
    category: "preferences",
  },
  {
    id: 6,
    question: "How does the ML recommendation system work?",
    answer:
      "Our ML recommendation system analyzes your profile, preferences, skills, and past interactions to suggest jobs that best match your qualifications and career goals. The more you use the platform, the more personalized your recommendations become.",
    category: "features",
  },
  {
    id: 7,
    question: "What are the benefits of a Pro membership?",
    answer:
      "Pro membership includes advanced filtering options, unlimited saved jobs, real-time notifications for new matching positions, application tracking, resume analysis tools, and exclusive salary insights to help you make informed career decisions.",
    category: "account",
  },
  {
    id: 8,
    question: "How secure is my personal information?",
    answer:
      "We use industry-standard encryption and security measures to protect your data. Your information is only shared with employers when you apply to positions or opt-in to be discovered. You can review and modify your privacy settings anytime in your account.",
    category: "privacy",
  },
  {
    id: 9,
    question: "Can I use the platform on mobile devices?",
    answer:
      "Yes, our platform is fully responsive and optimized for mobile use. You can access all features from your smartphone or tablet, allowing you to search for jobs and manage your profile on the go.",
    category: "technical",
  },
  {
    id: 10,
    question: "How do I cancel my subscription?",
    answer:
      "You can cancel your subscription anytime by going to Account Settings > Subscription > Cancel Subscription. Your Pro features will remain active until the end of your current billing period.",
    category: "account",
  },
]

// Main component
const HelpCenterModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("quick-help")
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedFaq, setExpandedFaq] = useState(null)
  const [activeCategory, setActiveCategory] = useState("all")
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [isAnimatingOut, setIsAnimatingOut] = useState(false)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const modalRef = useRef(null)
  const searchInputRef = useRef(null)

  // Handle modal close with animation
  const handleClose = () => {
    setIsAnimatingOut(true)
    setTimeout(() => {
      onClose()
      setIsAnimatingOut(false)
    }, 300)
  }

  // Handle click outside modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        handleClose()
      }
    }

    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleEscapeKey)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscapeKey)
    }
  }, [isOpen, onClose])

  // Focus trap for modal
  useEffect(() => {
    if (isOpen) {
      // Lock body scroll
      document.body.style.overflow = "hidden"

      // Focus search input when modal opens
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus()
        }
      }, 100)
    } else {
      // Restore body scroll
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  // Filter data based on search query
  const filteredFaqs = faqsData.filter((faq) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = activeCategory === "all" || faq.category === activeCategory

    return matchesSearch && matchesCategory
  })

  const filteredVideos = videoTutorialsData.filter(
    (video) =>
      searchQuery.trim() === "" ||
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Event handlers
  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id)
  }

  const openVideo = (video) => {
    setSelectedVideo(video)
  }

  const openVideoById = (videoId) => {
    const video = videoTutorialsData.find((v) => v.id === videoId)
    if (video) {
      setSelectedVideo(video)
    }
  }

  const closeVideo = () => {
    setSelectedVideo(null)
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out"
      style={{ opacity: isAnimatingOut ? 0 : 1 }}
      aria-modal="true"
      role="dialog"
      aria-labelledby="help-modal-title"
    >
      <div
        ref={modalRef}
        className={`
          bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col 
          transform transition-all duration-300 overflow-hidden
          ${isAnimatingOut ? "scale-95 opacity-0" : "scale-100 opacity-100"}
        `}
      >
        {/* Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 opacity-90"></div>
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557682250-33bd709cbe85?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')] bg-cover bg-center mix-blend-overlay opacity-20"></div>

          <div className="relative px-8 py-6 flex justify-between items-center z-10">
            <div className="flex items-center">
              <div className="bg-white/20 backdrop-blur-md rounded-2xl p-3 mr-4 shadow-lg">
                <LifeBuoy className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 id="help-modal-title" className="text-2xl font-bold text-white">
                  Help Center
                </h2>
                <p className="text-white/80 text-sm mt-1">Find answers, watch tutorials, get support</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2.5 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md"
              aria-label="Close help center"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative px-8 pb-6">
            <div className="relative max-w-2xl mx-auto">
              <div
                className={`
                relative bg-white/10 backdrop-blur-xl rounded-xl overflow-hidden
                focus-within:bg-white/20 transition-all duration-200 shadow-lg
                border border-white/20
              `}
              >
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-white/70" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  placeholder="Search for help topics, FAQs, or videos..."
                  className="w-full pl-12 pr-12 py-3.5 bg-transparent text-white placeholder-white/60 outline-none text-base"
                  aria-label="Search"
                />
                {searchQuery && (
                  <button
                    className="absolute inset-y-0 right-4 flex items-center"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                  >
                    <X className="h-5 w-5 text-white/70 hover:text-white" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs - Fixed for better responsiveness */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
          <div className="flex overflow-x-auto hide-scrollbar">
            <TabButton
              active={activeTab === "quick-help"}
              onClick={() => setActiveTab("quick-help")}
              icon={Sparkles}
              label="Quick Help"
            />
            <TabButton
              active={activeTab === "videos"}
              onClick={() => setActiveTab("videos")}
              icon={Video}
              label="Video Tutorials"
            />
            <TabButton
              active={activeTab === "faqs"}
              onClick={() => setActiveTab("faqs")}
              icon={BookOpen}
              label="FAQs"
            />
            <TabButton
              active={activeTab === "contact"}
              onClick={() => setActiveTab("contact")}
              icon={MessageSquare}
              label="Contact Support"
            />
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {/* Quick Help Tab */}
          {activeTab === "quick-help" && (
            <div className="animate-in fade-in duration-300 p-4 sm:p-6 md:p-8">
              <h3 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-gray-900">How can we help you?</h3>

              {Object.entries(helpTopicsData).map(([category, topics]) => (
                <div key={category} className="mb-8 sm:mb-10">
                  <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800 capitalize flex items-center">
                    {category === "preferences" && <Calendar className="h-5 w-5 mr-2 text-purple-500" />}
                    {category === "account" && <FileText className="h-5 w-5 mr-2 text-indigo-500" />}
                    {category === "technical" && <Link className="h-5 w-5 mr-2 text-blue-500" />}
                    {category === "features" && <Zap className="h-5 w-5 mr-2 text-violet-500" />}
                    {category} Help
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    {topics.map((topic) => (
                      <HelpTopicCard
                        key={topic.id}
                        topic={topic}
                        category={category}
                        onVideoClick={topic.videoId ? openVideoById : undefined}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Videos Tab */}
          {activeTab === "videos" && (
            <div className="animate-in fade-in duration-300 p-4 sm:p-6 md:p-8">
              <h3 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-gray-900">Video Tutorials</h3>

              {searchQuery && filteredVideos.length === 0 ? (
                <EmptyState
                  icon={Video}
                  title={`No video tutorials found for "${searchQuery}"`}
                  description="Try using different keywords or browse our video library"
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {filteredVideos.map((video) => (
                    <VideoCard key={video.id} video={video} onClick={() => openVideo(video)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* FAQs Tab */}
          {activeTab === "faqs" && (
            <div className="animate-in fade-in duration-300 p-4 sm:p-6 md:p-8">
              <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900">Frequently Asked Questions</h3>

              <div className="mb-6 sm:mb-8 flex flex-wrap gap-2">
                <CategoryButton
                  active={activeCategory === "all"}
                  onClick={() => setActiveCategory("all")}
                  label="All Questions"
                />
                <CategoryButton
                  active={activeCategory === "account"}
                  onClick={() => setActiveCategory("account")}
                  label="Account"
                />
                <CategoryButton
                  active={activeCategory === "preferences"}
                  onClick={() => setActiveCategory("preferences")}
                  label="Preferences"
                />
                <CategoryButton
                  active={activeCategory === "features"}
                  onClick={() => setActiveCategory("features")}
                  label="Features"
                />
                <CategoryButton
                  active={activeCategory === "privacy"}
                  onClick={() => setActiveCategory("privacy")}
                  label="Privacy"
                />
                <CategoryButton
                  active={activeCategory === "technical"}
                  onClick={() => setActiveCategory("technical")}
                  label="Technical"
                />
              </div>

              {searchQuery && filteredFaqs.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title={`No results found for "${searchQuery}"`}
                  description="Try using different keywords or browse through categories"
                />
              ) : (
                <div className="space-y-4">
                  {filteredFaqs.map((faq) => (
                    <FaqItem
                      key={faq.id}
                      faq={faq}
                      isExpanded={expandedFaq === faq.id}
                      onToggle={() => toggleFaq(faq.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === "contact" && (
            <div className="animate-in fade-in duration-300 p-4 sm:p-6 md:p-8">
              <h3 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-gray-900">Contact Support</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-10">
                <ContactCard
                  icon={MessageSquare}
                  title="Live Chat Support"
                  description="Available Monday to Friday, 9am - 5pm"
                  actionLabel="Start Chat"
                  iconColor="bg-gradient-to-br from-purple-500 to-indigo-600"
                />

                <ContactCard
                  icon={Mail}
                  title="Email Support"
                  description="We'll respond within 24 hours"
                  actionLabel="Email Us"
                  actionHref="mailto:support@example.com"
                  iconColor="bg-gradient-to-br from-blue-500 to-cyan-600"
                />
              </div>

              <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm border border-gray-100">
                <h4 className="text-lg sm:text-xl font-semibold mb-5 sm:mb-6 text-gray-900">Submit a Support Ticket</h4>
                <form className="space-y-5">
                  <FormField label="Subject" id="subject" placeholder="Brief description of your issue" type="text" />

                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <div className="relative">
                      <select
                        id="category"
                        className="w-full p-3.5 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all duration-200 bg-white text-gray-900 appearance-none"
                      >
                        <option value="">Select a category</option>
                        <option value="account">Account Issues</option>
                        <option value="billing">Billing & Subscription</option>
                        <option value="technical">Technical Problems</option>
                        <option value="feature">Feature Request</option>
                        <option value="other">Other</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      id="description"
                      className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all duration-200 h-32 resize-none bg-white text-gray-900"
                      placeholder="Please provide details about your issue"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Attachments (Optional)</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 sm:p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer group">
                      <input type="file" className="hidden" id="file-upload" multiple />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <div className="mx-auto flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-violet-100 group-hover:bg-violet-200 transition-colors mb-4">
                          <Upload className="h-6 w-6 sm:h-7 sm:w-7 text-violet-600" />
                        </div>
                        <p className="text-violet-600 font-medium group-hover:text-violet-700">Click to upload files</p>
                        <p className="text-sm text-gray-500 mt-1">PNG, JPG, PDF up to 10MB</p>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="px-5 py-3 sm:px-6 sm:py-3.5 rounded-xl font-medium text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                    >
                      Submit Ticket
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Video Player Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={closeVideo}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h3 className="font-semibold text-lg text-gray-900">{selectedVideo.title}</h3>
              <button
                onClick={closeVideo}
                className="text-gray-500 hover:text-gray-700 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close video"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="bg-black aspect-video flex items-center justify-center relative">
              <img
                src={selectedVideo.thumbnail || "/placeholder.svg"}
                alt=""
                className="w-full h-full object-cover opacity-40"
                aria-hidden="true"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white text-center">
                  <button className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full p-5 mx-auto mb-5 cursor-pointer hover:from-violet-700 hover:to-indigo-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 transition-transform duration-200">
                    <Play className="h-10 w-10" fill="white" />
                  </button>
                  <p className="text-2xl font-semibold">{selectedVideo.title}</p>
                  <p className="text-sm text-gray-300 mt-2">Duration: {selectedVideo.duration}</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <h4 className="font-semibold text-xl mb-3 text-gray-900">{selectedVideo.title}</h4>
              <p className="text-gray-700">{selectedVideo.description}</p>
              <div className="mt-4 flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-1.5" />
                <span>Published: March 15, 2023</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Reusable components
const TabButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    className={`
      flex items-center px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium transition-all duration-200 relative whitespace-nowrap
      ${active ? "text-violet-600" : "text-gray-600 hover:text-violet-500"}
    `}
    onClick={onClick}
    aria-selected={active}
    role="tab"
  >
    <Icon className={`h-4.5 w-4.5 mr-2 ${active ? "text-violet-600" : "text-gray-500"}`} />
    <span>{label}</span>
    {active && (
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-t-full" />
    )}
  </button>
)

const CategoryButton = ({ active, onClick, label }) => (
  <button
    className={`
      px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
      ${
        active
          ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md"
          : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
      }
    `}
    onClick={onClick}
    aria-selected={active}
    role="tab"
  >
    {label}
  </button>
)

const HelpTopicCard = ({ topic, category, onVideoClick }) => {
  const hasVideo = topic.videoId && onVideoClick

  // Different gradient colors based on category
  const gradients = {
    preferences: "from-purple-50 to-purple-100",
    account: "from-indigo-50 to-indigo-100",
    technical: "from-blue-50 to-blue-100",
    features: "from-violet-50 to-violet-100",
  }

  const gradient = gradients[category] || "from-gray-50 to-gray-100"

  return (
    <div
      className={`
      group rounded-2xl overflow-hidden bg-gradient-to-br ${gradient}
      hover:shadow-lg transition-all duration-300 p-5 sm:p-6 border border-gray-200
    `}
    >
      <div className="flex justify-between items-start mb-3">
        <h5 className="font-semibold text-gray-900 group-hover:text-violet-700 transition-colors">{topic.title}</h5>
        {hasVideo && (
          <button
            className="text-violet-600 hover:text-violet-700 flex items-center text-sm font-medium bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 transition-colors shadow-sm"
            onClick={() => onVideoClick(topic.videoId)}
            aria-label={`Watch video about ${topic.title}`}
          >
            <Video className="h-3.5 w-3.5 mr-1.5" />
            Watch
          </button>
        )}
      </div>
      <p className="text-sm text-gray-600 mb-4">{topic.content}</p>
      <div className="text-violet-600 text-sm font-medium flex items-center group-hover:translate-x-1 transition-transform">
        Learn more <ArrowUpRight className="h-4 w-4 ml-1.5" />
      </div>
    </div>
  )
}

const VideoCard = ({ video, onClick }) => (
  <div
    className="group rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
    onClick={onClick}
    tabIndex={0}
    role="button"
    aria-label={`Watch ${video.title}`}
    onKeyDown={(e) => e.key === "Enter" && onClick()}
  >
    <div className="relative overflow-hidden">
      <img
        src={video.thumbnail || "/placeholder.svg"}
        alt=""
        className="w-full h-48 object-cover transform group-hover:scale-105 transition-transform duration-500"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full p-3.5 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 shadow-lg">
          <Play className="h-7 w-7 text-white" fill="white" />
        </div>
      </div>
      <div className="absolute bottom-3 right-3 bg-black/75 text-white text-xs py-1 px-2.5 rounded-full backdrop-blur-sm">
        {video.duration}
      </div>
    </div>
    <div className="p-5">
      <h5 className="font-semibold mb-2 text-gray-900 group-hover:text-violet-600 transition-colors line-clamp-1">
        {video.title}
      </h5>
      <p className="text-sm text-gray-600 line-clamp-2">{video.description}</p>
    </div>
  </div>
)

const FaqItem = ({ faq, isExpanded, onToggle }) => (
  <div className="rounded-2xl overflow-hidden bg-white border border-gray-200 hover:border-violet-200 transition-colors duration-200 shadow-sm">
    <button
      className="w-full text-left p-5 flex justify-between items-center hover:bg-gray-50/80 transition-colors"
      onClick={onToggle}
      aria-expanded={isExpanded}
      aria-controls={`faq-answer-${faq.id}`}
    >
      <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
      <div
        className={`
        rounded-full p-1.5 transition-colors duration-200
        ${isExpanded ? "bg-violet-100 text-violet-600" : "bg-gray-100 text-gray-500"}
      `}
      >
        {isExpanded ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      </div>
    </button>

    <div
      id={`faq-answer-${faq.id}`}
      className={`
        overflow-hidden transition-all duration-300 ease-in-out
        ${isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}
      `}
      aria-hidden={!isExpanded}
    >
      <div className="p-5 bg-gray-50/80 border-t border-gray-200">
        <p className="text-gray-700">{faq.answer}</p>
      </div>
    </div>
  </div>
)

const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="text-center py-16 px-4">
    <div className="bg-violet-100 rounded-full p-5 w-20 h-20 mx-auto mb-5 flex items-center justify-center">
      <Icon className="h-10 w-10 text-violet-500" />
    </div>
    <p className="text-gray-900 text-xl font-semibold mb-2">{title}</p>
    {description && <p className="text-gray-600 max-w-md mx-auto">{description}</p>}
  </div>
)

const ContactCard = ({ icon: Icon, title, description, actionLabel, actionHref, iconColor }) => {
  const ActionButton = () => (
    <button className="px-5 py-3 rounded-xl font-medium text-white shadow-md hover:shadow-lg transition-all duration-200 flex items-center bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
      {actionLabel} <ArrowRight className="ml-2 h-4 w-4" />
    </button>
  )

  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start">
        <div className={`mr-5 ${iconColor} p-4 rounded-2xl shadow-md h-fit`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h4 className="font-semibold mb-2 text-gray-900 text-lg">{title}</h4>
          <p className="text-gray-600 mb-5">{description}</p>
          {actionHref ? (
            <a href={actionHref} className="inline-block">
              <ActionButton />
            </a>
          ) : (
            <ActionButton />
          )}
        </div>
      </div>
    </div>
  )
}

const FormField = ({ label, id, placeholder, type = "text" }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
      {label}
    </label>
    <input
      type={type}
      id={id}
      className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all duration-200 bg-white text-gray-900"
      placeholder={placeholder}
    />
  </div>
)

export default HelpCenterModal

