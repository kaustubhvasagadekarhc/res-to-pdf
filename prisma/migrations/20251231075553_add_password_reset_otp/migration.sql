-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password_reset_otp" TEXT,
ADD COLUMN     "password_reset_otp_expiry" TIMESTAMP(3);
