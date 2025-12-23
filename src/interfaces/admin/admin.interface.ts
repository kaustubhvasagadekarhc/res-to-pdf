import { UserResponse } from '../user/user.interface';
import { UserType, Prisma } from '@prisma/client';

export interface SystemStats {
    totalUsers: number;
    totalResumes: number;
    totalGenerated: number;
}

export interface InviteUserRequest {
    email: string;
    name: string;
}

export interface UpdateUserRoleRequest {
    userType: UserType;
}

export interface VerifyUserRequest {
    isVerified: boolean;
}

export interface ActivityLog {
    id: string;
    userId?: string | null;
    action: string;
    description?: string | null;
    metadata?: Prisma.JsonValue;
    ipAddress?: string | null;
    createdAt: Date;
    user?: UserResponse | null;
}

export interface SystemSettings {
    allowRegistration: boolean;
    maintenanceMode: boolean;
    supportEmail?: string | null;
    maxUploadSize: number;
    updatedAt: Date;
}
