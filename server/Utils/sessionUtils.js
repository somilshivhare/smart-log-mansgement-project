import crypto from "crypto";
import mongoose from "mongoose";
import { Session } from "../Models/SessionModel.js";

export const generateSessionId = () => {
  return crypto.randomBytes(32).toString("hex");
};

export const parseUserAgent = (userAgent) => {
  if (!userAgent) {
    return { device: "Unknown Device", browser: "Unknown Browser" };
  }

  let device = "Desktop";
  let browser = "Unknown Browser";

  // Detect device
  if (/mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
    device = "Mobile";
  } else if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    device = "Tablet";
  }

  // Detect browser
  if (/chrome/i.test(userAgent) && !/edg|opr/i.test(userAgent)) {
    browser = "Chrome";
  } else if (/firefox/i.test(userAgent)) {
    browser = "Firefox";
  } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
    browser = "Safari";
  } else if (/edg/i.test(userAgent)) {
    browser = "Edge";
  } else if (/opr/i.test(userAgent)) {
    browser = "Opera";
  }

  return { device, browser };
};

export const getClientIp = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    "Unknown"
  );
};

export const createSession = async (userId, req) => {
  try {
    // Ensure userId is ObjectId
    const userIdObj = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : userId;

    const sessionId = generateSessionId();
    const userAgent = req.headers["user-agent"] || "Unknown";
    const { device, browser } = parseUserAgent(userAgent);
    const ipAddress = getClientIp(req);

    const session = new Session({
      userId: userIdObj,
      sessionId,
      device: `${device} - ${browser}`,
      browser,
      ipAddress,
      userAgent,
      loginTime: new Date(),
      lastActive: new Date(),
      isActive: true,
    });

    await session.save();
    console.log(`Session created successfully for user ${userIdObj}: ${sessionId}`);
    return sessionId;
  } catch (error) {
    console.error("Error creating session:", error);
    // Don't fail login if session creation fails, but log it
    return null;
  }
};

export const deactivateSession = async (sessionId) => {
  try {
    await Session.findOneAndUpdate(
      { sessionId, isActive: true },
      {
        isActive: false,
        logoutTime: new Date(),
      }
    );
  } catch (error) {
    console.error("Error deactivating session:", error);
  }
};

export const updateSessionActivity = async (sessionId) => {
  try {
    await Session.findOneAndUpdate(
      { sessionId, isActive: true },
      { lastActive: new Date() }
    );
  } catch (error) {
    console.error("Error updating session activity:", error);
  }
};

export const getActiveSessionsForUser = async (userId, currentSessionId = null) => {
  try {
    // Convert userId to ObjectId if it's a string
    const userIdObj = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : userId;

    const sessions = await Session.find({
      userId: userIdObj,
      isActive: true,
    })
      .sort({ lastActive: -1 })
      .lean();

    // Return empty array if no sessions found (not an error)
    if (!sessions || sessions.length === 0) {
      return [];
    }

    return sessions.map((session) => ({
      id: session._id.toString(),
      sessionId: session.sessionId,
      device: session.device,
      browser: session.browser,
      ipAddress: session.ipAddress,
      loginTime: session.loginTime,
      lastActive: session.lastActive,
      current: session.sessionId === currentSessionId,
    }));
  } catch (error) {
    console.error("Error getting active sessions:", error);
    // Return empty array on error instead of throwing
    return [];
  }
};

