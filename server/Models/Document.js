import mongoose from "mongoose";
const DocumentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  fileSize: { type: Number, required: true },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "citizens",
    required: true,
  },
  type: { type: String, required: true },
  status: { type: String, default: "pending" },
  uploadedAt: { type: Date, default: Date.now },
  // Admin-provided remarks (do not overwrite AI analysis)
  adminRemarks: { type: String },
  adminBy: { type: mongoose.Schema.Types.ObjectId, ref: "admins" },
  adminAt: { type: Date },
});
export const Document = mongoose.model("documents", DocumentSchema);
// register alias with capitalized name so populate(ref) works when other code uses 'Document'
if (!mongoose.models.Document) mongoose.model("Document", DocumentSchema);
