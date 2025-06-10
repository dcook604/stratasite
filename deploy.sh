#!/bin/bash

# Strata Site Deployment Script for Coolify
set -e

APP_NAME="stratasite"
IMAGE_NAME="stratasite:latest"
CONTAINER_NAME="stratasite-container"
PORT=3331
HOST_PORT=3331

echo "🚀 Starting deployment of Strata Site..."

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t $IMAGE_NAME .

# Stop and remove existing container if it exists
echo "🔄 Stopping existing container..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# Create volume for database persistence
echo "💾 Creating database volume..."
docker volume create stratasite-data 2>/dev/null || true

# Run the new container
echo "🎯 Starting new container..."
docker run -d \
  --name $CONTAINER_NAME \
  --restart unless-stopped \
  -p $HOST_PORT:$PORT \
  -v stratasite-data:/app/data \
  -e NODE_ENV=production \
  -e DATABASE_URL="file:/app/data/database.db" \
  $IMAGE_NAME

echo "✅ Deployment complete!"
echo "🌐 Application available at: http://localhost:$HOST_PORT"
echo "🔑 Admin login: http://localhost:$HOST_PORT/admin/login"
echo "📧 Username: admin@example.com"
echo "🔒 Password: admin123"

# Show container status
echo ""
echo "📊 Container status:"
docker ps | grep $CONTAINER_NAME || echo "❌ Container not running"

# Show logs
echo ""
echo "📝 Recent logs:"
docker logs --tail 10 $CONTAINER_NAME