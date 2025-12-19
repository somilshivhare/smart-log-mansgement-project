import mongoose from "mongoose";

const ActivityHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Citizen",
      required: true,
    },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document" },
    action: { type: String, required: true }, // e.g. 'upload', 'approve', 'reject', 'verify', 'login', 'logout'
    details: { type: String }, // Optional: extra info (file name, reason, etc.)
    // session-specific fields
    sessionId: { type: String },
    ip: { type: String },
    userAgent: { type: String },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "performedByModel",
    },
    performedByModel: {
      type: String,
      enum: ["Citizen", "Admin"],
      default: "Citizen",
    },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const ActivityHistory = mongoose.model(
  "ActivityHistory",
  ActivityHistorySchema
);
