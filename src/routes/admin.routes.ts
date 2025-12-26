import { Router } from 'express';
import {
    getAllUsers,
    getUserStats,
    getUserById,
    deleteUser,
    updateUserRole,
    verifyUser,
    inviteUser,
    parseResume,
    getActivities,
    getAllActivities,
    getSettings,
    updateSettings
} from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import multer from 'multer';
import { activityLogger } from '../middleware/activityLogger.middleware';


const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Apply auth and admin check to all routes
router.use(authenticate);
router.use(authorize(['ADMIN']));


// User Management Routes

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/users', getAllUsers);

/**
 * @swagger
 * /admin/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/users/:id', activityLogger, getUserById);

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       500:
 *         description: Server error
 */
router.delete('/users/:id', activityLogger, deleteUser);

/**
 * @swagger
 * /admin/users/{id}/role:
 *   patch:
 *     summary: Update user role
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userType:
 *                 type: string
 *                 enum: [USER, ADMIN]
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       400:
 *         description: Invalid user type
 *       500:
 *         description: Server error
 */
router.patch('/users/:id/role', activityLogger, updateUserRole);

/**
 * @swagger
 * /admin/users/{id}/verify:
 *   patch:
 *     summary: Update user verification status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isVerified:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User verification updated successfully
 *       500:
 *         description: Server error
 */
router.patch('/users/:id/verify', activityLogger, verifyUser);

// Stats

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Get system statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System stats retrieved successfully
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
 *                     totalUsers:
 *                       type: integer
 *                     totalResumes:
 *                       type: integer
 *                     totalGenerated:
 *                       type: integer
 *       500:
 *         description: Server error
 */
router.get('/stats', activityLogger, getUserStats);

// Admin Onboarding Flow

/**
 * @swagger
 * /admin/users/invite:
 *   post:
 *     summary: Invite a new user (Create with temp password)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User invited successfully
 *       409:
 *         description: User already exists
 *       500:
 *         description: Server error
 */
router.post('/users/invite', activityLogger, inviteUser);

/**
 * @swagger
 * /admin/resume/parse:
 *   post:
 *     summary: Parse resume for Admin preview
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               resume:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Resume parsed successfully
 *       400:
 *         description: No file uploaded
 *       500:
 *         description: Server error
 */
router.post('/resume/parse', activityLogger, upload.single('resume'), parseResume);

// Activity Logs

/**
 * @swagger
 * /admin/activities/recent:
 *   get:
 *     summary: Get recent activities (for dashboard widget)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of activities to fetch (default 5)
 *     responses:
 *       200:
 *         description: Recent activities retrieved
 *       500:
 *         description: Server error
 */
router.get('/activities/recent', getActivities);

/**
 * @swagger
 * /admin/activities:
 *   get:
 *     summary: Get all activities with pagination
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of activities retrieved
 *       500:
 *         description: Server error
 */
router.get('/activities', getAllActivities);

// System Settings

/**
 * @swagger
 * /admin/settings:
 *   get:
 *     summary: Get system settings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings retrieved
 *       500:
 *         description: Server error
 */
router.get('/settings', getSettings);

/**
 * @swagger
 * /admin/settings:
 *   put:
 *     summary: Update system settings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               allowRegistration:
 *                 type: boolean
 *               maintenanceMode:
 *                 type: boolean
 *               supportEmail:
 *                 type: string
 *               maxUploadSize:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Settings updated
 *       500:
 *         description: Server error
 */
router.put('/settings', activityLogger, updateSettings);

export default router;
