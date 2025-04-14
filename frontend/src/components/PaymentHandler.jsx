import { useState } from 'react';
import { createPaymentOrder, verifyPayment } from '../services/paymentService';
import toast from 'react-hot-toast';
import { useProStatusContext } from '../contexts/ProStatusContext';

const PaymentHandler = ({ clerkId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { refreshProStatus } = useProStatusContext();

  const handlePayment = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Create payment order
      const order = await createPaymentOrder(clerkId);
      
      // Initialize Cashfree checkout
      const cashfree = window.Cashfree({
        mode: import.meta.env.VITE_CASHFREE_ENV === 'PRODUCTION' ? 'production' : 'sandbox',
      });
      
      const checkoutOptions = {
        paymentSessionId: order.payment_session_id,
        redirectTarget: '_self',
      };
      
      // Open Cashfree Checkout
      cashfree.checkout(checkoutOptions).then(function(result) {
        // This will be triggered on successful redirection from Cashfree hosted page
        if (result.error) {
          toast.error('Payment failed', {
            duration: 4000,
            position: 'top-center'
          });
          setError('Payment failed');
        }
      });
      
    } catch (error) {
      toast.error('Failed to initiate payment', {
        duration: 4000,
        position: 'top-center'
      });
      setError('Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={handlePayment}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
      >
        {loading ? 'Processing...' : 'Get Free 1 Month'}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};

export default PaymentHandler;