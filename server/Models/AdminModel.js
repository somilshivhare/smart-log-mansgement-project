import mongoose from "mongoose";
const AdminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: Number, required: true },
  address: { type: String, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  role: {
    type: String,
    enum: ["ADMIN", "SUPER_ADMIN"],
    default: "ADMIN",
  },
});
export const Admin = mongoose.model("admin", AdminSchema);
