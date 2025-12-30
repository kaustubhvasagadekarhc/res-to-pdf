import axios from 'axios';
import jwt from 'jsonwebtoken';
import prisma from '../../config/database';

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

  const VETLLY_CLIENT_ID = process.env.VETLLY_CLIENT_ID;
  const VETLLY_CLIENT_SECRET = process.env.VETLLY_CLIENT_SECRET;
  const VETLLY_TOKEN_URL = process.env.VETLLY_TOKEN_URL || 'https://auth.vetlly.com/oauth/token';
  const VETLLY_USERINFO_URL = process.env.VETLLY_USERINFO_URL || 'https://auth.vetlly.com/oauth/userinfo';
  // Redirect URI should match the frontend callback URL registered with Vettly
  const FRONTEND_URL = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
  const REDIRECT_URI = process.env.VETLLY_REDIRECT_URI || `${FRONTEND_URL}/auth/vetlly/callback`;

  if (!VETLLY_CLIENT_ID || !VETLLY_CLIENT_SECRET) {
    throw new Error('Vettly SSO configuration missing. Please set VETLLY_CLIENT_ID and VETLLY_CLIENT_SECRET environment variables.');
  }

  // Step 1: Exchange authorization code for access token
  let tokenResponse: VettlyTokenResponse;
  try {
    const tokenRes = await axios.post<VettlyTokenResponse>(
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
    console.error('Vettly token exchange error:', error);
    throw new Error('Failed to exchange authorization code for token');
  }

  // Step 2: Get user info from Vettly
  let vettlyUser: VettlyUserInfo;
  try {
    const userRes = await axios.get<VettlyUserInfo>(
      VETLLY_USERINFO_URL,
      {
        headers: {
          Authorization: `Bearer ${tokenResponse.access_token}`,
        },
      }
    );
    vettlyUser = userRes.data;
  } catch (error) {
    console.error('Vettly userinfo error:', error);
    throw new Error('Failed to fetch user information from Vettly');
  }

  // Step 3: Find or create user in database
  let user = await prisma.user.findUnique({
    where: { email: vettlyUser.email },
    include: { role: true },
  });

  if (!user) {
    // Create new user from Vettly SSO
    user = await prisma.user.create({
      data: {
        email: vettlyUser.email,
        name: vettlyUser.name || vettlyUser.email.split('@')[0],
        password: '', // SSO users don't have passwords
        isVerified: true, // Vettly verified users are auto-verified
        userType: 'USER',
      },
      include: { role: true },
    });
  } else {
    // Update user if needed (e.g., name, picture)
    if (vettlyUser.name && user.name !== vettlyUser.name) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name: vettlyUser.name },
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

