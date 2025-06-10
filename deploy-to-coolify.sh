#!/bin/bash

# Deploy to Coolify via API
set -e

COOLIFY_HOST="http://localhost:8000"
# Get your API token from: http://localhost:8000/security/api-tokens
API_TOKEN="${COOLIFY_API_TOKEN:-}"

if [ -z "$API_TOKEN" ]; then
    echo "❌ Error: COOLIFY_API_TOKEN environment variable not set"
    echo ""
    echo "📝 To get your API token:"
    echo "1. Open: $COOLIFY_HOST/security/api-tokens"
    echo "2. Create a new API token"
    echo "3. Run: export COOLIFY_API_TOKEN='your_token_here'"
    echo "4. Then run this script again"
    echo ""
    echo "🔧 Alternative: Edit this script and set API_TOKEN directly"
    exit 1
fi

echo "🚀 Deploying Strata Site to Coolify..."
echo "📍 Coolify Host: $COOLIFY_HOST"
echo "📦 Repository: https://github.com/dcook604/stratasite"

# Note: This is a template - actual API endpoints vary by Coolify version
# You may need to adjust based on your Coolify version

echo ""
echo "⚠️  Manual Setup Required:"
echo "1. Open: $COOLIFY_HOST"
echo "2. Create new Application"
echo "3. Use these settings:"
echo "   - Repository: https://github.com/dcook604/stratasite"
echo "   - Branch: main"
echo "   - Port: 3331"
echo "   - Dockerfile: ./Dockerfile"
echo "   - Environment:"
echo "     NODE_ENV=production"
echo "     DATABASE_URL=file:/app/data/database.db"
echo "   - Volume: /app/data -> /app/data"
echo ""
echo "📚 Coolify will handle the rest automatically!"