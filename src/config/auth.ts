import { JWT_EXPIRY } from './env';

export const jwtConfig = {
    secret: process.env.JWT_SECRET!,
    expiresIn: JWT_EXPIRY,
};
