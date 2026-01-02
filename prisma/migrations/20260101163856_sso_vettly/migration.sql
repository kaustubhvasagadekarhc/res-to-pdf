/*
  Warnings:

  - A unique constraint covering the columns `[vettly_user_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "is_sso_user" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_sso_login_at" TIMESTAMP(3),
ADD COLUMN     "vettly_user_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_vettly_user_id_key" ON "User"("vettly_user_id");
