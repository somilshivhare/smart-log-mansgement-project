import mongoose from "mongoose";
const DocumentSchema = new mongoose.Schema({
  name: {type: String, required: true},
  url: {type: String, required: true},
  fileSize: {type: Number, required: true},
  uploadedBy: {type: mongoose.Schema.Types.ObjectId, ref: "citizens", required: true},
  type: {type:String, required: true},
  status: {type:String,default: "pending"},
  uploadedAt: {type: Date, default: Date.now}
});
export const Document = mongoose.model("documents", DocumentSchema);
