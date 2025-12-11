import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';

interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
    };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.cookies['auth-token'] || req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        res.status(401).json({ status: 'error', message: 'Authentication required' });
        return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        res.status(500).json({ status: 'error', message: 'Server configuration error: JWT secret not set' });
        return;
    }

    try {
        const decoded = jwt.verify(token, secret) as { id: string; email: string };

        // Optional: Check if user still exists in DB
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user) {
            res.status(401).json({ status: 'error', message: 'User not found' });
            return;
        }

        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ status: 'error', message: 'Invalid token' });
    }
};
