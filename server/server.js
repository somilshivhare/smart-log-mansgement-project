import express from "express";
import http from "http";
import { Server as IoServer } from "socket.io";
import { connectDB } from "./Config/db.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import CitizenRouter from "./Routes/CitizenAuth.js";
import AdminRouter from "./Routes/AdminAuth.js";
import AdminHomeRouter from "./Routes/AdminRouter.js";
import CitizenHomeRouter from "./Routes/CitizenRouter.js";
import DocumentRouter from "./Routes/DocumentRouter.js";
import {
  adminMiddleware,
  authMiddleware,
} from "./Middlewares/AuthMiddleware.js";
dotenv.config();

// Basic required env validation to fail-fast with clear errors
const requiredEnv = ["MONGO_URI", "JWT_SECRET"];
const missing = requiredEnv.filter((k) => !process.env[k]);
if (missing.length) {
  console.error("Missing required environment variables:", missing.join(", "));
  process.exit(1);
}

// In production, require OAuth and frontend settings as well
if (process.env.NODE_ENV === "production") {
  const prodRequired = ["FRONTEND_URL", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"];
  const prodMissing = prodRequired.filter((k) => !process.env[k]);
  if (prodMissing.length) {
    console.error(
      "Missing required production environment variables:",
      prodMissing.join(", ")
    );
    process.exit(1);
  }
}

// Normalize FRONTEND_URL (strip trailing slash). In production, FRONTEND_URL must be set.
const FRONTEND_URL = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/+$/, "") : undefined;
if (process.env.NODE_ENV === "production" && !FRONTEND_URL) {
  console.error("Missing required environment variable: FRONTEND_URL (must be set in production to your frontend origin)");
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: FRONTEND_URL || (process.env.NODE_ENV !== "production" ? true : false),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.urlencoded({ extended: true }));
await connectDB();
// setup socket.io
const io = new IoServer(server, {
  cors: {
    origin: FRONTEND_URL || (process.env.NODE_ENV !== "production" ? true : false),
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  socket.on("disconnect", () => console.log("Socket disconnected:", socket.id));
});
// log any engine-level connection errors to help debug polling resets
io.engine.on("connection_error", (err) => {
  console.warn("Socket engine connection_error:", err?.message || err);
});
app.set("io", io);

// Health check endpoint (for monitoring services like UptimeRobot)
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use("/api/admin/auth", AdminRouter);
app.use("/api/citizen/auth", CitizenRouter);
app.use("/api/admin", adminMiddleware, AdminHomeRouter);
app.use("/api/user", authMiddleware, CitizenHomeRouter);
app.use("/api/document", DocumentRouter);

// Export app, server and io for testing or other programmatic usage
export { app, server, io };

// Only start listening when not running in test environment
if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 4000;
  server.listen(PORT, () => {
    console.log("Server is running on port", PORT);
  });
}
