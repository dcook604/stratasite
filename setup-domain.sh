#!/bin/bash

# Setup custom domain for Coolify application
set -e

COOLIFY_HOST="http://localhost:8000"
API_TOKEN="2|dcYe6bV3RuV1WZHlfrTHwkzCN4soyU9GUyWsjPvN7dbdedd3"
APP_UUID="sgwoo8koso8cgsgskkc8k4os"
DOMAIN="www.spectrum4.ca"

echo "🌐 Setting up domain: $DOMAIN for Coolify application..."

# Update application with custom domain
RESPONSE=$(curl -s -X PATCH \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  "$COOLIFY_HOST/api/v1/applications/$APP_UUID" \
  -d '{
    "domains": "'$DOMAIN'",
    "fqdn": "'$DOMAIN'"
  }')

echo "Domain setup response: $RESPONSE"

if echo "$RESPONSE" | grep -q "$DOMAIN"; then
    echo "✅ Domain configured successfully!"
    echo "🔗 Your site will be available at: https://$DOMAIN"
    echo ""
    echo "📋 Next steps:"
    echo "1. Ensure DNS points $DOMAIN to your server IP: 38.102.125.145"
    echo "2. Deploy your application in Coolify dashboard"
    echo "3. Enable SSL certificate generation"
else
    echo "⚠️  Domain setup may need manual configuration"
    echo "💡 Please configure domain manually in Coolify dashboard:"
    echo "   1. Go to your stratasite application"
    echo "   2. Add domain: $DOMAIN"
    echo "   3. Enable SSL certificate"
fi