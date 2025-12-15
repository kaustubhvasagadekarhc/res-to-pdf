/*
  Warnings:

  - You are about to drop the `ResumeSection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ResumeSectionVersion` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ResumeSection" DROP CONSTRAINT "ResumeSection_resumeId_fkey";

-- DropForeignKey
ALTER TABLE "ResumeSectionVersion" DROP CONSTRAINT "ResumeSectionVersion_resumeSectionId_fkey";

-- DropTable
DROP TABLE "ResumeSection";

-- DropTable
DROP TABLE "ResumeSectionVersion";

-- CreateTable
CREATE TABLE "ResumeVersions" (
    "id" TEXT NOT NULL,
    "jobTitle" TEXT,
    "resumeId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumeVersions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResumeVersions_resumeId_idx" ON "ResumeVersions"("resumeId");

-- AddForeignKey
ALTER TABLE "ResumeVersions" ADD CONSTRAINT "ResumeVersions_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;
