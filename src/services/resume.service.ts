import { fileUploadService } from "./fileUpload.service";
import { parseService } from "./parse.service";

export class ResumeService {
    /**
     * Orchestrates the upload and parsing of a resume file.
     * @param file The uploaded file from Multer
     * @returns The combined result of upload and parsing
     */
    async processResumeUpload(file: Express.Multer.File) {
        if (!file) {
            throw new Error("File is required");
        }

        // 1) Upload File
        const uploaded = await fileUploadService.upload(file);

        // 2) Parse Resume from file URL
        const parsed = await parseService.parseResume(uploaded.fileUrl, uploaded.fileId);

        return {
            uploaded,
            parsed,
        };
    }
}

export const resumeService = new ResumeService();
