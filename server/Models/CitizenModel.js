import mongoose from "mongoose";
const citizenSchema=new mongoose.Schema({
  name:{type:String,required:true},
  email:{type:String,required:true},
  password:{type:String,required:true},
  createdAt:{type:Date,default:Date.now},
  isActive: {
      type: Boolean,
      default: true
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    lastLoginAt: {
      type: Date,
      default: null
    },
    lastLogoutAt: {
      type: Date,
      default: null
    },
})
export const Citizen=mongoose.model("citizens",citizenSchema);