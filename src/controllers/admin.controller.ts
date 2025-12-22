import { Request, Response } from 'express';
import { adminService } from '../services/admin.service';
import { UserType } from '@prisma/client';
import crypto from 'crypto';
import { fileUploadService } from '../services/fileUpload.service';
import { parseService } from '../services/parse.service';
import { sendAdminInvitationEmail } from '../services/email.service';
import { activityService } from '../services/activity.service';
import { settingsService } from '../services/settings.service';

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await adminService.getAllUsers();
        res.json({
            status: 'success',
            data: users
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch users'
        });
    }
};

export const getUserStats = async (req: Request, res: Response) => {
    try {
        const stats = await adminService.getSystemStats();
        res.json({
            status: 'success',
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch stats'
        });
    }
};

export const getUserById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await adminService.getUserById(id);

        if (!user) {
            res.status(404).json({ status: 'error', message: 'User not found' });
            return;
        }

        res.json({ status: 'success', data: user });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch user' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await adminService.deleteUser(id);

        await activityService.logActivity(
            req.user?.id || null,
            'ADMIN_DELETE_USER',
            `Admin deleted user ${id}`,
            { targetUserId: id }
        );
        res.json({ status: 'success', message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to delete user' });
    }
};

export const updateUserRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { userType } = req.body;

        if (!Object.values(UserType).includes(userType)) {
            res.status(400).json({ status: 'error', message: 'Invalid user type' });
            return;
        }

        const user = await adminService.updateUserRole(id, userType);

        await activityService.logActivity(
            req.user?.id || null,
            'ADMIN_UPDATE_ROLE',
            `Admin updated role for user ${id} to ${userType}`,
            { targetUserId: id, newRole: userType }
        );
        res.json({ status: 'success', data: user });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to update user role' });
    }
};

export const verifyUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { isVerified } = req.body;

        const user = await adminService.verifyUser(id, isVerified);

        await activityService.logActivity(
            req.user?.id || null,
            'ADMIN_VERIFY_USER',
            `Admin ${isVerified ? 'verified' : 'unverified'} user ${id}`,
            { targetUserId: id, isVerified }
        );
        res.json({ status: 'success', data: user });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to update verification status' });
    }
};

// Admin Invitation Flow

export const inviteUser = async (req: Request, res: Response) => {
    try {
        const { email, name } = req.body;

        if (!email || !name) {
            res.status(400).json({ status: 'error', message: 'Email and Name are required' });
            return;
        }

        // Check if user exists
        const existingUser = await adminService.findUserByEmail(email);
        if (existingUser) {
            res.status(409).json({
                status: 'error',
                message: 'User already exists',
                data: existingUser
            });
            return;
        }

        // Generate temp password
        const tempPassword = crypto.randomBytes(8).toString('hex');

        // Create user
        const newUser = await adminService.inviteUser(email, name, tempPassword);

        await activityService.logActivity(
            req.user?.id || null,
            'ADMIN_INVITE_USER',
            `Admin invited new user ${email}`,
            { invitedEmail: email, invitedName: name }
        );

        // Send invitation email
        await sendAdminInvitationEmail(email, name, tempPassword);

        res.status(201).json({
            status: 'success',
            message: 'User invited successfully',
            data: {
                id: newUser.id,
                email: newUser.email,
                tempPassword // Returning in response for testing convenience, usually don't do this
            }
        });

    } catch (error) {
        console.error("Invite Error:", error);
        res.status(500).json({ status: 'error', message: 'Failed to invite user' });
    }
};

// Admin Resume Parse API
export const parseResume = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({ status: 'error', message: 'No file uploaded' });
            return;
        }

        // Upload file
        const uploaded = await fileUploadService.upload(req.file);

        // Parse without creating a Resume record yet
        const parsedData = await parseService.parseResume(uploaded.fileUrl, undefined);

        await activityService.logActivity(
            req.user?.id || null,
            'ADMIN_PARSE_RESUME',
            `Admin parsed resume: ${uploaded.name}`,
            { fileName: uploaded.name, fileUrl: uploaded.fileUrl }
        );

        res.json({
            status: 'success',
            data: {
                parsed: parsedData,
                fileUrl: uploaded.fileUrl,
                fileName: uploaded.name
            }
        });

    } catch (error) {
        console.error("Parse Error:", error);
        res.status(500).json({ status: 'error', message: 'Failed to parse resume' });
    }
};

// Activity Logs
export const getActivities = async (req: Request, res: Response) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
        const activities = await activityService.getRecentActivities(limit);
        res.json({ status: 'success', data: activities });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch activities' });
    }
};

export const getAllActivities = async (req: Request, res: Response) => {
    try {
        const page = req.query.page ? parseInt(req.query.page as string) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
        const type = req.query.type as string | undefined;

        const skip = (page - 1) * limit;
        const { activities, total } = await activityService.getAllActivities(skip, limit, type);

        res.json({
            status: 'success',
            data: activities,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch activities' });
    }
};

// System Settings
export const getSettings = async (req: Request, res: Response) => {
    try {
        const settings = await settingsService.getSettings();
        res.json({ status: 'success', data: settings });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch settings' });
    }
};

export const updateSettings = async (req: Request, res: Response) => {
    try {
        const settings = await settingsService.updateSettings(req.body);

        await activityService.logActivity(
            req.user?.id || null,
            'ADMIN_UPDATE_SETTINGS',
            'Admin updated system settings',
            { updates: req.body }
        );
        res.json({ status: 'success', data: settings });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to update settings' });
    }
};
