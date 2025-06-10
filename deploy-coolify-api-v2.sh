#!/bin/bash

# Deploy to Coolify via API v2
set -e

COOLIFY_HOST="http://localhost:8000"
API_TOKEN="2|dcYe6bV3RuV1WZHlfrTHwkzCN4soyU9GUyWsjPvN7dbdedd3"

echo "🚀 Deploying Strata Site to Coolify via API..."

# First, let's get available projects and servers
echo "📋 Getting projects and servers..."

PROJECTS=$(curl -s -H "Authorization: Bearer $API_TOKEN" \
  -H "Accept: application/json" \
  "$COOLIFY_HOST/api/v1/projects" || echo "[]")

echo "Available projects: $PROJECTS"

SERVERS=$(curl -s -H "Authorization: Bearer $API_TOKEN" \
  -H "Accept: application/json" \
  "$COOLIFY_HOST/api/v1/servers" || echo "[]")

echo "Available servers: $SERVERS"

# Get the Website project and server UUIDs
PROJECT_UUID=$(echo "$PROJECTS" | jq -r '.[] | select(.name | test("Website"; "i")) | .uuid // empty' 2>/dev/null || echo "")
if [ -z "$PROJECT_UUID" ]; then
    PROJECT_UUID=$(echo "$PROJECTS" | jq -r '.[0].uuid // empty' 2>/dev/null || echo "")
fi
SERVER_UUID=$(echo "$SERVERS" | jq -r '.[0].uuid // empty' 2>/dev/null || echo "")

if [ -z "$PROJECT_UUID" ] || [ -z "$SERVER_UUID" ]; then
    echo "❌ Could not get project or server UUID. Creating application manually..."
    echo ""
    echo "📝 Manual setup required:"
    echo "1. Open: $COOLIFY_HOST"
    echo "2. Create new Application with these settings:"
    echo "   - Type: Public Repository"
    echo "   - Repository: https://github.com/dcook604/stratasite"
    echo "   - Branch: main"
    echo "   - Build Pack: dockerfile"
    echo "   - Port: 3331"
    echo "   - Environment Variables:"
    echo "     NODE_ENV=production"
    echo "     DATABASE_URL=file:/app/data/database.db"
    echo "   - Volume: /app/data -> /app/data"
    exit 1
fi

echo "📦 Creating application..."
echo "Project UUID: $PROJECT_UUID"
echo "Server UUID: $SERVER_UUID"

# Try to create an environment first if needed
echo "🔧 Ensuring environment exists..."
ENV_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  "$COOLIFY_HOST/api/v1/projects/$PROJECT_UUID/environments" \
  -d '{
    "name": "production"
  }' 2>/dev/null || echo '{}')

echo "Environment creation response: $ENV_RESPONSE"

# Create the application
RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  "$COOLIFY_HOST/api/v1/applications/public" \
  -d '{
    "project_uuid": "'$PROJECT_UUID'",
    "server_uuid": "'$SERVER_UUID'",
    "environment_name": "production",
    "git_repository": "https://github.com/dcook604/stratasite",
    "git_branch": "main",
    "name": "stratasite",
    "build_pack": "dockerfile",
    "ports_exposes": "3331"
  }')

echo "API Response: $RESPONSE"

if echo "$RESPONSE" | grep -q "uuid"; then
    echo "✅ Application created successfully!"
    APP_UUID=$(echo "$RESPONSE" | jq -r '.uuid // empty' 2>/dev/null || echo "")
    
    if [ -n "$APP_UUID" ]; then
        echo "🚀 Starting deployment..."
        DEPLOY_RESPONSE=$(curl -s -X GET \
          -H "Authorization: Bearer $API_TOKEN" \
          -H "Accept: application/json" \
          "$COOLIFY_HOST/api/v1/applications/$APP_UUID/deploy")
        
        echo "Deploy Response: $DEPLOY_RESPONSE"
        echo "✅ Deployment initiated!"
        echo "📊 Check deployment status in Coolify dashboard: $COOLIFY_HOST"
    fi
else
    echo "❌ Failed to create application. Response: $RESPONSE"
    echo ""
    echo "🔧 Try manual setup instead:"
    echo "1. Open: $COOLIFY_HOST"
    echo "2. Create new Application manually"
fi