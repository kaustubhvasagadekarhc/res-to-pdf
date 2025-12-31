import prisma from "../../config/database";
import { verifyToken } from "../../utils/jwt";

export const getCurrentUser = async (token: string) => {
  const decoded = verifyToken(token);
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