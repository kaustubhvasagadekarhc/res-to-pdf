import { Router } from 'express';
import { analyzeResume } from '../controllers/recommendation.controller';
import { authenticate } from '../middleware/auth.middleware';
import { activityLogger } from '../middleware/activityLogger.middleware';

const router = Router();

// Protect this route with authentication
router.use(authenticate);

/**
 * @swagger
 * /recommendation/analyze:
 *   post:
 *     summary: Analyze resume JSON for improvements and ATS score
 *     tags: [Recommendation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: The parsed resume JSON object
 *             example: 
 *                personal: { name: "John Doe" }
 *                skills: ["React", "Node.js"]
 *     responses:
 *       200:
 *         description: Analysis successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     atsScore:
 *                       type: integer
 *                       description: ATS compatibility score (0-100)
 *                     overallReview:
 *                       type: string
 *                       description: Overall review in 2-3 lines
 *                     sectionImprovements:
 *                       type: object
 *                       properties:
 *                         summary:
 *                           type: string
 *                         skills:
 *                           type: string
 *                         experience:
 *                           type: string
 *                         education:
 *                           type: string
 *                         projects:
 *                           type: string
 *       400:
 *         description: Missing resume data
 *       500:
 *         description: Server error
 */
router.post('/analyze', activityLogger, analyzeResume);

export default router;
