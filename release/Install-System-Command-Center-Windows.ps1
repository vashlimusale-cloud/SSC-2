# =============================================================================
# System Command Center v2.5.0 — Automated Windows 11 Installer & G: Mount Setup
# =============================================================================
$ErrorActionPreference = "Stop"

Write-Host "================================================================" -ForegroundColor Magenta
Write-Host "  SYSTEM COMMAND CENTER v2.5.0 — WINDOWS 11 SETUP WIZARD" -ForegroundColor White
Write-Host "================================================================" -ForegroundColor Magenta

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

# 1. Check rclone installation at C:\rclone\rclone.exe
Write-Host "`n[1/5] Checking rclone installation..." -ForegroundColor Cyan
if (Test-Path "C:\rclone\rclone.exe") {
    $rcloneVer = & "C:\rclone\rclone.exe" version | Select-Object -First 1
    Write-Host "  -> Found $rcloneVer at C:\rclone\rclone.exe" -ForegroundColor Green
} else {
    Write-Host "  -> C:\rclone\rclone.exe not found. Installing via winget..." -ForegroundColor Yellow
    winget install -e --id Rclone.Rclone --accept-package-agreements --accept-source-agreements
}

# 2. Check WinFsp installation (required for G: virtual drive mount)
Write-Host "`n[2/5] Checking WinFsp Virtual File System driver..." -ForegroundColor Cyan
$winfspPath = "${env:ProgramFiles(x86)}\WinFsp"
if ((Test-Path $winfspPath) -or (Test-Path "$env:ProgramFiles\WinFsp")) {
    Write-Host "  -> Found WinFsp Virtual File System driver installed." -ForegroundColor Green
} else {
    Write-Host "  -> Installing WinFsp via winget for G: drive mounting..." -ForegroundColor Yellow
    winget install -e --id WinFsp.WinFsp --accept-package-agreements --accept-source-agreements
}

# 3. Install Node dependencies & build production bundle
Write-Host "`n[3/5] Installing application dependencies & verifying production bundle..." -ForegroundColor Cyan
npm install --no-fund --no-audit
npm run build

# 4. Mount Google Drive G: (gdrive:Laptop_Full_Backup/C_Drive_User) if not already mounted
Write-Host "`n[4/5] Checking Google Drive Virtual Disk (G:)..." -ForegroundColor Cyan
if (Test-Path "G:\") {
    Write-Host "  -> Drive G:\ is already mounted and accessible." -ForegroundColor Green
} elseif (Test-Path "C:\rclone\rclone.exe") {
    Write-Host "  -> Mounting gdrive:Laptop_Full_Backup/C_Drive_User to G:\ in background..." -ForegroundColor Cyan
    Start-Process -FilePath "C:\rclone\rclone.exe" -ArgumentList 'mount "gdrive:Laptop_Full_Backup/C_Drive_User" G: --vfs-cache-mode full --vfs-cache-max-age 24h --dir-cache-time 5m --volname "Google Drive (G:)" --network-mode' -WindowStyle Hidden
    Start-Sleep -Seconds 3
    Write-Host "  -> Virtual Drive G:\ mount initiated." -ForegroundColor Green
}

# 5. Create Desktop Shortcut
Write-Host "`n[5/5] Creating Windows 11 Desktop Shortcut..." -ForegroundColor Cyan
$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$Shortcut = $WshShell.CreateShortcut("$DesktopPath\System Command Center.lnk")
$Shortcut.TargetPath = "$ProjectRoot\release\Launch-System-Command-Center.bat"
$Shortcut.WorkingDirectory = $ProjectRoot
$Shortcut.Description = "System Command Center - Windows 11 System Intelligence & G: Cloud Storage"
$Shortcut.Save()

Write-Host "`n================================================================" -ForegroundColor Green
Write-Host "  INSTALLATION COMPLETE! Launching System Command Center..." -ForegroundColor White
Write-Host "================================================================" -ForegroundColor Green
Start-Process "$ProjectRoot\release\Launch-System-Command-Center.bat"
