"use client";

import { useState } from "react";
import { Save, Eye, EyeOff } from "lucide-react";

function Settings() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    name: "Admin User",
    email: "admin@gov.in",
    phone: "+91 98765 43210",
    designation: "Senior Verification Officer",
  });

  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    documentApproval: true,
    systemAlerts: true,
    weeklyReport: true,
  });

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    console.log("Profile updated:", profileData);
    alert("Profile updated successfully");
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
      alert("New passwords do not match");
      return;
    }
    console.log("Password changed");
    alert("Password changed successfully");
    setPasswordData({ current: "", new: "", confirm: "" });
  };

  const handleNotificationUpdate = () => {
    console.log("Notifications updated:", notifications);
    alert("Notification preferences saved");
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-sm text-gray-600">
          Manage your account and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Settings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Profile Information
              </h2>
            </div>
            <form onSubmit={handleProfileUpdate} className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) =>
                      setProfileData({ ...profileData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData({ ...profileData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) =>
                      setProfileData({ ...profileData, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={profileData.designation}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        designation: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700"
                  />
                </div>
              </div>
              <div className="mt-5">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <Save size={18} />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Change Password
              </h2>
            </div>
            <form onSubmit={handlePasswordChange} className="p-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.current}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          current: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showCurrentPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.new}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          new: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showNewPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirm}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirm: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-5">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <Save size={18} />
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Notification Preferences & System Info */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Notification Preferences
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Email Notifications
                  </p>
                  <p className="text-xs text-gray-500">
                    Receive updates via email
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.email}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      email: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    SMS Notifications
                  </p>
                  <p className="text-xs text-gray-500">
                    Receive urgent alerts via SMS
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.sms}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      sms: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Document Approvals
                  </p>
                  <p className="text-xs text-gray-500">
                    New documents for review
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.documentApproval}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      documentApproval: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    System Alerts
                  </p>
                  <p className="text-xs text-gray-500">
                    Critical system notifications
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.systemAlerts}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      systemAlerts: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Weekly Report
                  </p>
                  <p className="text-xs text-gray-500">
                    Summary of weekly activity
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.weeklyReport}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      weeklyReport: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
              </div>
              <button
                onClick={handleNotificationUpdate}
                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Save size={18} />
                <span>Save Preferences</span>
              </button>
            </div>
          </div>

          {/* System Configuration */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                System Configuration
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Read-only system information
              </p>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <p className="text-xs text-gray-500">Platform Version</p>
                <p className="text-sm font-medium text-gray-900">v2.4.1</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Last System Update</p>
                <p className="text-sm font-medium text-gray-900">2024-12-10</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">AI Model Version</p>
                <p className="text-sm font-medium text-gray-900">
                  DocVerify-ML v3.2
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Database Status</p>
                <p className="text-sm font-medium text-green-600">Connected</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Logout Section */}
      <div className="mt-10 flex justify-center">
        <div className="bg-white border border-gray-200 rounded-lg shadow w-full max-w-md">
          <div className="flex flex-col items-center p-8">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Sign Out
            </h3>
            <p className="text-gray-500 mb-6 text-center">
              Log out of your admin account securely.
            </p>
            <button
              onClick={() => {
                // TODO: Implement real logout logic
                alert("Logged out!");
              }}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition-colors text-lg font-semibold w-full justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1"
                />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
