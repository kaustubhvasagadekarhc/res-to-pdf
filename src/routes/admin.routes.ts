import { Router } from 'express';
import { getAllUsers, getUserStats } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Apply auth and admin check to all routes
router.use(authenticate);
router.use(authorize(['ADMIN']));

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         description: Forbidden
 */
router.get('/users', getAllUsers);

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Get system stats (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System statistics
 *       403:
 *         description: Forbidden
 */
router.get('/stats', getUserStats);

export default router;
