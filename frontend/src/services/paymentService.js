import axios from 'axios';

const API_URL_BACKEND = import.meta.env.VITE_API_URL_BACKEND;


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
    const response = await axios.post(`${API_URL_BACKEND}/payment/success`, {
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