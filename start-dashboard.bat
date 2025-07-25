@echo off
echo Starting Dashboard Servers...
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm start"

echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && npm start"

echo.
echo Servers are starting...
echo Backend: http://localhost:3000
echo Frontend: http://localhost:4200
echo.
echo Press any key to exit this window...
pause > nul 