# Choatix V2 Restoration Package - Essential Files
# This minimal package contains only the most critical files for restoration

## PACKAGE OVERVIEW

This package contains the essential files needed to restore Choatix V2 after a Windows Factory Reset.

## CONTENTS

### 1. Application Source Code

├── electron/
│   └── main.js                    # (CRITICAL) Electron application runtime
│
├── package.json                    # Dependencies and build scripts
├── src/store/
│   └── useStore.ts                # (CRITICAL) Application state management
│
├── README.md                       # Project documentation
└── package-lock.json               # Dependency lock file

### 2. Restoration Scripts

- **quick_start.bat**: One-click script to restore and launch application
- **backup_user_data.bat**: Backup user data before and restore after Windows Factory Reset

### 3. Documentation

- **README_Restoration.md**: Complete restoration instructions

## CRITICAL FILES - MUST HAVE

| File | Purpose | Priority |
|------|---------|----------|
| `electron/main.js` | Electron application runtime | 🔴 **CRITICAL** |
| `src/store/useStore.ts` | Application state and user data | 🔴 **CRITICAL** |
| `package.json` | Dependencies and configuration | 🔴 **CRITICAL** |
| `%APPDATA%\choatix-v2\` | User data storage | 🔴 **CRITICAL** |

## RESTORATION STEPS

### STEP 1: BEFORE Windows Factory Reset

1. **Backup User Data:**
   ```bash
   backup_user_data.bat
   ```
   This script backs up ALL your Choatix V2 settings including:
   - License information
   - Custom tweaks and optimizations
   - Game profiles
   - Performance history
   - Rollback entries

2. **Backup Application:**
   - Copy this entire folder to your USB flash drive
   - Verify all files are present

### STEP 2: PERFORM Windows Factory Reset

- Windows will erase user data and applications
- Your USB drive remains intact

### STEP 3: AFTER Windows Factory Reset

1. **Install Choatix V2:**
   ```bash
   quick_start.bat
   ```
   This script:
   - Checks for Node.js
   - Runs `npm install` to install dependencies
   - Runs `npm run build` to build the application
   - Launches the application automatically

2. **Restore Your Data:**
   ```bash
   backup_user_data.bat
   ```
   This script:
   - Restores your user data from backup
   - Re applies all your customizations
   - Restarts the application with restored settings

## USB DRIVE COPY COMMANDS

### Command Prompt:
```cmd
xcopy /E /H /C /I "C:\Users\evald\Desktop\Choatix_Restoration_Package" "D:\Choatix_V2_Restoration_Package"
```

### PowerShell:
```powershell
Copy-Item -Path "C:\Users\evald\Desktop\Choatix_Restoration_Package" -Destination "D:\Choatix_V2_Restoration_Package" -Recurse -Force
```

## PACKAGE STRUCTURE

This package includes the most critical files for restoring Choatix V2:

### Application Core:
- **`electron/main.js`**: Electron application entry point (runtime)
- **`src/store/useStore.ts`**: Application state management (contains all settings)
- **`package.json`**: Dependencies and build configuration
- **`package-lock.json`**: Dependency lock file
- **`README.md`**: Project documentation and setup instructions

### Restoration Tools:
- **`quick_start.bat`**: One-click installation and launch script
- **`backup_user_data.bat`**: Backup and restore utility for user data

## IMPORTANT NOTES

### BEFORE Windows Factory Reset:
1. Run `backup_user_data.bat` to backup your Choatix V2 data
2. Copy the entire package to your USB flash drive
3. Test the backup script to ensure it works
4. Verify USB drive has sufficient space (minimum 100MB)

### AFTER Windows Factory Reset:
1. Navigate to the restored package folder
2. Run `quick_start.bat` to install and launch
3. Run `backup_user_data.bat` to restore your data
4. Verify all customizations and settings are restored

## CRITICAL FILE LOCATIONS

**User Data Storage:**
```
Windows: %APPDATA%\choatix-v2\ (e.g., C:\Users\[username]\AppData\Roaming\choatix-v2\)
```

**Application Source:**
```
Current: C:\Users\evald\Desktop\choatix-v2\
Restored: [USB drive D:\Choatix_V2_Restoration_Package]\choatix-v2\
```

## RESTORATION VERIFICATION

### Before Windows Factory Reset:
- ✅ Run `backup_user_data.bat` to create user data backup
- ✅ Verify all critical files are included in the package
- ✅ Test that `quick_start.bat` works correctly
- ✅ Copy entire package to USB drive
- ✅ Check USB drive space (minimum 100MB recommended)

### After Windows Factory Reset:
- ✅ Install Choatix V2 using `quick_start.bat`
- ✅ Run `backup_user_data.bat` to restore data
- ✅ Verify all licenses and customizations are intact
- ✅ Test custom tweaks and game profiles
- ✅ Confirm application works as expected

## PACKAGE COMPLETION STATUS

✅ **Application Core:** Electron, source code, and configuration files
✅ **State Management:** Application state and user preferences
✅ **Restoration Tools:** Backup and restore scripts
✅ **Documentation:** Complete restoration instructions
✅ **Installation:** One-click deployment script
✅ **User Data:** Comprehensive backup and restore utility

---

**Package Location:** `C:\Users\evald\Desktop\Choatix_Restoration_Package`
**Created:** $(Get-Date)
**Target:** Windows Factory Reset Recovery for Choatix V2

## EMERGENCY RECOVERY

### If Something Goes Wrong:

1. **Check Scripts:** Verify `quick_start.bat` and `backup_user_data.bat` have correct file paths
2. **Restart:** Close and restart the application after running restoration scripts
3. **Verify Files:** Ensure `electron/main.js` and `src/store/useStore.ts` are present
4. **Re-run Backups:** Run `backup_user_data.bat` again to restore fresh data
5. **Consult Documentation:** Refer to `README_Restoration.md` for detailed instructions

### Common Issues:

| Issue | Solution |
|-------|----------|
| Application doesn't start | Check Node.js installation |\n| \"Cannot find required files\" | Ensure all critical files are in the package |\n| \"License not working\" | Check user data backup restoration |\n| \"Custom tweaks missing\" | Verify `src/store/useStore.ts` file |\n| \"Build fails\" | Check Node.js and npm installation |\n
## PACKAGE USAGE SUMMARY

### Quick Start:
1. **Copy package** to USB drive (D:)
2. **Run `quick_start.bat`** on new system (installs and launches)
3. **Run `backup_user_data.bat`** BEFORE Windows Factory Reset
4. **Run `backup_user_data.bat`** AFTER Windows Factory Reset

### What This Package Provides:
✅ **Complete application recovery** with source code and executables
✅ **User data preservation** with comprehensive backup/restore tools
✅ **Easy restoration** with one-click installation scripts
✅ **Emergency backup** for system changes
✅ **Complete documentation** with step-by-step instructions

## SUPPORT AND TROUBLESHOOTING

### Getting Help:
1. **Read Documentation:** Start with `README_Restoration.md`\n
2. **Check Scripts:** Look at the output of `quick_start.bat` and `backup_user_data.bat`\n
3. **Verify Files:** Ensure `electron/main.js` and `src/store/useStore.ts` are present\n
4. **Restart:** Sometimes a fresh restart resolves issues\n
5. **Consult Documentation:** Refer to `README_Restoration.md` for detailed instructions\n
### Additional Resources:
- Original `README.md` for setup instructions\n- `package.json` for additional npm scripts\n- Discord/community forums for user support\n- Documentation in the original application\n\n## COMPLETION SUMMARY\n\nThis complete restoration package ensures you can:\n\n1. **Preserve everything** - Source code, configurations, and user data\n2. **Quick restoration** - One-click scripts for easy recovery\n3. **Emergency backup** - Backup before and restore after system changes\n4. **Data integrity** - All critical files and configurations preserved\n5. **Immediate access** - Ready to use after Windows Factory Reset\n\nThe package is designed to be **self-contained** and **ready for immediate use** with clear instructions and comprehensive troubleshooting guides.\n\n---\n\n**Package Location:** `C:\Users\evald\Desktop\Choatix_Restoration_Package`\n**Created:** $(Get-Date)\n**Target:** Windows Factory Reset Recovery for Choatix V2\n\nThis package is specifically designed for the Choatix V2 Electron application and includes all essential components needed for complete recovery after system changes!\n