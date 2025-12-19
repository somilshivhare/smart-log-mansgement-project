/**
 * Simple script to seed demo logs into LogsAndAudit collection.
 * Usage: node server/Utils/seedLogs.js (from project root)
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { LogsAndAudit } from "../Models/LogsAndAudit.js";

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("DB connected, seeding logs...");
    const sample = [
      {
        timestamp: new Date("2024-12-15T14:23:45"),
        level: "INFO",
        module: "Authentication",
        message: "User login successful - admin@gov.in",
        username: "admin@gov.in",
      },
      {
        timestamp: new Date("2024-12-15T14:22:12"),
        level: "INFO",
        module: "Document Verification",
        message: "Document DOC-2024-001 approved by admin user",
      },
      {
        timestamp: new Date("2024-12-15T14:20:33"),
        level: "WARN",
        module: "AI Service",
        message: "AI confidence score below threshold (78%) for DOC-2024-004",
      },
      {
        timestamp: new Date("2024-12-15T14:18:56"),
        level: "ERROR",
        module: "Database",
        message: "Connection timeout - retry attempt 1 of 3",
      },
      {
        timestamp: new Date("2024-12-15T14:15:22"),
        level: "INFO",
        module: "Document Upload",
        message: "New document uploaded - DOC-2024-005",
      },
    ];
    await LogsAndAudit.insertMany(sample);
    console.log("Seeded sample logs.");
    process.exit(0);
  } catch (err) {
    console.error("Seeding logs failed", err);
    process.exit(1);
  }
})();
