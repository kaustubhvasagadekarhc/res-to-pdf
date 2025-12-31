import axios, { AxiosError } from 'axios';
import prisma from '../../config/database';
import { config, validateVettlyConfig } from '../../config/env';
import { generateToken } from '../../utils/jwt';

interface VettlyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

interface VettlyUserInfo {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  [key: string]: unknown;
}

export const handleVettlyCallback = async (code: string, state: string | null) => {
  // Validate configuration
  validateVettlyConfig();

  const { clientId, clientSecret, tokenUrl, userInfoUrl, redirectUri } = config.vettly;

  // Step 1: Exchange authorization code for access token
  let tokenResponse: VettlyTokenResponse;
  try {
    const tokenRes = await axios.post<VettlyTokenResponse>(
      tokenUrl,
      {
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 10000, // 10 second timeout
      }
    );
    tokenResponse = tokenRes.data;
  } catch (error) {
    console.error('Vettly token exchange error:', error);
    
    // Provide more specific error messages
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ error?: string; error_description?: string }>;
      const status = axiosError.response?.status;
      const errorData = axiosError.response?.data;
      
      if (status === 400) {
        throw new Error(`Invalid authorization code: ${errorData?.error_description || errorData?.error || 'Bad request'}`);
      } else if (status === 401) {
        throw new Error(`Vettly authentication failed: ${errorData?.error_description || errorData?.error || 'Unauthorized'}`);
      } else if (status && status >= 500) {
        throw new Error(`Vettly service unavailable: ${errorData?.error_description || 'Internal server error'}`);
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Request to Vettly timed out. Please try again.');
      }
    }
    
    throw new Error(`Failed to exchange authorization code: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Step 2: Get user info from Vettly
  let vettlyUser: VettlyUserInfo;
  try {
    const userRes = await axios.get<VettlyUserInfo>(
      userInfoUrl,
      {
        headers: {
          Authorization: `Bearer ${tokenResponse.access_token}`,
        },
        timeout: 10000, // 10 second timeout
      }
    );
    vettlyUser = userRes.data;
  } catch (error) {
    console.error('Vettly userinfo error:', error);
    
    // Provide more specific error messages
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ error?: string; error_description?: string }>;
      const status = axiosError.response?.status;
      
      if (status === 401) {
        throw new Error('Invalid access token from Vettly');
      } else if (status && status >= 500) {
        throw new Error('Vettly userinfo service unavailable');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Request to Vettly timed out. Please try again.');
      }
    }
    
    throw new Error(`Failed to fetch user information from Vettly: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Step 3: Find or create user in database (using transaction for atomicity)
  const { user, roleName } = await prisma.$transaction(async (tx) => {
    let user = await tx.user.findUnique({
      where: { email: vettlyUser.email },
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
        roleId: true,
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
          isVerified: true, // Vettly verified users are auto-verified
          userType: 'USER',
        },
        select: {
          id: true,
          email: true,
          name: true,
          userType: true,
          roleId: true,
        },
      });
    } else {
      // Update user if name changed
      if (vettlyUser.name && user.name !== vettlyUser.name) {
        user = await tx.user.update({
          where: { id: user.id },
          data: { name: vettlyUser.name },
          select: {
            id: true,
            email: true,
            name: true,
            userType: true,
            roleId: true,
          },
        });
      }
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

  // Step 4: Generate JWT token
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

