-- CreateTable
CREATE TABLE "resume_sections" (
    "id" SERIAL NOT NULL,
    "resumeId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "resume_sections_pkey" PRIMARY KEY ("id")
);
