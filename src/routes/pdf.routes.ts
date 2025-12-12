import { Router } from 'express';

import { pdfGeneratorService } from '../services/pdfGenerator.service';

const router = Router();

/**
 * @swagger
 * /generate/pdf:
 *   post:
 *     summary: Generate PDF from resume data
 *     tags: [PDF]
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
router.post('/', (req, res) => {
  try {
    const resumeData = req.body;

    if (!resumeData) {
      return res.status(400).json({ error: 'Resume data is required' });
    }

    pdfGeneratorService.generatePDF(resumeData, res);
  } catch (err: unknown) {
    console.error('PDF Generation Error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
});

export default router;
