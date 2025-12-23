import { UserType } from '@prisma/client';

export interface User {
    id: string;
    name: string | null;
    email: string;
    userType: UserType;
    isVerified: boolean;
    jobTitle?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserResponse {
    id: string;
    name: string | null;
    email: string;
    userType: UserType;
    isVerified: boolean;
}
