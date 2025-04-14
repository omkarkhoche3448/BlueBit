// src/services/PaymentService.js
const API_URL_BACKEND = import.meta.env.VITE_API_URL_BACKEND;

// Log the backend URL for debugging
console.log("Backend API URL:", API_URL_BACKEND);

// Function to create a payment order
export async function createPaymentOrder(
  clerkId,
  phone,
  email = "user@example.com",
  name = ""
) {
  try {
    const url = `${API_URL_BACKEND}/payment`;
    console.log("Making payment request to:", url);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clerkId,
        phone,
        email,
        name,
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
    console.error("Error creating payment order:", error);
    throw error;
  }
}

// Function to verify payment status
export async function verifyPayment(clerkId, orderId) {
  try {
    const url = `${API_URL_BACKEND}/payment/success`;
    console.log("Verifying payment with URL:", url, "Data:", {
      clerkId,
      orderId,
    });

    const response = await fetch(url, {
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
      console.error("Payment verification failed:", errorData);
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    console.log("Payment verification result:", result);
    return result;
  } catch (error) {
    console.error("Error verifying payment:", error);
    throw error;
  }
}

// For backward compatibility with existing code that uses default import
class PaymentService {
  // Forward the functions as methods
  async initiatePayment(userId, phone, email, name) {
    return await createPaymentOrder(userId, phone, email, name);
  }

  async verifyPayment(clerkId, orderId) {
    return await verifyPayment(clerkId, orderId);
  }
}

// Export as default to maintain compatibility with existing imports
export default new PaymentService();
