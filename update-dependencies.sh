#!/bin/bash

# Script to update dependencies and regenerate package-lock.json
# This should be run locally after updating package.json dependencies

echo "Updating dependencies and regenerating package-lock.json..."

# Remove existing lock file
rm -f package-lock.json

# Clear npm cache
npm cache clean --force

# Install dependencies and regenerate lock file
npm install --legacy-peer-deps

echo "Dependencies updated. Don't forget to commit the updated package-lock.json!"
