import { useState, useEffect, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Briefcase,
  Filter,
  Globe,
  Zap,
  CheckCircle,
  Database,
  Layers,
  Compass,
  Star,
  Menu,
  X,
  Linkedin,
  ExternalLink,
  BarChart2,
  Bookmark,
  AlertCircle,
  Bell,
} from "lucide-react";

import { useClerk } from "@clerk/clerk-react";

// Lazy load components that aren't needed immediately
const SignIn = lazy(() => import("@clerk/clerk-react").then(module => ({ default: module.SignIn })));
const SignUp = lazy(() => import("@clerk/clerk-react").then(module => ({ default: module.SignUp })));

export default function LandingPage() {
  const clerk = useClerk();

  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [email, setEmail] = useState("");
  const [isVisible, setIsVisible] = useState({
    features: false,
    howItWorks: false,
    testimonials: false,
    pricing: false,
  });
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Intersection Observer for scroll animations - optimized with fewer re-renders
  useEffect(() => {
    const observerOptions = {
      threshold: isMobile ? 0.1 : 0.2, // Lower threshold for mobile
      rootMargin: isMobile ? "0px 0px -50px 0px" : "0px 0px -100px 0px",
    };

    const observerCallback = (entries) => {
      const updatedSections = {};
      
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          updatedSections[entry.target.id] = true;
        }
      });
      
      if (Object.keys(updatedSections).length > 0) {
        setIsVisible(prev => ({ ...prev, ...updatedSections }));
      }
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions
    );

    const sections = ["features", "howItWorks", "testimonials", "pricing"];
    sections.forEach((section) => {
      const element = document.getElementById(section);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [isMobile]);

  // Optimized animations for mobile
  const fadeInUp = {
    hidden: { opacity: 0, y: isMobile ? 30 : 60 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: isMobile ? 0.4 : 0.6,
        ease: "easeOut",
      },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: isMobile ? 0.1 : 0.2,
      },
    },
  };

  const platformTabs = [
    {
      name: "LinkedIn",
      icon: <Linkedin className="h-5 w-5 mr-2" />,
      color: "bg-blue-600",
    },
    {
      name: "Indeed",
      icon: <Briefcase className="h-5 w-5 mr-2" />,
      color: "bg-blue-500",
    },
    {
      name: "Ziprecruiter",
      icon: <Globe className="h-5 w-5 mr-2" />,
      color: "bg-purple-600",
    },
  ];

  const features = [
    {
      title: "Unified Job Search",
      description:
        "Search across LinkedIn, Indeed, Ziprecruiter, and more with a single query. No more jumping between tabs.",
      icon: <Search className="h-6 w-6" />,
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
    },
    {
      title: "Advanced Filtering",
      description:
        "Filter by location, experience level, company, and more. Find exactly what you're looking for in seconds.",
      icon: <Filter className="h-6 w-6" />,
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
    },
    {
      title: "Real-time Updates",
      description:
        "Get notified about new opportunities that match your criteria as soon as they're posted.",
      icon: <Zap className="h-6 w-6" />,
      color: "bg-gradient-to-br from-amber-500 to-amber-600",
    },
    {
      title: "Direct Applications",
      description:
        "Apply to jobs directly through our platform with just a few clicks. Track your applications in one place.",
      icon: <ExternalLink className="h-6 w-6" />,
      color: "bg-gradient-to-br from-green-500 to-green-600",
    },
    {
      title: "Data Insights",
      description:
        "Gain valuable insights into job market trends, salary ranges, and in-demand skills.",
      icon: <BarChart2 className="h-6 w-6" />,
      color: "bg-gradient-to-br from-red-500 to-red-600",
    },
    {
      title: "Saved Searches",
      description:
        "Save your search criteria and receive alerts when new matching opportunities are available.",
      icon: <Bookmark className="h-6 w-6" />,
      color: "bg-gradient-to-br from-cyan-500 to-cyan-600",
    },
  ];

  const steps = [
    {
      title: "Aggregate",
      description:
        "Our advanced web crawlers continuously scan top job platforms to collect the latest opportunities.",
      icon: <Database className="h-8 w-8" />,
      color: "bg-blue-600",
    },
    {
      title: "Analyze",
      description:
        "We process and categorize job listings to ensure you get relevant, high-quality results.",
      icon: <Layers className="h-8 w-8" />,
      color: "bg-purple-600",
    },
    {
      title: "Search",
      description:
        "Use our powerful search and filtering tools to find exactly what you're looking for.",
      icon: <Compass className="h-8 w-8" />,
      color: "bg-amber-600",
    },
    {
      title: "Apply",
      description:
        "Apply directly through our platform or follow links to the original job posting.",
      icon: <CheckCircle className="h-8 w-8" />,
      color: "bg-green-600",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Software Engineer",
      company: "Recently hired at Google",
      quote:
        "Handjobs saved me countless hours of searching across different platforms. I found my dream job at Google in just two weeks!",
      avatar: "https://i.pravatar.cc/80?img=1",
    },
    {
      name: "Michael Chen",
      role: "Product Manager",
      company: "Recently hired at Airbnb",
      quote:
        "The filtering options are incredible. I was able to narrow down exactly what I was looking for and found the perfect match.",
      avatar: "https://i.pravatar.cc/80?img=2",
    },
    {
      name: "Jessica Williams",
      role: "UX Designer",
      company: "Recently hired at Figma",
      quote:
        "As a designer, I appreciate the clean interface and thoughtful user experience. It made my job search so much easier.",
      avatar: "https://i.pravatar.cc/80?img=3",
    },
  ];

  const plans = [
    {
      name: "Free",
      price: "₹0",
      period: "/month",
      description: "Perfect for casual job seekers",
      features: [
        "Basic job search across platforms",
        "Limited filters",
        "Save up to 5 jobs",
        "Weekly email alerts",
      ],
      cta: "Get Started",
      popular: false,
      color: "border-gray-200",
    },
    {
      name: "Pro",
      price: "₹199",
      period: "/month",
      description: "For serious job hunters",
      features: [
        "Advanced search with all filters",
        "Unlimited saved jobs",
        "Real-time notifications",
        "Application tracking",
        "Resume analyzer",
        "Salary insights",
      ],
      cta: "Start Free Trial",
      popular: true,
      color: "border-blue-500",
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For teams and organizations",
      features: [
        "Everything in Pro",
        "API access",
        "Custom integrations",
        "Dedicated account manager",
        "Advanced analytics",
        "White-label options",
      ],
      cta: "Contact Sales",
      popular: false,
      color: "border-gray-200",
    },
  ];

  const footerLinks = [
    {
      title: "Product",
      links: [{ name: "Features", href: "#" }],
    },
    {
      title: "Support",
      links: [{ name: "Help Center", href: "#" }],
    },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Email submitted:", email);
    setEmail("");
  };

  // Close mobile menu when clicking on a link
  const handleMobileNavClick = (sectionId) => {
    setIsMenuOpen(false);
    // Smooth scroll to section
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Add viewport meta tag for better mobile experience */}
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      
      {/* Auth Modals - Lazy loaded */}
      <AnimatePresence>
        {showSignIn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center"
            onClick={() => setShowSignIn(false)}
          >
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              className="bg-white rounded-xl p-4 sm:p-8 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
                <SignIn afterSignInUrl="/home" />
              </Suspense>
            </motion.div>
          </motion.div>
        )}

        {showSignUp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center"
            onClick={() => setShowSignUp(false)}
          >
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              className="bg-white rounded-xl p-4 sm:p-8 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
                <SignUp afterSignUpUrl="/home" />
              </Suspense>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Navigation - Optimized for mobile */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <motion.div
                className="flex-shrink-0 flex items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mr-2">
                  <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <span className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                  Handjobs
                </span>
              </motion.div>
              <div className="hidden md:ml-8 md:flex md:space-x-8">
                <a
                  href="#features"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                >
                  Features
                </a>
                <a
                  href="#howItWorks"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                >
                  How It Works
                </a>
                <a
                  href="#testimonials"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                >
                  Testimonials
                </a>
                <a
                  href="#pricing"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                >
                  Pricing
                </a>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              {/* Auth buttons commented out as in original code */}
            </div>
            <div className="flex md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 focus:outline-none"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu - Improved animation and UX */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className="md:hidden fixed inset-x-0 top-16 z-40"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-lg border-b border-gray-200">
                <a
                  href="#features"
                  className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  onClick={() => handleMobileNavClick("features")}
                >
                  Features
                </a>
                <a
                  href="#howItWorks"
                  className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  onClick={() => handleMobileNavClick("howItWorks")}
                >
                  How It Works
                </a>
                <a
                  href="#testimonials"
                  className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  onClick={() => handleMobileNavClick("testimonials")}
                >
                  Testimonials
                </a>
                <a
                  href="#pricing"
                  className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  onClick={() => handleMobileNavClick("pricing")}
                >
                  Pricing
                </a>
                {/* Auth buttons commented out as in original code */}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section - Optimized for mobile */}
      <section className="pt-24 pb-16 md:pt-36 md:pb-32 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <motion.div
              className="text-center lg:text-left lg:col-span-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm sm:text-base font-medium bg-blue-100 text-blue-800">
                  <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Launching Soon
                </span>
              </motion.div>
              <motion.h1
                className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 sm:mt-5 lg:mt-6 xl:text-6xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                <span className="block">One search.</span>
                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                  All job opportunities.
                </span>
              </motion.h1>
              <motion.p
                className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                Stop jumping between job sites. Handjobs aggregates opportunities
                from LinkedIn, Indeed, Ziprecruiter, and more — all in one powerful
                search platform.
              </motion.p>
              <motion.div
                className="mt-8 mx-auto max-w-sm sm:max-w-lg lg:mx-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.8 }}
              >
                <form onSubmit={handleSubmit} className="mt-3 flex flex-col sm:flex-row">
                  <label htmlFor="email" className="sr-only">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    className="block w-full rounded-md border border-gray-300 px-5 py-3 text-base text-gray-900 placeholder-gray-500 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <motion.button
                    type="submit"
                    className="mt-3 w-full rounded-md px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-base font-medium text-white shadow-md hover:shadow-lg sm:mt-0 sm:ml-3 sm:w-auto sm:flex-shrink-0"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Get early access
                  </motion.button>
                </form>
                <p className="mt-3 text-sm text-gray-500 flex items-center justify-center lg:justify-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  No credit card required
                </p>
              </motion.div>
            </motion.div>
            
            {/* App mockup - Only show on larger screens or simplified on mobile */}
            <motion.div
              className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center"
              initial={{ opacity: 0, x: isMobile ? 0 : 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            >
              <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
                <div className="relative block w-full bg-white rounded-lg overflow-hidden">
                  <div className="w-full">
                    <div className="relative h-fit bg-white rounded-lg border border-gray-200 shadow-xl overflow-hidden">
                      {/* App UI mockup - Simplified for mobile */}
                      <div className="p-4">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-2">
                            <div className="h-8 w-8 rounded-md bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                              <Briefcase className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-bold text-lg">Handjobs</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                              <Bell className="h-4 w-4 text-gray-500" />
                            </div>
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                JD
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Search */}
                        <div className="mb-6">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                              type="text"
                              className="block w-full rounded-lg border border-gray-300 pl-10 pr-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                              placeholder="Search job title, company, or keywords..."
                            />
                          </div>
                        </div>

                        {/* Tabs - Simplified for mobile */}
                        <div className="flex space-x-1 mb-6 border-b border-gray-200 overflow-x-auto pb-1 hide-scrollbar">
                          {platformTabs.map((tab, index) => (
                            <button
                              key={index}
                              className={`flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-t-lg whitespace-nowrap ${
                                activeTab === index
                                  ? "text-blue-600 border-b-2 border-blue-600"
                                  : "text-gray-500 hover:text-gray-700"
                              }`}
                              onClick={() => setActiveTab(index)}
                            >
                              {tab.icon}
                              {tab.name}
                            </button>
                          ))}
                        </div>

                        {/* Job listings - Show fewer on mobile */}
                        <div className="space-y-4">
                          {[
                            {
                              title: "Senior Product Designer",
                              company: "Airbnb",
                              location: "Remote",
                              posted: "2h ago",
                              logo: "https://imgs.search.brave.com/oBliE7TXIHe3I5t7Ifr_5bcQlQIf7rR5I6dx9mHcBMQ/rs:fit:500:0:0:0/g:ce/aHR0cHM6Ly9taXJv/Lm1lZWRpdW0uY29t/vjIvMSpNbE5RS2ct/c2llQkdXNXByV29l/OUhRLmpwZWc",
                              source: platformTabs[activeTab].name,
                              sourceColor: platformTabs[activeTab].color,
                            },
                            {
                              title: "Frontend Developer",
                              company: "Stripe",
                              location: "San Francisco",
                              posted: "5h ago",
                              logo: "https://stripe.com/img/v3/home/twitter.png",
                              source: platformTabs[activeTab].name,
                              sourceColor: platformTabs[activeTab].color,
                            },
                            // Show only 2 jobs on mobile, 3 on desktop
                            ...(!isMobile ? [{
                              title: "Data Scientist",
                              company: "Netflix",
                              location: "Los Angeles",
                              posted: "1d ago",
                              logo: "https://upload.wikimedia.org/wikipedia/commons/6/69/Netflix_logo.svg",
                              source: platformTabs[activeTab].name,
                              sourceColor: platformTabs[activeTab].color,
                            }] : []),
                          ].map((job, i) => (
                            <motion.div
                              key={i}
                              className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.1, duration: 0.3 }}
                              whileHover={{ scale: 1.02 }}
                            >
                              <div className="flex items-start">
                                <div className="h-10 w-10 rounded-md overflow-hidden mr-3 flex-shrink-0">
                                  {/* Use loading="lazy" for images */}
                                  <img
                                    src={job.logo || "/placeholder.svg"}
                                    alt={job.company}
                                    width={40}
                                    height={40}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between">
                                    <h3 className="text-sm font-medium text-gray-900 truncate">
                                      {job.title}
                                    </h3>
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${job.sourceColor} text-white`}
                                    >
                                      {job.source}
                                    </span>
                                  </div>
                                  <div className="mt-1 flex items-center text-xs text-gray-500">
                                    <span className="truncate">
                                      {job.company}
                                    </span>
                                    <span className="mx-1.5 h-1 w-1 rounded-full bg-gray-300"></span>
                                    <span>{job.location}</span>
                                  </div>
                                  <div className="mt-2 flex items-center justify-between">
                                    <span className="text-xs text-gray-500">
                                      {job.posted}
                                    </span>
                                    <div className="flex space-x-2">
                                      <button className="text-xs text-blue-600 hover:text-blue-800">
                                        Save
                                      </button>
                                      <button className="text-xs text-blue-600 hover:text-blue-800">
                                        Apply
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Logos Section - Optimized for mobile */}
      <section className="py-8 sm:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.p
            className="text-center text-sm sm:text-base font-medium text-gray-500 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            Aggregating jobs from leading platforms
          </motion.p>
          <motion.div
            className="grid grid-cols-2 gap-8 md:grid-cols-6 lg:grid-cols-5 sm:grid-cols-1"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {[
              {
                name: "LinkedIn",
                logo: "https://upload.wikimedia.org/wikipedia/commons/0/01/LinkedIn_Logo.svg",
              },
              {
                name: "Indeed",
                logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Indeed_logo.svg/1920px-Indeed_logo.svg.png",
              },
              {
                name: "Ziprecruiter",
                logo: "https://mms.businesswire.com/media/20240725864404/en/2196160/4/ZipRecruiter_logo_dark_web.jpg",
              },
              {
                name: "Glassdoor",
                logo: "https://upload.wikimedia.org/wikipedia/commons/f/f0/Glassdoor_Logo_2023.svg",
              },
              {
                name: "Monster",
                logo: "https://upload.wikimedia.org/wikipedia/commons/2/2c/Monster.com_Logo_2019.svg",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                className="col-span-1 flex justify-center md:col-span-2 lg:col-span-1"
                variants={fadeInUp}
              >
                <div className="h-12 flex items-center justify-center">
                  <img
                    src={item.logo}
                    alt={item.name}
                    className="h-full w-auto"
                    loading="lazy"
                    width={120}
                    height={48}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section - Optimized for mobile */}
      <section id="features" className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 40 }}
            animate={
              isVisible.features ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }
            }
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-base font-semibold tracking-wide uppercase text-blue-600">
              Features
            </h2>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900 sm:text-4xl lg:text-5xl">
              Everything you need to find your dream job
            </p>
            <p className="mt-4 max-w-2xl text-lg sm:text-xl text-gray-500 mx-auto">
              Handjobs brings all job opportunities to one place, saving you time
              and helping you find the perfect match.
            </p>
          </motion.div>

          <motion.div
            className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            animate={isVisible.features ? "visible" : "hidden"}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
                variants={fadeInUp}
              >
                <div className="p-6 sm:p-8">
                  <div
                    className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center text-white mb-5`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section - Optimized for mobile */}
      <section id="howItWorks" className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 40 }}
            animate={
              isVisible.howItWorks
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: 40 }
            }
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-base font-semibold tracking-wide uppercase text-blue-600">
              How It Works
            </h2>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900 sm:text-4xl lg:text-5xl">
              Simplifying your job search
            </p>
            <p className="mt-4 max-w-2xl text-lg sm:text-xl text-gray-500 mx-auto">
              Our platform works tirelessly behind the scenes to bring you the
              best opportunities with minimal effort.
            </p>
          </motion.div>

          <motion.div
            className="relative"
            initial={{ opacity: 0 }}
            animate={isVisible.howItWorks ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            {/* Timeline connector - only visible on desktop */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gray-200 hidden md:block"></div>

            {/* Mobile-optimized grid */}
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-x-6 md:gap-y-12">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  className="relative"
                  initial={{ opacity: 0, y: 30 }}
                  animate={
                    isVisible.howItWorks
                      ? { opacity: 1, y: 0 }
                      : { opacity: 0, y: 30 }
                  }
                  transition={{ 
                    duration: isMobile ? 0.4 : 0.5, 
                    delay: isMobile ? index * 0.08 + 0.3 : index * 0.1 + 0.5 
                  }}
                >
                  <div className="flex flex-col items-center text-center">
                    <div
                      className={`flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full ${step.color} text-white mb-4 z-10`}
                    >
                      {step.icon}
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 max-w-xs mx-auto">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section - Optimized for mobile */}
      <section id="testimonials" className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 40 }}
            animate={
              isVisible.testimonials
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: 40 }
            }
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-base font-semibold tracking-wide uppercase text-blue-600">
              Testimonials
            </h2>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900 sm:text-4xl lg:text-5xl">
              Success stories from our users
            </p>
            <p className="mt-4 max-w-2xl text-lg sm:text-xl text-gray-500 mx-auto">
              Hear from job seekers who found their dream positions using
              Handjobs.
            </p>
          </motion.div>

          {/* Testimonials grid - Responsive for mobile */}
          <motion.div
            className="grid gap-6 sm:gap-8 md:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            animate={isVisible.testimonials ? "visible" : "hidden"}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-xl shadow-md overflow-hidden p-6 sm:p-8 hover:shadow-xl transition-shadow duration-300"
                variants={fadeInUp}
              >
                <div className="flex items-center mb-6">
                  <div className="h-12 w-12 rounded-full overflow-hidden mr-4 flex-shrink-0">
                    <img
                      src={testimonial.avatar || "/placeholder.svg"}
                      alt={testimonial.name}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {testimonial.name}
                    </h3>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                    <p className="text-sm text-blue-600">
                      {testimonial.company}
                    </p>
                  </div>
                </div>
                <p className="text-gray-600 italic">"{testimonial.quote}"</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section - Optimized for mobile */}
      <section id="pricing" className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 40 }}
            animate={
              isVisible.pricing ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }
            }
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-base font-semibold tracking-wide uppercase text-blue-600">
              Pricing
            </h2>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900 sm:text-4xl lg:text-5xl">
              Plans for every stage of your job search
            </p>
            <p className="mt-4 max-w-2xl text-lg sm:text-xl text-gray-500 mx-auto">
              Start for free, upgrade when you need more features.
            </p>
          </motion.div>

          {/* Pricing cards - Optimized for mobile with scrollable container on small screens */}
          <div className={`${isMobile ? 'flex overflow-x-auto pb-6 -mx-4 px-4 hide-scrollbar' : ''}`}>
            <motion.div
              className={`${isMobile ? 'flex space-x-6' : 'grid gap-8 lg:grid-cols-3'}`}
              variants={staggerContainer}
              initial="hidden"
              animate={isVisible.pricing ? "visible" : "hidden"}
            >
              {plans.map((plan, index) => (
                <motion.div
                  key={index}
                  className={`${isMobile ? 'flex-shrink-0 w-[85vw] max-w-sm' : ''} 
                    bg-white rounded-xl shadow-md overflow-hidden border-2 ${
                    plan.popular
                      ? "border-blue-500 ring-2 ring-blue-500 ring-opacity-50"
                      : plan.color
                    } hover:shadow-xl transition-shadow duration-300`}
                  variants={fadeInUp}
                >
                  <div className="p-6 sm:p-8">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                        {plan.name}
                      </h3>
                      {plan.popular && (
                        <span className="inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-0.5 rounded-full text-xs sm:text-sm font-medium bg-blue-100 text-blue-800">
                          Popular
                        </span>
                      )}
                    </div>
                    <div className="flex items-end mb-6">
                      <span className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className="text-lg sm:text-xl text-gray-500 ml-1">
                          {plan.period}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 mb-6">{plan.description}</p>
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <motion.a
                      href="#"
                      className={`block w-full py-3 px-4 rounded-md text-center font-medium ${
                        plan.popular
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                          : "bg-white text-blue-600 border border-blue-600 hover:bg-blue-50"
                      } shadow-sm hover:shadow transition-all duration-200`}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {plan.cta}
                    </motion.a>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section - Optimized for mobile */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-base font-semibold tracking-wide uppercase text-blue-600">
              FAQ
            </h2>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Frequently asked questions
            </p>
            <p className="mt-4 max-w-2xl text-lg sm:text-xl text-gray-500 mx-auto">
              Everything you need to know about Handjobs Job Aggregator.
            </p>
          </div>

          <div className="max-w-3xl mx-auto divide-y divide-gray-200">
            {[
              {
                question: "How does Handjobs aggregate job listings?",
                answer:
                  "Handjobs uses advanced web crawling techniques to fetch job postings from multiple platforms like LinkedIn, Indeed, Ziprecruiter, and more. Our algorithms process and categorize these listings to ensure you get relevant, high-quality results.",
              },
              {
                question: "Is Handjobs completely free to use?",
                answer:
                  "We offer a free tier that gives you access to basic search functionality across platforms. For advanced features like unlimited saved jobs, real-time notifications, and application tracking, we offer affordable premium plans.",
              },
              {
                question: "How often are job listings updated?",
                answer:
                  "Our crawlers run continuously, ensuring that new job postings are added to our database as soon as they appear on the source platforms. Premium users receive real-time notifications for new jobs matching their criteria.",
              },
              {
                question: "Can I apply to jobs directly through Handjobs?",
                answer:
                  "Yes, for many job listings you can apply directly through our platform. For others, we provide a direct link to the original posting where you can complete your application.",
              },
              {
                question:
                  "How is Handjobs different from other job search platforms?",
                answer:
                  "Unlike traditional job boards, Handjobs doesn't host job listings directly. Instead, we aggregate opportunities from multiple sources, saving you the time and effort of searching across different platforms. Our advanced filtering and search capabilities help you find exactly what you're looking for.",
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                className="py-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 pr-6">
                    {faq.question}
                  </h3>
                  <span className="ml-2 h-7 flex items-center flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-blue-500" />
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-sm sm:text-base text-gray-500">{faq.answer}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Optimized for mobile */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h2
              className="text-2xl sm:text-3xl font-extrabold text-white sm:text-4xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <span className="block">Ready to simplify your job search?</span>
              <span className="block mt-2">Get early access today.</span>
            </motion.h2>
            <motion.p
              className="mt-4 text-base sm:text-lg leading-6 text-blue-100"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Join thousands of job seekers who are already saving time and
              finding better opportunities.
            </motion.p>
            <motion.div
              className="mt-8 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex rounded-md shadow">
                <motion.a
                  href="#"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Get started
                </motion.a>
              </div>
              <div className="inline-flex">
                <motion.a
                  href="#"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-800 bg-opacity-60 hover:bg-opacity-70"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Learn more
                </motion.a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer - Optimized for mobile */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            {/* Logo & About Section */}
            <div className="space-y-6">
              <div className="flex items-center">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mr-2">
                  <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <span className="text-xl sm:text-2xl font-bold text-gray-800">
                  Handjobs
                </span>
              </div>
              <p className="text-gray-600 text-sm sm:text-base">
                One search. All job opportunities.
                <br />
                Save time and find your dream job faster.
              </p>
              <div className="flex space-x-6">
                {/* Social Icons */}
                {["Twitter", "GitHub", "LinkedIn"].map((social, index) => (
                  <a
                    key={index}
                    href="#"
                    className="text-gray-500 hover:text-blue-600 transition duration-200"
                  >
                    <span className="sr-only">{social}</span>
                    <svg
                      className="h-5 w-5 sm:h-6 sm:w-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      {/* Add corresponding SVG path here */}
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Footer Links - Simplified for mobile */}
            <div className="md:col-span-2 grid grid-cols-2 gap-8">
              {footerLinks.map((section, index) => (
                <div key={index}>
                  <h3 className="text-sm font-semibold text-gray-600 tracking-wider uppercase">
                    {section.title}
                  </h3>
                  <ul className="mt-4 space-y-4">
                    {section.links.map((link, linkIndex) => (
                      <li key={linkIndex}>
                        <a
                          href={link.href}
                          className="text-sm sm:text-base text-gray-500 hover:text-gray-900 transition duration-200"
                        >
                          {link.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Copyright Section */}
          <div className="mt-12 border-t border-gray-200 pt-8 text-center">
            <p className="text-sm sm:text-base text-gray-500">
              &copy; {new Date().getFullYear()} Handjobs Job Aggregator. All
              rights reserved.
            </p>
          </div>
        </div>
      </footer>
      
      {/* Add custom CSS for hiding scrollbars but allowing scrolling */}
      <style jsx global>{`
        .hide-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none; /* Chrome, Safari and Opera */
        }
      `}</style>
    </div>
  );
}