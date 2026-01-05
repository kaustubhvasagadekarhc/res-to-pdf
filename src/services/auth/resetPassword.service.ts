import bcrypt from 'bcrypt';
import prisma from '../../config/database';

export const resetPassword = async (
  email: string,
  otp: string,
  newPassword: string
) => {
  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      passwordResetOtp: true,
      passwordResetOtpExpiry: true,
      isVerified: true,
    },
  });

  if (!user) {
    throw new Error('Invalid or expired reset code');
  }

  // Check if user is verified
  if (!user.isVerified) {
    throw new Error('Please verify your email first');
  }

  // Verify OTP
  if (!user.passwordResetOtp || !user.passwordResetOtpExpiry) {
    throw new Error('No password reset request found. Please request a new reset code.');
  }

  if (user.passwordResetOtp !== otp) {
    throw new Error('Invalid reset code');
  }

  if (user.passwordResetOtpExpiry < new Date()) {
    // Clear expired OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetOtp: null,
        passwordResetOtpExpiry: null,
      },
    });
    throw new Error('Reset code has expired. Please request a new one.');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password and clear OTP
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetOtp: null,
      passwordResetOtpExpiry: null,
    },
  });

  return { message: 'Password has been reset successfully' };
};




