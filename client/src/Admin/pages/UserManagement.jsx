"use client";

import React, { useEffect, useState } from "react";
import { Search, UserCheck, UserX, Eye } from "lucide-react";
import axios from "axios";
import AlertModal from "@/components/ui/AlertModal";
import { io } from "socket.io-client";
import { toast } from "sonner";

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [users, setUsers] = useState([]);
  const [totals, setTotals] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 25;

  const [alertState, setAlertState] = useState({
    open: false,
    title: "",
    message: "",
    primaryLabel: "OK",
    onPrimary: null,
  });
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    onCancel: null,
    primaryLabel: "Confirm",
    secondaryLabel: "Cancel",
  });
  const totalPages =
    (totals && totals.totalPages) ||
    Math.max(1, Math.ceil((totals.totalUsers || 0) / limit));

  useEffect(() => {
    const SOCKET_URL = axios.defaults.baseURL || "http://localhost:4000";
    console.log("Attempting socket connection to:", SOCKET_URL);
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnectionAttempts: 5,
    });
    socket.on("connect", () =>
      console.log("socket connected", socket.id, "to", SOCKET_URL)
    );
    socket.on("connect_error", (err) =>
      console.warn(
        "Socket connect_error (to " + SOCKET_URL + "):",
        err?.message || err
      )
    );
    socket.on("user:status_updated", (payload) => {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === payload.id ? { ...u, status: payload.status } : u
        )
      );
      fetchUsers();
    });
    return () => socket.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  // debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // reset to page 1 whenever filters/search change so results are consistent
  useEffect(() => {
    if (page !== 1) setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, roleFilter, statusFilter, page]);

  // fetch selected user activity history
  useEffect(() => {
    const fetchActivity = async () => {
      if (!selectedUser) return setActivities([]);
      try {
        setLoadingActivities(true);
        const res = await axios.get(
          `/api/admin/users/${selectedUser.id}/history`,
          { withCredentials: true }
        );
        if (res.data && res.data.success) {
          setActivities(res.data.activities || []);
        } else {
          console.warn("Failed to fetch activities", res.data);
          setActivities([]);
        }
      } catch (err) {
        console.error("fetchActivity error", err?.response?.data || err);
        toast.error("Failed to fetch user activity");
        setActivities([]);
      } finally {
        setLoadingActivities(false);
      }
    };
    fetchActivity();
  }, [selectedUser]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/admin/users`, {
        params: {
          search: debouncedSearch,
          role: roleFilter,
          status: statusFilter,
          page,
          limit,
        },
        withCredentials: true,
      });
      console.log("GET /api/admin/users response:", res.data);
      if (res.data && res.data.success) {
        setUsers(res.data.users || []);
        // merge totals and include server-provided totalPages when present
        const serverTotals = res.data.totals || {};
        if (typeof res.data.totalPages !== "undefined") {
          serverTotals.totalPages = res.data.totalPages;
        }
        setTotals(serverTotals);

        // clamp current page to totalPages if server indicates fewer pages
        const tp =
          serverTotals.totalPages ||
          Math.max(1, Math.ceil((serverTotals.totalUsers || 0) / limit));
        if (page > tp) {
          setPage(tp);
        }
      } else {
        console.warn("GET /api/admin/users returned non-success", res.data);
      }
    } catch (err) {
      console.error("fetchUsers error:", err?.response?.data || err);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  // log users updates to help debugging
  useEffect(() => {
    console.log("users state updated", users.length, users.slice(0, 5));
  }, [users]);

  const handleToggleStatus = async (userId, currentStatus) => {
    console.log("toggle status", userId, currentStatus);
    const action = currentStatus === "Active" ? "disable" : "enable";
    setConfirmState({
      open: true,
      title: "Confirm",
      message: `Are you sure you want to ${action} this user account?`,
      primaryLabel: action === "disable" ? "Disable" : "Enable",
      secondaryLabel: "Cancel",
      onConfirm: async () => {
        setConfirmState({ open: false });
        try {
          const status = currentStatus === "Active" ? "Inactive" : "Active";
          const res = await axios.post(
            `/api/admin/users/${userId}/status`,
            { status },
            { withCredentials: true }
          );
          if (res.data && res.data.success) {
            toast.success("User status updated");
            setUsers((prev) =>
              prev.map((u) => (u.id === userId ? { ...u, status } : u))
            );
            fetchUsers();
          }
        } catch (err) {
          console.error(err);
          toast.error("Failed to update status");
        }
      },
      onCancel: () => setConfirmState({ open: false }),
    });
  };

  return (
    <div>
      <AlertModal
        open={alertState.open}
        title={alertState.title}
        message={alertState.message}
        primaryLabel={alertState.primaryLabel}
        onPrimary={
          alertState.onPrimary || (() => setAlertState({ open: false }))
        }
        secondaryLabel={alertState.secondaryLabel}
        onSecondary={alertState.onSecondary}
      />
      <AlertModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        primaryLabel={confirmState.primaryLabel}
        onPrimary={confirmState.onConfirm}
        secondaryLabel={confirmState.secondaryLabel}
        onSecondary={confirmState.onCancel}
      />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          User Management
        </h1>
        <p className="text-sm text-gray-600">
          Manage user accounts and permissions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total Users</p>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "..." : totals.totalUsers || 0}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Active Users</p>
          <p className="text-2xl font-bold text-green-600">
            {totals.activeUsers || 0}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Inactive Users</p>
          <p className="text-2xl font-bold text-gray-600">
            {totals.inactiveUsers || 0}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Admin/Staff</p>
          <p className="text-2xl font-bold text-slate-700">
            {totals.adminCount || 0}
          </p>
        </div>
      </div>

      {/* Debug info */}

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700"
          >
            <option value="all">All Roles</option>
            <option value="citizen">Citizen</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  User ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Last Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {user.id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {user.email}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                        user.role === "Admin"
                          ? "bg-purple-100 text-purple-700"
                          : user.role === "Verifier"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                        user.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {user.lastActivity}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedUser(user)}
                        title="View Details"
                        className="p-1 text-slate-700 hover:bg-slate-100 rounded"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user.id, user.status)}
                        title={
                          user.status === "Active"
                            ? "Disable Account"
                            : "Enable Account"
                        }
                        className={`p-1 rounded ${
                          user.status === "Active"
                            ? "text-red-600 hover:bg-red-50"
                            : "text-green-600 hover:bg-green-50"
                        }`}
                      >
                        {user.status === "Active" ? (
                          <UserX size={16} />
                        ) : (
                          <UserCheck size={16} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {users.length} of {totals.totalUsers || 0} entries
          </p>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm"
              disabled={page <= 1}
            >
              Previous
            </button>

            {/* page numbers */}
            <div className="flex gap-1">
              {(() => {
                const pages = [];
                const start = Math.max(1, page - 3);
                const end = Math.min(totalPages, page + 3);
                for (let p = start; p <= end; p++) pages.push(p);
                return pages.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1 rounded text-sm ${
                      p === page
                        ? "bg-slate-700 text-white"
                        : "border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                ));
              })()}
            </div>

            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm"
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        </div>

        {/* Details modal */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black opacity-40"
              onClick={() => setSelectedUser(null)}
            />
            <div className="relative z-10 bg-white rounded-lg shadow-lg w-11/12 md:w-1/2 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">User Details</h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-slate-600"
                >
                  Close
                </button>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <strong>ID:</strong> {selectedUser.id}
                </p>
                <p>
                  <strong>Name:</strong> {selectedUser.name}
                </p>
                <p>
                  <strong>Email:</strong> {selectedUser.email}
                </p>
                <p>
                  <strong>Role:</strong> {selectedUser.role}
                </p>
                <p>
                  <strong>Status:</strong> {selectedUser.status}
                </p>
                <p>
                  <strong>Last Activity:</strong> {selectedUser.lastActivity}
                </p>

                <hr className="my-3" />

                <div>
                  <h4 className="text-sm font-medium mb-2">Activity History</h4>

                  {loadingActivities ? (
                    <p className="text-sm text-gray-500">
                      Loading activities...
                    </p>
                  ) : activities.length === 0 ? (
                    <p className="text-sm text-gray-500">No recent activity</p>
                  ) : (
                    <ul className="space-y-2 max-h-48 overflow-auto text-xs text-gray-700">
                      {activities.map((act) => (
                        <li key={act._id} className="border rounded p-2">
                          <div className="flex justify-between">
                            <div>
                              <div className="font-medium">{act.action}</div>
                              <div className="text-xs text-gray-500">
                                {act.details}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 text-right">
                              <div>
                                {act.performedBy?.name ||
                                  act.performedBy?.email ||
                                  "System"}
                              </div>
                              <div>
                                {new Date(act.timestamp).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
