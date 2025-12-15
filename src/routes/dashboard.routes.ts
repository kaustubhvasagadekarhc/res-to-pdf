import { Router } from 'express';
import { getUserResumes } from '../controllers/dashboard.controller';

const router = Router();

/**
 * @swagger
 * /dashboard/resumes:
 *   get:
 *     summary: Get user resumes for dashboard
 *     tags: [Dashboard]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User resumes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       fileName:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       latestVersion:
 *                         type: integer
 */
router.get('/resumes', getUserResumes);

export default router;