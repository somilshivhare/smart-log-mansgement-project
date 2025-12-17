import express from "express";
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
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.urlencoded({ extended: true }));
await connectDB();
app.use("/api/admin/auth", AdminRouter);
app.use("/api/citizen/auth", CitizenRouter);
app.use("/api/admin", adminMiddleware, AdminHomeRouter);
app.use("/api/user", authMiddleware, CitizenHomeRouter);
app.use("/api/document", DocumentRouter);
app.listen(process.env.PORT, () => {
  console.log("Server is running on port", process.env.PORT);
});
