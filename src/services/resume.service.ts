import { fileUploadService } from "./fileUpload.service";
import { parseService } from "./parse.service";
import prisma from "../config/database";

export class ResumeService {
    /**
     * Orchestrates the upload and parsing of a resume file.
     * @param file The uploaded file from Multer
     * @returns The combined result of upload and parsing
     */
    async processResumeUpload(file: Express.Multer.File, userId: string) {
        if (!file) {
            throw new Error("File is required");
        }

        // 1) Upload File
        const uploaded = await fileUploadService.upload(file);

        // 2) Create Resume record in database
        let resume;
        try {
            resume = await prisma.resume.create({
                data: {
                    userId,
                    fileUrl: uploaded.fileUrl,
                    fileName: uploaded.name,
                    mimeType: uploaded.mimeType,
                    appwriteFileId: uploaded.fileId
                }
            });
            console.log('Created resume with ID:', resume.id);
        } catch (error) {
            console.error('Failed to create resume record:', error);
            throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // 3) Parse Resume from file URL using database resume ID
        const parsed = await parseService.parseResume(uploaded.fileUrl, resume.id);

        return {
            uploaded,
            parsed,
            resume
        };
    }

    /**
     * Delete a resume and its uploaded file (if present)
     * @param resumeId Resume id to delete
     */
    async deleteResume(resumeId: string) {
        // Verify resume exists
        const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
        if (!resume) {
            throw new Error(`Resume with id ${resumeId} not found`);
        }

        // Attempt to delete the stored file (best-effort)
        if (resume.appwriteFileId) {
            try {
                await fileUploadService.delete(resume.appwriteFileId);
            } catch (err) {
                console.error(`Failed to delete file ${resume.appwriteFileId}:`, err);
                // Do not block DB deletion; log the error and proceed
            }
        }

        try {
            await prisma.resume.delete({ where: { id: resumeId } });
        } catch (err) {
            console.error('Failed to delete resume record:', err);
            throw new Error('Database deletion failed');
        }
    }
}

export const resumeService = new ResumeService();