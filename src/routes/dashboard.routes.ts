import { Router } from 'express';
import { getUserResumes } from '../controllers/dashboard.controller';

const router = Router();

import { activityLogger } from '../middleware/activityLogger.middleware';

/**
 * @swagger
 * /dashboard/resumes:
 *   post:
 *     summary: Get user resumes for dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The ID of the user whose resumes to retrieve
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
 *                       jobTitle:
 *                         type: string
 *                       section:
 *                         type: string
 *                       content:
 *                         type: string
 *                       version:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Missing userId in request body
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.post('/resumes', activityLogger, getUserResumes);



export default router;