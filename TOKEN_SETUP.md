# Token Setup Guide

## Overview
The application uses JWT (JSON Web Token) authentication to secure API endpoints. Tokens are automatically fetched and managed by the frontend.

## How It Works

### Frontend (Automatic)
- The frontend automatically fetches a token from `/auth/token` endpoint when the page loads
- The token is stored in `sessionStorage` (more secure - cleared when tab closes) and reused for subsequent requests
- If token fetch fails, an error is shown immediately before any upload attempt
- Token is included in the `Authorization` header for all API requests

**Security Note:** We use `sessionStorage` instead of `localStorage` for better security:
- Tokens are automatically cleared when the browser tab/window is closed
- Reduces risk of token theft from shared computers or browser extensions
- Tokens still persist during the session for convenience

### Backend Configuration

#### Required Environment Variables

Create a `.env` file in the `res-to-pdf` directory with the following variables:

```env
# JWT Secret Key (REQUIRED)
# Generate a strong random secret key for JWT signing
JWT_SECRET=your_strong_random_secret_key_here

# Other required environment variables
GEMINI_API_KEY=your_gemini_api_key
APPWRITE_ENDPOINT=your_appwrite_endpoint
APPWRITE_PROJECT_ID=your_appwrite_project_id
APPWRITE_API_KEY=your_appwrite_api_key
APPWRITE_BUCKET_ID=your_appwrite_bucket_id
DATABASE_URL=your_database_connection_string
PORT=4000
```

#### Generating a JWT Secret

You can generate a secure random secret using:

**Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**OpenSSL:**
```bash
openssl rand -hex 32
```

**Online:**
Use any secure random string generator (at least 32 characters)

## API Endpoints

### Get Token
```
GET /auth/token
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h"
}
```

### Upload Resume (Requires Token)
```
POST /upload
Headers:
  Authorization: Bearer <token>
Body:
  FormData with 'file' field
```

## Manual Token Usage

If you need to use the API manually (e.g., with curl or Postman):

1. **Get a token:**
```bash
curl https://res-to-pdf.vercel-app.app/auth/token
```

2. **Use the token in requests:**
```bash
curl -X POST https://res-to-pdf-app.vercel.app/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@resume.pdf"
```

## Troubleshooting

### "Access token required" Error
- **Frontend**: Token should be fetched automatically. If error persists, check browser console and ensure `/auth/token` endpoint is accessible
- **Backend**: Ensure `JWT_SECRET` is set in environment variables

### "Invalid or expired token" Error
- Token expires after 24 hours
- Frontend automatically fetches a new token when needed
- Close and reopen the browser tab to clear `sessionStorage` if issues persist

### Token Not Being Sent
- Check browser's Network tab to verify `Authorization` header is included
- Ensure token is stored in `sessionStorage` (check Application tab in DevTools → Session Storage)
- Note: `sessionStorage` is cleared when the tab closes, so token will be fetched again on next visit

