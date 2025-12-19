"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

function VerificationQueue() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  // Pending filter selections (UI) — only applied when user clicks Apply
  const [statusFilter, setStatusFilter] = useState("all");
  const [documentTypeFilter, setDocumentTypeFilter] = useState("all");
  // Active filters used for fetching
  const [activeStatusFilter, setActiveStatusFilter] = useState("all");
  const [activeDocumentTypeFilter, setActiveDocumentTypeFilter] =
    useState("all");

  const [searchTermDebounced, setSearchTermDebounced] = useState("");
  // simple debounce for search
  useEffect(() => {
    const t = setTimeout(() => setSearchTermDebounced(searchTerm.trim()), 450);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // reset to page 1 when debounced search changes
  useEffect(() => {
    setPage(1);
  }, [searchTermDebounced]);

  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        if (activeStatusFilter && activeStatusFilter !== "all")
          params.set("status", activeStatusFilter);
        if (activeDocumentTypeFilter && activeDocumentTypeFilter !== "all")
          params.set("type", activeDocumentTypeFilter);
        if (searchTermDebounced) params.set("search", searchTermDebounced);
        const res = await fetch(
          `${
            import.meta.env.VITE_API_PATH
          }/admin/documents?${params.toString()}`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) {
          throw new Error(data?.message || "Failed to load documents");
        }
        setDocuments(data.documents || []);
        setTotal(data.total || 0);
      } catch (err) {
        const msg = err?.message || "Failed to load documents";
        setError(msg);
        try {
          toast.error(msg);
        } catch (e) {}
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [
    page,
    limit,
    activeStatusFilter,
    activeDocumentTypeFilter,
    searchTermDebounced,
  ]);

  const handleReview = (docId) => {
    // Navigate to the review route for the selected document
    navigate(`/admin/review/${docId}`);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Verification Queue
        </h1>
        <p className="text-sm text-gray-600">
          Review and verify pending documents
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by ID or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={documentTypeFilter}
            onChange={(e) => setDocumentTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700"
          >
            <option value="all">All Document Types</option>
            <option value="Identity Proof">Identity Proof</option>
            <option value="Address Proof">Address Proof</option>
            <option value="Tax Document">Tax Document</option>
            <option value="Financial Document">Financial Document</option>
            <option value="Educational Certificate">
              Educational Certificate
            </option>
          </select>
          <button
            onClick={() => {
              // commit pending filters and trigger fetch
              setActiveStatusFilter(statusFilter);
              setActiveDocumentTypeFilter(documentTypeFilter);
              setPage(1);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Filter size={18} />
            <span>Apply Filters</span>
          </button>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Document ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  User Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  User ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Document Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  AI Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Submission Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-8 text-center text-sm text-gray-600"
                  >
                    Loading...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-8 text-center text-sm text-red-600"
                  >
                    {error}
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-8 text-center text-sm text-gray-600"
                  >
                    No documents found.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {doc._id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {doc.uploader?.name || doc.uploader?.email || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {doc.uploader?._id || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {doc.type}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          doc.confidence >= 90
                            ? "bg-green-100 text-green-700"
                            : doc.confidence >= 80
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {doc.confidence ?? "N/A"}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {doc.uploadDate || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs rounded ${
                          doc.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : doc.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleReview(doc._id)}
                        className="text-sm text-slate-700 hover:text-slate-900 font-medium hover:underline"
                      >
                        Review
                      </button>
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
            Showing page {page} of {totalPages} ({total} entries)
          </p>
          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`px-3 py-1 rounded text-sm ${
                  page === i + 1
                    ? "bg-slate-700 text-white"
                    : "border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerificationQueue;
