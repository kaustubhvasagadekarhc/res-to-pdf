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

// CORS configuration for cookie-based authentication
const allowedOrigins = [
  'http://localhost:3000',
  'https://res-to-pdf.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // CRITICAL: This allows cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie'],
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
