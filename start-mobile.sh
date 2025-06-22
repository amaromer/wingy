#!/bin/bash

# Find local IP address
echo "🔍 Finding your local IP address..."
LOCAL_IP=$(hostname -I | awk '{print $1}')
echo "📱 Your local IP address is: $LOCAL_IP"
echo ""

# Start backend server
echo "🚀 Starting backend server..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo "🎨 Starting frontend server..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

# Wait a moment for frontend to start
sleep 5

echo ""
echo "✅ Servers are running!"
echo ""
echo "📱 Mobile Access URLs:"
echo "   Frontend: http://$LOCAL_IP:4200"
echo "   Backend:  http://$LOCAL_IP:3000"
echo ""
echo "💻 Local Access URLs:"
echo "   Frontend: http://localhost:4200"
echo "   Backend:  http://localhost:3000"
echo ""
echo "🔧 To stop servers, press Ctrl+C"
echo ""

# Wait for user to stop
wait 