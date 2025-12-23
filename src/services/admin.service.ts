import prisma from '../config/database';
import { UserType } from '@prisma/client';
import bcrypt from 'bcrypt';

export class AdminService {

    // Get all users with basic info and resume count
    async getAllUsers() {
        return await prisma.user.findMany({
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
    }

    // Get system statistics
    async getSystemStats() {
        const totalUsers = await prisma.user.count();
        const totalResumes = await prisma.resume.count();
        const totalGenerated = await prisma.generatedResume.count();

        return {
            totalUsers,
            totalResumes,
            totalGenerated
        };
    }

    // Get user by ID
    async getUserById(id: string) {
        return await prisma.user.findUnique({
            where: { id },
            include: {
                resumes: {
                    orderBy: { createdAt: 'desc' },
                    take: 5
                }
            }
        });
    }

    // Delete user
    async deleteUser(id: string) {
        return await prisma.user.delete({
            where: { id }
        });
    }

    // Update user role
    async updateUserRole(id: string, userType: UserType) {
        return await prisma.user.update({
            where: { id },
            data: { userType }
        });
    }

    // Verify user (manually)
    async verifyUser(id: string, isVerified: boolean) {
        return await prisma.user.update({
            where: { id },
            data: { isVerified }
        });
    }

    // Check if user exists by email
    async findUserByEmail(email: string) {
        return await prisma.user.findUnique({
            where: { email }
        });
    }

    // Create user (Invitation flow)
    async inviteUser(email: string, name: string, tempPasswordRaw: string) {
        const hashedPassword = await bcrypt.hash(tempPasswordRaw, 10);

        return await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                userType: 'USER',
                isVerified: true, // Auto-verified since admin invited
            }
        });
    }
}


export const adminService = new AdminService();
