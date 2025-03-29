const PreferencesService = {
  async fetchUserPreferences(userId) {
    try {
      const response = await fetch(
        `http://localhost:8000/api/users/${userId}/preferences`
      );
      if (response.ok) {
        const data = await response.json();
        return data.preferences || {};
      }
      return {};
    } catch (err) {
      console.error("Error fetching preferences:", err);
      return {};
    }
  },

  async saveUserPreferences(userId, preferences) {
    try {
      const response = await fetch(
        `http://localhost:8000/api/users/${userId}/preferences`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ preferences }),
        }
      );

      return response.ok;
    } catch (err) {
      console.error("Error saving preferences:", err);
      return false;
    }
  },

  async updateUserPreferences(userId, preferences) {
    try {
      const response = await fetch(
        `http://localhost:8000/api/users/${userId}/preferences`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ preferences }),
        }
      );

      return response.ok;
    } catch (err) {
      console.error("Error updating preferences:", err);
      return false;
    }
  },
};

export default PreferencesService; 