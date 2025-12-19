import { ActivityHistory } from "../Models/ActivityHistory.js";
import { Citizen } from "../Models/CitizenModel.js";
import { Document } from "../Models/Document.js";

// GET /api/activity/user-history (self)
export const getUserActivityHistory = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const activities = await ActivityHistory.find({ userId })
      .sort({ timestamp: -1 })
      .populate("documentId", "name type")
      .populate("performedBy", "name email")
      .lean();
    return res.status(200).json({ success: true, activities });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// GET /api/admin/users/:id/history (admin)
export const getActivityHistoryForUser = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId)
      return res
        .status(400)
        .json({ success: false, message: "User id required" });

    const activities = await ActivityHistory.find({ userId })
      .sort({ timestamp: -1 })
      .populate("documentId", "name type")
      .populate("performedBy", "name email")
      .lean();

    return res.status(200).json({ success: true, activities });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// GET /api/user/sessions
export const getUserSessions = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const logs = await ActivityHistory.find({
      userId,
      action: { $in: ["login", "logout"] },
    })
      .sort({ timestamp: 1 })
      .lean();

    const map = new Map();
    for (const l of logs) {
      const sid = l.sessionId || `s_${l._id}`;
      if (!map.has(sid)) {
        map.set(sid, {
          sessionId: sid,
          ip: l.ip || null,
          userAgent: l.userAgent || null,
          location: l.location || null,
          loginAt: null,
          logoutAt: null,
        });
      }
      const s = map.get(sid);
      if (l.action === "login") {
        if (!s.loginAt || new Date(l.timestamp) < new Date(s.loginAt))
          s.loginAt = l.timestamp;
        // preserve ip/userAgent/location from first login if available
        if (!s.ip && l.ip) s.ip = l.ip;
        if (!s.userAgent && l.userAgent) s.userAgent = l.userAgent;
        if (!s.location && l.location) s.location = l.location;
      }
      if (l.action === "logout") {
        // use logout timestamp as latest logout
        if (!s.logoutAt || new Date(l.timestamp) > new Date(s.logoutAt))
          s.logoutAt = l.timestamp;
      }
    }

    const sessions = Array.from(map.values()).map((s) => ({
      ...s,
      isActive: !s.logoutAt,
    }));

    // sort by loginAt desc
    sessions.sort(
      (a, b) => new Date(b.loginAt || 0) - new Date(a.loginAt || 0)
    );

    return res.status(200).json({ success: true, sessions });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// POST /api/user/sessions/:sessionId/logout
export const logoutSession = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    const { sessionId } = req.params;
    if (!sessionId)
      return res
        .status(400)
        .json({ success: false, message: "sessionId required" });

    const ip =
      req.headers["x-forwarded-for"]?.split(",")?.[0]?.trim() || req.ip;
    const userAgent = req.headers["user-agent"] || "";

    const location = req.body?.location;
    await ActivityHistory.create({
      userId,
      action: "logout",
      sessionId,
      ip,
      userAgent,
      location,
      details: `Logged out session ${sessionId}`,
    });

    return res
      .status(200)
      .json({ success: true, message: "Session logged out" });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};
