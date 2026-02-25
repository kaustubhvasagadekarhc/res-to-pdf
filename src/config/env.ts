/**
 * Environment configuration module
 * Caches environment variables at startup for better performance
 */

// Validate and cache JWT configuration
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export const JWT_EXPIRY = '7d';
export const JWT_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

// Vettly API configuration
const VETLLY_API_BASE_URL = process.env.VETLLY_API_BASE_URL || 'http://localhost:5000';
const VETLLY_API_KEY = process.env.VETLLY_API_KEY?.trim();

export const config = {
  jwt: {
    secret: JWT_SECRET,
  },
  vettly: {
    apiBaseUrl: VETLLY_API_BASE_URL,
    apiKey: VETLLY_API_KEY,
  },
};

// Validate required Vettly config (only if SSO is being used)
export const validateVettlyConfig = () => {
  if (!config.vettly.apiBaseUrl) {
    throw new Error('VETLLY_API_BASE_URL environment variable is required for SSO');
  }
  if (!config.vettly.apiKey || config.vettly.apiKey.trim() === '') {
    throw new Error('VETLLY_API_KEY environment variable is required for SSO. Please check your .env file.');
  }
};

// Warn about missing optional-but-important env vars at startup
const recommendedVars = [
  'DATABASE_URL',
  'GEMINI_API_KEY',
  'APPWRITE_ENDPOINT',
  'APPWRITE_PROJECT_ID',
  'APPWRITE_BUCKET_ID',
  'APPWRITE_API_KEY',
  'EMAIL_USER',
  'EMAIL_PASS',
];

const missing = recommendedVars.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.warn(`WARNING: Missing environment variables: ${missing.join(', ')}`);
}
