import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const createPaymentOrder = async (clerkId) => {
  try {
    const response = await axios.post(`${API_URL}/payment`, {
      clerkId
    });
    return response.data;
  } catch (error) {
    console.error('Error creating payment order:', error);
    throw error;
  }
};

export const verifyPayment = async (clerkId, paymentId, orderId) => {
  try {
    const response = await axios.post(`${API_URL}/api/payment/success`, {
      clerkId,
      paymentId,
      orderId  // Added orderId parameter
    });
    return response.data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
};