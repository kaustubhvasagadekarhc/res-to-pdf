import { Router } from "express";
import { upload } from "../middleware/multer.js";
import { fileUploadService } from "../services/fileUpload.service.js";
import { parseService } from "../services/parse.service.js";

const router = Router();

/**
 * POST /upload
 * 1. Upload file to Appwrite
 * 2. Get public URL
 * 3. Parse resume using Gemini
 */
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "file is required" });

    // 1) Upload File
    const uploaded = await fileUploadService.upload(req.file);

    // 2) Parse Resume from file URL
    const parsed = await parseService.parseResume(uploaded.fileUrl,
       uploaded.fileId
      );

    return res.json({
      uploaded,
      parsed,
    });

  } catch (err: unknown) {
    console.error("Upload+Parse Error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

export default router;
