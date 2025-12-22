import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { activityService } from '../services/activity.service';

interface DecodedUser {
    id: string;
    email: string;
}

export const activityLogger = async (req: Request, res: Response, next: NextFunction) => {
    // 1. Try to get user from req.user (if auth middleware ran first)
    let userId = req.user?.id;
    let userEmail = req.user?.email;

    // 2. If no req.user, try to manually decode token (for "soft" auth or incorrectly ordered middleware)
    if (!userId) {
        try {
            const token = req.cookies['auth-token'] || req.header('Authorization')?.replace('Bearer ', '');
            if (token && process.env.JWT_SECRET) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET) as DecodedUser;
                userId = decoded.id;
                userEmail = decoded.email;
            }
        } catch (error) {
            // Token invalid or expired - just ignore, we can't log as a specific user
        }
    }

    // Hook into response finish to log the outcome
    res.on('finish', () => {
        // If we still don't have a user, we might log it as 'Anonymous' or skip
        // The prompt asked "with the basses of which user has called", implying we need a user.
        if (!userId) return;

        // Construct action name
        const path = req.originalUrl.split('?')[0]; // /generate/pdf
        const method = req.method; // POST

        // Clean up path to make it a readable action
        // e.g. /api/users/123 -> USERS_ID
        // This is a heuristic.
        const cleanPath = path
            .replace(/^\//, '')
            .replace(/\//g, '_')
            .toUpperCase();

        const action = `${method}_${cleanPath}`;

        // Don't await this, let it run in background

        activityService.logActivity(
            userId,
            action,
            `User ${userEmail || userId} accessed ${path}`,
            {
                method,
                url: req.originalUrl,
                statusCode: res.statusCode,
                userAgent: req.get('user-agent')
            },
            req.ip
        ).catch(err => console.error('Activity logging failed', err));
    });

    next();
};
