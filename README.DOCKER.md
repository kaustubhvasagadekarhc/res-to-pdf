# Docker Compose Setup - Full Stack with Database

This docker-compose file runs PostgreSQL database, backend, and frontend services together.

## Prerequisites

- Docker installed on your system
- Docker Compose installed

## Quick Start

### Step 1: Create Environment Files

**Root .env file** (optional, for docker-compose port configuration):
```bash
POSTGRES_PORT=5433
BACKEND_PORT=4000
FRONTEND_PORT=3002
NODE_ENV=production
```

**Backend .env file** (`res-to-pdf/.env`):
```bash
DATABASE_URL=postgresql://postgres:password@postgres:5432/res_to_pdf
NODE_ENV=production
PORT=4000
# Add other backend-specific environment variables
# JWT_SECRET=your-secret-key
# etc.
```

**Frontend .env file** (`res-to-pdf-frontend/.env`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
NODE_ENV=production
```

### Step 2: Build and Run

```bash
# From the root directory (where docker-compose.yml is located)
docker-compose up -d

# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f postgres
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Step 3: Access the Application

- **Frontend**: http://localhost:3002
- **Backend API**: http://localhost:4000
- **Backend Health Check**: http://localhost:4000/health
- **PostgreSQL**: localhost:5433 (user: postgres, password: password, db: res_to_pdf)

## Services

### PostgreSQL Database
- **Container Name**: `res-to-pdf_postgres`
- **Port**: 5433 (configurable via `POSTGRES_PORT`)
- **Database**: `res_to_pdf`
- **User**: `postgres`
- **Password**: `password`
- **Health Check**: Enabled
- **Volume**: `postgres_data` (persistent storage)

### Backend Service
- **Container Name**: `res-to-pdf-backend`
- **Port**: 4000 (configurable via `BACKEND_PORT`)
- **Health Check**: Enabled
- **Auto Migrations**: Runs Prisma migrations on startup
- **Depends On**: PostgreSQL (waits for database to be healthy)
- **Location**: `./res-to-pdf`

### Frontend Service
- **Container Name**: `res-to-pdf-frontend`
- **Port**: 3002 (configurable via `FRONTEND_PORT`)
- **Depends On**: Backend (waits for backend to be healthy)
- **Location**: `./res-to-pdf-frontend`

## Common Commands

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### Stop and Remove Volumes (⚠️ This will delete database data)
```bash
docker-compose down -v
```

### Restart Services
```bash
docker-compose restart
```

### Rebuild After Code Changes
```bash
docker-compose up -d --build
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f postgres
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Check Service Status
```bash
docker-compose ps
```

### Check Health Status
```bash
# Check if all services are healthy
docker-compose ps
```

### Execute Commands in Container
```bash
# PostgreSQL
docker exec -it res-to-pdf_postgres psql -U postgres -d res_to_pdf

# Backend
docker exec -it res-to-pdf-backend sh

# Frontend
docker exec -it res-to-pdf-frontend sh
```

## Database Management

### Connect to PostgreSQL
```bash
# Using docker exec
docker exec -it res-to-pdf_postgres psql -U postgres -d res_to_pdf

# Or using external client
# Host: localhost
# Port: 5433
# User: postgres
# Password: password
# Database: res_to_pdf
```

### Run Prisma Migrations Manually
```bash
docker exec -it res-to-pdf-backend npx prisma migrate deploy
```

### Run Prisma Studio
```bash
docker exec -it res-to-pdf-backend npx prisma studio
# Access at http://localhost:5555 (if port forwarded)
```

### Backup Database
```bash
docker exec res-to-pdf_postgres pg_dump -U postgres res_to_pdf > backup.sql
```

### Restore Database
```bash
docker exec -i res-to-pdf_postgres psql -U postgres res_to_pdf < backup.sql
```

## Environment Variables

### PostgreSQL Environment Variables
Set in docker-compose.yml or root `.env`:
- `POSTGRES_USER` - Database user (default: postgres)
- `POSTGRES_PASSWORD` - Database password (default: password)
- `POSTGRES_DB` - Database name (default: res_to_pdf)
- `POSTGRES_PORT` - Host port (default: 5433)

### Backend Environment Variables
Set in `res-to-pdf/.env`:
- `DATABASE_URL` - PostgreSQL connection string
  - For Docker: `postgresql://postgres:password@postgres:5432/res_to_pdf`
  - For local: `postgresql://postgres:password@localhost:5433/res_to_pdf`
- `PORT` - Backend port (default: 4000)
- `NODE_ENV` - Environment (production/development)
- Other backend-specific variables

### Frontend Environment Variables
Set in `res-to-pdf-frontend/.env`:
- `NEXT_PUBLIC_API_URL` - Backend API URL
  - For browser: `http://localhost:4000`
  - For server-side: `http://backend:4000`
- `NODE_ENV` - Environment

## Networking

All services are on the same Docker network (`app-network`), so they can communicate using service names:
- Backend can reach database at: `postgres:5432`
- Frontend can reach backend at: `http://backend:4000`
- Backend can reach frontend at: `http://frontend:3000`

## Troubleshooting

### Port Already in Use
If ports are already in use, change them in root `.env`:
```bash
POSTGRES_PORT=5434
BACKEND_PORT=4001
FRONTEND_PORT=3003
```

### Database Connection Issues
1. Check if PostgreSQL is healthy:
   ```bash
   docker-compose ps
   ```

2. Verify `DATABASE_URL` in backend `.env`:
   - For Docker network: `postgresql://postgres:password@postgres:5432/res_to_pdf`
   - Service name `postgres` is used instead of `localhost`

3. Check database logs:
   ```bash
   docker-compose logs postgres
   ```

### Backend Health Check Failing
1. Check backend logs:
   ```bash
   docker-compose logs backend
   ```

2. Ensure the `/health` endpoint exists in your backend

3. Check if migrations ran successfully:
   ```bash
   docker-compose logs backend | grep -i migration
   ```

### Frontend Can't Connect to Backend
1. Check that backend is healthy:
   ```bash
   docker-compose ps
   ```

2. Verify `NEXT_PUBLIC_API_URL` in frontend `.env`:
   - For browser access: `http://localhost:4000`
   - For server-side: `http://backend:4000`

### Database Data Persistence
Database data is stored in the `postgres_data` volume. To reset:
```bash
# Stop and remove volumes (⚠️ deletes all data)
docker-compose down -v

# Start fresh
docker-compose up -d
```

### Rebuild Everything
```bash
# Stop and remove everything
docker-compose down -v

# Remove images
docker rmi res-to-pdf-backend res-to-pdf-frontend

# Rebuild and start
docker-compose up -d --build
```

## Production Deployment

For production:
1. **Change default passwords** in docker-compose.yml
2. Use proper secrets management (Docker secrets, environment files)
3. Set up a reverse proxy (nginx/traefik)
4. Use managed database service or configure proper backups
5. Enable HTTPS
6. Set proper resource limits in docker-compose.yml
7. Use environment-specific configuration files

## File Structure

```
.
├── docker-compose.yml          # Main compose file
├── .env                        # Root environment variables (optional)
├── res-to-pdf/
│   ├── Dockerfile             # Backend Dockerfile
│   └── .env                   # Backend environment variables
└── res-to-pdf-frontend/
    ├── Dockerfile             # Frontend Dockerfile
    └── .env                   # Frontend environment variables
```

## Testing the Setup

### 1. Check all services are running
```bash
docker-compose ps
```

All services should show "Up" and "healthy" status.

### 2. Test Backend Health
```bash
curl http://localhost:4000/health
```

### 3. Test Frontend
Open browser: http://localhost:3002

### 4. Test Database Connection
```bash
docker exec -it res-to-pdf_postgres psql -U postgres -d res_to_pdf -c "SELECT version();"
```

### 5. Check Logs
```bash
docker-compose logs -f
```

## Security Notes

⚠️ **Important**: The default passwords in this setup are for development only. For production:
- Change `POSTGRES_PASSWORD` to a strong password
- Use Docker secrets or environment variable files
- Never commit `.env` files with real credentials
- Use strong JWT secrets
- Configure proper CORS and security headers
