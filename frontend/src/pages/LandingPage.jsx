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
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useClerk } from "@clerk/clerk-react";

// Lazy load components that aren't needed immediately
const SignIn = lazy(() =>
  import("@clerk/clerk-react").then((module) => ({ default: module.SignIn }))
);
const SignUp = lazy(() =>
  import("@clerk/clerk-react").then((module) => ({ default: module.SignUp }))
);

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
  const [isAnnual, setIsAnnual] = useState(true);

  // Check if on mobile
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
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
        setIsVisible((prev) => ({ ...prev, ...updatedSections }));
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
  const partners = [
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
      logo: "https://imgs.search.brave.com/KiAmPaTDZjLngP86tg5MArFpRoMZ-5B4rkxh0KdJGko/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly91cGxv/YWQud2lraW1lZGlh/Lm9yZy93aWtpcGVk/aWEvY29tbW9ucy9k/L2QyL1ppcFJlY3J1/aXRlcl9sb2dvX2Js/YWNrX3RleHQuc3Zn",
    },
    {
      name: "Glassdoor",
      logo: "https://upload.wikimedia.org/wikipedia/commons/f/f0/Glassdoor_Logo_2023.svg",
    },
  ];

  const plans = [
    {
      name: "Free",
      monthlyPrice: "₹0",
      period: "/month",
      description: "Perfect for casual job seekers",
      popular: false,
      color: "bg-white",
      cta: "Get Started",
      features: [
        "Basic job search across platforms",
        "Limited filters",
        "Save up to 5 jobs",
        "Weekly email alerts",
      ],
    },
    {
      name: "Pro",
      monthlyPrice: "₹149",
      originalPrice: "₹299", // Add the original price for strike-through
      period: "/month",
      description: "For serious job hunters",
      popular: true,
      color: "bg-blue-50",
      cta: "Start Free Trial",
      features: [
        "Advanced search with all filters",
        "Unlimited saved jobs",
        "Real-time notifications",
        "Application tracking",
        "Resume analyzer",
        "Salary insights",
      ],
      offer: "Early Bird Offer", // Add the offer label
    },
    {
      name: "Enterprise",
      monthlyPrice: "Custom",
      period: "",
      description: "For teams and organizations",
      popular: false,
      color: "bg-white",
      cta: "Contact Sales",
      features: [
        "Everything in Pro",
        "API access",
        "Custom integrations",
        "Dedicated account manager",
        "Advanced analytics",
        "White-label options",
      ],
    },
  ];

  // For mobile, make popular plan first
  const displayPlans = isMobile
    ? [...plans].sort((a, b) => b.popular - a.popular)
    : plans;

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

  const footerLinks = [
    {
      title: "Product",
      links: [{ name: "Features", href: "#features" }],
    },
    {
      title: "Support",
      links: [{ name: "Help Center", href: "#" }],
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Regular expression for validating email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    try {
      const googleFormUrl =
        "https://docs.google.com/forms/d/e/1FAIpQLSfgMLqH5s89tMH4R0a0iojbz73Aubwf3Uo1WrDdryW5RCVQUg/formResponse";
      const formData = new URLSearchParams();
      formData.append("entry.1242802776", email);
      const response = await fetch(googleFormUrl, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        mode: "no-cors", // Allow the request to bypass CORS restrictions
      });

      // Since we can't access the response in no-cors mode, assume success
      toast.success("We received your request. We'll revert you back soon!");
      setEmail(""); // Clear input field
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("An error occurred. Please try again later.");
    }
  };

  // Close mobile menu when clicking on a link
  const handleMobileNavClick = (sectionId) => {
    setIsMenuOpen(false);
    // Smooth scroll to section
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Toast container for displaying notifications */}
      <ToastContainer />
      {/* Add viewport meta tag for better mobile experience */}
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
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
              className=" rounded-xl p-4 sm:p-8 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <Suspense
                fallback={<div className="text-center py-8">Loading...</div>}
              >
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
              className=" rounded-xl p-4 sm:p-8 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <Suspense
                fallback={<div className="text-center py-8">Loading...</div>}
              >
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
              {/* Enable Sign In and Sign Up buttons */}
              <button
                onClick={() => setShowSignIn(true)}
                className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
              >
                Sign In
              </button>
              <button
                onClick={() => setShowSignUp(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Sign Up
              </button>
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
                <div className="flex items-center space-x-4 ml-3">
                {/* Enable Sign In and Sign Up buttons */}
                <button
                  onClick={() => setShowSignIn(true)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setShowSignUp(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Sign Up
                </button>
              </div>
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
                Stop jumping between job sites. Handjobs aggregates
                opportunities from LinkedIn, Indeed, Ziprecruiter, and more —
                all in one powerful search platform.
              </motion.p>
              <motion.div
                className="mt-8 mx-auto max-w-sm sm:max-w-lg lg:mx-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.8 }}
              >
                <form
                  onSubmit={handleSubmit}
                  className="mt-3 flex flex-col sm:flex-row"
                >
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
                              logo: "https://imgs.search.brave.com/v7LTwd66GARrCdy_CKH2bHH5MFyed6rjD-ZI2bzzCmg/rs:fit:500:0:0:0/g:ce/aHR0cHM6Ly9wbHVz/cG5nLmNvbS9pbWct/cG5nL2FpcmJuYi1s/b2dvLXBuZy1haXJi/bmItbG9nby0xNjAw/LnBuZw",
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
                            ...(!isMobile
                              ? [
                                  {
                                    title: "Data Scientist",
                                    company: "Netflix",
                                    location: "Los Angeles",
                                    posted: "1d ago",
                                    logo: "https://imgs.search.brave.com/jlYYZNC0nF9fAoNASa3s8JPNgMcfYdZravm2ilUMd-k/rs:fit:500:0:0:0/g:ce/aHR0cHM6Ly9zdHls/ZXMucmVkZGl0bWVk/aWEuY29tL3Q1XzNm/emsyL3N0eWxlcy9j/b21tdW5pdHlJY29u/X3RnYzE1ZGJndWQw/MTEucG5n",
                                    source: platformTabs[activeTab].name,
                                    sourceColor: platformTabs[activeTab].color,
                                  },
                                ]
                              : []),
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
      <section className="py-8 px-4 md:py-12">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-sm sm:text-base font-medium text-gray-600 mb-8">
            Aggregating jobs from leading platforms
          </p>

          <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-8 md:gap-x-32">
            {partners.map((item, index) => (
              <div key={index} className="flex items-center justify-center">
                <img
                  src={item.logo}
                  alt={item.name}
                  className="h-auto w-auto opacity-80 hover:opacity-100 transition-opacity"
                  loading="lazy"
                  style={{
                    maxWidth: isMobile ? "120px" : "140px",
                    maxHeight: isMobile ? "30px" : "40px",
                  }}
                />
              </div>
            ))}
          </div>
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
              Handjobs brings all job opportunities to one place, saving you
              time and helping you find the perfect match.
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
                    delay: isMobile ? index * 0.08 + 0.3 : index * 0.1 + 0.5,
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
                    <p className="text-gray-600 max-w-xs mx-auto">
                      {step.description}
                    </p>
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

      {/* Pricing Section - Updated */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-xl font-semibold text-blue-600">Simple Pricing</h2>
            <h3 className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900">
              Choose the plan that's right for you
            </h3>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              Start for free, upgrade when you need more features
            </p>
          </div>

          {/* Plans container */}
          <div className={isMobile ? "py-2 overflow-x-auto pb-8 hide-scrollbar" : ""}>
            <div
              className={
                isMobile
                  ? "flex space-x-6 px-2 pb-4"
                  : "grid grid-cols-1 md:grid-cols-3 gap-8"
              }
            >
              {displayPlans.map((plan, index) => (
                <div
                  key={index}
                  className={`${isMobile ? "min-w-[280px] flex-shrink-0" : ""} 
                  ${
                    plan.color
                  } rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300
                  ${
                    plan.popular
                      ? "border-2 border-blue-500 relative transform md:scale-105"
                      : "border border-gray-200"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Recommended
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    <div className="mt-4 flex items-baseline">
                      <span className="text-3xl font-extrabold tracking-tight text-gray-900">
                        {plan.monthlyPrice}
                      </span>
                      {plan.period && (
                        <span className="ml-1 text-lg text-gray-500">
                          {plan.period}
                        </span>
                      )}
                    </div>
                    
                    
                    {plan.offer && (
                      <div className="mt-2 text-sm text-green-600 font-medium">
                        {plan.offer}
                      </div>
                    )}
                    <p className="mt-5 text-gray-500">{plan.description}</p>

                    <button
                      className={`mt-6 w-full py-3 px-4 rounded-lg text-center font-medium transition-colors duration-200 ${
                        plan.popular
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-white border border-blue-600 text-blue-600 hover:bg-blue-50"
                      }`}
                    >
                      {plan.cta}
                    </button>

                    <ul className="mt-6 space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex">
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span className="ml-3 text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ teaser */}
          <div className="mt-12 text-center">
            <p className="text-gray-600">
              Have questions?{" "}
              <a href="#faq" className="text-blue-600 font-medium">
                Check our FAQ
              </a>{" "}
              or{" "}
              <a href="#contact" className="text-blue-600 font-medium">
                contact us
              </a>
            </p>
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
                  <p className="text-sm sm:text-base text-gray-500">
                    {faq.answer}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-base font-semibold tracking-wide uppercase text-blue-600">
              Meet Our Team
            </h2>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900 sm:text-4xl">
              The People Behind the Vision
            </p>
            <p className="mt-4 max-w-2xl text-lg sm:text-xl text-gray-500 mx-auto">
              Our dedicated team works tirelessly to bring you the best experience.
            </p>
          </div>

          {/* Desktop View: Static Grid */}
          <div className="hidden md:grid md:grid-cols-4 gap-8">
            {[
              {
                name: "Mihir Pande",
                position: "Software Engineer",
                photo: "https://i.pravatar.cc/150?img=10",
                linkedin: "#",
                instagram: "#",
              },
              {
                name: "Soham Mhatre",
                position: "Product Manager",
                photo: "https://i.pravatar.cc/150?img=20",
                linkedin: "#",
                instagram: "#",
              },
              {
                name: "Omkar Khoche",
                position: "UI/UX Designer",
                photo: "https://i.pravatar.cc/150?img=30",
                linkedin: "#",
                instagram: "#",
              },
              {
                name: "Manthan Barhate",
                position: "Data Scientist",
                photo: "https://i.pravatar.cc/150?img=40",
                linkedin: "#",
                instagram: "#",
              },
            ].map((member, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow duration-300"
              >
                <img
                  src={member.photo}
                  alt={member.name}
                  className="w-24 h-24 mx-auto rounded-full mb-4"
                />
                <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
                <p className="text-sm text-gray-500">{member.position}</p>
                <div className="mt-4 flex justify-center space-x-4">
                  <a
                    href={member.linkedin}
                    className="text-blue-600 hover:text-blue-800"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                  <a
                    href={member.instagram}
                    className="text-pink-500 hover:text-pink-700"
                    aria-label="Instagram"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.34 3.608 1.316.975.975 1.254 2.242 1.316 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.34 2.633-1.316 3.608-.975.975-2.242 1.254-3.608 1.316-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.34-3.608-1.316-.975-.975-1.254-2.242-1.316-3.608C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.062-1.366.34-2.633 1.316-3.608.975-.975 2.242-1.254 3.608-1.316C8.416 2.175 8.796 2.163 12 2.163zm0-2.163C8.741 0 8.332.014 7.052.072 5.773.13 4.548.39 3.5 1.438 2.452 2.486 2.192 3.711 2.134 4.99.014 8.332 0 8.741 0 12s.014 3.668.072 4.948c.058 1.279.318 2.504 1.366 3.552 1.048 1.048 2.273 1.308 3.552 1.366C8.332 23.986 8.741 24 12 24s3.668-.014 4.948-.072c1.279-.058 2.504-.318 3.552-1.366 1.048-1.048 1.308-2.273 1.366-3.552.058-1.279.072-1.688.072-4.948s-.014-3.668-.072-4.948c-.058-1.279-.318-2.504-1.366-3.552-1.048-1.048-2.273-1.308-3.552-1.366C15.668.014 15.259 0 12 0z" />
                      <path d="M12 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a3.999 3.999 0 1 1 0-7.998 3.999 3.999 0 0 1 0 7.998zM18.406 4.594a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile View: Carousel */}
          <div className="md:hidden">
            <div className="relative">
              <div className="overflow-hidden">
                <motion.div
                  className="flex space-x-4"
                  animate={{ x: ["0%", "-100%"] }}
                  transition={{
                    repeat: Infinity,
                    duration: 12,
                    ease: "linear",
                  }}
                >
                  {[
                    {
                      name: "Mihir Pande",
                      position: "Software Engineer",
                      photo: "https://i.pravatar.cc/150?img=10",
                      linkedin: "#",
                      instagram: "#",
                    },
                    {
                      name: "Soham Mhatre",
                      position: "Product Manager",
                      photo: "https://i.pravatar.cc/150?img=20",
                      linkedin: "#",
                      instagram: "#",
                    },
                    {
                      name: "Omkar Khoche",
                      position: "UI/UX Designer",
                      photo: "https://i.pravatar.cc/150?img=30",
                      linkedin: "#",
                      instagram: "#",
                    },
                    {
                      name: "Manthan Barhate",
                      position: "Data Scientist",
                      photo: "https://i.pravatar.cc/150?img=40",
                      linkedin: "#",
                      instagram: "#",
                    },
                  ].map((member, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg shadow-md p-6 text-center flex-shrink-0 w-64"
                    >
                      <img
                        src={member.photo}
                        alt={member.name}
                        className="w-24 h-24 mx-auto rounded-full mb-4"
                      />
                      <h3 className="text-lg font-bold text-gray-900">
                        {member.name}
                      </h3>
                      <p className="text-sm text-gray-500">{member.position}</p>
                      <div className="mt-4 flex justify-center space-x-4">
                        <a
                          href={member.linkedin}
                          className="text-blue-600 hover:text-blue-800"
                          aria-label="LinkedIn"
                        >
                          <Linkedin className="h-5 w-5" />
                        </a>
                        <a
                          href={member.instagram}
                          className="text-pink-500 hover:text-pink-700"
                          aria-label="Instagram"
                        >
                          <svg
                            className="h-5 w-5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.34 3.608 1.316.975.975 1.254 2.242 1.316 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.34 2.633-1.316 3.608-.975.975-2.242 1.254-3.608 1.316-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.34-3.608-1.316-.975-.975-1.254-2.242-1.316-3.608C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.062-1.366.34-2.633 1.316-3.608.975-.975 2.242-1.254 3.608-1.316C8.416 2.175 8.796 2.163 12 2.163zm0-2.163C8.741 0 8.332.014 7.052.072 5.773.13 4.548.39 3.5 1.438 2.452 2.486 2.192 3.711 2.134 4.99.014 8.332 0 8.741 0 12s.014 3.668.072 4.948c.058 1.279.318 2.504 1.366 3.552 1.048 1.048 2.273 1.308 3.552 1.366C8.332 23.986 8.741 24 12 24s3.668-.014 4.948-.072c1.279-.058 2.504-.318 3.552-1.366 1.048-1.048 1.308-2.273 1.366-3.552.058-1.279.072-1.688.072-4.948s-.014-3.668-.072-4.948c-.058-1.279-.318-2.504-1.366-3.552-1.048-1.048-2.273-1.308-3.552-1.366C15.668.014 15.259 0 12 0z" />
                            <path d="M12 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a3.999 3.999 0 1 1 0-7.998 3.999 3.999 0 0 1 0 7.998zM18.406 4.594a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>
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
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none; /* Chrome, Safari and Opera */
        }
      `}</style>
    </div>
  );
}
