import express from "express";
import cors from "cors";
import uploadRoutes from "./routes/upload.routes";
import pdfRoutes from "./routes/pdf.routes";
import authRoutes from "./routes/auth.routes";
import { authenticate } from "./middleware/auth.middleware";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/upload", authenticate, uploadRoutes);
app.use("/generate/pdf", authenticate, pdfRoutes);

app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), memory: process.memoryUsage(), pid: process.pid });
});

export default app;
