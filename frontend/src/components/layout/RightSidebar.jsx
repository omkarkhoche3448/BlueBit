import { useEffect, useState } from 'react';
import { ExternalLink } from "lucide-react";
import { useUser } from '@clerk/clerk-react';
import { useProStatusContext } from '../../contexts/ProStatusContext';
import PaymentService from '../../services/paymentService';
import toast from 'react-hot-toast';

function RightSidebar() {
  const { user } = useUser();
  const { isPro, refreshProStatus } = useProStatusContext();

  const handlePayment = async () => {
    try {
      if (!user) return;
      
      const result = await PaymentService.initiatePayment(
        user.id,
        user.primaryEmailAddress.emailAddress,
        user.fullName
      );
      
      // Refresh pro status after successful payment
      await refreshProStatus();
      
      toast.success('Payment successful! Pro features activated.', {
        duration: 4000,
        position: 'top-center',
        icon: '🎉',
        // When toast is closed or dismissed, reload the page
        onClose: () => window.location.reload()
      });
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(`Payment failed: ${error.message}`, {
        duration: 4000,
        position: 'top-center'
      });
    }
  };

  const resources = [
    { title: "Resume Builder", link: "/create-resume" },
    { title: "Interview Preparation", link: "https://www.indeed.com/career-advice/interviewing/how-to-prepare-for-an-interview" },
    { title: "Salary Insights", link: "https://www.glassdoor.co.in/Salaries/index.htm?countryRedirect=true" },
    { title: "Career Advice", link: "https://www.themuse.com/advice/45-pieces-of-career-advice-that-will-get-you-to-the-top" },
  ];

  return (
    <div className="space-y-4">
      {/* Resources Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-300">
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

      {/* Pro Benefits Section */}
      <div className={`rounded-lg p-4 border ${
        isPro 
          ? 'bg-amber-50 border-amber-300' 
          : 'bg-blue-50 border-blue-100'
      }`}>
        <p className="text-xs text-gray-500 mb-2">
          {isPro ? 'Pro Membership' : 'Sponsored'}
        </p>
        <h4 className="font-medium text-sm mb-2">
          {isPro ? 'Pro Benefits' : 'Upgrade to Premium'}
        </h4>
        <p className="text-sm text-gray-600 mb-3">
          {isPro 
            ? 'Enjoy your current benefits like resume builder, personalized recommendations, and chrome extension.'
            : 'Get access to exclusive job listings and advanced search features.'}
        </p>
        {!isPro && (
          <button 
            onClick={handlePayment} 
            className="w-full bg-blue-600 text-white text-sm py-1.5 px-3 rounded-md hover:bg-blue-700 cursor-pointer"
          >
            Try for 1 Month
          </button>
        )}
      </div>
    </div>
  );
}

export default RightSidebar;