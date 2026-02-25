import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import uploadRoutes from './routes/upload.routes';
import uploadVertexRoutes from './routes/uploadVertex.routes';
import pdfRoutes from './routes/pdf.routes';
import authRoutes from './routes/auth.routes';
import resumeRoutes from './routes/resume.routes';
import dashboardRoutes from './routes/dashboard.routes';
import { authenticate } from './middleware/auth.middleware';
import adminRoutes from './routes/admin.routes';
import recommendationRoutes from './routes/recommendation.routes';
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger';
import { globalErrorHandler } from './middleware/errorHandler';
import { generalLimiter, authLimiter } from './middleware/rateLimiter';

const app = express();

// Security headers
app.use(helmet());

// Request logging
app.use(morgan('combined'));

// Rate limiting
app.use(generalLimiter);

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:3000'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs));
app.get("/api/docs.json", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.send(specs);
});

app.use('/auth', authLimiter, authRoutes);

app.use('/upload', authenticate, uploadRoutes);
app.use('/upload/vertex', authenticate, uploadVertexRoutes);
app.use('/generate/pdf', authenticate, pdfRoutes);
app.use('/resume', authenticate, resumeRoutes);
app.use('/dashboard', authenticate, dashboardRoutes);

app.use('/admin', adminRoutes);
app.use('/recommendation', recommendationRoutes);

app.get('/', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    pid: process.pid,
  });
});

// Global error handler — must be last
app.use(globalErrorHandler);

export default app;
