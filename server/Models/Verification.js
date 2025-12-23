import mongoose from "mongoose";
const VerificationSchema = mongoose.Schema({
  citizenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "citizens",
    required: true,
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "documents",
    required: true,
  },
  status: { type: String, default: "pending" },
  confiedenceScore: { type: Number, required: true },
  AnalysisData: { type: String, required: true },
  // Parsed/processed extraction returned by LLM — stored as Mixed so it can be an object or string
  ExtractedData: { type: mongoose.Schema.Types.Mixed },
  // Source of extraction: 'llm' | 'heuristic' | null
  extractionSource: { type: String },
  Feedback: { type: String },
  verifiedAt: { type: Date, default: Date.now },
});
export const Verification = mongoose.model("verifications", VerificationSchema);
