@echo off
echo 🔍 Finding your local IP address...

REM Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /r /c:"IPv4 Address"') do (
    set LOCAL_IP=%%a
    goto :found_ip
)
:found_ip
set LOCAL_IP=%LOCAL_IP: =%
echo 📱 Your local IP address is: %LOCAL_IP%
echo.

echo 🚀 Starting backend server...
start "Backend Server" cmd /k "cd backend && npm start"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

echo 🎨 Starting frontend server...
start "Frontend Server" cmd /k "cd frontend && npm start"

REM Wait a moment for frontend to start
timeout /t 5 /nobreak >nul

echo.
echo ✅ Servers are running!
echo.
echo 📱 Mobile Access URLs:
echo    Frontend: http://%LOCAL_IP%:4200
echo    Backend:  http://%LOCAL_IP%:3000
echo.
echo 💻 Local Access URLs:
echo    Frontend: http://localhost:4200
echo    Backend:  http://localhost:3000
echo.
echo 🔧 Close the server windows to stop them
echo.
pause 