import bcrypt from 'bcrypt';
import prisma from '../../config/database';
import { sendOtpEmail } from '../email.service';

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

export const registerUser = async (userData: {
  email: string;
  password: string;
  name?: string;
  userType: 'user' | 'admin';
  jobTitle?: string;
}) => {
  const { email, password, name, userType, jobTitle } = userData;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('User already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      userType,
      jobTitle,
      roleId: 1,
      otp,
      otpExpiry,
      isVerified: false,
    },
  });

  await sendOtpEmail(email, otp);
  return { userId: user.id, email: user.email };
};
