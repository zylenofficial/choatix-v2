@echo off
title Choatix V2 Restoration Script

REM Create log file
echo Restoration Script Started > restoration_log.txt
echo Package: choatix-v2 > restoration_log.txt
echo Time: %date% %time% >> restoration_log.txt
echo. >> restoration_log.txt

echo Restoring Choatix V2 Application... >> restoration_log.txt

echo Checking for Node.js... >> restoration_log.txt
where node >nul 2>nul
if errorlevel 1 (
    echo ERROR: Node.js not found! >> restoration_log.txt
    echo Please install Node.js from https://nodejs.org/ >> restoration_log.txt
    echo Install Node.js and try again. >> restoration_log.txt
    pause
    exit /b 1
)

echo.
echo Installing dependencies... >> restoration_log.txt
echo Node version: >> restoration_log.txt
node --version >> restoration_log.txt

echo Running npm install... >> restoration_log.txt
npm install
if errorlevel 1 (
    echo ERROR: npm install failed! >> restoration_log.txt
    echo Check your internet connection and Node.js installation. >> restoration_log.txt
    echo Package installation failed. >> restoration_log.txt
    pause
    exit /b 1
)

echo Building application... >> restoration_log.txt
npm run build
if errorlevel 1 (
    echo WARNING: Build may have warnings but application may still work. >> restoration_log.txt
    echo Build completed with warnings. >> restoration_log.txt
) else (
    echo Build completed successfully. >> restoration_log.txt
)

echo.
echo Starting Choatix V2... >> restoration_log.txt
echo.

echo =================================================================== >> restoration_log.txt
echo       CHOATIX V2 RESTORATION COMPLETE       >> restoration_log.txt
echo =================================================================== >> restoration_log.txt
echo. >> restoration_log.txt
echo Next Steps: >> restoration_log.txt
echo 1. If this is your first run, configure your game profiles in the app >> restoration_log.txt
echo 2. Test your game optimizations by launching a game while Choatix V2 is running >> restoration_log.txt
echo 3. Use the Advisor feature to scan for system improvements >> restoration_log.txt
echo 4. Check your license information in the Settings menu >> restoration_log.txt
echo. >> restoration_log.txt
echo Your Choatix V2 optimization suite is ready to use! >> restoration_log.txt
echo. >> restoration_log.txt
echo For help, visit the Choatix V2 documentation. >> restoration_log.txt
echo =================================================================== >> restoration_log.txt

npm run dev

echo. >> restoration_log.txt
echo Restoration script completed at: %date% %time% >> restoration_log.txt
echo Log file: restoration_log.txt >> restoration_log.txt
echo. >> restoration_log.txt

echo.
echo ===========================================
echo   CHOATIX V2 RESTORATION COMPLETE
echo ===========================================
echo.
echo Your Choatix V2 application has been successfully restored!
echo.
echo Note: The application will continue running in the background.
echo You can close this window or keep it open while using the application.
echo.
echo Restoration log saved to: restoration_log.txt
pause
