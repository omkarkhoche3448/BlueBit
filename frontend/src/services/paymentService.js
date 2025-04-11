// src/services/PaymentService.js
const API_URL_BACKEND = import.meta.env.VITE_API_URL_BACKEND;

class PaymentService {
  async initiatePayment(userId, userEmail, userName) {
    try {
      console.log('Fetching from:', `${API_URL_BACKEND}/payment`);
      const response = await fetch(`${API_URL_BACKEND}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clerkId: userId })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const order = await response.json();
      
      return new Promise((resolve, reject) => {
        const options = {
          key: order.key,
          amount: order.amount,
          currency: order.currency,
          name: 'ProFind Pro Subscription',
          description: '1 Month Pro Subscription',
          order_id: order.order_id,
          handler: async (response) => {
            try {
              const verificationResult = await this.verifyPayment(
                userId,
                response.razorpay_payment_id,
                order.order_id,
                response.razorpay_signature
              );
              resolve(verificationResult);
            } catch (error) {
              reject(error);
            }
          },
          prefill: {
            email: userEmail,
            name: userName
          },
          theme: {
            color: '#2563eb',
          },
          modal: {
            ondismiss: () => {
              reject(new Error('Payment cancelled by user'));
            }
          }
        };
        
        const rzp = new window.Razorpay(options);
        rzp.open();
      });
    } catch (error) {
      throw error;
    }
  }

  async verifyPayment(userId, paymentId, orderId, signature) {
    const response = await fetch(`${API_URL_BACKEND}/payment/success`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clerkId: userId,
        paymentId: paymentId,
        orderId: orderId,
        signature: signature
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  }
}

export default new PaymentService();