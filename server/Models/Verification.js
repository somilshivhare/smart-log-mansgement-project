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
  Feedback: { type: String },
  verifiedAt: { type: Date, default: Date.now },
});
export const Verification = mongoose.model("verifications", VerificationSchema);
