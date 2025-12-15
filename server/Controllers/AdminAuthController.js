import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import {Admin} from "../Models/AdminModel.js";
import cloudinary from "../Config/cloudinary.js"; 
import dotenv from 'dotenv';
dotenv.config();
export const postsignup = async (req, res) => {
  try {
    console.log(req.body);
    const {name, email,phone,address, password } = req.body;
    const check = await Admin.findOne({ email });
    if (check) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }
    const result=await new Promise((resolve,reject)=>{
      const stream=cloudinary.uploader.upload_stream({
        folder:'admin'
      },(error,result)=>{
        if (error){
          reject(error);
        }
        else{
          resolve(result);
        }
      })
      stream.end(req.file.buffer);
    })
    const image=result.secure_url;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new Admin({name, email,phone,address, password:hashedPassword,image});
    await newUser.save();
    return res
      .status(201)
      .json({ success: true, message: "Your account has been created successfully"});
  } catch (error) {
    console.log(error.message);
    res.status(404).json({ success: false, message: "Network error. Please try again." });
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
      image:check.image,
      phone:check.phone,
      address:check.address,
      name: check.name,
      email: check.email,
      orders:check.orders,
      products:check.products,
      revenue:check.revenue,
      role:'admin'
    };
    console.log(payload);
    const token = jwt.sign(payload, "jwt-secret");
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });
    return res
      .status(202)
      .json({ success: true, message: "You are logged in successfully"});
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
