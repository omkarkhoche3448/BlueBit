import { ExternalLink, TrendingUp } from "lucide-react"
import { useUser } from '@clerk/clerk-react';
import { useProStatusContext } from '../../contexts/ProStatusContext';
import { toast } from 'react-toastify'; // Import toast

const API_URL_BACKEND = import.meta.env.VITE_API_URL_BACKEND;

function RightSidebar() {

  const { user } = useUser();
  const { isPro } = useProStatusContext();

  const handlePayment = async () => {
    try {
      console.log('Fetching from:', `${API_URL_BACKEND}/payment`);
      const response = await fetch(`${API_URL_BACKEND}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clerkId: user.id })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const order = await response.json();
      
      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: 'ProFind Pro Subscription',
        description: '1 Month Pro Subscription',
        order_id: order.order_id,
        handler: async (response) => {
          try {
            const verificationResponse = await fetch(`${API_URL_BACKEND}/payment/success`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                clerkId: user.id,
                paymentId: response.razorpay_payment_id,
                orderId: order.order_id,
                signature: response.razorpay_signature  // Added signature
              })
            });
            
            if (!verificationResponse.ok) {
              const errorData = await verificationResponse.json().catch(() => ({}));
              throw new Error(errorData.error || `HTTP error! status: ${verificationResponse.status}`);
            }
            
            const result = await verificationResponse.json();
            toast.success('Payment successful! Pro features activated.'); 
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed: ' + error.message); 
          }
        },
        prefill: {
          email: user.primaryEmailAddress.emailAddress,
          name: user.fullName
        },
        theme: {
          color: '#2563eb',
        }
      };
      
      const rzp = new window.Razorpay(options);
      rzp.open();
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed: ' + error.message); 
    }
  };

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
    { title: "Resume Builder", link: "/create-resume" },
    { title: "Interview Preparation", link: "https://www.indeed.com/career-advice/interviewing/how-to-prepare-for-an-interview" },
    { title: "Salary Insights", link: "https://www.glassdoor.co.in/Salaries/index.htm?countryRedirect=true" },
    { title: "Career Advice", link: "https://www.themuse.com/advice/45-pieces-of-career-advice-that-will-get-you-to-the-top" },
  ]

  return (
    <div className="space-y-4">
      {/* Trending Jobs Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-300">
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

      {/* Ad Section or Pro Benefits Section */}
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
            className="w-full bg-blue-600 text-white text-sm py-1.5 px-3 rounded-md hover:bg-blue-700"
          >
            Try for 1 Month
          </button>
        )}
      </div>
    </div>
  );
}

export default RightSidebar;
