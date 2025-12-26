import { Router } from "express";
import { upload } from "../middleware/multer";
import { activityLogger } from "../middleware/activityLogger.middleware";
import { uploadResume } from "../controllers/upload.controller";

const router = Router();

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload and parse a resume PDF
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
router.post("/", upload.single("file"), activityLogger, uploadResume);

export default router;
