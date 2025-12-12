import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    userType: z.enum(['user', 'admin'], {
        message: 'User type must be either user or Admin',
    }),
    jobTitle: z.string().optional(),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const verifyOtpSchema = z.object({
    email: z.string().email('Invalid email address'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const resendOtpSchema = z.object({
    email: z.string().email('Invalid email address'),
});
