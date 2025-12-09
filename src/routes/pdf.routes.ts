import { Router } from 'express';
import path from 'path';
import { pdfGeneratorService } from '../services/pdfGenerator.service';

const router = Router();

router.post('/', (req, res) => {
  try {
    const resumeData = req.body;

    if (!resumeData) {
      return res.status(400).json({ error: 'Resume data is required' });
    }

    const logoPath = path.join(__dirname, '../assets/logo.png');
    pdfGeneratorService.generatePDF(resumeData, res, logoPath);
  } catch (err: unknown) {
    console.error('PDF Generation Error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
});

export default router;
