/*
  Warnings:

  - Added the required column `updatedAt` to the `ResumeSection` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ResumeSection" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "ResumeSectionVersion" (
    "id" TEXT NOT NULL,
    "resumeSectionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "section" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "changeNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "ResumeSectionVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResumeSectionVersion_resumeSectionId_idx" ON "ResumeSectionVersion"("resumeSectionId");

-- CreateIndex
CREATE INDEX "ResumeSectionVersion_createdAt_idx" ON "ResumeSectionVersion"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ResumeSectionVersion_resumeSectionId_version_key" ON "ResumeSectionVersion"("resumeSectionId", "version");

-- AddForeignKey
ALTER TABLE "ResumeSectionVersion" ADD CONSTRAINT "ResumeSectionVersion_resumeSectionId_fkey" FOREIGN KEY ("resumeSectionId") REFERENCES "ResumeSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
