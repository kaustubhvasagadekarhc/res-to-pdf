# Docker Desktop Startup Guide

## Issue
Docker Desktop is not running or not fully initialized.

## Solution

### Step 1: Start Docker Desktop
1. Look for Docker Desktop icon in your system tray (bottom right)
2. If not there, open Docker Desktop from Start Menu
3. Wait until you see "Docker Desktop is running" in the system tray

### Step 2: Verify Docker is Ready
Open PowerShell and run:
```powershell
docker version
```

You should see both **Client** and **Server** sections. If you only see Client, Docker Desktop is still starting.

### Step 3: Once Docker is Ready

#### Option A: Build and Run with Docker Compose (Recommended)
```powershell
cd "C:\Users\HC_User\Documents\HC-kaustubh\res-to-pdf repo\res-to-pdf"

# Build the image
docker build -t res-to-pdf-app .

# Start with docker-compose (if you have docker-compose files)
# docker-compose up -d
```

#### Option B: Run Container Directly
```powershell
cd "C:\Users\HC_User\Documents\HC-kaustubh\res-to-pdf repo\res-to-pdf"

# Build the image
docker build -t res-to-pdf-app .

# Run with environment variables from .env file
docker run -d --name res-to-pdf-app -p 5001:5001 --env-file .env res-to-pdf-app

# Or run with inline environment variables
docker run -d --name res-to-pdf-app -p 5001:5001 `
  -e APPWRITE_ENDPOINT="https://cloud.appwrite.io/v1" `
  -e APPWRITE_PROJECT_ID="your_project_id" `
  -e APPWRITE_API_KEY="your_api_key" `
  -e APPWRITE_BUCKET_ID="your_bucket_id" `
  -e DATABASE_URL="postgresql://postgres:postgres@host.docker.internal:5432/res_to_pdf" `
  -e JWT_SECRET="your_jwt_secret" `
  -e GEMINI_API_KEY="your_gemini_key" `
  -e PORT=5001 `
  -e NODE_ENV=production `
  res-to-pdf-app
```

### Step 4: Check Container Status
```powershell
# View running containers
docker ps

# View logs
docker logs res-to-pdf-app

# Follow logs in real-time
docker logs -f res-to-pdf-app
```

## Troubleshooting

### If Docker Desktop won't start:
1. Restart your computer
2. Check Windows Services - ensure "Docker Desktop Service" is running
3. Reinstall Docker Desktop if needed

### If you get "port already in use":
```powershell
# Find what's using port 5001
netstat -ano | findstr :5001

# Stop the container
docker stop res-to-pdf-app
docker rm res-to-pdf-app
```

### If container exits immediately:
```powershell
# Check logs for errors
docker logs res-to-pdf-app

# Run container in foreground to see errors
docker run --rm -p 5001:5001 --env-file .env res-to-pdf-app
```

## Quick Test
Once Docker is ready, test with:
```powershell
docker run hello-world
```

If this works, Docker is fully operational!
