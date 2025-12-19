"use client";

import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../Context/UserContext";
import { Save, Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

function Settings() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const navigate = useNavigate();
  const { setuser } = useContext(UserContext);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    name: "Admin User",
    email: "admin@gov.in",
    phone: "+91 98765 43210",
    designation: "Senior Verification Officer",
  });

  const [config, setConfig] = useState({});
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);
    try {
      const res = await axios.put(
        "/api/admin/profile",
        {
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          designation: profileData.designation,
        },
        { withCredentials: true }
      );
      const data = res.data;
      if (data?.success) {
        toast.success("Profile updated");
        const updated = data.admin;
        const stored = localStorage.getItem("user");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const merged = {
              ...parsed,
              name: updated.name,
              email: updated.email,
              phone: updated.phone,
              designation: updated.designation,
            };
            localStorage.setItem("user", JSON.stringify(merged));
            setuser(merged);
          } catch (err) {
            setuser(updated);
            localStorage.setItem("user", JSON.stringify(updated));
          }
        } else {
          setuser(updated);
          localStorage.setItem("user", JSON.stringify(updated));
        }
      } else {
        toast.error(data?.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("profile update error", err);
      toast.error("Failed to update profile");
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    setChangingPassword(true);
    try {
      const res = await axios.put(
        "/api/admin/profile/password",
        { current: passwordData.current, newPassword: passwordData.new },
        { withCredentials: true }
      );
      const data = res.data;
      if (data?.success) {
        toast.success("Password changed successfully");
        setPasswordData({ current: "", new: "", confirm: "" });
      } else {
        toast.error(data?.message || "Failed to change password");
      }
    } catch (err) {
      console.error("password change error", err);
      toast.error("Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  // fetch profile and config when settings mounts
  useEffect(() => {
    const fetchProfileAndConfig = async () => {
      try {
        setLoadingProfile(true);
        setLoadingConfig(true);
        const [pRes, cRes] = await Promise.all([
          axios.get("/api/admin/profile", { withCredentials: true }),
          axios.get("/api/admin/config", { withCredentials: true }),
        ]);
        const pd = pRes.data;
        const cd = cRes.data;
        if (pd && pd.success && pd.admin) {
          setProfileData((prev) => ({
            ...prev,
            name: pd.admin.name || prev.name,
            email: pd.admin.email || prev.email,
            phone: pd.admin.phone || "",
            designation: "Admin",
          }));
          // sync context
          const adminNormalized = { ...pd.admin, designation: "Admin" };
          setuser(adminNormalized);
          localStorage.setItem("user", JSON.stringify(adminNormalized));
        } else if (
          pd &&
          pd.message &&
          pd.message.toLowerCase().includes("unauthorized")
        ) {
          navigate("/admin/login");
        }
        if (cd && cd.success && cd.config) {
          setConfig(cd.config);
        }
      } catch (err) {
        console.error("Failed to fetch profile/config", err);
        toast.error("Failed to load settings");
      } finally {
        setLoadingProfile(false);
        setLoadingConfig(false);
      }
    };
    fetchProfileAndConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                    value={profileData.phone || ""}
                    onChange={(e) =>
                      setProfileData({ ...profileData, phone: e.target.value })
                    }
                    placeholder="Add phone number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Designation
                  </label>
                  <p className="w-full px-3 py-2 border border-gray-100 rounded-lg bg-gray-50 text-sm text-gray-700">
                    Admin
                  </p>
                </div>
              </div>
              <div className="mt-5">
                <button
                  type="submit"
                  disabled={loadingProfile}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    loadingProfile
                      ? "bg-slate-400 text-white cursor-not-allowed"
                      : "bg-slate-700 text-white hover:bg-slate-800"
                  }`}
                >
                  <Save size={18} />
                  <span>{loadingProfile ? "Saving..." : "Save Changes"}</span>
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
                  disabled={changingPassword}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    changingPassword
                      ? "bg-slate-400 text-white cursor-not-allowed"
                      : "bg-slate-700 text-white hover:bg-slate-800"
                  }`}
                >
                  <Save size={18} />
                  <span>
                    {changingPassword ? "Updating..." : "Update Password"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Notification Preferences & System Info */}
        <div className="space-y-6">
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
                <p className="text-sm font-medium text-gray-900">
                  {config.platformVersion || "v2.4.1"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Last System Update</p>
                <p className="text-sm font-medium text-gray-900">
                  {config.lastSystemUpdate || "2024-12-10"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">AI Model Version</p>
                <p className="text-sm font-medium text-gray-900">
                  {config.aiModelVersion || "DocVerify-ML v3.2"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Database Status</p>
                <p
                  className={`text-sm font-medium ${
                    config.dbStatus === "connected" || config.dbStatus === "ok"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {config.dbStatus === "connected" || config.dbStatus === "ok"
                    ? "Connected"
                    : config.dbStatus || "Unknown"}
                </p>
                {config.storage && (
                  <p className="text-xs text-gray-500 mt-1">
                    Storage used: {config.storage.usedMB} MB (
                    {config.storage.percent}%)
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    setLoadingConfig(true);
                    try {
                      const res = await axios.get("/api/admin/config", {
                        withCredentials: true,
                      });
                      if (res.data && res.data.success)
                        setConfig(res.data.config || {});
                      else toast.error("Failed to refresh config");
                    } catch (err) {
                      console.error("Failed to refresh config", err);
                      toast.error("Failed to refresh config");
                    } finally {
                      setLoadingConfig(false);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  {loadingConfig ? "Refreshing..." : "Refresh Config"}
                </button>

                <button
                  onClick={() => {
                    localStorage.removeItem("user");
                    setuser(null);
                    navigate("/admin/login");
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Logout Section */}
    </div>
  );
}

export default Settings;
