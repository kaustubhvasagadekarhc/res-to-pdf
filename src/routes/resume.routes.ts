import { Router } from 'express';
import { getUserResumeSections } from '../controllers/resume.controller';

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
router.get('/sections/:userId', getUserResumeSections);

export default router;