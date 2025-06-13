#!/bin/bash
# Script to view and monitor application logs

echo "🔍 Strata Compass Web - Log Viewer"
echo "=================================="
echo ""

# Check if running in container or development
if [ -f /.dockerenv ]; then
    echo "📦 Running in Docker container"
    LOG_CMD="tail -f /proc/1/fd/1 /proc/1/fd/2"
else
    echo "💻 Running in development mode"
    # Check if server is running
    if ! pgrep -f "node server.js" > /dev/null; then
        echo "❌ Server is not running. Start it with './start-dev.sh' or 'npm start'"
        exit 1
    fi
    
    # Get the PID of the server process
    SERVER_PID=$(pgrep -f "node server.js")
    echo "📊 Server PID: $SERVER_PID"
    
    # Use journalctl if available, otherwise fallback to generic monitoring
    if command -v journalctl &> /dev/null; then
        LOG_CMD="journalctl -f _PID=$SERVER_PID"
    else
        # Fallback: monitor the process output (limited functionality)
        echo "⚠️  Limited logging capability in this environment"
        echo "💡 For better logging, run: './start-dev.sh > logs/app.log 2>&1 &'"
        echo "   Then use: tail -f logs/app.log"
        exit 1
    fi
fi

echo ""
echo "📝 Monitoring logs... (Ctrl+C to stop)"
echo "---"
echo ""

# Create logs directory if it doesn't exist
mkdir -p logs

# Start log monitoring
exec $LOG_CMD 