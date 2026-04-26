import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import http from "http";

import { initSocket } from "./socket/socket.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// ---------------- MIDDLEWARE ----------------

// 🔥 FIXED CORS (ONLY CHANGE)
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ---------------- ROUTES ----------------
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

// ---------------- STATIC FILES ----------------
app.use("/uploads", express.static("uploads"));

// ---------------- HEALTH CHECK ----------------
app.get("/", (req, res) => {
  res.send("Blink API is running...");
});

// ---------------- SOCKET ----------------
initSocket(server);

// ---------------- DATABASE ----------------
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("❌ MongoDB Error:", err);
  });
