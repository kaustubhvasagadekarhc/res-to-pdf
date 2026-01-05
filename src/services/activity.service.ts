import { Prisma } from '@prisma/client';
import prisma from '../config/database';

export class ActivityService {
    async logActivity(userId: string | null, action: string, description?: string, metadata?: Prisma.InputJsonValue) {
        try {
            return await prisma.activityLog.create({
                data: {
                    userId,
                    action,
                    description,
                    metadata
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

    async getAllActivities(
        skip: number = 0, 
        take: number = 20, 
        filters?: {
            type?: string;
            userId?: string;
            statusCode?: number;
            startDate?: Date;
            endDate?: Date;
            search?: string;
            method?: string;
        }
    ) {
        const where: Prisma.ActivityLogWhereInput = {};

        if (filters?.type) {
            where.action = { contains: filters.type, mode: 'insensitive' };
        }

        if (filters?.userId) {
            where.userId = filters.userId;
        }

        // Handle metadata filters (statusCode and method)
        // Note: Prisma JSON filtering can only filter on one path at a time
        // If both are provided, we'll prioritize statusCode
        if (filters?.statusCode) {
            where.metadata = {
                path: ['statusCode'],
                equals: filters.statusCode
            };
        } else if (filters?.method) {
            where.metadata = {
                path: ['method'],
                equals: filters.method
            };
        }

        if (filters?.startDate || filters?.endDate) {
            where.createdAt = {};
            if (filters.startDate) {
                where.createdAt.gte = filters.startDate;
            }
            if (filters.endDate) {
                where.createdAt.lte = filters.endDate;
            }
        }

        if (filters?.search) {
            where.OR = [
                { description: { contains: filters.search, mode: 'insensitive' } },
                { action: { contains: filters.search, mode: 'insensitive' } },
                { 
                    user: {
                        OR: [
                            { email: { contains: filters.search, mode: 'insensitive' } },
                            { name: { contains: filters.search, mode: 'insensitive' } }
                        ]
                    }
                }
            ];
        }

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

    // Get activity statistics for admin dashboard
    async getActivityStats(startDate?: Date, endDate?: Date) {
        const where: Prisma.ActivityLogWhereInput = {};
        
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = startDate;
            if (endDate) where.createdAt.lte = endDate;
        }

        const [total, byAction, byUser] = await Promise.all([
            prisma.activityLog.count({ where }),
            prisma.activityLog.groupBy({
                by: ['action'],
                where,
                _count: { action: true },
                orderBy: { _count: { action: 'desc' } },
                take: 10
            }),
            prisma.activityLog.groupBy({
                by: ['userId'],
                where: { ...where, userId: { not: null } },
                _count: { userId: true },
                orderBy: { _count: { userId: 'desc' } },
                take: 10
            })
        ]);

        // Get status code statistics using raw query
        const byStatusCode = await prisma.$queryRaw<Array<{ statusCode: number; count: bigint }>>`
            SELECT 
                CAST(metadata->>'statusCode' AS INTEGER) as "statusCode",
                COUNT(*)::bigint as count
            FROM "ActivityLog"
            WHERE metadata->>'statusCode' IS NOT NULL
            ${startDate ? Prisma.sql`AND "createdAt" >= ${startDate}` : Prisma.empty}
            ${endDate ? Prisma.sql`AND "createdAt" <= ${endDate}` : Prisma.empty}
            GROUP BY "statusCode"
            ORDER BY count DESC
        `;

        return {
            total,
            byAction: byAction.map(a => ({ action: a.action, count: a._count.action })),
            byUser,
            byStatusCode: byStatusCode.map(s => ({ 
                statusCode: Number(s.statusCode), 
                count: Number(s.count) 
            }))
        };
    }
}

export const activityService = new ActivityService();
