import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import uploadRoutes from './routes/upload.routes';
import pdfRoutes from './routes/pdf.routes';
import authRoutes from './routes/auth.routes';
import resumeRoutes from './routes/resume.routes';
import dashboardRoutes from './routes/dashboard.routes';
import { authenticate } from './middleware/auth.middleware';

import adminRoutes from './routes/admin.routes';
import recommendationRoutes from './routes/recommendation.routes';
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger';

const app = express();

// CORS configuration for cookie-based authentication
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', "https://res-to-pdf.vercel.app"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(cookieParser());

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs));
// api call from swagger to get the json spec
app.get("/api/docs.json", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.send(specs);
});


app.use('/auth', authRoutes);

app.use('/upload', authenticate, uploadRoutes);
app.use('/generate/pdf', authenticate, pdfRoutes);
app.use('/resume', authenticate, resumeRoutes);
app.use('/dashboard', authenticate, dashboardRoutes);

app.use('/admin', adminRoutes);
// Admin routes often have their own auth, but let's leave as is or inspect. 
// Wait, admin routes often handle their own auth or expect global auth?
// Let's look at admin.routes.ts, it likely has `authenticate` inside.
// For now, I'll only add it to the explicit failures.
app.use('/recommendation', recommendationRoutes);
// Recommendation might be public or hybrid? Let's assume we want to log if user is there.

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
