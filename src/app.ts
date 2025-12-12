import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import uploadRoutes from './routes/upload.routes';
import pdfRoutes from './routes/pdf.routes';
import authRoutes from './routes/auth.routes';
import { authenticate } from './middleware/auth.middleware';
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger';

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs));

app.get("/api/docs.json", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.send(specs);
});

app.use('/auth', authRoutes);
app.use('/upload', authenticate, uploadRoutes);
app.use('/generate/pdf', authenticate, pdfRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    pid: process.pid,
  });
});

export default app;
