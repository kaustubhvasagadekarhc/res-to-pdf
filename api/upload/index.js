import { upload, runMiddleware } from '../../lib/middleware/multer.js';
import { fileUploadService } from '../../lib/services/fileUpload.service.js';
import { parseService } from '../../lib/services/parse.service.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Run multer middleware
    await runMiddleware(req, res, upload.single('file'));

    if (!req.file) {
      return res.status(400).json({ error: 'file is required' });
    }

    // 1) Upload File
    const uploaded = await fileUploadService.upload(req.file);

    // 2) Parse Resume from file URL
    const parsed = await parseService.parseResume(uploaded.fileUrl, uploaded.fileId);

    return res.json({
      uploaded,
      parsed,
    });

  } catch (err) {
    console.error('Upload+Parse Error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}