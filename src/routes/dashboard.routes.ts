import { Router } from 'express';
import { getUserResumes, renameResume } from '../controllers/dashboard.controller';
import { activityLogger } from '../middleware/activityLogger.middleware';

const router = Router();

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
 */
router.post('/resumes', activityLogger, getUserResumes);

/**
 * @swagger
 * /dashboard/resumes/rename:
 *   patch:
 *     summary: Rename a resume file
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
 *               - resumeId
 *               - fileName
 *             properties:
 *               resumeId:
 *                 type: string
 *                 description: The ID of the resume to rename
 *               fileName:
 *                 type: string
 *                 description: The new file name (with or without .pdf extension)
 *     responses:
 *       200:
 *         description: Resume renamed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     fileName:
 *                       type: string
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Unauthorized - Resume does not belong to user
 *       404:
 *         description: Resume not found
 *       500:
 *         description: Server error
 */
router.patch('/resumes/rename', activityLogger, renameResume);

export default router;