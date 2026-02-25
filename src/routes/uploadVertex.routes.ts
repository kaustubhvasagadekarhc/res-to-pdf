import { Router } from "express";
import { upload } from "../middleware/multer";
import { resumeService } from "../services/resume.service";
import { activityLogger } from "../middleware/activityLogger.middleware";

const router = Router();

/**
 * @swagger
 * /upload/vertex:
 *   post:
 *     summary: Upload and parse resume using Vertex AI with parse type selection
 *     tags: [Resume]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               parseType:
 *                 type: string
 *                 enum: [quick, inferred, generative]
 *                 default: quick
 *     responses:
 *       200:
 *         description: Resume parsed successfully
 *       400:
 *         description: File is missing or invalid parseType
 *       500:
 *         description: Internal server error
 */
router.post("/", activityLogger, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "file is required" });

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "User not authenticated" });

    const result = await resumeService.processResumeUpload(req.file, userId);

    return res.json(result);

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

export default router;