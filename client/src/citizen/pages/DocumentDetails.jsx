import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, CheckCircle, XCircle, Clock } from "lucide-react";

export default function DocumentDetailsPage() {
  const { id: documentId } = useParams();
  const API_BASE_URL = import.meta.env.VITE_API_PATH;
  const [document, setDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!documentId) return;
      setError("");
      try {
        setIsLoading(true);
        const response = await fetch(
          `${API_BASE_URL}/document/${documentId}`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.success) {
          throw new Error(
            data?.error || data?.message || "Failed to load document"
          );
        }
        setDocument(data.document);
      } catch (err) {
        setError(err?.message || "Failed to load document");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [documentId]);

  const safeDocument = useMemo(() => {
    return (
      document || {
        name: "-",
        type: "-",
        uploadDate: "-",
        status: "pending",
        fileSize: "-",
        verificationDate: null,
        verifiedBy: null,
        confidence: null,
        feedback: "-",
        remarks: "-",
        history: [],
        url: null,
      }
    );
  }, [document]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-700" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-700" />;
      case "pending":
        return <Clock className="w-5 h-5 text-orange-700" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-orange-100 text-orange-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/citizen"
          className="inline-flex items-center text-sm text-gray-700 hover:text-gray-900 mb-6 hover:underline"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          Document Details
        </h1>
        {isLoading ? (
          <div className="bg-white border border-gray-200 p-6 mb-6 text-sm text-gray-600">
            Loading document...
          </div>
        ) : error ? (
          <div className="bg-white border border-gray-200 p-6 mb-6 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        <div className="bg-white border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {safeDocument.name}
              </h2>
              <div className="flex items-center gap-2">
                {getStatusIcon(safeDocument.status)}
                <span
                  className={`inline-block px-3 py-1 text-xs font-medium ${getStatusColor(
                    safeDocument.status
                  )}`}
                >
                  {safeDocument.status.charAt(0).toUpperCase() +
                    safeDocument.status.slice(1)}
                </span>
              </div>
            </div>
            <Button
              className="bg-gray-800 text-white hover:bg-gray-900"
              onClick={() => {
                if (safeDocument.url) window.open(safeDocument.url, "_blank");
              }}
              disabled={!safeDocument.url}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">
                  Document Type
                </div>
                <div className="text-sm text-gray-900">{safeDocument.type}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">
                  Upload Date
                </div>
                <div className="text-sm text-gray-900">
                  {safeDocument.uploadDate}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">
                  File Size
                </div>
                <div className="text-sm text-gray-900">
                  {safeDocument.fileSize}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">
                  Verification Date
                </div>
                <div className="text-sm text-gray-900">
                  {safeDocument.verificationDate || "Pending"}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">
                  Verified By
                </div>
                <div className="text-sm text-gray-900">
                  {safeDocument.verifiedBy || "N/A"}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">
                  Confidence Score
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {typeof safeDocument.confidence === "number"
                    ? `${safeDocument.confidence}%`
                    : "N/A"}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Verification Feedback
          </h2>
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">
                Analysis Result
              </div>
              <p className="text-sm text-gray-900 leading-relaxed">
                {safeDocument.feedback}
              </p>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Remarks
              </div>
              <p className="text-sm text-gray-900 leading-relaxed">
                {safeDocument.remarks}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Verification Timeline
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {safeDocument.history.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-gray-800"></div>
                    {index < safeDocument.history.length - 1 && (
                      <div className="w-px h-full bg-gray-300 mt-1"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="text-xs text-gray-500 mb-1">
                      {item.date}
                    </div>
                    <div className="text-sm text-gray-900">{item.event}</div>
                  </div>
                </div>
              ))}
              {safeDocument.history.length === 0 ? (
                <div className="text-sm text-gray-600">
                  No timeline available.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
