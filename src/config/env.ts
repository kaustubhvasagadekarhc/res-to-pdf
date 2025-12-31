/**
 * Environment configuration module
 * Caches environment variables at startup for better performance
 */

// Validate and cache JWT configuration
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// Validate and cache Vettly SSO configuration
const VETLLY_CLIENT_ID = process.env.VETLLY_CLIENT_ID;
const VETLLY_CLIENT_SECRET = process.env.VETLLY_CLIENT_SECRET;

// Vettly URLs with defaults
const VETLLY_TOKEN_URL = process.env.VETLLY_TOKEN_URL || 'https://auth.vetlly.com/oauth/token';
const VETLLY_USERINFO_URL = process.env.VETLLY_USERINFO_URL || 'https://auth.vetlly.com/oauth/userinfo';

// Frontend URL for redirect URI construction
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
const VETLLY_REDIRECT_URI = process.env.VETLLY_REDIRECT_URI || `${FRONTEND_URL}/auth/vetlly/callback`;

export const config = {
  jwt: {
    secret: JWT_SECRET,
  },
  vettly: {
    clientId: VETLLY_CLIENT_ID,
    clientSecret: VETLLY_CLIENT_SECRET,
    tokenUrl: VETLLY_TOKEN_URL,
    userInfoUrl: VETLLY_USERINFO_URL,
    redirectUri: VETLLY_REDIRECT_URI,
  },
};

// Validate required Vettly config (only if SSO is being used)
export const validateVettlyConfig = () => {
  if (!config.vettly.clientId || !config.vettly.clientSecret) {
    throw new Error('VETLLY_CLIENT_ID and VETLLY_CLIENT_SECRET environment variables are required for SSO');
  }
};

