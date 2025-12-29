import { Router } from 'express';
import { getUserResumeSections } from '../controllers/resume.controller';
import { deleteResume } from '../controllers/dashboard.controller';
import { activityLogger } from '../middleware/activityLogger.middleware';

const router = Router();

/**
 * @swagger
 * /resume/sections/{userId}:
 *   get:
 *     summary: Get user resume sections
 *     tags: [Resume]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resume sections retrieved successfully
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
 */
router.get('/sections/:userId', activityLogger, getUserResumeSections);



/**
 * @swagger
 * /resume/{id}:
 *   delete:
 *     summary: Delete a resume
 *     tags: [Resume]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resume ID
 *     responses:
 *       200:
 *         description: Resume deleted successfully
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Resume not found
 */
router.delete('/:id', activityLogger, deleteResume);

export default router;