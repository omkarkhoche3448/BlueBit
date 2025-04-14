import React, { useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  FileCheck,
  CheckCircle,
  HelpCircle,
  Star,
} from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import PaymentService from "../../services/paymentService";
import { useProStatusContext } from "../../contexts/ProStatusContext";

const ResumeRightSidebar = ({ score }) => {
  const { user } = useUser();
  const { isPro, refreshProStatus } = useProStatusContext();
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      if (!user) return;
      setLoading(true);
      
      // Get payment session details from the backend
      const paymentDetails = await PaymentService.initiatePayment(user.id);
      console.log('Payment session created:', paymentDetails);
      
      // Check if we have a valid payment session ID
      if (!paymentDetails || !paymentDetails.payment_session_id) {
        throw new Error('Invalid payment session');
      }
      
      // Initialize Cashfree checkout
      if (window.Cashfree) {
        const cashfree = new window.Cashfree({
          mode: "test" // Since we're using production credentials
        });
        
        // Configure checkout
        const checkoutOptions = {
          paymentSessionId: paymentDetails.payment_session_id,
          returnUrl: window.location.href,  // Return to the same page after payment
        };
        
        console.log('Opening Cashfree checkout with options:', checkoutOptions);
        
        // Launch Cashfree checkout
        cashfree.checkout(checkoutOptions).then(function(result) {
          // This will be called on successful redirection
          if (result.error) {
            console.error('Checkout error:', result.error);
            toast.error(`Payment failed: ${result.error.message || 'Unknown error'}`, {
              duration: 4000,
              position: 'top-center'
            });
          } else if (result.order && result.order.status === 'PAID') {
            // Payment successful
            refreshProStatus();
            toast.success('Payment successful! Pro features activated.', {
              duration: 4000,
              position: 'top-center',
              icon: '🎉',
              // When toast is closed or dismissed, reload the page
              onClose: () => window.location.reload()
            });
          }
        });
      } else {
        throw new Error('Cashfree SDK not loaded. Please refresh the page and try again.');
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(`Payment failed: ${error.message}`, {
        duration: 4000,
        position: "top-center",
      });
    } finally {
      setLoading(false);
    }
  };

  // Determine resume health status based on score
  const getResumeHealth = (score) => {
    if (score >= 80) return { status: "Excellent", color: "text-green-600" };
    if (score >= 60) return { status: "Good", color: "text-blue-600" };
    if (score >= 40) return { status: "Fair", color: "text-yellow-600" };
    return { status: "Needs Work", color: "text-red-600" };
  };

  const resumeHealth = score
    ? getResumeHealth(score)
    : { status: "N/A", color: "text-gray-500" };

  // Helpful resume resources
  const resources = [
    { title: "Resume Writing Guide", icon: <BookOpen size={16} /> },
    { title: "ATS Optimization Tips", icon: <FileCheck size={16} /> },
    { title: "Industry Keywords", icon: <CheckCircle size={16} /> },
    { title: "Resume Templates", icon: <Star size={16} /> },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6 ">
      {/* Resume Health Card */}
      <div className="bg-blue-50 rounded-lg p-4 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Resume Health
        </h3>
        <div className="flex items-center space-x-2">
          <div className={`text-xl font-bold ${resumeHealth.color}`}>
            {resumeHealth.status}
          </div>
          {score && <div className="text-sm text-gray-500">({score}/100)</div>}
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {!score
            ? "Upload your resume to see your score"
            : score >= 80
            ? "Your resume is well-optimized for ATS systems"
            : "Take action on our recommendations to improve your score"}
        </p>
      </div>

      {/* Expert Tips */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Expert Tips</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start">
            <CheckCircle
              size={16}
              className="text-green-500 mr-2 mt-0.5 flex-shrink-0"
            />
            <span>Use keywords from the job description</span>
          </li>
          <li className="flex items-start">
            <CheckCircle
              size={16}
              className="text-green-500 mr-2 mt-0.5 flex-shrink-0"
            />
            <span>Quantify your achievements with numbers</span>
          </li>
          <li className="flex items-start">
            <CheckCircle
              size={16}
              className="text-green-500 mr-2 mt-0.5 flex-shrink-0"
            />
            <span>Use standard section headings</span>
          </li>
          <li className="flex items-start">
            <CheckCircle
              size={16}
              className="text-green-500 mr-2 mt-0.5 flex-shrink-0"
            />
            <span>Avoid complex formatting and tables</span>
          </li>
        </ul>
      </div>

      {/* Helpful Resources */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Resources</h3>
        <ul className="space-y-2">
          {resources.map((resource, index) => (
            <li key={index}>
              <a
                href="#"
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
            ? "Access premium features including line-by-line feedback, keyword suggestions, and custom industry insights, and unlimited resume analysis ."
            : "Get access to line-by-line feedback, keyword suggestions, and custom industry insights."}
        </p>
        {!isPro && (
          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-blue-600 text-white text-sm py-1.5 px-3 rounded-md hover:bg-blue-700 cursor-pointer disabled:bg-blue-400"
          >
            {loading ? 'Processing...' : 'Upgrade to Pro'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ResumeRightSidebar;
