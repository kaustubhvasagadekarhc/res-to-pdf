import { Prisma } from '@prisma/client';
import prisma from '../config/database';

export class ActivityService {
    async logActivity(userId: string | null, action: string, description?: string, metadata?: Prisma.InputJsonValue, ipAddress?: string) {
        try {
            return await prisma.activityLog.create({
                data: {
                    userId,
                    action,
                    description,
                    metadata,
                    ipAddress
                },
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Failed to log activity:', error);
            // Don't throw to avoid disrupting the main flow
        }
    }

    async getRecentActivities(limit: number = 5) {
        return await prisma.activityLog.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        userType: true,
                        role: {
                            select: { name: true }
                        }
                    }
                }
            }
        });
    }

    async getAllActivities(skip: number = 0, take: number = 20, type?: string) {
        const where = type ? { action: type } : {};

        const [activities, total] = await Promise.all([
            prisma.activityLog.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            userType: true,
                            role: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    }
                }
            }),
            prisma.activityLog.count({ where })
        ]);

        return { activities, total };
    }
}

export const activityService = new ActivityService();
