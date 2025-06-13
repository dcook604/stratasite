#!/bin/bash
# Script to start both backend and frontend development servers

echo "Starting development servers..."

# Kill any existing processes on the required ports
echo "Cleaning up existing processes..."
lsof -ti:3331 | xargs -r kill -9
lsof -ti:8080 | xargs -r kill -9
lsof -ti:8081 | xargs -r kill -9
lsof -ti:8082 | xargs -r kill -9

echo "Starting backend server..."
npm start &

echo "Waiting for backend to start..."
sleep 3

echo "Starting frontend development server..."
npm run dev &

echo ""
echo "🚀 Development servers starting:"
echo "   Backend API: http://localhost:3331"
echo "   Frontend: http://localhost:8080 (or next available port)"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for any background job to finish
wait 