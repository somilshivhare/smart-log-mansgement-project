import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Header from "../components/Header";
import Footer from "../components/Footer";
export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [verificationResult, setVerificationResult] = useState(null);
  const fileInputRef = useRef(null);

  const [documents, setDocuments] = useState([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [documentsError, setDocumentsError] = useState("");

  const documentsPerPage = 5;

  const stats = useMemo(() => {
    const total = documents.length;
    const approved = documents.filter((d) => d?.status === "approved").length;
    const pending = documents.filter((d) => d?.status === "pending").length;
    return { total, approved, pending };
  }, [documents]);

  const activityLogs = [
    {
      id: 1,
      timestamp: "2024-03-20 14:23",
      action: "Uploaded Voter_ID.pdf for verification",
    },
    {
      id: 2,
      timestamp: "2024-03-18 09:15",
      action: "Driving_License.pdf approved by verification authority",
    },
    {
      id: 3,
      timestamp: "2024-03-16 16:45",
      action: "Uploaded Residence_Proof.pdf for verification",
    },
    {
      id: 4,
      timestamp: "2024-03-16 11:30",
      action: "Residence_Proof.pdf rejected - invalid address format",
    },
    {
      id: 5,
      timestamp: "2024-03-15 13:20",
      action: "Uploaded Income_Certificate.pdf for verification",
    },
    {
      id: 6,
      timestamp: "2024-03-14 10:10",
      action: "Uploaded Birth_Certificate.pdf for verification",
    },
  ];

  const API_BASE_URL = "http://localhost:4000";

  const fetchDocuments = async () => {
    setDocumentsError("");
    try {
      setIsLoadingDocuments(true);
      const response = await fetch(
        `${API_BASE_URL}/api/document/fetch-documents`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error || data?.message || "Failed to load documents"
        );
      }
      setDocuments(Array.isArray(data.documents) ? data.documents : []);
      setCurrentPage(1);
    } catch (err) {
      setDocumentsError(err?.message || "Failed to load documents");
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploadError("");

    if (!selectedFile || !documentType) {
      toast.error("Please select a document type and file.");
      return;
    }

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append("document", selectedFile);
      formData.append("documentType", documentType);

      const response = await fetch(
        `${API_BASE_URL}/api/document/upload-document`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || data?.message || "Upload failed");
      }

      const confidence = data?.verification?.confiedenceScore;
      const feedbackRaw = data?.verification?.Feedback;
      let feedbackText = "";
      try {
        const parsed =
          typeof feedbackRaw === "string"
            ? JSON.parse(feedbackRaw)
            : feedbackRaw;
        if (parsed?.issues?.length) {
          feedbackText = parsed.issues.join("\n");
        } else {
          feedbackText =
            typeof parsed === "string" ? parsed : JSON.stringify(parsed);
        }
      } catch {
        feedbackText = typeof feedbackRaw === "string" ? feedbackRaw : "";
      }

      setVerificationResult({
        documentName: data?.document?.name || selectedFile.name,
        confidence: typeof confidence === "number" ? confidence : 0,
        feedback: feedbackText,
      });

      setSelectedFile(null);
      setDocumentType("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("Document submitted for verification.");

      await fetchDocuments();
    } catch (err) {
      const message = err?.message || "Upload failed";
      setUploadError(message);
      toast.error(message);
    } finally {
      setIsUploading(false);
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

  const totalPages = Math.ceil(documents.length / documentsPerPage) || 1;
  const startIndex = (currentPage - 1) * documentsPerPage;
  const paginatedDocuments = documents.slice(
    startIndex,
    startIndex + documentsPerPage
  );

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toISOString().slice(0, 10);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          Citizen Dashboard
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-gray-200 p-6">
            <div className="text-sm text-gray-600 mb-1">Total Documents</div>
            <div className="text-3xl font-semibold text-gray-900">
              {stats.total}
            </div>
          </div>
          <div className="bg-white border border-gray-200 p-6">
            <div className="text-sm text-gray-600 mb-1">Approved Documents</div>
            <div className="text-3xl font-semibold text-green-700">
              {stats.approved}
            </div>
          </div>
          <div className="bg-white border border-gray-200 p-6">
            <div className="text-sm text-gray-600 mb-1">Pending Documents</div>
            <div className="text-3xl font-semibold text-orange-700">
              {stats.pending}
            </div>
          </div>
        </div>

        {/* Document Upload Section */}
        <div className="bg-white border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Upload Document
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="document-type"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Document Type
                </label>
                <select
                  id="document-type"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  required
                >
                  <option value="">Select document type</option>
                  <option value="Identity Proof">Identity Proof</option>
                  <option value="Address Proof">Address Proof</option>
                  <option value="Tax Document">Tax Document</option>
                  <option value="Financial Document">Financial Document</option>
                  <option value="Educational Certificate">
                    Educational Certificate
                  </option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="file-upload"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Choose File (Image)
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 file:mr-4 file:py-1 file:px-4 file:border-0 file:bg-gray-700 file:text-white file:text-sm hover:file:bg-gray-800"
                  required
                />
              </div>
            </div>
            {selectedFile && (
              <div className="text-sm text-gray-600">
                Selected: {selectedFile.name}
              </div>
            )}
            <Button
              type="submit"
              disabled={isUploading}
              className="bg-gray-800 text-white hover:bg-gray-900 px-6"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? "Submitting..." : "Submit Document"}
            </Button>
            {uploadError ? (
              <div className="text-sm text-red-700">{uploadError}</div>
            ) : null}
          </form>
        </div>

        {/* Document Status Table */}
        <div className="bg-white border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Document Status
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Document Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Document Type
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Upload Date
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoadingDocuments ? (
                  <tr>
                    <td className="px-6 py-6 text-sm text-gray-600" colSpan={5}>
                      Loading documents...
                    </td>
                  </tr>
                ) : documentsError ? (
                  <tr>
                    <td className="px-6 py-6 text-sm text-red-700" colSpan={5}>
                      {documentsError}
                    </td>
                  </tr>
                ) : paginatedDocuments.length === 0 ? (
                  <tr>
                    <td className="px-6 py-6 text-sm text-gray-600" colSpan={5}>
                      No documents uploaded yet.
                    </td>
                  </tr>
                ) : (
                  paginatedDocuments.map((doc) => (
                    <tr key={doc._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {doc.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {doc.type}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {formatDate(doc.uploadedAt)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 text-xs font-medium ${getStatusColor(
                            doc.status
                          )}`}
                        >
                          {doc.status.charAt(0).toUpperCase() +
                            doc.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() =>
                            navigate(`/citizen/document/${doc._id}`)
                          }
                          className="text-sm text-gray-700 hover:text-gray-900 underline"
                        >
                          View Details
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
            <div className="text-sm text-gray-600">
              Showing {documents.length === 0 ? 0 : startIndex + 1} to{" "}
              {Math.min(startIndex + documentsPerPage, documents.length)} of{" "}
              {documents.length} documents
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {[...Array(totalPages)].map((_, i) => (
                <Button
                  key={i + 1}
                  variant={currentPage === i + 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(i + 1)}
                  disabled={documents.length === 0}
                  className={
                    currentPage === i + 1
                      ? "bg-gray-800 text-white hover:bg-gray-900"
                      : "border-gray-300 text-gray-700 hover:bg-gray-100"
                  }
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Verification Feedback Section */}
        <div className="bg-white border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Verification Result
          </h2>
          {verificationResult ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Document:
                </span>
                <span className="text-sm text-gray-900">
                  {verificationResult.documentName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Confidence Score:
                </span>
                <span className="text-sm font-semibold text-green-700">
                  {verificationResult.confidence}%
                </span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-700 block mb-2">
                  Feedback:
                </span>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {verificationResult.feedback}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              No verification results yet.
            </div>
          )}
        </div>

        {/* User Activity Logs */}
        <div className="bg-white border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Activity History
            </h2>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <div className="divide-y divide-gray-200">
              {activityLogs.map((log) => (
                <div key={log.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="text-xs text-gray-500 mb-1">
                    {log.timestamp}
                  </div>
                  <div className="text-sm text-gray-900">{log.action}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
