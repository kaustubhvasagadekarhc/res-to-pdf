import jwt from 'jsonwebtoken';
import prisma from "../../config/database";

export const getCurrentUser = async (token: string) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Server configuration error: JWT secret not set");
  }

  const decoded = jwt.verify(token, secret) as { id: string };
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      email: true,
      name: true,
      userType: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};