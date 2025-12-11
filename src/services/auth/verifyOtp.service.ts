import jwt from 'jsonwebtoken';
import prisma from "../../config/database";

export const verifyUserOtp = async (email: string, otp: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
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

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Server configuration error: JWT secret not set");
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role?.name },
    secret,
    { expiresIn: "7d" }
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role?.name,
    },
  };
};
