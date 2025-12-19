"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Download } from "lucide-react";
import axios from "axios";

function LogsAudit() {
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const getLevelColor = (level) => {
    switch (level) {
      case "ERROR":
        return "bg-red-100 text-red-700";
      case "WARN":
        return "bg-orange-100 text-orange-700";
      case "INFO":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit,
      };
      if (levelFilter && levelFilter !== "all")
        params.level = levelFilter.toUpperCase();
      if (moduleFilter && moduleFilter !== "all") params.module = moduleFilter;
      const res = await axios.get(
        `${import.meta.env.VITE_API_PATH}/admin/logs`,
        { params, withCredentials: true }
      );
      if (res.data?.success) {
        setLogs(res.data.logs || []);
        setTotal(res.data.total || 0);
      } else {
        setError(res.data?.message || "Failed to load logs");
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelFilter, moduleFilter, page, limit]);

  // client-side search/filtering
  const filtered = useMemo(() => {
    if (!searchTerm) return logs;
    const q = searchTerm.toLowerCase();
    return logs.filter(
      (l) =>
        (l.message || "").toLowerCase().includes(q) ||
        (l.module || "").toLowerCase().includes(q) ||
        (l.username || "").toLowerCase().includes(q)
    );
  }, [logs, searchTerm]);

  const exportCSV = () => {
    const rows = filtered.map((r) => ({
      timestamp: r.timestamp,
      level: r.level,
      module: r.module,
      message: r.message,
    }));
    const header = Object.keys(
      rows[0] || { timestamp: "", level: "", module: "", message: "" }
    );
    const csv = [
      header.join(","),
      ...rows.map((r) =>
        header
          .map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.max(1, Math.ceil((total || 0) / limit));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Logs & Audit Trail
        </h1>
        <p className="text-sm text-gray-600">
          Monitor system activity and review audit logs
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative md:col-span-2">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700"
            />
          </div>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700"
          >
            <option value="all">All Levels</option>
            <option value="ERROR">ERROR</option>
            <option value="WARN">WARN</option>
            <option value="INFO">INFO</option>
          </select>
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700"
          >
            <option value="all">All Modules</option>
            {/* Common modules; backend can return others */}
            <option value="Authentication">Authentication</option>
            <option value="Document Verification">Document Verification</option>
            <option value="AI Service">AI Service</option>
            <option value="Database">Database</option>
            <option value="System">System</option>
            <option value="Document Upload">Document Upload</option>
            <option value="Storage">Storage</option>
            <option value="Email Service">Email Service</option>
            <option value="Backup">Backup</option>
          </select>
          <div className="flex items-center gap-2">
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <button
              onClick={exportCSV}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Download size={18} />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Module
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Message
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Loading logs...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-red-600"
                  >
                    {error}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No logs found
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log._id || log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getLevelColor(
                          log.level
                        )}`}
                      >
                        {log.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {log.module}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {log.message}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {(page - 1) * limit + (filtered.length ? 1 : 0)} to{" "}
            {(page - 1) * limit + filtered.length} of {total} entries
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(1)}
                className={`px-3 py-1 rounded text-sm ${
                  page === 1
                    ? "bg-slate-700 text-white"
                    : "border border-gray-300 hover:bg-gray-50"
                }`}
              >
                1
              </button>
              {totalPages > 1 && (
                <button
                  onClick={() => setPage(Math.min(totalPages, 2))}
                  className={`px-3 py-1 rounded text-sm ${
                    page === 2
                      ? "bg-slate-700 text-white"
                      : "border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  2
                </button>
              )}
              {totalPages > 2 && (
                <button
                  onClick={() => setPage(Math.min(totalPages, 3))}
                  className={`px-3 py-1 rounded text-sm ${
                    page === 3
                      ? "bg-slate-700 text-white"
                      : "border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  3
                </button>
              )}
            </div>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LogsAudit;
