import prisma from '../../config/database';
import { sendPasswordResetOtpEmail } from '../email.service';
import { generateOtp } from '../../utils/otp';

export const forgotPassword = async (email: string) => {
  // Check if user exists in database
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      isVerified: true,
    },
  });

  // Security: Don't reveal if user exists or not
  // Always return success message to prevent email enumeration
  if (!user) {
    // Still return success to prevent user enumeration
    return { message: 'If an account exists with this email, a password reset code has been sent.' };
  }

  // Check if user is verified
  if (!user.isVerified) {
    // Don't reveal this either - just return success
    return { message: 'If an account exists with this email, a password reset code has been sent.' };
  }

  // Generate OTP
  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Store OTP in database
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetOtp: otp,
      passwordResetOtpExpiry: otpExpiry,
    },
  });

  // Send OTP email
  try {
    await sendPasswordResetOtpEmail(email, otp);
  } catch (error) {
    // Clear OTP if email fails
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetOtp: null,
        passwordResetOtpExpiry: null,
      },
    });
    throw new Error('Failed to send password reset email. Please try again later.');
  }

  return { message: 'If an account exists with this email, a password reset code has been sent.' };
};




