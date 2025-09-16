FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including dev) for building
RUN npm install --legacy-peer-deps

# Copy all source files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application (using npx for reliability)
RUN npx vite build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache sqlite

# Copy package files for production install
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production --legacy-peer-deps

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