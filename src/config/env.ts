/**
 * Environment configuration module
 * Caches environment variables at startup for better performance
 */

// Validate and cache JWT configuration
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

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

