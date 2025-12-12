import prisma from "../../config/database";
import { sendOtpEmail } from '../email.service';

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const resendUserOtp = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    throw new Error("User not found");
  }

  if (user.isVerified) {
    throw new Error("User already verified");
  }

  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { otp, otpExpiry },
  });

  await sendOtpEmail(email, otp);
};
