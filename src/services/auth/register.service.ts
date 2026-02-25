import bcrypt from 'bcrypt';
import prisma from '../../config/database';
import { sendOtpEmail } from '../email.service';
import { activityService } from '../activity.service';
import { generateOtp } from '../../utils/otp';

export const registerUser = async (userData: {
  email: string;
  password: string;
  name?: string;
  userType: 'USER' | 'ADMIN';
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
      otp,
      otpExpiry,
      isVerified: false,
    },
  });

  await sendOtpEmail(email, otp);

  // Log activity
  await activityService.logActivity(user.id, 'USER_REGISTER', `New user registered: ${email}`, { email, userType });

  return { userId: user.id, email: user.email };
};
