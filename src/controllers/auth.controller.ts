import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/auth';

export const getToken = (req: Request, res: Response) => {
    // Static payload since we don't have users
    const payload = {
        role: 'api_user',
        timestamp: new Date().toISOString()
    };

    const token = jwt.sign(payload, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn as any });

    return res.json({
        token,
        expiresIn: jwtConfig.expiresIn
    });
};
