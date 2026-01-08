/**
 * Encryption Utility Functions
 * Two-way encryption for storing sensitive data that needs to be retrieved
 * Uses AES-256-GCM for authenticated encryption
 */

import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required for SSO secret encryption');
}

// Ensure key is 32 bytes (256 bits) for AES-256
const getKey = (): Buffer => {
  if (ENCRYPTION_KEY.length === 64) {
    // Hex string (32 bytes)
    return Buffer.from(ENCRYPTION_KEY, 'hex');
  } else if (ENCRYPTION_KEY.length === 32) {
    // Already 32 bytes
    return Buffer.from(ENCRYPTION_KEY);
  } else {
    // Hash to get 32 bytes
    return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  }
};

const key = getKey();

/**
 * Encrypt text using AES-256-GCM
 * Returns format: iv:authTag:encrypted
 */
export function encrypt(text: string): string {
  if (!text) {
    return text;
  }

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Return iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt text encrypted with encrypt()
 * Expects format: iv:authTag:encrypted
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) {
    return encryptedText;
  }

  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

