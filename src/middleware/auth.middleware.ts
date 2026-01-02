import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { verifyToken } from '../utils/jwt';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies['auth-token'] || req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        res.status(401).json({ status: 'error', message: 'Authentication required' });
        return;
    }

    try {
        const decoded = verifyToken(token);

        // Optional: Check if user still exists in DB
        const user = await prisma.user.findUnique({ 
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                name: true,
                userType: true,
                roleId: true,
            },
        });
        if (!user) {
            res.status(401).json({ status: 'error', message: 'User not found' });
            return;
        }

        req.user = {
            id: decoded.id,
            email: decoded.email,
            name: user.name,
            userType: user.userType as 'USER' | 'ADMIN',
            role: user.roleId ? { id: user.roleId } : undefined
        };
        next();
    } catch (error) {
        res.status(401).json({ status: 'error', message: 'Invalid token' });
    }
};

export const authorize = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            res.status(401).json({ status: 'error', message: 'Authentication required' });
            return;
        }

        const userType = req.user.userType;

        if (roles.includes(userType || '')) {
            next();
            return;
        }

        res.status(403).json({ status: 'error', message: 'Access denied: Insufficient permissions' });
    };
};
