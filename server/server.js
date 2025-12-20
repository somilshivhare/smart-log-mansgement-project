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
const app = express();
const server = http.createServer(app);
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
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
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
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
app.use("/api/admin/auth", AdminRouter);
app.use("/api/citizen/auth", CitizenRouter);
app.use("/api/admin", adminMiddleware, AdminHomeRouter);
app.use("/api/user", authMiddleware, CitizenHomeRouter);
app.use("/api/document", DocumentRouter);

// Export app, server and io for testing or other programmatic usage
export { app, server, io };

// Only start listening when not running in test environment
if (process.env.NODE_ENV !== "test") {
  server.listen(process.env.PORT, () => {
    console.log("Server is running on port", process.env.PORT);
  });
}
