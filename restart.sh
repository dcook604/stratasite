#!/bin/bash
# A script to stop any running server on port 3331 and restart it.

echo "Attempting to stop any process on port 3331..."

# Get the process ID (PID) of the process using TCP port 3331
PID=$(lsof -t -i:3331)

if [ -z "$PID" ]; then
  echo "No process was found running on port 3331."
else
  echo "Process with PID $PID found. Terminating it now."
  kill -9 $PID
  echo "Process terminated."
fi

echo "Starting the server..."
npm start 