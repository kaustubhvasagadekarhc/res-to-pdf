# Vercel Serverless Deployment Guide

## Final Folder Structure
```
re2pdf/
├── api/
│   ├── index.js                    # GET / 
│   ├── health.js                   # GET /health
│   ├── upload/
│   │   └── index.js               # POST /upload
│   └── generate/
│       └── pdf.js                 # POST /generate/pdf
├── lib/
│   ├── config/
│   │   ├── database.js            # Prisma configuration
│   │   └── appwrite.js            # Appwrite configuration
│   ├── services/
│   │   ├── fileUpload.service.js  # File upload logic
│   │   ├── parse.service.js       # Resume parsing logic
│   │   └── pdfGenerator.service.js # PDF generation logic
│   └── middleware/
│       └── multer.js              # File upload middleware
├── src/assets/                     # Keep logo.png here
├── prisma/                         # Keep existing Prisma files
├── vercel.json                     # Vercel configuration
├── package.json                    # Updated for serverless
├── .env.example                    # Environment template
└── DEPLOYMENT.md                   # This file
```

## API Endpoints (Serverless)
- `GET /api` → Root endpoint
- `GET /api/health` → Health check
- `POST /api/upload` → Upload and parse resume
- `POST /api/generate/pdf` → Generate PDF from resume data

## Deployment Steps

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Set Environment Variables
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

### 3. Test Locally
```bash
npm run dev
# Server runs on http://localhost:3000
```

### 4. Deploy to Vercel
```bash
# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### 5. Set Environment Variables in Vercel Dashboard
Go to your Vercel project dashboard and add these environment variables:
- `DATABASE_URL`
- `APPWRITE_ENDPOINT`
- `APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY`
- `APPWRITE_BUCKET_ID`
- `GEMINI_API_KEY`

## Key Changes Made

### ✅ Removed Express Server Logic
- Removed `app.listen()`, `http.createServer()`
- Converted Express routes to Vercel serverless functions

### ✅ Serverless Function Structure
- Each endpoint is now a separate file in `/api`
- Functions use `export default async function handler(req, res)`

### ✅ Preserved All Middleware
- CORS handling in each endpoint
- Multer file upload with serverless wrapper
- JWT authentication ready (if needed)

### ✅ Database Configuration
- Global Prisma instance reuse for serverless
- Uses `DATABASE_URL` from environment

### ✅ File Structure
- `/api` directory for serverless functions
- `/lib` directory for shared utilities
- Maintained existing `/src/assets` for logo

### ✅ Package.json Updates
- Changed to ES modules (`"type": "module"`)
- Updated scripts for Vercel deployment
- Added deployment script

## Testing Endpoints

### Upload Resume
```bash
curl -X POST https://your-app.vercel.app/api/upload \
  -F "file=@resume.pdf"
```

### Generate PDF
```bash
curl -X POST https://your-app.vercel.app/api/generate/pdf \
  -H "Content-Type: application/json" \
  -d '{"personal":{"name":"John Doe"}}'
```

### Health Check
```bash
curl https://your-app.vercel.app/api/health
```

## Notes
- All functionality preserved from original Express app
- Serverless functions auto-scale and have 30s timeout
- Database connections are optimized for serverless
- CORS enabled for all endpoints
- File uploads work with Multer in serverless environment