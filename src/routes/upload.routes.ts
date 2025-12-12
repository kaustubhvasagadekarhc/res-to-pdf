import { Router } from "express";
import { upload } from "../middleware/multer";
import { resumeService } from "../services/resume.service";

const router = Router();

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload and parse a resume PDF
 *     tags: [Resume]
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
 *     responses:
 *       200:
 *         description: Resume parsed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uploaded:
 *                   type: object
 *                 parsed:
 *                   type: object
 *       400:
 *         description: File is missing
 *       500:
 *         description: Internal server error
 */
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "file is required" });

    const result = await resumeService.processResumeUpload(req.file);

    return res.json(result);

  } catch (err: unknown) {
    console.error("Upload+Parse Error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

export default router;
