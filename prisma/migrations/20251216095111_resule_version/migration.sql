/*
  Warnings:

  - Added the required column `userId` to the `GeneratedResume` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileName` to the `ResumeVersions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileUrl` to the `ResumeVersions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GeneratedResume" ADD COLUMN     "userId" TEXT NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "ResumeVersions" ADD COLUMN     "fileName" TEXT NOT NULL,
ADD COLUMN     "fileUrl" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "GeneratedResume" ADD CONSTRAINT "GeneratedResume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
