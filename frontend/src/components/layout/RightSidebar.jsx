import { useEffect, useState } from 'react';
import { ExternalLink } from "lucide-react";
import { useUser } from '@clerk/clerk-react';
import { useProStatusContext } from '../../contexts/ProStatusContext';
import PaymentService from '../../services/paymentService';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';

function RightSidebar() {
  const { user } = useUser();
  const { isPro, refreshProStatus } = useProStatusContext();
  const [loading, setLoading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [fullName, setFullName] = useState('');
  const [nameError, setNameError] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const location = useLocation();

  // Initialize form fields with user data when available
  useEffect(() => {
    if (user) {
      if (user.fullName) setFullName(user.fullName);
      if (user.primaryEmailAddress) setEmail(user.primaryEmailAddress.emailAddress);
    }
  }, [user]);

  // Check for payment success from URL parameters on component mount
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const orderId = queryParams.get('order_id');
    const paymentSuccess = queryParams.get('payment_success');
    
    // If URL contains order_id and payment_success parameters, verify the payment
    if (orderId && paymentSuccess === 'true' && user) {
      verifyPaymentWithBackend(user.id, orderId);
    }
  }, [location, user]);

  // Function to verify payment with backend
  const verifyPaymentWithBackend = async (userId, orderId) => {
    try {
      console.log('Verifying payment with backend:', userId, orderId);
      const response = await PaymentService.verifyPayment(userId, orderId);
      
      if (response && response.is_pro) {
        await refreshProStatus();
        toast.success('Payment successful! Pro features activated.', {
          duration: 4000,
          position: 'top-center',
          icon: '🎉',
        });
        
        // Remove the query parameters from URL
        const url = new URL(window.location.href);
        url.searchParams.delete('order_id');
        url.searchParams.delete('payment_success');
        window.history.replaceState({}, '', url);
      }
    } catch (error) {
      console.error('Payment verification error:', error);
    }
  };

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^[0-9]{10}$/;
    if (!phone) return "Phone number is required";
    if (!phoneRegex.test(phone)) return "Please enter a valid 10-digit phone number";
    return "";
  };

  const validateName = (name) => {
    if (!name.trim()) return "Name is required";
    if (name.trim().length < 2) return "Please enter your full name";
    return "";
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  const validateForm = () => {
    const phoneErr = validatePhoneNumber(phoneNumber);
    const nameErr = validateName(fullName);
    const emailErr = validateEmail(email);
    
    setPhoneError(phoneErr);
    setNameError(nameErr);
    setEmailError(emailErr);
    
    return !phoneErr && !nameErr && !emailErr;
  };

  const handleProceedToPayment = async () => {
    if (!validateForm()) return;
    
    try {
      if (!user) return;
      setLoading(true);
      
      // Get payment session details from the backend
      const paymentDetails = await PaymentService.initiatePayment(
        user.id, 
        phoneNumber, 
        email,
        fullName
      );
      
      console.log('Payment session created:', paymentDetails);
      
      // Check if we have a valid payment session ID
      if (!paymentDetails || !paymentDetails.payment_session_id) {
        throw new Error('Invalid payment session');
      }
      
      // Save order ID in localStorage for verification after redirect
      if (paymentDetails.order_id) {
        localStorage.setItem('currentOrderId', paymentDetails.order_id);
      }
      
      // Initialize Cashfree checkout
      if (window.Cashfree) {
        const cashfree = new window.Cashfree({
          mode: "production" // Since we're using production credentials
        });
        
        // Configure checkout with return URL that includes payment verification params
        const returnUrl = new URL(window.location.href);
        returnUrl.searchParams.set('order_id', paymentDetails.order_id);
        returnUrl.searchParams.set('payment_success', 'true');
        
        const checkoutOptions = {
          paymentSessionId: paymentDetails.payment_session_id,
          returnUrl: returnUrl.toString(),
        };
        
        console.log('Opening Cashfree checkout with options:', checkoutOptions);
        
        // Launch Cashfree checkout
        cashfree.checkout(checkoutOptions);
        
      } else {
        throw new Error('Cashfree SDK not loaded. Please refresh the page and try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(`Payment failed: ${error.message}`, {
        duration: 4000,
        position: 'top-center'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = () => {
    setShowPaymentForm(true);
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
        {!isPro && !showPaymentForm && (
          <button 
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-blue-600 text-white text-sm py-1.5 px-3 rounded-md hover:bg-blue-700 cursor-pointer disabled:bg-blue-400"
          >
            {loading ? 'Processing...' : 'Try for 1 Month'}
          </button>
        )}

        {!isPro && showPaymentForm && (
          <div className="space-y-3">
            {/* Full Name Input */}
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (nameError) setNameError(validateName(e.target.value));
                }}
                placeholder="Enter your full name"
                className="w-full border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {nameError && (
                <p className="text-xs text-red-500 mt-1">{nameError}</p>
              )}
            </div>
            
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(validateEmail(e.target.value));
                }}
                placeholder="Enter your email address"
                className="w-full border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {emailError && (
                <p className="text-xs text-red-500 mt-1">{emailError}</p>
              )}
            </div>
            
            {/* Phone Input */}
            <div>
              <label htmlFor="phone" className="block text-xs font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  if (phoneError) setPhoneError(validatePhoneNumber(e.target.value));
                }}
                placeholder="Enter 10-digit number"
                className="w-full border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {phoneError && (
                <p className="text-xs text-red-500 mt-1">{phoneError}</p>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setShowPaymentForm(false)}
                className="flex-1 bg-gray-200 text-gray-700 text-sm py-1.5 px-3 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button 
                onClick={handleProceedToPayment}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white text-sm py-1.5 px-3 rounded-md hover:bg-blue-700 cursor-pointer disabled:bg-blue-400"
              >
                {loading ? 'Processing...' : 'Proceed'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RightSidebar;