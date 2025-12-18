import { Router } from 'express';
import { getUserResumeSections, deleteResume } from '../controllers/resume.controller';

const router = Router();

/**
 * @swagger
 * /resume/sections/{userId}:
 *   get:
 *     summary: Get user resume sections
 *     tags: [Resume]
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
router.get('/sections/:userId', getUserResumeSections);

/**
 * @swagger
 * /resume/{id}:
 *   delete:
 *     summary: Delete a resume (owner or admin only)
 *     tags: [Resume]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resume deleted successfully
 */
router.delete('/:id', deleteResume);

export default router;