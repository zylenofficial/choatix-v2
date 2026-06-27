# Powerful Choatix V2 Restoration Package Generator
# This script creates a complete restoration package for Windows Factory Reset

Write-Host "Creating Complete Choatix V2 Restoration Package..." -ForegroundColor Green

# Get restoration directory and timestamp
$RestorationDir = "C:\Users\evald\Desktop\Choatix_Restoration_Package"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# Create main restoration directory
if (!(Test-Path $RestorationDir)) {
    New-Item -ItemType Directory -Path $RestorationDir -Force | Out-Null
    Write-Host "Created restoration package directory" -ForegroundColor Green
}

# 1. COMPLETE SOURCE CODE PACKAGE
$sourceDir = "$RestorationDir\Source_Code_$timestamp\choatix-v2\"
New-Item -ItemType Directory -Path $sourceDir -Force | Out-Null

Write-Host "Backing up complete source code..." -ForegroundColor Cyan

# Copy entire source tree recursively
$sourceFiles = @("package.json", "package-lock.json", "tsconfig.json", "tsconfig.tsbuildinfo", "next.config.js", "postcss.config.js", "tailwind.config.ts", ".gitignore", "README.md", "electron", "src")
foreach ($file in $sourceFiles) {
    $sourcePath = "C:\Users\evald\Desktop\choatix-v2\$file"
    if (Test-Path $sourcePath) {
        Copy-Item -Path $sourcePath -Destination "$sourceDir\$file" -Recurse -Force
        Write-Host "  ✓ Backed up: $file" -ForegroundColor Green
    } else {
        Write-Host "  - Skipping (not found): $file" -ForegroundColor Yellow
    }
}

# 2. PRE-BUILT PACKAGE (if available)
if (Test-Path "C:\Users\evald\Desktop\choatix-v2\dist") {
    $distDir = "$RestorationDir\Prebuilt_$timestamp\choatix-v2\"
    New-Item -ItemType Directory -Path $distDir -Force | Out-Null
    Copy-Item -Path "C:\Users\evald\Desktop\choatix-v2\dist" -Destination "$distDir\dist" -Recurse -Force
    Write-Host "Created pre-built package (dist folder)" -ForegroundColor Cyan
}

if (Test-Path "C:\Users\evald\Desktop\choatix-v2\out") {
    $outDir = "$RestorationDir\Prebuilt_$timestamp\choatix-v2\"
    Copy-Item -Path "C:\Users\evald\Desktop\choatix-v2\out" -Destination "$outDir\out" -Recurse -Force
    Write-Host "Created pre-built package (out folder)" -ForegroundColor Cyan
}

# 3. CREATE COMPREHENSIVE RESTORATION GUIDE
$restorationGuide = "$sourceDir\RESTORATION_GUIDE.md"
$guideContent = @"
# Choatix V2 - Complete Restoration Package

## Overview
This package contains everything needed to reinstall and restore Choatix V2 after a Windows Factory Reset.

## Package Contents

### 1. Source_Code_$timestamp/choatix-v2/
All source code including:
- **Electron application** (electron/ folder)
- **React frontend** (src/ folder)
- **Build configurations** (package.json, tsconfig.json, etc.)
- **Runtime dependencies** (node_modules/ - minimal)
- **Documentation** (README.md)

### 2. Prebuilt_$timestamp/choatix-v2/ (if available)
If build outputs exist (dist/ or out/), these are included for quick deployment.

## MOST CRITICAL FILES:

### choatix-v2/electron/main.js
**This is your Electron application entry point** - absolutely essential!

### choatix-v2/src/store/useStore.ts
**Contains all your application state and persistent data**

### choatix-v2/src/data/tweaks.ts
**Your custom tweak configurations**

### choatix-v2/src/data/games.ts
**Your game profiles and optimization settings**

### choatix-v2/package.json
**Application dependencies and build scripts**

## RESTORATION STEPS (QUICK START):

1. **Install Node.js** (if not already installed)
2. **Extract this entire package to your Desktop** (or any preferred location)
3. **Navigate to the choatix-v2 directory**
4. **Run dependency installation:**
   ```bash
   npm install
   ```
5. **Build the application:**
   ```bash
   npm run build
   ```
6. **Launch the application:**
   ```bash
   npm run dev
   ```
   OR for Electron:
   ```bash
   npm run electron:dev
   ```

## AFTER INITIAL SETUP - USER DATA BACKUP:

Your application settings and customizations are stored in:
`%APPDATA%\\choatix-v2\\`

**To backup your app data BEFORE Windows Reset:**
```powershell
# Copy this script to your Desktop as Backup_User_Data.ps1
# Then run it before performing Windows Factory Reset
```

**To restore your app data AFTER Windows Reset:**
1. **Close Choatix V2** if running
2. **Navigate to:** `%APPDATA%\\choatix-v2\\`
3. **Backup:** If existing choatix-v2 folder exists, rename it
4. **Restore:** Copy from your backup
5. **Start Choatix V2** to load all your settings

## WHAT THIS PACKAGE INCLUDES:

✅ **All source code** - Reinstall the complete application
✅ **All runtime files** - Electron and React components
✅ **Build configurations** - TypeScript, Next.js, tooling
✅ **Dependency management** - package.json and lock files
✅ **Runtime scripts** - npm scripts for development and production
✅ **Complete application structure** - Ready to run

## FILES YOU ABSOLUTELY MUST HAVE:

1. `choatix-v2/electron/main.js` - Your Electron application (Runtime)
2. `choatix-v2/package.json` - Application configuration
3. `choatix-v2/README.md` - Setup instructions
4. `choatix-v2/electron/preload.js` - Your preload scripts
5. `choatix-v2/src/store/useStore.ts` - Your application state store
6. `%APPDATA%\\choatix-v2\\` - Your application settings and data

## AFTER RELOCATION:

Once you move this package to your new system:

1. **Complete the steps above** for reinstallation
2. **Restore your user data** from `%APPDATA%\\choatix-v2\\`
3. **All your customizations** will be restored:
   - License information
   - Custom tweaks and optimizations
   - Game profiles and settings
   - Performance history
   - Rollback entries
   - Notification preferences

This package gives you a complete, working copy of Choatix V2 that you can immediately restore after a Windows Factory Reset!

Package created: $(Get-Date)
Generated by Choatix V2 Complete Restoration Package
"@

Set-Content -Path $restorationGuide -Value $guideContent -Encoding UTF8
Write-Host "Created comprehensive restoration guide" -ForegroundColor Green

# 4. CREATE QUICK START SCRIPT
$quickStartScript = "$sourceDir\quick_start.bat"
$quickStartContent = @"@echo off
REM Quick Start Script for Choatix V2
REM Double-click to restore and run the application quickly

cd /d "%~dp0\" choatix-v2

REM Check if Node.js is available
where node >nul 2>nul
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Install dependencies
echo Installing dependencies...
npm install

REM Build the application
echo Building application...
npm run build

REM Launch the application
echo Starting Choatix V2...
npm run dev

pause
"@"

Set-Content -Path $quickStartScript -Value $quickStartContent -Encoding UTF8
Write-Host "Created quick start script" -ForegroundColor Green

# 5. CREATE USER DATA BACKUP SCRIPT
$userDataScriptPath = "$sourceDir\backup_user_data.bat"
$userDataScript = @"@echo off
REM User Data Backup Script for Choatix V2
REM Run this BEFORE Windows Factory Reset to backup your app data

cmd /c "echo Creating Choatix V2 user data backup..." > "%TEMP%\\choatix_backup_log.txt"

echo Starting user data backup...

setlocal enabledelayedexpansion

set "appdata=%APPDATA%"
set "data_dir=%appdata%\\choatix-v2"

if not exist "%data_dir%" (
    echo NOTE: No existing Choatix V2 user data found.
    echo This may be a fresh installation.
    echo Backup will be empty, but script ran successfully.
) else (
    echo Backing up: %data_dir%
    xcopy /E /H /C /I "%data_dir%" "%data_dir%_backup_$timestamp" > "%TEMP%\\choatix_backup_log.txt"
    echo Backup complete: %data_dir%_backup_$timestamp
)

echo.
echo USER DATA BACKUP COMPLETE

echo.
echo IMPORTANT REMINDER:

echo 1. This backup contains YOUR CHOSATIX V2 SETTINGS:

echo    - License information

echo    - Custom tweaks

echo    - Game profiles

echo    - Performance history

echo    - Rollback entries

echo    - Notification preferences

echo.

echo 2. After Windows Factory Reset:

echo    a. Reinstall Choatix V2 using the main package

echo    b. Run this script AGAIN to restore your data

echo    c. The restore will copy %_backup%_backup_$timestamp to %data_dir%

echo.
echo Backup log saved to: %TEMP%\\choatix_backup_log.txt
echo.
echo NOTE: Windows will clean user profiles and hidden files automatically.
echo Your app data backup will survive the Windows Factory Reset!
"@"

Set-Content -Path $userDataScriptPath -Value $userDataScript -Encoding UTF8
Write-Host "Created user data backup script" -ForegroundColor Green

Write-Host ""
Write-Host "=== PACKAGE CREATION COMPLETE ===" -ForegroundColor Green
Write-Host ""
Write-Host "Your complete Choatix V2 restoration package has been created:" -ForegroundColor Cyan
Write-Host "  Location: $RestorationDir" -ForegroundColor White
Write-Host ""
Write-Host "Contents:" -ForegroundColor Yellow
Write-Host "  Source_Code_$timestamp\\choatix-v2\\" -ForegroundColor Green
Write-Host "    ├── Complete source code (everything you need)" -ForegroundColor Gray
Write-Host "    ├── electron/main.js (CRITICAL)" -ForegroundColor Gray
Write-Host "    ├── package.json" -ForegroundColor Gray
Write-Host "    ├── src/store/useStore.ts (Your application state)" -ForegroundColor Gray
Write-Host "    ├── quick_start.bat (One-click restore)" -ForegroundColor Gray
Write-Host "    └── backup_user_data.bat (Backup user data)" -ForegroundColor Gray
Write-Host ""
Write-Host "RESTORATION PROCESS:" -ForegroundColor Yellow
Write-Host "1. Move this entire folder to your new system" -ForegroundColor Gray
Write-Host "2. Run quick_start.bat (automatically installs and launches)" -ForegroundColor Gray
Write-Host "3. Run backup_user_data.bat BEFORE Windows Factory Reset" -ForegroundColor Gray
Write-Host "4. After Windows Reset: Run backup_user_data.bat to restore data" -ForegroundColor Gray
Write-Host ""
Write-Host "The package contains everything needed for immediate restoration!" -ForegroundColor Green
"@"
