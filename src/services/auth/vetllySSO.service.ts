import axios, { AxiosError } from 'axios';
import { Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { config, validateVettlyConfig } from '../../config/env';
import { generateToken } from '../../utils/jwt';
import { encrypt } from '../../utils/encryption';

interface VettlyVerifyResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    email: string;
    name: string;
    jobTitle?: string;
    isVerified: boolean;
    language?: string;
    isActive: boolean;
    emailVerifiedAt?: string;
    createdAt: string;
    updatedAt: string;
    profile?: {
      phoneNumber?: string;
      location?: string;
      skills?: string[];
      experience?: number;
      resumeUrl?: string;
      portfolioUrl?: string;
      linkedinUrl?: string;
      bio?: string;
      profilePicture?: string;
    };
  };
}

interface VettlyErrorResponse {
  success: false;
  message: string;
  error: {
    code: string;
    details?: unknown;
    stack?: string;
  };
}

export const handleVettlyCallback = async (ssoCode: string, ssoSecret: string) => {
  // Validate configuration
  validateVettlyConfig();

  const { apiBaseUrl, apiKey } = config.vettly;
  
  // Ensure API key is trimmed and valid
  const trimmedApiKey = apiKey?.trim();
  if (!trimmedApiKey) {
    throw new Error('VETLLY_API_KEY is missing or empty. Please check your .env file.');
  }

  // Step 1: Verify candidate with Vettly API using sso_code and sso_secret
  let vettlyUser: VettlyVerifyResponse['data'];
  try {
    const verifyRes = await axios.get<VettlyVerifyResponse>(
      `${apiBaseUrl}/api/v1/sso/verify-candidate`,
      {
        params: {
          sso_code: ssoCode,
          sso_secret: ssoSecret,
        },
        headers: {
          'Authorization': `Bearer ${trimmedApiKey}`,
          'X-API-Key': trimmedApiKey, // Fallback header for compatibility
          'Accept': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      }
    );

    if (!verifyRes.data.success || !verifyRes.data.data) {
      throw new Error(verifyRes.data.message || 'Failed to verify candidate');
    }

    vettlyUser = verifyRes.data.data;
  } catch (error) {
    // API key status for debugging (safe — no secret exposure)
    // Provide more specific error messages
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<VettlyErrorResponse>;
      const status = axiosError.response?.status;
      const errorData = axiosError.response?.data;

      if (status === 400) {
        throw new Error(errorData?.message || 'Missing or invalid query parameters');
      } else if (status === 401) {
        // Enhanced error message for API key issues
        const errorMsg = errorData?.message || 'Invalid API key';
        if (errorMsg.toLowerCase().includes('api key')) {
          throw new Error(`${errorMsg}. Please verify VETLLY_API_KEY in your .env file is correct and has no extra spaces.`);
        }
        throw new Error(errorMsg || 'Invalid SSO code or secret');
      } else if (status && status >= 500) {
        throw new Error(errorData?.message || 'Vettly service unavailable');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Request to Vettly timed out. Please try again.');
      }
    }

    throw new Error(`Failed to verify candidate with Vettly: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Step 2: Find or create user in database (using transaction for atomicity)
  const { user, roleName } = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    let user = await tx.user.findUnique({
      where: { email: vettlyUser.email  },
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
        roleId: true,
        jobTitle: true,
      },
    });

    let roleName: string | undefined;

    if (!user) {
      // Create new user from Vettly SSO
      user = await tx.user.create({
        data: {
          email: vettlyUser.email,
          name: vettlyUser.name || vettlyUser.email.split('@')[0],
          password: '', // SSO users don't have passwords
          isVerified: vettlyUser.isVerified || true, // Use Vettly verification status
          userType: 'USER',
          jobTitle: vettlyUser.jobTitle || null,
          vettlyUserId: vettlyUser.id, // Store Vettly's user ID
          isSSOUser: true, // Mark as SSO user
          lastSSOLoginAt: new Date(), // Track SSO login time
          vettlySsoCode: ssoCode, // Store sso_code for future use
          vettlySsoSecret: encrypt(ssoSecret), // Store encrypted sso_secret for future use
        },
        select: {
          id: true,
          email: true,
          name: true,
          userType: true,
          roleId: true,
          jobTitle: true,
        },
      });
    } else {
      // Update user if name, jobTitle, or Vettly user ID changed
      const updateData: { 
        name?: string; 
        jobTitle?: string | null; 
        isVerified?: boolean;
        vettlyUserId?: string;
        isSSOUser?: boolean;
        lastSSOLoginAt?: Date;
        vettlySsoCode?: string;
        vettlySsoSecret?: string;
      } = {
        // Always update SSO-related fields on login
        isSSOUser: true,
        lastSSOLoginAt: new Date(),
        vettlySsoCode: ssoCode, // Update sso_code
        vettlySsoSecret: encrypt(ssoSecret), // Update encrypted sso_secret
      };

      if (vettlyUser.name && user.name !== vettlyUser.name) {
        updateData.name = vettlyUser.name;
      }

      if (vettlyUser.jobTitle !== undefined && user.jobTitle !== vettlyUser.jobTitle) {
        updateData.jobTitle = vettlyUser.jobTitle || null;
      }

      // Update verification status if provided
      if (vettlyUser.isVerified !== undefined) {
        updateData.isVerified = vettlyUser.isVerified;
      }

      // Update Vettly user ID if not set or changed
      updateData.vettlyUserId = vettlyUser.id;

      user = await tx.user.update({
        where: { id: user.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          userType: true,
          roleId: true,
          jobTitle: true,
        },
      });
    }

    // Fetch role name if roleId exists
    if (user.roleId) {
      const role = await tx.role.findUnique({
        where: { id: user.roleId },
        select: { name: true },
      });
      roleName = role?.name;
    }

    return { user, roleName };
  });

  // Step 3: Generate JWT token
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: roleName,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      userType: user.userType,
    },
  };
};

 