import { updateSessionActivity } from "../utils/sessionUtils.js";

// Lightweight middleware to update session activity
// This is separate from auth middleware and doesn't modify auth flow
export const updateSessionActivityMiddleware = async (req, res, next) => {
  try {
    const sessionId = req.cookies?.sessionId;
    if (sessionId) {
      // Update activity asynchronously without blocking the request
      updateSessionActivity(sessionId).catch((err) => {
        // Silently fail - session tracking shouldn't break the app
        console.error("Failed to update session activity:", err);
      });
    }
  } catch (error) {
    // Silently fail - session tracking shouldn't break the app
  }
  next();
};

