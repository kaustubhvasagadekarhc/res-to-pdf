import { fileUploadService } from './fileUpload.service';
import { parseService } from './parse.service';
import prisma from '../config/database';
import { activityService } from './activity.service';
// import { parseResumeWithVertexAI } from './vertexAI.service';

export class ResumeService {
  /**
   * Orchestrates the upload and parsing of a resume file.
   * @param file The uploaded file from Multer
   * @returns The combined result of upload and parsing
   */
  async processResumeUpload(
    file: Express.Multer.File,
    userId: string,
    parseType: 'quick' | 'inferred' | 'generative' = 'quick'
  ) {
    if (!file) {
      throw new Error('File is required');
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
          appwriteFileId: uploaded.fileId,
        },
      });
      console.log('Created resume with ID:', resume.id);
    } catch (error) {
      console.error('Failed to create resume record:', error);
      throw new Error(
        `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

        // 3) Parse Resume from file URL using database resume ID
        const parsed = await parseService.parseResume(uploaded.fileUrl, resume.id, parseType);

        // Log activity
        await activityService.logActivity(userId, 'UPLOAD_RESUME', `Uploaded resume: ${uploaded.name}`, { resumeId: resume.id });

        return {
            uploaded,
            parsed,
            resume
        };
    }

 
}

export const resumeService = new ResumeService();