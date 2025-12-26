import { Router } from 'express';
import { activityLogger } from '../middleware/activityLogger.middleware';

import { generatePdf } from '../controllers/pdf.controller';

const router = Router();

/**
 * @swagger
 * /generate/pdf:
 *   post:
 *     summary: Generate PDF from resume data
 *     tags: [PDF]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               personal:
 *                 type: object
 *                 properties:
 *                   name: { type: string }
 *                   email: { type: string }
 *               summary: { type: string }
 *               skills: { type: object }
 *               work_experience: { type: array }
 *               education: { type: array }
 *               projects: { type: array }
 *     responses:
 *       200:
 *         description: PDF file generated
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Resume data is required
 *       500:
 *         description: Server error
 */
router.post('/', activityLogger, generatePdf);

export default router;
