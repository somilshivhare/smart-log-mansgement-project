import mongoose from "mongoose";

const logsSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  level: {
    type: String,
    enum: ["INFO", "WARN", "ERROR", "DEBUG"],
    default: "INFO",
  },
  module: { type: String, required: true },
  message: { type: String, required: true },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "citizens",
    required: false,
  },
  username: { type: String, required: false },
  metadata: { type: mongoose.Schema.Types.Mixed, required: false },
});

// simple helper for creating logs
logsSchema.statics.log = async function ({
  level = "INFO",
  module,
  message,
  userId,
  username,
  metadata,
} = {}) {
  try {
    return await this.create({
      level,
      module,
      message,
      userId,
      username,
      metadata,
    });
  } catch (err) {
    // don't throw from logging helper - just console.warn
    console.warn("Failed to write log entry", err?.message || err);
    return null;
  }
};

export const LogsAndAudit = mongoose.model("LogsAndAudit", logsSchema);
