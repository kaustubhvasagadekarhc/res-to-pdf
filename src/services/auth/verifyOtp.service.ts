import prisma from "../../config/database";
import { generateToken } from "../../utils/jwt";

export const verifyUserOtp = async (email: string, otp: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      isVerified: true,
      otp: true,
      otpExpiry: true,
      roleId: true,
    },
  });
  
  if (!user) {
    throw new Error("User not found");
  }

  if (user.isVerified) {
    throw new Error("User already verified");
  }

  if (user.otp !== otp || !user.otpExpiry || user.otpExpiry < new Date()) {
    throw new Error("Invalid or expired OTP");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true, otp: null, otpExpiry: null },
  });

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
      role: roleName,
    },
  };
};
