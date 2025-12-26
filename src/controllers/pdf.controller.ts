import { Request, Response } from 'express';
import { pdfGeneratorService } from '../services/pdfGenerator.service';

export const generatePdf = async (req: Request, res: Response) => {
    try {
        const resumeData = req.body;
        const userId = req.user?.id;

        if (!resumeData) {
            return res.status(400).json({ error: 'Resume data is required' });
        }

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        await pdfGeneratorService.generatePDF(resumeData, res, userId);
    } catch (err: unknown) {
        console.error('PDF Generation Error:', err);
        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json({ error: message });
    }
};
