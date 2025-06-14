FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client and build
RUN npm run db:generate
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Install sqlite3
RUN apk add --no-cache sqlite

# Copy built application and server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma/
COPY --from=builder /app/scripts ./scripts/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server.js ./

# Create data directory for SQLite and persistent uploads
RUN mkdir -p /app/data/uploads/documents /app/data/uploads/marketplace /app/public/uploads/marketplace

# Set environment variables
ENV NODE_ENV=production
ENV DATABASE_URL="file:/app/data/database.db"

# Expose port
EXPOSE 3331

# Start command - push schema changes then start the server
CMD ["sh", "-c", "npx prisma db push && npm start"]