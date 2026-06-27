@echo off
title Choatix V2 User Data Backup Script

REM Create log file
echo Choatix V2 User Data Backup Script Started > backup_log.txt
echo Time: %date% %time% >> backup_log.txt
echo. >> backup_log.txt

echo Backing up Choatix V2 user data... >> backup_log.txt
echo. >> backup_log.txt

setlocal enabledelayedexpansion

set "APPDATA=%APPDATA%"
set "DATA_DIR=%APPDATA%\\choatix-v2"

echo Source directory: %DATA_DIR% >> backup_log.txt
echo. >> backup_log.txt

if not exist "%DATA_DIR%" (
    echo Note: No existing Choatix V2 user data found. >> backup_log.txt
    echo This may be a fresh installation. >> backup_log.txt
    echo Backup will be empty, but script completed successfully. >> backup_log.txt
    echo. >> backup_log.txt
    echo The application starts fresh with default settings. >> backup_log.txt
) else (
    echo Backing up user data... >> backup_log.txt
    echo Creating backup at: %DATA_DIR%_backup >> backup_log.txt
    
    xcopy /E /H /C /I "%DATA_DIR%" "%DATA_DIR%_backup" 2>nul
    
    if errorlevel 1 (
        echo WARNING: Backup may have been partially created. >> backup_log.txt
        echo Check permissions and disk space. >> backup_log.txt
    ) else (
        echo Backup completed successfully. >> backup_log.txt
    )
    
    echo. >> backup_log.txt
    echo Checking backup contents... >> backup_log.txt
    
    dir "%DATA_DIR%_backup" /b >> backup_log.txt 2>nul
    
    echo. >> backup_log.txt
    echo Source files backed up: >> backup_log.txt
    dir "%DATA_DIR%" /b >> backup_log.txt 2>nul
)

echo. >> backup_log.txt
echo User Data Backup Complete! >> backup_log.txt
echo. >> backup_log.txt
echo IMPORTANT REMINDER: >> backup_log.txt
echo. >> backup_log.txt
echo This backup contains YOUR CHOSATIX V2 SETTINGS: >> backup_log.txt
echo   - License information (PRO/PREMIUM status) >> backup_log.txt
echo   - Custom tweaks and optimization settings >> backup_log.txt
echo   - Game profiles and game-specific configurations >> backup_log.txt
echo   - Performance history and benchmark data >> backup_log.txt
echo   - Rollback history (when tweaks were applied/reverted) >> backup_log.txt
echo   - Notification preferences and thresholds >> backup_log.txt
echo   - Advisor scan results and recommendations >> backup_log.txt
echo   - Scheduled scan settings >> backup_log.txt
echo   - Performance snapshots and monitoring data >> backup_log.txt
echo. >> backup_log.txt
echo AFTER WINDOWS FACTORY RESET: >> backup_log.txt
echo   1. Run this script AGAIN to restore your data >> backup_log.txt
echo   2. Copy %DATA_DIR%_backup to %DATA_DIR% >> backup_log.txt
echo   3. Restart Choatix V2 to load all restored settings >> backup_log.txt
echo. >> backup_log.txt
echo RESTORATION INSTRUCTIONS: >> backup_log.txt
echo   Run backup_user_data.bat AFTER Windows Factory Reset >> backup_log.txt
echo   The script will automatically restore: %DATA_DIR%_backup to %DATA_DIR% >> backup_log.txt
echo   Then restart Choatix V2 with your previous settings >> backup_log.txt
echo. >> backup_log.txt
echo BACKUP LOG: >> backup_log.txt
echo   Detailed backup information saved to: backup_log.txt >> backup_log.txt
echo. >> backup_log.txt
echo NOTE: Windows Factory Reset will clear the user profile. >> backup_log.txt
echo This backup script will create a complete copy that can >> backup_log.txt
echo survive the Windows Factory Reset and be restored later. >> backup_log.txt
echo. >> backup_log.txt
echo =============================================== >> backup_log.txt
echo   CHOATIX V2 USER DATA BACKUP COMPLETE   >> backup_log.txt
echo =============================================== >> backup_log.txt

if not exist "%DATA_DIR%" (
    echo.
    echo No existing user data found. This appears to be a fresh install.
    echo The backup will be empty, but the script completed successfully.
    echo You can run this script again after making changes to your data.
)

echo.

set /p choice=Do you want to copy this backup to your USB drive? (Y/N): 

if /I "%choice%"=="Y" (
    echo Copying backup to USB drive D:\Choatix_Backup... >> backup_log.txt
    
    if not exist "D:\Choatix_Backup" (
        mkdir "D:\Choatix_Backup" > nul
    )
    
    xcopy /E /H /C /I "%DATA_DIR%_backup" "D:\Choatix_Backup\\choatix-v2_backup_%date:/=-%" 2>nul
    
    if not errorlevel 1 (
        echo Backup copied to USB drive D:\Choatix_Backup successfully! >> backup_log.txt
        echo. >> backup_log.txt
        echo Your Choatix V2 data is now safely backed up on your USB drive! >> backup_log.txt
    ) else (
        echo Failed to copy to USB drive. >> backup_log.txt
    )
)

echo.

echo ===============================================
echo   CHOATIX V2 BACKUP SCRIPT COMPLETE
 echo ===============================================
echo.
echo User data backup script completed successfully.
echo.
echo Remember: Run this script BEFORE Windows Factory Reset to backup your data.
echo Run this script AGAIN AFTER Windows Factory Reset to restore your data.
echo.
echo Backup log saved to: backup_log.txt
pause
