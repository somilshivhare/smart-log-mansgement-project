import mongoose from "mongoose";
const citizenSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  isActive: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  lastLoginAt: {
    type: Date,
    default: null,
  },
  lastLogoutAt: {
    type: Date,
    default: null,
  },
  phoneNumber: { type: String, required: false },
  address: { type: String, required: false },
  dateOfBirth: { type: Date, required: false },
  govtIds: [{ type: String, required: false }],
});
export const Citizen = mongoose.model("citizens", citizenSchema);
// register alias with capitalized name so populate(refPath) works when value is 'Citizen'
if (!mongoose.models.Citizen) mongoose.model("Citizen", citizenSchema);
