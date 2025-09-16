FROM node:20-alpine AS builder

WORKDIR /app

# Set environment variable to indicate Docker build
ENV DOCKER_BUILD=true

# Copy package files first for better Docker layer caching
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including dev) for building
# Using npm install instead of ci to handle lock file updates
RUN npm install --legacy-peer-deps && npm cache clean --force

# Copy all source files
COPY . .

# Generate Prisma client
RUN npm run db:generate

# Build the application using npm scripts (ensures proper module resolution)
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache sqlite

# Copy package files for production install
COPY package*.json ./

# Install only production dependencies
# Using npm install to handle potential lock file mismatches
RUN npm install --omit=dev --legacy-peer-deps

# Copy built application and necessary files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma/
COPY --from=builder /app/scripts ./scripts/
COPY --from=builder /app/server ./server/
COPY --from=builder /app/server.js ./

# Create data directories for persistence
RUN mkdir -p /app/data/uploads/documents /app/data/uploads/marketplace /app/public/uploads

# Set production environment variables
ENV NODE_ENV=production
ENV DATABASE_URL="file:/app/data/database.db"

# Expose the application port
EXPOSE 3331

# Start command with database setup
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node server.js"]