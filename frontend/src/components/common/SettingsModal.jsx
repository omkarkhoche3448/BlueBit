import { useEffect, useState } from "react";
import { useClerk, useUser } from "@clerk/clerk-react";
import {
  X,
  UserCircle,
  Sliders,
  CreditCard,
  Bell,
  Shield,
  Download,
  HelpCircle,
  FileUp,
} from "lucide-react";
import { useProStatusContext } from "../../contexts/ProStatusContext";
import { useNavigate } from "react-router-dom";
import PreferencesService from "../../services/PreferencesService";
import PaymentService from '../../services/paymentService';

function formatDate(date) {
  if (!date) return '';
  const dateObject = new Date(date);
  const year = dateObject.getFullYear();
  const month = dateObject.getMonth() + 1;
  const day = dateObject.getDate();
  const hours = dateObject.getHours();
  const minutes = dateObject.getMinutes();
  const seconds = dateObject.getSeconds();

  const formattedDate = `${month < 10 ? '0' : ''}${month}/${day < 10 ? '0' : ''}${day}/${year} ${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return formattedDate;
}

const SettingsModal = ({ isOpen, onClose }) => {
  const { openUserProfile } = useClerk();
  const { user } = useUser();
  const navigate = useNavigate();
  const { isPro, expiryDate, refreshProStatus } = useProStatusContext();
  const [activeTab, setActiveTab] = useState("account");
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [preferences, setPreferences] = useState({
    jobPreferences: [],
    culturalPreferences: [],
    countryPreferences: [],
    workPreferences: [],
    jobTypePreferences: [],
    companyPreferences: [],
  });
  const [hasExistingPreferences, setHasExistingPreferences] = useState(false);

  const handlePayment = async () => {
    try {
      if (!user) {
        console.error('No user found');
        return;
      }

      setIsLoading(true);
      const result = await PaymentService.initiatePayment(
        user.id,
        user.primaryEmailAddress?.emailAddress,
        user.fullName
      );

      if (result.success) {
        await refreshProStatus(); // Refresh pro status after successful payment
        alert('Payment successful! Pro features activated.');
      } else {
        throw new Error(result.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed: ' + (error.message || 'Unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle profile update via Clerk
  const handleProfileUpdate = () => {
    openUserProfile();
    onClose();
  };

  const handleModalClose = () => {
    setActiveTab("account");
    onClose();
  };

  const handlePreferencesClick = () => {
    navigate("/edit-preferences");
    onClose();
  };

  const handleResumeUploadClick = () => {
    navigate("/update-resume-upload");
    onClose();
  };

  // make an api call to fetch the user preferences and show them in preference tab 
  const fetchUserPreferences = async () => {
    if (!user) {
      console.log("No user found, cannot fetch preferences");
      return;
    }
    
    console.log("Fetching preferences for user:", user.id);
    setIsLoading(true);
    try {
      const data = await PreferencesService.fetchUserPreferences(user.id);
      console.log("Fetched user preferences:", data);

      if (data && Object.keys(data).length > 0) {
        setPreferences({
          jobPreferences: data.jobPreferences || [],
          culturalPreferences: data.culturalPreferences || [],
          countryPreferences: data.countryPreferences || [],
          workPreferences: data.workPreferences || [],
          jobTypePreferences: data.jobTypePreferences || [],
          companyPreferences: data.companyPreferences || [],
        });
        setHasExistingPreferences(true);
      } else {
        console.log("No preferences data found");
        setHasExistingPreferences(false);
      }
    } catch (err) {
      console.error("Error fetching preferences:", err);
      setHasExistingPreferences(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Call fetchUserPreferences when the preferences tab is selected
  useEffect(() => {
    if (activeTab === "preferences" && user) {
      console.log("Preferences tab selected, fetching preferences");
      fetchUserPreferences();
    }
  }, [activeTab, user]);

  // Add a handler for tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "preferences") {
      fetchUserPreferences();
    }
  };

  const handleExportData = async () => {
    if (!user) return;

    try {
      setIsExporting(true);
      // Collect all user data
      const userData = {
        personalInfo: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.primaryEmailAddress?.emailAddress,
          createdAt: user.createdAt,
          lastSignInAt: user.lastSignInAt,
        },
        preferences: preferences,
        subscriptionStatus: {
          isPro: isPro,
          expiryDate: expiryDate,
        },
        exportDate: new Date().toISOString(),
      };

      // Convert data to JSON string with proper formatting
      const jsonString = JSON.stringify(userData, null, 2);
      
      // Create blob and download link
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Set filename with user's name and current date
      const date = new Date().toISOString().split('T')[0];
      const userName = `${user.firstName || ''}${user.lastName ? '_' + user.lastName : ''}`.toLowerCase().replace(/\s+/g, '_');
      const fileName = userName ? `${userName}_data_${date}.json` : `user_data_${date}.json`;
      
      link.download = fileName;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-full h-full fixed inset-0 z-50 flex items-center justify-center bg-transaprent bg-opacity-10 transition-all duration-300 backdrop-blur-xs">
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in fade-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-xl font-semibold text-gray-800">Settings</h2>
          <button
            onClick={handleModalClose}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors duration-200"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div className="flex h-[500px]">
          {/* Sidebar */}
          <div className="w-1/3 border-r border-gray-200 bg-gray-50 p-2">
            <nav className="space-y-1">
              <button
                onClick={() => handleTabChange("account")}
                className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium flex items-center transition-colors ${
                  activeTab === "account"
                    ? "bg-blue-100 text-blue-800"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <UserCircle className="h-4 w-4 mr-2" />
                Account
              </button>

              <button
                onClick={() => handleTabChange("preferences")}
                className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium flex items-center transition-colors ${
                  activeTab === "preferences"
                    ? "bg-blue-100 text-blue-800"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Sliders className="h-4 w-4 mr-2" />
                Preferences
              </button>

              <button
                onClick={() => handleTabChange("resume")}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors ${
                  activeTab === "resume"
                    ? "bg-blue-100 text-blue-800"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <FileUp className="h-4 w-4 mr-2" />
                Resume
              </button>

              <button
                onClick={() => handleTabChange("subscription")}
                className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium flex items-center transition-colors ${
                  activeTab === "subscription"
                    ? "bg-blue-100 text-blue-800"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Subscription
              </button>

              <button
                onClick={() => handleTabChange("notifications")}
                className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium flex items-center transition-colors ${
                  activeTab === "notifications"
                    ? "bg-blue-100 text-blue-800"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </button>

            </nav>
          </div>

          {/* Content */}
          <div className="w-2/3 p-5 overflow-y-auto">
            {activeTab === "account" && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800">
                  Account Settings
                </h3>

                <div className="space-y-4">
                  <button
                    onClick={handleProfileUpdate}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="flex items-center">
                      <div className="p-2 rounded-md bg-blue-100 text-blue-600 mr-3 group-hover:bg-blue-200 transition-colors">
                        <UserCircle className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-medium text-gray-800">
                          Update Profile
                        </h4>
                        <p className="text-xs text-gray-500">
                          Change your name, photo, email
                        </p>
                      </div>
                    </div>
                    <div className="text-gray-400 group-hover:text-blue-500 transition-colors">
                      →
                    </div>
                  </button>

                  <button 
                    onClick={handleExportData}
                    disabled={isExporting}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors group"
                  >
                    <div className="flex items-center">
                      <div className="p-2 rounded-md bg-green-100 text-green-600 mr-3 group-hover:bg-green-200 transition-colors">
                        <Download className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-medium text-gray-800">
                          {isExporting ? 'Exporting...' : 'Export Data'}
                        </h4>
                        <p className="text-xs text-gray-500">
                          Download your account data
                        </p>
                      </div>
                    </div>
                    <div className="text-gray-400 group-hover:text-green-500 transition-colors">
                      →
                    </div>
                  </button>
                </div>
              </div>
            )}

            {activeTab === "resume" && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800">
                  Resume Management
                </h3>

                <div className="space-y-4">
                  <button
                    onClick={handleResumeUploadClick}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="flex items-center">
                      <div className="p-2 rounded-md bg-blue-100 text-blue-600 mr-3 group-hover:bg-blue-200 transition-colors">
                        <FileUp className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-medium text-gray-800">
                          Update Resume
                        </h4>
                        <p className="text-xs text-gray-500">
                          Upload a new version of your resume
                        </p>
                      </div>
                    </div>
                    <div className="text-gray-400 group-hover:text-blue-500 transition-colors">
                      →
                    </div>
                  </button>

                  <div className="py-2 px-1 md:p-4 bg-blue-50 rounded-lg">
                    <p className="text-xs md:text-sm text-blue-700">
                      Keep your resume up to date to increase your chances of finding the perfect job match.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "subscription" && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800">
                  Your Subscription
                </h3>

                <div
                  className={`p-4 rounded-lg border ${
                    isPro ? "border-green-200 bg-green-50" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">
                        {isPro ? "Pro Membership" : "Free Plan"}
                      </p>

                      {isPro && expiryDate && (
                        <p className="text-sm text-gray-600 mt-1">
                          Valid until:{" "}
                          {formatDate ? formatDate(expiryDate) : expiryDate}
                        </p>
                      )}
                    </div>

                    {isPro ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-200 text-green-800">
                        Active
                      </span>
                    ) : (
                      <button
                        onClick={handlePayment}
                        disabled={isLoading}
                        className="px-3 py-1 text-xs font-medium rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Processing...' : 'Upgrade'}
                      </button>
                    )}
                  </div>

                  {isPro && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Pro Benefits:
                      </h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li className="flex items-center">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 mr-2"></span>
                          Unlimited job applications
                        </li>
                        <li className="flex items-center">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 mr-2"></span>
                          Priority support
                        </li>
                        <li className="flex items-center">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 mr-2"></span>
                          Early access to new jobs
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "preferences" && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800">
                  Job Preferences
                </h3>

                {isLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  </div>
                ) : hasExistingPreferences ? (
                  <div className="space-y-3">
                    {Object.entries(preferences).map(([key, values]) => 
                      values.length > 0 ? (
                        <div key={key} className="border border-gray-200 rounded-md p-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-1 capitalize">
                            {key.replace('Preferences', '')}
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {values.map((item, index) => (
                              <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-md">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div key={key} className="border border-gray-200 rounded-md p-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-1 capitalize">
                            {key.replace('Preferences', '')}
                          </h4>
                          <p className="text-gray-500">Not selected</p>
                        </div>
                      )
                    )}
                    
                    <button 
                      onClick={handlePreferencesClick}
                      className="mt-3 w-full py-2 px-4 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    >
                      Update Preferences
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500 mb-3">No preferences set yet. Please select your preferences to get personalized job recommendations.</p>
                    <button 
                      onClick={handlePreferencesClick}
                      className="py-2 px-4 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    >
                      Set Preferences
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800">
                  Notification Settings
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="emailNotif"
                      className="text-sm text-gray-700 font-medium"
                    >
                      Email Notifications
                    </label>
                    <div className="relative inline-block w-10 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer">
                      <input
                        type="checkbox"
                        id="emailNotif"
                        defaultChecked={true}
                        className="absolute w-10 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer appearance-none focus:outline-none bg-gray-300 peer checked:bg-blue-500"
                      />
                      <span className="absolute left-1 top-1 right-1 bottom-1 transition duration-200 ease-in-out bg-white rounded-full h-4 w-4 peer-checked:translate-x-4"></span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="jobAlerts"
                      className="text-sm text-gray-700 font-medium"
                    >
                      Job Alerts
                    </label>
                    <div className="relative inline-block w-10 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer">
                      <input
                        type="checkbox"
                        id="jobAlerts"
                        defaultChecked={true}
                        className="absolute w-10 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer appearance-none focus:outline-none bg-gray-300 peer checked:bg-blue-500"
                      />
                      <span className="absolute left-1 top-1 right-1 bottom-1 transition duration-200 ease-in-out bg-white rounded-full h-4 w-4 peer-checked:translate-x-4"></span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="marketingEmails"
                      className="text-sm text-gray-700 font-medium"
                    >
                      Marketing Emails
                    </label>
                    <div className="relative inline-block w-10 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer">
                      <input
                        type="checkbox"
                        id="marketingEmails"
                        className="absolute w-10 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer appearance-none focus:outline-none bg-gray-300 peer checked:bg-blue-500"
                      />
                      <span className="absolute left-1 top-1 right-1 bottom-1 transition duration-200 ease-in-out bg-white rounded-full h-4 w-4 peer-checked:translate-x-4"></span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 text-center text-xs text-gray-500 flex items-center justify-center">
          <HelpCircle className="h-3 w-3 mr-1" />
          Need help? Contact support
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;