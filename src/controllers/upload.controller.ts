import { Request, Response } from 'express';
import { resumeService } from '../services/resume.service';

export const uploadResume = async (req: Request, res: Response) => {
    try {
        if (!req.file) return res.status(400).json({ error: "file is required" });

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "User not authenticated" });

        const result = await resumeService.processResumeUpload(req.file, userId);

        return res.json(result);

    } catch (err: unknown) {
        console.error("Upload+Parse Error:", err);
        const message = err instanceof Error ? err.message : "Unknown error";
        return res.status(500).json({ error: message });
    }
};
