# Build stage
FROM node:24-alpine AS base

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Copy Prisma schema and config first
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts

# Install dependencies (including devDependencies for build)
# Skip postinstall script during build (DATABASE_URL not available)
RUN npm install --ignore-scripts

# Generate Prisma client with dummy URL (only needed for TypeScript compilation)
RUN DATABASE_URL="postgresql://dummy:dummy@dummy:5432/dummy" npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:24-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache openssl libc6-compat dumb-init

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Copy Prisma schema and config from build stage
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/prisma.config.ts ./prisma.config.ts

# Install only production dependencies, plus dotenv (needed at runtime)
# Keep all runtime JS files and Prisma engines intact so migrations and seeding
# can run inside the container.
# Note: DATABASE_URL will be provided at runtime via environment variable
RUN npm install --only=production --ignore-scripts && \
    npm install dotenv && \
    # Prisma generate will be done at runtime when DATABASE_URL is available
    npm cache clean --force && \
    rm -rf /tmp/* /var/cache/apk/* /root/.npm /root/.cache /root/.node-gyp

# Copy built application
COPY --from=base /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 4000) + '/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Run Prisma generate, migrations, then start the app.
# If migrations fail, still try to start the app (migrations might already be applied)
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy || echo 'Migrations skipped or already applied' && node dist/src/index.js"]
