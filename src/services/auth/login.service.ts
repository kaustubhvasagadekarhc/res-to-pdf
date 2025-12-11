import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../config/database';
import { LoginRequest } from '../../interfaces/auth/auth.interface';

export const loginUser = async (data: LoginRequest) => {
  const { email, password } = data;
  const user = await prisma.user.findUnique({
    where: { email: email },
    include: { role: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (!user.isVerified) {
    throw new Error('Please verify your email first');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Server configuration error: JWT secret not set');
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role?.name }, secret, {
    expiresIn: '7d',
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
