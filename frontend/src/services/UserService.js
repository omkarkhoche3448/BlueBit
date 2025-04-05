const API_URL_BACKEND = import.meta.env.VITE_API_URL_BACKEND;

const UserService = {
  async deleteAccount(userId) {
    try {
      const response = await fetch(`${API_URL_BACKEND}/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      return true;
    } catch (error) {
      console.error("Error deleting account:", error);
      throw error;
    }
  }
};

export default UserService;