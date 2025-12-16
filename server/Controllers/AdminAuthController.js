import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Admin } from "../Models/AdminModel.js";
import dotenv from "dotenv";
dotenv.config();
export const postsignup = async (req, res) => {
  try {
    console.log(req.body);
    const { name, email, password, role } = req.body;
    const check = await Admin.findOne({ email });
    if (check) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserData = {
      name,
      email,
      password: hashedPassword,
    };
    if (role) newUserData.role = role;
    const newUser = new Admin(newUserData);
    await newUser.save();
    return res
      .status(201)
      .json({
        success: true,
        message: "Your account has been created successfully",
      });
  } catch (error) {
    console.log(error.message);
    res
      .status(404)
      .json({ success: false, message: "Network error. Please try again." });
  }
};
export const postlogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const check = await Admin.findOne({ email });
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
    const payload = {
      _id: check._id,
      name: check.name,
      email: check.email,
      phone: check.phone? check.phone : undefined,
      address: check.address? check.address : undefined,
      createdAt: check.createdAt,
      ...(check.role && { role: check.role }),
    };
    console.log(payload);
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
export const postlogout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
  });
  res.status(200).json({ success: true, message: "Logged out successfully" });
};
