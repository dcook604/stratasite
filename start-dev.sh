#!/bin/bash
# Script to start both backend and frontend development servers

echo "Starting development servers..."

# Function to safely kill processes on specific ports
cleanup_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pids" ]; then
        echo "  Cleaning up processes on port $port..."
        # First try graceful termination
        echo "$pids" | xargs -r kill -TERM 2>/dev/null
        sleep 1
        # Then force kill if still running
        local remaining=$(lsof -ti:$port 2>/dev/null)
        if [ ! -z "$remaining" ]; then
            echo "$remaining" | xargs -r kill -9 2>/dev/null
        fi
    fi
}

# Kill any existing processes on the required ports
echo "Cleaning up existing processes..."
cleanup_port 3331
cleanup_port 8080
cleanup_port 8081
cleanup_port 8082

echo "Starting backend server..."
mkdir -p logs
npm start > logs/backend.log 2>&1 &
BACKEND_PID=$!

echo "Waiting for backend to start..."
sleep 3

# Check if backend started successfully
if ! ps -p $BACKEND_PID > /dev/null; then
    echo "❌ Backend failed to start. Check logs/backend.log"
    exit 1
fi

echo "Starting frontend development server..."
npm run dev > logs/frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 2

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
    
    # Kill our specific processes
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        kill -TERM $BACKEND_PID 2>/dev/null
    fi
    
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        kill -TERM $FRONTEND_PID 2>/dev/null
    fi
    
    # Give them time to shut down gracefully
    sleep 2
    
    # Force kill if still running
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        kill -9 $BACKEND_PID 2>/dev/null
    fi
    
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        kill -9 $FRONTEND_PID 2>/dev/null
    fi
    
    echo "✅ Servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM EXIT

# Wait for background processes to finish (or until interrupted)
while ps -p $BACKEND_PID > /dev/null 2>&1 && ps -p $FRONTEND_PID > /dev/null 2>&1; do
    sleep 1
done

# If we get here, one of the processes died unexpectedly
echo "❌ One of the servers stopped unexpectedly. Check the logs."
cleanup 