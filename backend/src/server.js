import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import taskRoutes from "./routes/task.routes.js";
import jwt from "jsonwebtoken";

const app = express();
const server = http.createServer(app);

const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

const io = new Server(server, {
  cors: {
    origin: clientUrl,
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.set("io", io);

app.use(
  cors({
    origin: clientUrl
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Task Management API is running." });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

io.on("connection", (socket) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      socket.disconnect();
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.join(`user:${decoded.userId}`);
  } catch {
    socket.disconnect();
  }
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

const PORT = process.env.PORT || 5000;

await connectDB();

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
