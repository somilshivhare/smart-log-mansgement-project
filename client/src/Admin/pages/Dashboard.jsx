import { CheckCircle, Clock, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";

function timeAgo(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    pending: 0,
    approvedToday: 0,
    rejectedToday: 0,
    recent: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_PATH}/admin/metrics`,
          { withCredentials: true }
        );
        if (res.data?.success) {
          setMetrics(
            res.data.metrics || {
              pending: 0,
              approvedToday: 0,
              rejectedToday: 0,
              recent: [],
            }
          );
        } else {
          setError(res.data?.message || "Failed to load metrics");
        }
      } catch (err) {
        setError(
          err?.response?.data?.message || err.message || "Network error"
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = [
    {
      label: "Pending Verifications",
      value: metrics.pending ?? 0,
      icon: Clock,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
    {
      label: "Approved Today",
      value: metrics.approvedToday ?? 0,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Rejected Today",
      value: metrics.rejectedToday ?? 0,
      icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
  ];

  const recentActivity = metrics.recent || [];

  // Find the most recent verification (approved/rejected/pending)
  const mostRecentVerification = recentActivity.find((a) =>
    ["approved", "rejected", "pending"].includes(a.status)
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Dashboard Overview
      </h1>

      {loading && (
        <div className="mb-4 text-sm text-gray-500">Loading metrics...</div>
      )}
      {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

      {/* Most Recent Verification Result */}
      {mostRecentVerification && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
          <div>
            <span className="font-semibold text-gray-800">
              Most Recent Verification:
            </span>
            <span className="ml-2 text-gray-700">
              {mostRecentVerification.action || mostRecentVerification.details}
            </span>
            <span className="ml-2 text-gray-500">
              ({mostRecentVerification.user})
            </span>
            <span className="ml-2 text-xs text-gray-400">
              {timeAgo(mostRecentVerification.timestamp)}
            </span>
          </div>
          <span
            className={`px-3 py-1 text-sm rounded font-semibold capitalize ${
              mostRecentVerification.status === "approved"
                ? "bg-green-100 text-green-700"
                : mostRecentVerification.status === "rejected"
                ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {mostRecentVerification.status}
          </span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-gray-200 rounded-lg p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={stat.color} size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg">
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {recentActivity.map((activity) => (
              <div
                key={activity._id}
                className="p-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.action}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {activity.user} • {timeAgo(activity.timestamp)}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    activity.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : activity.status === "rejected"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {activity.status}
                </span>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <div className="p-4 text-sm text-gray-500">
                No recent activity
              </div>
            )}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              System Health
            </h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-700">API Response Time</span>
                <span
                  className={`text-sm font-medium ${
                    metrics.health?.apiResponseMs != null
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {metrics.health?.apiResponseMs != null
                    ? `${metrics.health.apiResponseMs}ms`
                    : "N/A"}
                </span>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-700">
                  Database Connection
                </span>
                <span
                  className={`text-sm font-medium ${
                    metrics.health?.dbStatus === "connected"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {metrics.health?.dbStatus ?? "unknown"}
                </span>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-700">AI Service</span>
                <span
                  className={`text-sm font-medium ${
                    metrics.health?.aiService === "configured"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {metrics.health?.aiService === "configured"
                    ? "Configured"
                    : "Not configured"}
                </span>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-700">Storage Used</span>
                <span
                  className={`text-sm font-medium ${
                    metrics.health?.storage?.percent &&
                    metrics.health.storage.percent < 80
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {metrics.health?.storage
                    ? `${metrics.health.storage.usedMB} MB (${
                        metrics.health.storage.percent ?? 0
                      }%)`
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
