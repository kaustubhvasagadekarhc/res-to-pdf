import dotenv from 'dotenv';
dotenv.config();

export const jwtConfig = {
    secret: process.env.JWT_SECRET || 'default_secret_please_change_in_env',
    expiresIn: '24h',
};
