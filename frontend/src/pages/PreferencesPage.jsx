import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { CheckSquare, Square, Loader, Check, Pencil } from "lucide-react";
import PreferencesService from "../services/PreferencesService";

function PreferencesPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8 animate-pulse">
        <div className="text-center mb-8">
          <div className="h-10 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>

        {[1, 2, 3, 4, 5, 6].map((section) => (
          <div key={section} className="p-6 bg-gray-50 rounded-lg mb-6">
            <div className="h-7 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-5 bg-gray-200 rounded w-1/2 mb-4"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="flex items-center p-3 rounded-lg bg-white border border-gray-200"
                >
                  <div className="h-5 w-5 bg-gray-200 rounded mr-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-between items-center pt-6">
          <div className="h-10 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    </div>
  );
}

function PreferencesPage() {
  const { user, isSignedIn } = useUser();
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState({
    jobPreferences: [],
    culturalPreferences: [],
    countryPreferences: [],
    workPreferences: [],
    jobTypePreferences: [],
    companyPreferences: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [hasExistingPreferences, setHasExistingPreferences] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Keyword definitions
  const preferenceKeywords = {
    jobPreferences: [
      "Frontend Development",
      "Backend Development",
      "Full Stack Development",
      "Software Engineering",
      "Data Science",
      "DevOps",
      "Mobile Development",
      "Machine Learning",
      "UI/UX Design",
      "Product Management",
      "Quality Assurance",
      "Cybersecurity",
      "Cloud Computing",
      "Blockchain Development",
      "Embedded Systems",
    ],
    culturalPreferences: [
      "Remote Work",
      "Flexible Hours",
      "Work-Life Balance",
      "Charity & Volunteering",
      "Hackathons",
      "Datathons",
      "Professional Development",
      "Diversity & Inclusion",
      "Mentorship",
      "Startup Culture",
      "Enterprise Environment",
    ],
    countryPreferences: [
      "India",
      "United States",
      "Canada",
      "United Kingdom",
      "Germany",
      "Australia",
      "Singapore",
      "Netherlands",
      "Switzerland",
      "Sweden",
      "Remote (No Country Preference)",
    ],
    workPreferences: ["Remote", "In-Person", "Hybrid"],
    jobTypePreferences: [
      "Internship",
      "Part-time",
      "Full-time",
      "Contract",
      "Freelance",
    ],
    companyPreferences: [
      "Startups",
      "Domestic Firms",
      "Multinational Corporations (MNCs)",
      "Government Organizations",
      "Research Institutes",
    ],
  };

  // Check if user already has preferences when component mounts
  useEffect(() => {
    if (isSignedIn && user?.id) {
      fetchUserPreferences();
    }
  }, [isSignedIn, user]);

  const fetchUserPreferences = async () => {
    setIsLoading(true);
    try {
      const data = await PreferencesService.fetchUserPreferences(user.id);

      if (data) {
        setPreferences({
          jobPreferences: data.jobPreferences || [],
          culturalPreferences: data.culturalPreferences || [],
          countryPreferences: data.countryPreferences || [],
          workPreferences: data.workPreferences || [],
          jobTypePreferences: data.jobTypePreferences || [],
          companyPreferences: data.companyPreferences || [],
        });
        setHasExistingPreferences(true);
      }
    } catch (err) {
      console.error("Error fetching preferences:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Generic toggle preference function
  const togglePreference = (category, keyword) => {
    setPreferences((prev) => ({
      ...prev,
      [category]: prev[category].includes(keyword)
        ? prev[category].filter((k) => k !== keyword)
        : [...prev[category], keyword],
    }));
  };

  // Generic select all function
  const selectAll = (category) => {
    setPreferences((prev) => ({
      ...prev,
      [category]:
        prev[category].length === preferenceKeywords[category].length
          ? []
          : [...preferenceKeywords[category]],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Important to prevent default form submission
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:8000/api/users/${user.id}/preferences`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            preferences: preferences,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save preferences");
      }

      // On success, show success message briefly
      setSuccess(true);
      
      // Then redirect to resume upload page
      setTimeout(() => {
        navigate("/resume-upload");
      }, 1000);
    } catch (err) {
      console.error("Error saving preferences:", err);
      setError("Failed to save preferences. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Add this function and connect it to the Save button
  const handleSaveButton = () => {
    handleSubmit({ preventDefault: () => {} });
  };

  // Render preference section
  const renderPreferenceSection = (category, title, description) => {
    const keywords = preferenceKeywords[category];
    const selectedPreferences = preferences[category];

    return (
      <div className="p-6 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={() => selectAll(category)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            <Check className="h-4 w-4 mr-1" />
            {selectedPreferences.length === keywords.length
              ? "Deselect All"
              : "Select All"}
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">{description}</p>

        <div
          className={`grid grid-cols-1 ${
            keywords.length > 3
              ? "md:grid-cols-2 lg:grid-cols-3"
              : "md:grid-cols-3"
          } gap-3`}
        >
          {keywords.map((keyword) => (
            <div
              key={keyword}
              onClick={() => togglePreference(category, keyword)}
              className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                selectedPreferences.includes(keyword)
                  ? "bg-blue-50 border border-blue-200"
                  : "bg-white border border-gray-200 hover:bg-gray-100"
              }`}
            >
              {selectedPreferences.includes(keyword) ? (
                <CheckSquare className="h-5 w-5 text-blue-600 mr-2" />
              ) : (
                <Square className="h-5 w-5 text-gray-400 mr-2" />
              )}
              <span
                className={`text-sm ${
                  selectedPreferences.includes(keyword)
                    ? "text-blue-700 font-medium"
                    : "text-gray-700"
                }`}
              >
                {keyword}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Loading state
  if (isLoading && !hasExistingPreferences) {
    return <PreferencesPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditMode ? "Update Preferences" : "Welcome to JobFinder!"}
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              {isEditMode
                ? "Modify your existing preferences"
                : "Let's personalize your experience"}
            </p>
          </div>
          {hasExistingPreferences && !isEditMode && (
            <button
              onClick={() => setIsEditMode(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit Preferences
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  Preferences saved successfully!
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {renderPreferenceSection(
            "jobPreferences",
            "Job Preferences",
            "Select the job areas you're interested in:"
          )}

          {renderPreferenceSection(
            "culturalPreferences",
            "Cultural Preferences",
            "Select the workplace values important to you:"
          )}

          {renderPreferenceSection(
            "countryPreferences",
            "Country Preferences",
            "Select the countries you'd like to work in:"
          )}

          {renderPreferenceSection(
            "workPreferences",
            "Work Location Preference",
            "Select your preferred work arrangement:"
          )}

          {renderPreferenceSection(
            "jobTypePreferences",
            "Job Type",
            "Select your preferred employment types:"
          )}

          {renderPreferenceSection(
            "companyPreferences",
            "Company Preference",
            "Select your preferred types of companies:"
          )}

          {isEditMode ? (
            <div className="flex justify-between items-center pt-6">
              <button
                type="button"
                onClick={() => {
                  setIsEditMode(false);
                  fetchUserPreferences();
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 ${
                  isLoading ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    Updating...
                  </>
                ) : (
                  "Update Preferences"
                )}
              </button>
            </div>
          ) : (
            <div className="flex justify-between items-center pt-6">
              <button
                type="button"
                onClick={() => navigate("/home")}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {hasExistingPreferences ? "Skip for now" : "I'll do this later"}
              </button>
              <button
                type="button"
                onClick={handleSaveButton}
                disabled={isLoading}
                className={`inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 ${
                  isLoading ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    Saving...
                  </>
                ) : (
                  "Save Preferences"
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default PreferencesPage;
