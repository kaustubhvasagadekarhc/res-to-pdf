import express from "express";
import cors from "cors";
import uploadRoutes from "./routes/upload.routes";
import pdfRoutes from "./routes/pdf.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/upload", uploadRoutes);
app.use("/generate/pdf", pdfRoutes);

app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), memory: process.memoryUsage(), pid: process.pid });
});

export default app;
