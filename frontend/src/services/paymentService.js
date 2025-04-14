// src/services/PaymentService.js
const API_URL_BACKEND = import.meta.env.VITE_API_URL_BACKEND;

// Function to create a payment order
export async function createPaymentOrder(clerkId) {
  try {
    const response = await fetch(`${API_URL_BACKEND}/payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ clerkId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating payment order:", error);
    throw error;
  }
}

// Function to verify payment status
export async function verifyPayment(clerkId, orderId) {
  try {
    const response = await fetch(`${API_URL_BACKEND}/payment/success`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clerkId,
        orderId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error verifying payment:", error);
    throw error;
  }
}

// For backward compatibility with existing code that uses default import
class PaymentService {
  // Forward the functions as methods
  async initiatePayment(userId) {
    return await createPaymentOrder(userId);
  }
  
  async verifyPayment(clerkId, orderId) {
    return await verifyPayment(clerkId, orderId);
  }
}

// Export as default to maintain compatibility with existing imports
export default new PaymentService();
