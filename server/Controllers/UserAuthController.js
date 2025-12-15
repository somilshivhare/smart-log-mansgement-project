import { User } from "../Models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
export const postsignup = async (req, res) => {
  try {
    console.log(req.body);
    const { name, email, password } = req.body;
    const check = await User.findOne({ email });
    if (check) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    return res
      .status(201)
      .json({ success: true, message: "Your account created successfully" });
  } catch (error) {
    res.status(404).json({ success: false, message: "Network Error Please try again later" });
  }
};

export const postlogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const check = await User.findOne({ email });
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
      role:'user'
    };
    const token = jwt.sign(payload, "jwt-secret");
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
  res.status(200).json({ success:true,message: "Logged out successfully" });
};
