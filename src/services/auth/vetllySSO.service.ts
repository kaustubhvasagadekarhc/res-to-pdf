import axios from 'axios';
import jwt from 'jsonwebtoken';
import prisma from '../../config/database';

interface VetllyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

interface VetllyUserInfo {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  [key: string]: unknown;
}

export const handleVetllyCallback = async (code: string, state: string | null) => {
  const VETLLY_CLIENT_ID = process.env.VETLLY_CLIENT_ID;
  const VETLLY_CLIENT_SECRET = process.env.VETLLY_CLIENT_SECRET;
  const VETLLY_TOKEN_URL = process.env.VETLLY_TOKEN_URL || 'https://auth.vetlly.com/oauth/token';
  const VETLLY_USERINFO_URL = process.env.VETLLY_USERINFO_URL || 'https://auth.vetlly.com/oauth/userinfo';
  // Redirect URI should match the frontend callback URL registered with Vetlly
  const FRONTEND_URL = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
  const REDIRECT_URI = process.env.VETLLY_REDIRECT_URI || `${FRONTEND_URL}/auth/vetlly/callback`;

  if (!VETLLY_CLIENT_ID || !VETLLY_CLIENT_SECRET) {
    throw new Error('Vetlly SSO configuration missing. Please set VETLLY_CLIENT_ID and VETLLY_CLIENT_SECRET environment variables.');
  }

  // Step 1: Exchange authorization code for access token
  let tokenResponse: VetllyTokenResponse;
  try {
    const tokenRes = await axios.post<VetllyTokenResponse>(
      VETLLY_TOKEN_URL,
      {
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: VETLLY_CLIENT_ID,
        client_secret: VETLLY_CLIENT_SECRET,
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    tokenResponse = tokenRes.data;
  } catch (error) {
    console.error('Vetlly token exchange error:', error);
    throw new Error('Failed to exchange authorization code for token');
  }

  // Step 2: Get user info from Vetlly
  let vetllyUser: VetllyUserInfo;
  try {
    const userRes = await axios.get<VetllyUserInfo>(
      VETLLY_USERINFO_URL,
      {
        headers: {
          Authorization: `Bearer ${tokenResponse.access_token}`,
        },
      }
    );
    vetllyUser = userRes.data;
  } catch (error) {
    console.error('Vetlly userinfo error:', error);
    throw new Error('Failed to fetch user information from Vetlly');
  }

  // Step 3: Find or create user in database
  let user = await prisma.user.findUnique({
    where: { email: vetllyUser.email },
    include: { role: true },
  });

  if (!user) {
    // Create new user from Vetlly SSO
    user = await prisma.user.create({
      data: {
        email: vetllyUser.email,
        name: vetllyUser.name || vetllyUser.email.split('@')[0],
        password: '', // SSO users don't have passwords
        isVerified: true, // Vetlly verified users are auto-verified
        userType: 'USER',
      },
      include: { role: true },
    });
  } else {
    // Update user if needed (e.g., name, picture)
    if (vetllyUser.name && user.name !== vetllyUser.name) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name: vetllyUser.name },
        include: { role: true },
      });
    }
  }

  // Step 4: Generate JWT token
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Server configuration error: JWT secret not set');
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role?.name },
    secret,
    {
      expiresIn: '7d',
    }
  );

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

