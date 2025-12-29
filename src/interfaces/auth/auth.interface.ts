import { UserResponse } from '../user/user.interface';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    name?: string;
    userType: 'USER' | 'ADMIN';
    jobTitle?: string;
}

export interface VerifyOtpRequest {
    email: string;
    otp: string;
}

export interface ResendOtpRequest {
    email: string;
}

export interface LoginResponse {
    user: UserResponse;
    token: string;
}
