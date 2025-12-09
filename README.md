# Minimal Backend (TypeScript + Express)

## Install
npm ci

## Run in dev
npm run dev
# server runs on http://localhost:3000

## Build + Run
npm run build
npm start

## Endpoints
GET  /health
GET  /items
POST /items         { name: string, description?: string, meta?: object }
GET  /items/:id
PUT  /items/:id     { name?, description?, meta? }
DELETE /items/:id

## Docker
docker build -t minimal-backend .
docker run -p 3000:3000 minimal-backend
