import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Citizen } from "../Models/CitizenModel.js";
import dotenv from "dotenv";
import { OAuth2Client } from "google-auth-library";

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
    const payload = {
      _id: check._id,
      name: check.name,
      email: check.email,
      role: "citizen",
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
      const decoded = jwt.verify(token, "jwt-secret");
      if (decoded && decoded.email) {
        const user = await Citizen.findOne({ email: decoded.email });
        if (user) {
          user.lastLogoutAt = new Date();
          await user.save();
        }
      }
    }
      res.clearCookie("token", {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: "Logout failed" });
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

    const sessionPayload = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: "citizen",
      picture,
      googleId: sub,
    };

    const token = jwt.sign(sessionPayload, process.env.JWT_SECRET);

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });

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
