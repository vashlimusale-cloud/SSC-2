# System Command Center — Installation & Deployment Guide

This guide covers installing, running, and packaging **System Command Center** on Windows 11 (x64) as both a native Tauri 2 desktop application and a standalone Node/SQLite local workstation server.

## 1. System Prerequisites

| Component | Minimum Requirement | Recommended / Verified |
| :--- | :--- | :--- |
| **Operating System** | Windows 10 (21H2+) or Windows 11 | Windows 11 Pro 23H2 (Build 22631) |
| **WebView2 Runtime** | Microsoft Edge WebView2 Evergreen | Pre-installed on Windows 11 |
| **Node.js Runtime** | Node.js v22.5.0+ (includes built-in `node:sqlite`) | Node.js v22.14.0 LTS |
| **rclone Binary** | `rclone v1.65+` at `C:\rclone\rclone.exe` | `rclone v1.75.1` (`windows/amd64`) |
| **WinFsp Driver** | WinFsp 2023+ (required for `G:` virtual drive mount) | WinFsp 2024.1 (`v2.0.23075`) |
| **Rust Toolchain** *(for native `.exe`/`.msi` build)* | Rust 1.77+ (`rustup`, `cargo`) + MSVC Build Tools | Rust 1.82 Stable |

---

## 2. Option A: One-Click Windows Automated Installer (`release/`)

1. Extract `System-Command-Center-Full-Release.zip` to a local folder (for example, `C:\SystemCommandCenter`).
2. Right-click `release\Install-System-Command-Center-Windows.ps1` and select **Run with PowerShell** (or run from an elevated PowerShell prompt):
   ```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   .\release\Install-System-Command-Center-Windows.ps1
   ```
3. The automated installer performs:
   - Verification of `C:\rclone\rclone.exe` (`v1.75.1`) and `WinFsp` (`winget install WinFsp.WinFsp` if missing).
   - Verification of configured Google Drive remotes (`gdrive:` and `gdrive2:`).
   - Dependency installation (`npm install`) and production bundle verification (`dist/`).
   - Creation of a Desktop shortcut (**System Command Center**) and optional Windows Logon Scheduled Task to auto-mount `G:\` (`gdrive:Laptop_Full_Backup/C_Drive_User`).

To launch immediately at any time without PowerShell, double-click:
```bat
release\Launch-System-Command-Center.bat
```

---

## 3. Option B: Developer Mode (Live Workstation Server + SQLite)

```bash
# 1. Install dependencies
npm install

# 2. Run unit test suites (15 tests across System & Storage Intelligence)
npm test

# 3. Start the unified Express + SQLite + Vite workstation server on port 3000
npm run dev
```

Open `http://localhost:3000` in Microsoft Edge or Chrome, or run in app window mode:
```powershell
start msedge --app=http://localhost:3000
```

---

## 4. Option C: Native Windows 11 Desktop Packaging (Tauri 2 `.exe` & `.msi`)

The repository includes the complete Tauri 2 Rust project under `src-tauri/` (`Cargo.toml`, `tauri.conf.json`, `src/main.rs`).

On a Windows 11 machine with Rust and Visual Studio C++ Build Tools installed:
```powershell
# 1. Install Tauri CLI
npm install -D @tauri-apps/cli@^2.0.0

# 2. Build the frontend production assets and compile the native Rust desktop binary
npx tauri build
```

Generated native installers will be output to:
- `src-tauri\target\release\system-command-center.exe`
- `src-tauri\target\release\bundle\msi\System Command Center_2.5.0_x64_en-US.msi`
- `src-tauri\target\release\bundle\nsis\System Command Center_2.5.0_x64-setup.exe`
