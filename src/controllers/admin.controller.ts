import { Request, Response } from 'express';
import prisma from '../config/database';

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                userType: true,
                isVerified: true,
                createdAt: true,
                _count: {
                    select: { resumes: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

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
        const totalUsers = await prisma.user.count();
        const totalResumes = await prisma.resume.count();
        const totalGenerated = await prisma.generatedResume.count();

        res.json({
            status: 'success',
            data: {
                totalUsers,
                totalResumes,
                totalGenerated
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch stats'
        });
    }
};
