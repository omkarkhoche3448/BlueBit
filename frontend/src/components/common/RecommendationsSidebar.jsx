import React, { useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  FileCheck,
  CheckCircle,
  HelpCircle,
  Star,
  Briefcase,
  Target,
  TrendingUp,
} from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import PaymentService from "../../services/paymentService";
import { useProStatusContext } from "../../contexts/ProStatusContext";
import { toast } from 'react-hot-toast';

const RecommendationsSidebar = () => {
  const { user } = useUser();
  const { isPro } = useProStatusContext();

  const handlePayment = async () => {
    try {
      if (!user) return;

      await PaymentService.initiatePayment(
        user.id,
        user.primaryEmailAddress.emailAddress,
        user.fullName
      );

      await refreshProStatus();

      toast.success("Payment successful! Pro features activated.", {
        duration: 4000,
        position: "top-center",
        icon: "🎉",
        onClose: () => window.location.reload(),
      });
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(`Payment failed: ${error.message}`, {
        duration: 4000,
        position: "top-center",
      });
    }
  };

  // Job search tips
  const jobSearchTips = [
    {
      tip: "Update your preferences regularly",
      icon: <Target size={16} className="text-blue-500" />,
    },
    {
      tip: "Apply within 24 hours of job posting",
      icon: <TrendingUp size={16} className="text-green-500" />,
    },
    {
      tip: "Customize your resume for each application",
      icon: <FileCheck size={16} className="text-purple-500" />,
    },
    {
      tip: "Research companies before applying",
      icon: <Briefcase size={16} className="text-orange-500" />,
    },
  ];

  // Career resources with actual links
  const resources = [
    {
      title: "Job Search Strategies",
      icon: <BookOpen size={16} />,
      url: "https://www.indeed.com/career-advice/finding-a-job/job-search-strategies"
    },
    {
      title: "Industry Trends",
      icon: <TrendingUp size={16} />,
      url: "https://www.linkedin.com/pulse/topics/home/"
    },
    {
      title: "Interview Preparation",
      icon: <CheckCircle size={16} />,
      url: "https://www.glassdoor.com/blog/guide/how-to-prepare-for-an-interview/"
    },
    {
      title: "Salary Insights",
      icon: <Star size={16} />,
      url: "https://www.payscale.com/salary-calculator"
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
      {/* Job Search Tips */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Job Search Tips</h3>
        <ul className="space-y-2 text-sm">
          {jobSearchTips.map((item, index) => (
            <li key={index} className="flex items-start">
              <span className="mr-2 mt-0.5 flex-shrink-0">{item.icon}</span>
              <span>{item.tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Career Resources */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Career Resources</h3>
        <ul className="space-y-2">
          {resources.map((resource, index) => (
            <li key={index}>
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors text-sm group"
              >
                <span className="mr-2">{resource.icon}</span>
                <span>{resource.title}</span>
                <ArrowUpRight
                  size={14}
                  className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Pro Feature Highlight */}
      <div
        className={`rounded-lg p-4 border ${
          isPro ? "bg-amber-50 border-amber-300" : "bg-blue-50 border-blue-100"
        }`}
      >
        <p className="text-xs text-gray-500 mb-2">
          {isPro ? "Pro Membership" : "Sponsored"}
        </p>
        <h4 className="font-medium text-sm mb-2">
          {isPro ? "Pro Benefits" : "Upgrade to Premium"}
        </h4>
        <p className="text-sm text-gray-600 mb-3">
          {isPro
            ? "Access advanced job matching, early job alerts, and personalized career insights."
            : "Get priority access to new jobs, advanced filters, and personalized job recommendations."}
        </p>
        {!isPro && (
          <button
            onClick={handlePayment}
            className="w-full bg-blue-600 text-white text-sm py-1.5 px-3 rounded-md hover:bg-blue-700 cursor-pointer"
          >
            Upgrade to Pro
          </button>
        )}
      </div>
    </div>
  );
};

export default RecommendationsSidebar;
