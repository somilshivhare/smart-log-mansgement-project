import mongoose from "mongoose";
export const connectDB=async ()=>{
  try{
      await mongoose.connect(process.env.MONGO_URI).then (()=>{
        console.log("Database connected");
      })
  } catch(error){
    console.log("Error occured",error.message);
  }
}