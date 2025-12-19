import { LogsAndAudit } from "../Models/LogsAndAudit.js";

export const getLogs = async (req, res) => {
  try {
    const {
      level,
      module: moduleName,
      userId,
      from,
      to,
      page = 1,
      limit = 50,
    } = req.query;
    const q = {};
    if (level) q.level = level.toUpperCase();
    if (moduleName) q.module = moduleName;
    if (userId) q.userId = userId;
    if (from || to) q.timestamp = {};
    if (from) q.timestamp.$gte = new Date(from);
    if (to) q.timestamp.$lte = new Date(to);

    const p = Math.max(1, parseInt(page) || 1);
    const lim = Math.max(1, Math.min(200, parseInt(limit) || 50));
    const skip = (p - 1) * lim;

    const [items, total] = await Promise.all([
      LogsAndAudit.find(q).sort({ timestamp: -1 }).skip(skip).limit(lim).lean(),
      LogsAndAudit.countDocuments(q),
    ]);

    // Format timestamp to readable string
    const formatted = items.map((it) => ({
      ...it,
      timestamp: it.timestamp
        ? new Date(it.timestamp).toISOString().replace("T", " ").slice(0, 19)
        : null,
    }));

    return res.status(200).json({ success: true, logs: formatted, total });
  } catch (err) {
    console.error("Failed to fetch logs", err.message || err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch logs" });
  }
};

export const createLog = async (req, res) => {
  try {
    const {
      level = "INFO",
      module,
      message,
      userId,
      username,
      metadata,
    } = req.body;
    if (!module || !message) {
      return res
        .status(400)
        .json({ success: false, message: "module and message are required" });
    }
    const entry = await LogsAndAudit.log({
      level,
      module,
      message,
      userId,
      username,
      metadata,
    });
    return res.status(201).json({ success: true, log: entry });
  } catch (err) {
    console.error("Failed to create log", err.message || err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create log" });
  }
};
