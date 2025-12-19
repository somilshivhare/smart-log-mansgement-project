import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar } from "lucide-react";
import Header from "../components/Header";
import axios from "axios";
import AlertModal from "@/components/ui/AlertModal";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alertState, setAlertState] = useState({
    open: false,
    title: "",
    message: "",
    primaryLabel: "OK",
    onPrimary: null,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_PATH}/user/profile`,
          { withCredentials: true }
        );
        if (res.data.success) {
          setFormData({
            name: res.data.citizen.name || "",
            email: res.data.citizen.email || "",
            phone: res.data.citizen.phoneNumber || "",
            address: res.data.citizen.address || "",
            dateOfBirth: res.data.citizen.dateOfBirth || "",
            aadhaarNumber: res.data.citizen.govtIds?.find(
              (id) => id.type === "aadhaar"
            )?.value
              ? res.data.citizen.govtIds?.find((id) => id.type === "aadhaar")
                  ?.value
              : "",
            panNumber: res.data.citizen.govtIds?.find((id) => id.type === "pan")
              ?.value
              ? res.data.citizen.govtIds?.find((id) => id.type === "pan")?.value
              : "",
            accountCreated: res.data.citizen.createdAt || "",
            lastLogin: res.data.citizen.lastLoginAt || "",
          });
          setOriginalData({
            name: res.data.citizen.name || "",
            email: res.data.citizen.email || "",
            phone: res.data.citizen.phoneNumber || "",
            address: res.data.citizen.address || "",
            dateOfBirth: res.data.citizen.dateOfBirth || "",
            accountCreated: res.data.citizen.createdAt || "",
            lastLogin: res.data.citizen.lastLoginAt || "",
          });
          // fetch document stats after profile successful
          fetchDocumentStats();
        } else {
          setError(res.data.message || "Failed to fetch profile");
        }
      } catch (err) {
        setError(err?.response?.data?.message || "Network error");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
    // also fetch stats even if profile fetch is delayed
    async function fetchDocumentStats() {
      try {
        const r = await axios.get(
          `${import.meta.env.VITE_API_PATH}/document/fetch-documents`,
          { withCredentials: true }
        );
        if (r.data?.success && Array.isArray(r.data.documents)) {
          const docs = r.data.documents;
          const total = docs.length;
          let approved = 0;
          let pending = 0;
          let rejected = 0;
          for (const d of docs) {
            if (d.status === "approved") approved += 1;
            else if (d.status === "rejected") rejected += 1;
            else pending += 1;
          }
          setStats({ total, approved, pending, rejected });
        }
      } catch (err) {
        // ignore stats errors, keep defaults
        console.warn("Failed to fetch document stats", err?.message || err);
      }
    }
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Build payload with only changed fields (exclude email - readonly)
      const payload = {};
      if (!originalData) {
        // fallback - send everything
        payload.name = formData.name;
        payload.phone = formData.phone;
        payload.address = formData.address;
        payload.dateOfBirth = formData.dateOfBirth;
      } else {
        if (formData.name !== originalData.name) payload.name = formData.name;
        if (formData.phone !== originalData.phone)
          payload.phone = formData.phone;
        if (formData.address !== originalData.address)
          payload.address = formData.address;
        if (formData.dateOfBirth !== originalData.dateOfBirth)
          payload.dateOfBirth = formData.dateOfBirth;
      }

      if (Object.keys(payload).length === 0) {
        setError(null);
        setAlertState({
          open: true,
          title: "No changes",
          message: "No changes to save",
          primaryLabel: "OK",
          onPrimary: () => {
            setAlertState({ open: false });
          },
        });
        setIsEditing(false);
        setLoading(false);
        return;
      }
      const res = await axios.put(
        `${import.meta.env.VITE_API_PATH}/user/profile`,
        payload,
        { withCredentials: true }
      );
      if (res.data.success) {
        // Use returned citizen if available to normalize data
        const updated = res.data.citizen || {};
        const newState = {
          ...formData,
          name: updated.name ?? formData.name,
          email: updated.email ?? formData.email,
          phone: updated.phoneNumber ?? formData.phone,
          address: updated.address ?? formData.address,
          dateOfBirth: updated.dateOfBirth ?? formData.dateOfBirth,
        };
        setFormData(newState);
        setOriginalData({
          name: newState.name,
          email: newState.email,
          phone: newState.phone,
          address: newState.address,
          dateOfBirth: newState.dateOfBirth,
          accountCreated: newState.accountCreated,
          lastLogin: newState.lastLogin,
        });
        setAlertState({
          open: true,
          title: "Success",
          message: "Profile updated successfully",
          primaryLabel: "OK",
          onPrimary: () => {
            setAlertState({ open: false });
            setIsEditing(false);
          },
        });
      } else {
        setError(res.data.message || "Failed to update profile");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  // include the alert modal
  const AlertPopup = () => (
    <AlertModal
      open={alertState.open}
      title={alertState.title}
      message={alertState.message}
      primaryLabel={alertState.primaryLabel}
      onPrimary={alertState.onPrimary || (() => setAlertState({ open: false }))}
    />
  );

  // Helper to decide if a field should be editable (if missing or editing)
  const editableField = (field, label, type = "text") => {
    if (field === "email") {
      return (
        <div className="text-sm text-gray-900">
          {formData[field] ? (
            formData[field]
          ) : (
            <span className="text-gray-400 italic">Not updated</span>
          )}
        </div>
      );
    }
    if (field === "address") {
      return isEditing ? (
        <textarea
          name="address"
          value={formData.address || ""}
          onChange={handleInputChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
          required
        />
      ) : (
        <div className="text-sm text-gray-900">
          {formData.address ? (
            formData.address
          ) : (
            <span className="text-gray-400 italic">Not updated</span>
          )}
        </div>
      );
    }
    return isEditing ? (
      <input
        type={type}
        name={field}
        value={formData[field] || ""}
        onChange={handleInputChange}
        className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
        required
      />
    ) : (
      <div className="text-sm text-gray-900">
        {formData[field] ? (
          formData[field]
        ) : (
          <span className="text-gray-400 italic">Not updated</span>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        {error}
      </div>
    );
  }
  if (!formData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <AlertPopup />
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          to="/citizen"
          className="inline-flex items-center text-sm text-gray-700 hover:text-gray-900 mb-6 hover:underline"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        {/* Page Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-8">User Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Personal Information
                </h2>
                {!isEditing && (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-gray-800 text-white hover:bg-gray-900"
                    size="sm"
                  >
                    Edit Profile
                  </Button>
                )}
              </div>

              <form onSubmit={handleSave}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Full Name
                    </label>
                    {editableField("name", "Full Name")}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email Address
                    </label>
                    <div className="text-sm text-gray-900">
                      {formData.email}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Phone Number
                    </label>
                    {editableField("phone", "Phone Number", "tel")}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Address
                    </label>
                    {editableField("address", "Address")}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Date of Birth
                    </label>
                    {editableField("dateOfBirth", "Date of Birth", "date")}
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                    <Button
                      type="submit"
                      className="bg-gray-800 text-white hover:bg-gray-900"
                    >
                      Save Changes
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        // revert to original values
                        if (originalData) setFormData(originalData);
                        setIsEditing(false);
                        setError(null);
                      }}
                      className="border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </form>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Account Statistics
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">
                    Total Documents
                  </div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {stats.total ?? 0}
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Approved</div>
                  <div className="text-xl font-semibold text-green-700">
                    {stats.approved ?? 0}
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Pending</div>
                  <div className="text-xl font-semibold text-orange-700">
                    {stats.pending ?? 0}
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Rejected</div>
                  <div className="text-xl font-semibold text-red-700">
                    {stats.rejected ?? 0}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Account Activity
              </h2>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600 mb-1">
                    Account Created
                  </div>
                  <div className="text-sm text-gray-900">
                    {formData.accountCreated ? (
                      new Date(formData.accountCreated).toLocaleDateString()
                    ) : (
                      <span className="text-gray-400 italic">
                        Not available
                      </span>
                    )}
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Last Login</div>
                  <div className="text-sm text-gray-900">
                    {formData.lastLogin ? (
                      new Date(formData.lastLogin).toLocaleString()
                    ) : (
                      <span className="text-gray-400 italic">
                        Not available
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
