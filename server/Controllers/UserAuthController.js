import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Citizen } from "../Models/CitizenModel.js";
import dotenv from "dotenv";
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";
import { ActivityHistory } from "../Models/ActivityHistory.js";

dotenv.config();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
export const postsignup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const check = await Citizen.findOne({ email });
    if (check) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new Citizen({ name, email, password: hashedPassword });
    await newUser.save();
    // Log signup
    try {
      const { LogsAndAudit } = await import("../Models/LogsAndAudit.js");
      await LogsAndAudit.log({
        level: "INFO",
        module: "Authentication",
        message: `New user signup - ${email}`,
        userId: newUser._id,
        username: email,
      });
    } catch (err) {
      console.warn("Failed to write signup log", err?.message || err);
    }
    return res
      .status(201)
      .json({ success: true, message: "Your account created successfully" });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: "Network Error Please try again later",
    });
  }
};

export const postlogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const check = await Citizen.findOne({ email });
    if (!check) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    if (!(await bcrypt.compare(password, check.password))) {
      return res
        .status(401)
        .json({ success: false, message: "Wrong password" });
    }
    check.lastLoginAt = new Date();
    await check.save();

    // create session id
    const sessionId = crypto.randomUUID();

    // Log login (LogsAndAudit) and ActivityHistory
    try {
      const { LogsAndAudit } = await import("../Models/LogsAndAudit.js");
      await LogsAndAudit.log({
        level: "INFO",
        module: "Authentication",
        message: `User login successful - ${email}`,
        userId: check._id,
        username: email,
      });
    } catch (err) {
      console.warn("Failed to write login log", err?.message || err);
    }

    // write activity history (include optional location from client)
    try {
      const ip =
        req.headers["x-forwarded-for"]?.split(",")?.[0]?.trim() || req.ip;
      const userAgent = req.headers["user-agent"] || "";
      const location = req.body?.location || undefined;
      await ActivityHistory.create({
        userId: check._id,
        action: "login",
        sessionId,
        ip,
        userAgent,
        location,
        details: `Login from IP ${ip}`,
      });
    } catch (err) {
      console.warn(
        "Failed to write activity history for login",
        err?.message || err
      );
    }

    const payload = {
      _id: check._id,
      name: check.name,
      email: check.email,
      role: "citizen",
      sessionId,
      ...(check.phoneNumber && { phoneNumber: check.phoneNumber }),
      ...(check.address && { address: check.address }),
      ...(check.dateOfBirth && { dateOfBirth: check.dateOfBirth }),
      ...(check.govtIds &&
        check.govtIds.length > 0 && { govtIds: check.govtIds }),
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET);
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });
    return res
      .status(202)
      .json({ success: true, message: "You are logged in successfully" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ success: false, message: "Something went wrong" });
  }
};

export const postlogout = async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded && decoded.email) {
          const user = await Citizen.findOne({ email: decoded.email });
          if (user) {
            user.lastLogoutAt = new Date();
            await user.save();
          }
        }
      } catch (jwtError) {
        // Token is invalid/expired, but we still want to clear the cookie
        console.log("JWT verification failed during logout:", jwtError.message);
      }
    }
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });
    // Log logout to LogsAndAudit and ActivityHistory (use sessionId from token if available)
    try {
      const decoded = jwt.verify(
        req.cookies?.token || "",
        process.env.JWT_SECRET
      );
      if (decoded && decoded.email) {
        const { LogsAndAudit } = await import("../Models/LogsAndAudit.js");
        await LogsAndAudit.log({
          level: "INFO",
          module: "Authentication",
          message: `User logout - ${decoded.email}`,
          userId: decoded._id,
          username: decoded.email,
        });

        try {
          const ip =
            req.headers["x-forwarded-for"]?.split(",")?.[0]?.trim() || req.ip;
          const userAgent = req.headers["user-agent"] || "";
          await ActivityHistory.create({
            userId: decoded._id,
            action: "logout",
            sessionId: decoded.sessionId || undefined,
            ip,
            userAgent,
            details: `Logout from IP ${ip}`,
          });
        } catch (err) {
          console.warn(
            "Failed to write activity history for logout",
            err?.message || err
          );
        }
      }
    } catch (err) {
      // ignore
    }

    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    // Still clear the cookie even if there's an error
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });
    res.status(200).json({ success: true, message: "Logged out successfully" });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { code, redirectUri } = req.body;

    if (!code || !redirectUri) {
      return res.status(400).json({
        success: false,
        message: "Missing authorization code or redirect URI",
      });
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => null);
      console.error("Error exchanging code for tokens:", errorData);
      return res.status(401).json({
        success: false,
        message: "Failed to exchange authorization code with Google",
      });
    }

    const tokenData = await tokenResponse.json();
    const idToken = tokenData.id_token;

    if (!idToken) {
      return res.status(500).json({
        success: false,
        message: "No ID token returned from Google",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid Google token" });
    }

    const { email, name, picture, sub } = payload;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Google account has no email" });
    }

    let user = await Citizen.findOne({ email });
    if (!user) {
      user = new Citizen({
        name: name || "New Citizen",
        email,
        password: Math.random().toString(36).slice(-12),
      });
      await user.save();
    }

    // create a sessionId for activity tracking
    const sessionId = crypto.randomUUID();
    const sessionPayload = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: "citizen",
      picture,
      googleId: sub,
      sessionId,
    };

    const token = jwt.sign(sessionPayload, process.env.JWT_SECRET);

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });

    // Log login activity
    try {
      const ip =
        req.headers["x-forwarded-for"]?.split(",")?.[0]?.trim() || req.ip;
      const userAgent = req.headers["user-agent"] || "";
      await ActivityHistory.create({
        userId: user._id,
        action: "login",
        sessionId,
        ip,
        userAgent,
        details: `Login via Google from IP ${ip}`,
      });
    } catch (err) {
      console.warn(
        "Failed to write activity history for google login",
        err?.message || err
      );
    }

    return res.status(200).json({
      success: true,
      message: "Logged in with Google",
      user: {
        name: user.name,
        email: user.email,
        picture,
      },
    });
  } catch (error) {
    console.error("Google login error:", error);
    return res
      .status(401)
      .json({ success: false, message: "Google login failed" });
  }
};
