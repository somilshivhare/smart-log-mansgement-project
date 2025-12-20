import mongoose from "mongoose";
export const connectDB = async () => {
  try {
    // Do not pass legacy `useNewUrlParser` / `useUnifiedTopology` options —
    // newer mongodb driver rejects them. Let mongoose use its defaults.
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connected");
  } catch (error) {
    console.error("Database connection failed:", error?.message || error);
    // Fail-fast: surface the error so process manager (Render) restarts or fails the deployment
    throw error;
  }
};