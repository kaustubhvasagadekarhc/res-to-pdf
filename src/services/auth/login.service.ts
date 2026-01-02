import bcrypt from 'bcrypt';
import prisma from '../../config/database';
import { LoginRequest } from '../../interfaces/auth/auth.interface';
import { generateToken } from '../../utils/jwt';

export const loginUser = async (data: LoginRequest) => {
  const { email, password } = data;
  const user = await prisma.user.findUnique({
    where: { email: email },
    select: {
      id: true,
      email: true,
      name: true,
      password: true,
      isVerified: true,
      userType: true,
      roleId: true,
    },
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

  // Fetch role name if roleId exists
  let roleName: string | undefined;
  if (user.roleId) {
    const role = await prisma.role.findUnique({
      where: { id: user.roleId },
      select: { name: true },
    });
    roleName = role?.name;
  }

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
