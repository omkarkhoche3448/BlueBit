import { useState } from 'react';
import { createPaymentOrder, verifyPayment } from '../services/paymentService';

const PaymentHandler = ({ clerkId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Create payment order
      const order = await createPaymentOrder(clerkId);
      
      // Initialize Razorpay checkout
      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: 'ProFind Pro Subscription',
        description: '1 Month Pro Subscription',
        order_id: order.order_id,
        handler: async (response) => {
          try {
            // Verify payment
            await verifyPayment(clerkId, response.razorpay_payment_id);
            alert('Payment successful! Pro features activated.');
            // You might want to refresh user data or redirect
          } catch (error) {
            setError('Payment verification failed');
          }
        },
        prefill: {
          email: 'user@example.com', // You can get this from Clerk
        },
        theme: {
          color: '#2563eb',
        }
      };
      
      const rzp = new window.Razorpay(options);
      rzp.open();
      
    } catch (error) {
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