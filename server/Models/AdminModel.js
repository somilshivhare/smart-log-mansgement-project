import mongoose from "mongoose";
const AdminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  designation: { type: String },
  phone: { type: String },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  role: {
    type: String,
    enum: ["admin", "super_admin"],
    default: "admin",
  },
});
export const Admin = mongoose.model("admin", AdminSchema);
// register alias with capitalized name so populate(refPath) works when value is 'Admin'
if (!mongoose.models.Admin) mongoose.model("Admin", AdminSchema);
