"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Loader from "../../components/ui/Loader";
import { Button } from "@/components/ui/button";

function DocumentReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [approveFeedback, setApproveFeedback] = useState("");
  const [documentData, setDocumentData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setIsLoading(true);
      setError("");
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_PATH}/admin/documents/${id}`,
          { credentials: "include" }
        );
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success)
          throw new Error(data?.message || "Failed to load document");
        setDocumentData(data.document || null);
      } catch (err) {
        const msg = err?.message || "Failed to load document";
        setError(msg);
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const handleApprove = async () => {
    if (!approveFeedback.trim()) {
      setApproveFeedback("");
    }
    try {
      setApproveLoading(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_PATH}/admin/documents/${id}/approve`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            feedback: approveFeedback.trim() || "Approved by admin",
          }),
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success)
        throw new Error(data?.message || "Failed to approve");
      // Update UI immediately so page reflects approved state
      setDocumentData((prev) => ({
        ...prev,
        status: "approved",
        verificationDate: new Date().toLocaleString(),
        approvalFeedback: approveFeedback.trim() || "Approved by admin",
      }));
      toast.success("Document approved");
      // Delay navigation so user sees the approved state briefly
      setTimeout(() => navigate("/admin/verification"), 800);
    } catch (err) {
      toast.error(err?.message || "Failed to approve document");
    } finally {
      setApproveLoading(false);
      setShowApproveDialog(false);
      setApproveFeedback("");
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    try {
      setRejectLoading(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_PATH}/admin/documents/${id}/reject`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: rejectionReason }),
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success)
        throw new Error(data?.message || "Failed to reject");
      // Update UI immediately so page reflects rejected state
      setDocumentData((prev) => ({
        ...prev,
        status: "rejected",
        rejectionReason,
      }));
      toast.success("Document rejected");
      setShowRejectDialog(false);
      // Delay navigation so user sees the rejected state briefly
      setTimeout(() => navigate("/admin/verification"), 800);
    } catch (err) {
      toast.error(err?.message || "Failed to reject document");
    } finally {
      setRejectLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error && !documentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (!documentData) {
    return null;
  }

  // Build derived values for backward-compatible UI
  const timeline = [];
  if (documentData.uploadDate) {
    timeline.push({
      time: documentData.uploadDate,
      event: "Document submitted by user",
      type: "info",
    });
    timeline.push({
      time: documentData.uploadDate,
      event: "Document submitted for verification",
      type: "info",
    });
  }
  if (documentData.verificationDate) {
    timeline.push({
      time: documentData.verificationDate,
      event: `AI verification completed - Score: ${
        documentData.confidence ?? "N/A"
      }%`,
      type: "success",
    });
  }
  if (documentData.status === "pending") {
    timeline.push({
      time: new Date().toLocaleString(),
      event: "Queued for manual review",
      type: "pending",
    });
  }

  const feedbackText = documentData.feedback || "No feedback available.";

  return (
    <div>
      <button
        onClick={() => navigate("/admin/verification")}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Back to Queue</span>
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Document Review
        </h1>
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-gray-600">
            {documentData?.type || "-"} - {documentData?._id || "-"}
          </p>
          <Button
            variant="outline"
            onClick={() =>
              documentData?.url && window.open(documentData.url, "_blank")
            }
            disabled={!documentData?.url}
            className="text-sm"
          >
            Preview
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Document Preview & Extracted Text */}
        <div className="lg:col-span-2 space-y-6">
          {/* Extracted Text */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Extracted Information
                </h2>
                {documentData.extractionSource ? (
                  <div className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                    Source:{" "}
                    {String(documentData.extractionSource).toUpperCase()}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="p-5">
              {documentData.extractedText &&
              typeof documentData.extractedText === "object" ? (
                (() => {
                  const fields = Object.entries(
                    documentData.extractedText
                  ).filter(
                    ([k, v]) =>
                      !k.startsWith("_") && String(v || "").trim() !== ""
                  );
                  if (fields.length > 0) {
                    return (
                      <dl className="grid grid-cols-2 gap-4">
                        {fields.map(([key, value]) => (
                          <div key={key}>
                            <dt className="text-xs font-medium text-gray-500 uppercase mb-1">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </dt>
                            <dd className="text-sm text-gray-900 font-medium">
                              {String(value)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    );
                  }
                  return (
                    <div className="text-sm text-gray-600">
                      <div>No extracted information available.</div>
                      {Array.isArray(documentData.warnings) &&
                      documentData.warnings.length > 0 ? (
                        <div className="mt-2 text-xs text-orange-600">
                          {documentData.warnings.map((w, i) => (
                            <div key={i}>{w}</div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })()
              ) : (
                <div className="text-sm text-gray-600">
                  <div>No extracted information available.</div>
                  {Array.isArray(documentData.warnings) &&
                  documentData.warnings.length > 0 ? (
                    <div className="mt-2 text-xs text-orange-600">
                      {documentData.warnings.map((w, i) => (
                        <div key={i}>{w}</div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}

              {/* Show AI raw excerpt if available (admin-only audit) */}
              {documentData.aiRawExcerpt ? (
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded">
                  <p className="text-xs text-gray-500 mb-2">
                    AI Raw Excerpt (audit)
                  </p>
                  <pre className="whitespace-pre-wrap text-xs text-gray-800">
                    {documentData.aiRawExcerpt}
                  </pre>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Right Column - AI Analysis & Timeline */}
        <div className="space-y-6">
          {/* User Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              User Information
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="text-sm font-medium text-gray-900">
                  {documentData.uploader?.name ||
                    documentData.uploader?.email ||
                    "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">User ID</p>
                <p className="text-sm font-medium text-gray-900">
                  {documentData.uploader?._id || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Submission Date</p>
                <p className="text-sm font-medium text-gray-900">
                  {documentData.uploadDate || "-"}
                </p>
              </div>
            </div>
          </div>

          {/* AI Analysis */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                AI Analysis
              </h2>
            </div>
            <div className="p-5">
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Confidence Score</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${documentData.confidence ?? 0}%` }}
                    ></div>
                  </div>
                  <span className="text-lg font-bold text-gray-900">
                    {documentData.confidence ?? "N/A"}%
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs font-medium text-gray-700 mb-2">
                  AI Remarks
                </p>
                <ul className="space-y-2">
                  {(feedbackText
                    ? String(feedbackText).split(/[;\n]+/)
                    : []
                  ).map((remark, index) => (
                    <li key={index} className="flex gap-2 text-sm">
                      <CheckCircle
                        className="text-green-600 flex-shrink-0"
                        size={16}
                      />
                      <span className="text-gray-700">{remark}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {Array.isArray(documentData.warnings) &&
                documentData.warnings.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      Warnings
                    </p>
                    <ul className="space-y-2">
                      {documentData.warnings.map((warning, index) => (
                        <li key={index} className="flex gap-2 text-sm">
                          <AlertCircle
                            className="text-orange-600 flex-shrink-0"
                            size={16}
                          />
                          <span className="text-gray-700">{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Activity Timeline
              </h2>
            </div>
            <div className="p-5">
              <div className="space-y-4">
                {timeline.map((item, index) => (
                  <div key={index} className="flex gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        item.type === "success"
                          ? "bg-green-500"
                          : item.type === "pending"
                          ? "bg-yellow-500"
                          : "bg-blue-500"
                      }`}
                    ></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{item.event}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Final Decision
            </h3>

            {/* If already decided, show status */}
            {documentData.status === "approved" ? (
              <div className="flex flex-col items-start gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md">
                  <CheckCircle size={18} />
                  <span className="font-medium">Approved</span>
                </div>
                <p className="text-sm text-gray-600">
                  {documentData.verificationDate
                    ? `Approved on ${documentData.verificationDate}`
                    : "Approved"}
                </p>
                {documentData.approvalFeedback ? (
                  <div className="text-sm text-gray-700">
                    {documentData.approvalFeedback}
                  </div>
                ) : null}
              </div>
            ) : documentData.status === "rejected" ? (
              <div className="flex flex-col items-start gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-md">
                  <XCircle size={18} />
                  <span className="font-medium">Rejected</span>
                </div>
                <p className="text-sm text-gray-600">
                  {documentData.rejectionReason
                    ? `Reason: ${documentData.rejectionReason}`
                    : "Rejected"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => setShowApproveDialog(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors font-medium bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle size={20} />
                  <span>Approve Document</span>
                </button>
                {/* Approve Dialog */}
                {showApproveDialog && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Approve Document
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Please provide feedback for approval (optional):
                      </p>
                      <textarea
                        value={approveFeedback}
                        onChange={(e) => setApproveFeedback(e.target.value)}
                        placeholder="Enter approval feedback..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 mb-4"
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setShowApproveDialog(false);
                            setApproveFeedback("");
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleApprove}
                          disabled={approveLoading}
                          className={`flex-1 px-4 py-2 rounded-lg ${
                            approveLoading
                              ? "bg-green-600 opacity-70 cursor-not-allowed"
                              : "bg-green-600 text-white hover:bg-green-700"
                          }`}
                        >
                          {approveLoading ? (
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                              ></path>
                            </svg>
                          ) : null}
                          {approveLoading ? "Approving..." : "Confirm Approve"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setShowRejectDialog(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  <XCircle size={20} />
                  <span>Reject Document</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reject Document
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejection:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={rejectLoading}
                className={`flex-1 px-4 py-2 rounded-lg ${
                  rejectLoading
                    ? "bg-red-600 opacity-70 cursor-not-allowed"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                {rejectLoading ? (
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                ) : null}
                {rejectLoading ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentReview;
