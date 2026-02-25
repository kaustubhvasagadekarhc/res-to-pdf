/**
 * JWT utility functions
 * Centralized token generation and verification
 */
import jwt from 'jsonwebtoken';
import { config, JWT_EXPIRY } from '../config/env';

export interface TokenPayload {
  id: string;
  email: string;
  role?: string;
}

/**
 * Generate a JWT token
 */
export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: JWT_EXPIRY,
  });
};

/**
 * Verify a JWT token
 */
export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.secret) as TokenPayload;
};
