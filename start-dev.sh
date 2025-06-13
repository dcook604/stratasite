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
mkdir -p logs
npm start > logs/backend.log 2>&1 &
BACKEND_PID=$!

echo "Waiting for backend to start..."
sleep 3

echo "Starting frontend development server..."
npm run dev > logs/frontend.log 2>&1 &
FRONTEND_PID=$!

echo ""
echo "🚀 Development servers starting:"
echo "   Backend API: http://localhost:3331"
echo "   Frontend: http://localhost:8080 (or next available port)"
echo ""
echo "📝 Logs are being written to:"
echo "   Backend: logs/backend.log"
echo "   Frontend: logs/frontend.log"
echo ""
echo "💡 To view logs in real-time:"
echo "   tail -f logs/backend.log"
echo "   tail -f logs/frontend.log"
echo "   OR use: ./view-logs.sh"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for any background job to finish
wait 