import { Request, Response } from 'express';
import { recommendationService } from '../services/recommendation.service';

export const analyzeResume = async (req: Request, res: Response) => {
    try {
        const resumeData = req.body;

        if (!resumeData || Object.keys(resumeData).length === 0) {
            res.status(400).json({
                status: 'error',
                message: 'No resume data provided. Please send the parsed resume JSON in the body.'
            });
            return;
        }

        const analysis = await recommendationService.analyzeResume(resumeData);

        res.json({
            status: 'success',
            data: analysis
        });
    } catch (error) {
        console.error('Analysis Error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to analyze resume'
        });
    }
};
