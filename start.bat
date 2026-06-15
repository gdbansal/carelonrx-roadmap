@echo off
echo ========================================
echo   CarelonRx Product Roadmap
echo   Starting Application...
echo ========================================
echo.

cd backend

echo Checking dependencies...
if not exist "node_modules\" (
    echo Installing backend dependencies...
    call npm install
    echo.
)

echo Starting backend server...
echo Backend API will run on http://localhost:5000
echo.
start cmd /k "npm start"

timeout /t 3 /nobreak >nul

echo Opening application in browser...
start http://localhost:5000/../frontend/login.html

echo.
echo ========================================
echo   Application Started!
echo ========================================
echo.
echo Backend API: http://localhost:5000
echo Frontend: Open frontend/login.html
echo.
echo Demo Credentials:
echo   Username: admin
echo   Password: admin123
echo.
echo Press any key to exit this window...
pause >nul
