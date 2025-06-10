#!/bin/bash

# Coolify API Deployment Script
set -e

# Configuration
COOLIFY_HOST="http://localhost:8000"  # Adjust if different
API_TOKEN=""  # You'll need to get this from Coolify dashboard
PROJECT_NAME="stratasite"
REPO_URL="https://github.com/dcook604/stratasite"

echo "🚀 Deploying to Coolify via API..."

if [ -z "$API_TOKEN" ]; then
    echo "❌ Error: API_TOKEN not set"
    echo "💡 Get your API token from: $COOLIFY_HOST/security/api-tokens"
    echo "💡 Then edit this script and set API_TOKEN variable"
    exit 1
fi

# Create application via API
echo "📦 Creating application in Coolify..."

# Note: This is a template - actual API endpoints may vary
# You'll need to check your Coolify version's API documentation
curl -X POST "$COOLIFY_HOST/api/v1/applications" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "'$PROJECT_NAME'",
    "repository": "'$REPO_URL'",
    "branch": "main",
    "port": 3331,
    "dockerfile": "./Dockerfile",
    "environment": {
      "NODE_ENV": "production",
      "DATABASE_URL": "file:/app/data/database.db"
    }
  }'

echo "✅ Application created! Check Coolify dashboard for deployment status."