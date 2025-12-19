import { Document } from "../Models/Document.js";
import { ActivityHistory } from "../Models/ActivityHistory.js";
import { Admin } from "../Models/AdminModel.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export const getAdmin = (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Admin Home Accessed Successfully",
      user: req.user,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

import bcrypt from "bcrypt";
import fs from "fs";
const pkg = JSON.parse(
  fs.readFileSync(new URL("../../package.json", import.meta.url), "utf8")
);

// GET /api/admin/profile
export const getAdminProfile = async (req, res) => {
  try {
    const adminId = req.user?._id;
    if (!adminId)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    const admin = await Admin.findById(adminId).select("-password");
    if (!admin)
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    return res.status(200).json({ success: true, admin });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch profile" });
  }
};

// PUT /api/admin/profile
export const updateAdminProfile = async (req, res) => {
  try {
    const adminId = req.user?._id;
    if (!adminId)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    const { name, email, phone } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (email !== undefined) update.email = email;
    if (phone !== undefined) update.phone = phone;
    // enforce designation on server
    update.designation = "Admin";
    const admin = await Admin.findByIdAndUpdate(
      adminId,
      { $set: update },
      { new: true }
    ).select("-password");
    if (!admin)
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    return res
      .status(200)
      .json({ success: true, admin, message: "Profile updated" });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update profile" });
  }
};

// PUT /api/admin/profile/password
export const changeAdminPassword = async (req, res) => {
  try {
    const adminId = req.user?._id;
    if (!adminId)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    const { current, newPassword } = req.body;
    if (!current || !newPassword)
      return res
        .status(400)
        .json({ success: false, message: "Current and new password required" });
    const admin = await Admin.findById(adminId);
    if (!admin)
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    const ok = await bcrypt.compare(current, admin.password);
    if (!ok)
      return res
        .status(400)
        .json({ success: false, message: "Current password incorrect" });
    const hashed = await bcrypt.hash(newPassword, 10);
    admin.password = hashed;
    await admin.save();
    return res.status(200).json({ success: true, message: "Password changed" });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to change password" });
  }
};

// GET /api/admin/config
export const getAdminConfig = async (req, res) => {
  try {
    // DB connection status
    const ready = mongoose.connection.readyState; // 1 = connected
    const dbStatus = ready === 1 ? "connected" : "disconnected";

    // storage usage
    let storage = null;
    try {
      const agg = await Document.aggregate([
        { $group: { _id: null, totalBytes: { $sum: "$fileSize" } } },
      ]);
      const totalBytes = (agg && agg[0] && agg[0].totalBytes) || 0;
      const usedMB = +(totalBytes / (1024 * 1024)).toFixed(2);
      const quotaMB = +(process.env.STORAGE_QUOTA_MB
        ? Number(process.env.STORAGE_QUOTA_MB)
        : 10240);
      const percent = quotaMB > 0 ? Math.round((usedMB / quotaMB) * 100) : null;
      storage = { usedMB, quotaMB, percent };
    } catch (err) {
      storage = {
        usedMB: 0,
        quotaMB: process.env.STORAGE_QUOTA_MB || 10240,
        percent: 0,
      };
    }

    return res.status(200).json({
      success: true,
      config: {
        platformVersion: pkg.version || "v2.4.1",
        lastSystemUpdate: process.env.LAST_SYSTEM_UPDATE || "2024-12-10",
        aiModelVersion: process.env.AI_MODEL_VERSION || "DocVerify-ML v3.2",
        dbStatus,
        storage,
      },
    });
  } catch (err) {
    console.error("getAdminConfig error:", err?.message || err);
    const payload = { success: false, message: "Failed to fetch config" };
    if (process.env.NODE_ENV !== "production")
      payload.error = err?.message || String(err);
    return res.status(500).json(payload);
  }
};

// Dashboard metrics for admin
export const getDashboardMetrics = async (req, res) => {
  try {
    // pending documents
    const pending = await Document.countDocuments({ status: "pending" });

    // today's window
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const approvedToday = await ActivityHistory.countDocuments({
      action: "approve",
      timestamp: { $gte: startOfDay, $lt: endOfDay },
    });
    const rejectedToday = await ActivityHistory.countDocuments({
      action: "reject",
      timestamp: { $gte: startOfDay, $lt: endOfDay },
    });

    const recent = await ActivityHistory.find({})
      .sort({ timestamp: -1 })
      .limit(5)
      .populate("userId", "name email")
      .lean();

    const recentMapped = recent.map((r) => ({
      _id: r._id,
      action: r.action,
      details: r.details || "",
      user: r.userId
        ? r.userId.name || r.userId.email || String(r.userId._id)
        : "System",
      timestamp: r.timestamp,
      status:
        r.action === "approve"
          ? "approved"
          : r.action === "reject"
          ? "rejected"
          : r.action,
    }));

    // System health checks
    const health = {};
    const start = Date.now();
    try {
      await Document.findOne().select("_id").lean().exec();
      health.apiResponseMs = Date.now() - start;
    } catch (err) {
      health.apiResponseMs = null;
    }

    const ready = mongoose.connection.readyState; // 1 = connected
    health.dbStatus = ready === 1 ? "connected" : "disconnected";

    health.aiService = process.env.GEMINI_API_KEY
      ? "configured"
      : "not_configured";

    try {
      const agg = await Document.aggregate([
        { $group: { _id: null, totalBytes: { $sum: "$fileSize" } } },
      ]);
      const totalBytes = (agg && agg[0] && agg[0].totalBytes) || 0;
      const usedMB = +(totalBytes / (1024 * 1024)).toFixed(2);
      const quotaMB = +(process.env.STORAGE_QUOTA_MB
        ? Number(process.env.STORAGE_QUOTA_MB)
        : 10240);
      const percent = quotaMB > 0 ? Math.round((usedMB / quotaMB) * 100) : null;
      health.storage = { usedMB, quotaMB, percent };
    } catch (err) {
      health.storage = {
        usedMB: 0,
        quotaMB: process.env.STORAGE_QUOTA_MB || 10240,
        percent: 0,
      };
    }

    return res.status(200).json({
      success: true,
      metrics: {
        pending,
        approvedToday,
        rejectedToday,
        recent: recentMapped,
        health,
      },
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch metrics" });
  }
};
