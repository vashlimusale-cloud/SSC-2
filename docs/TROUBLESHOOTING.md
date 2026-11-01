# System Command Center — Troubleshooting Guide

## 1. Virtual Drive (`G:`) Mount Issues

### Symptom: `Fatal error: failed to mount FUSE fs: cgofuse: cannot find winfsp`
- **Cause**: The WinFsp kernel/user-mode filesystem driver is not installed on Windows 11.
- **Resolution**:
  1. Run `winget install -e --id WinFsp.WinFsp` in an elevated PowerShell window, or run `release\Install-System-Command-Center-Windows.ps1`.
  2. Click **Reconnect** in the **Google Drive (G:)** screen.

### Symptom: Drive letter `G:` is already in use
- **Cause**: A USB drive or existing network share is occupying `G:`.
- **Resolution**:
  1. Open the **Google Drive (G:)** screen in System Command Center.
  2. Change the **Drive Letter** dropdown from `G:` to `Z:`, `X:`, or `M:` and click **Apply Mount Settings**.

---

## 2. rclone Remote & Quota Questions

### Why do `gdrive:` and `gdrive2:` both show `5 TiB` total and `22.367 GiB` used?
- Both remotes are configured against the same Google Drive account / shared workspace pool (`5.000 TiB` total, `4.961 TiB` free).
- System Command Center automatically detects this correlation and warns you that effective free space is `4.961 TiB` (not `10 TiB`).

---

## 3. Process & Command Execution Issues

### Why is the "Terminate" button disabled on `csrss.exe`, `lsass.exe`, or `dwm.exe`?
- Those binaries are classified as **Protected System Processes**. Terminating them triggers a Windows 11 Blue Screen (`CRITICAL_PROCESS_DIED`) or session crash. System Command Center hard-locks protected processes against termination.

### Why is there no "Undo" button after terminating an application?
- Unlike Startup Registry toggles (`enable_startup` / `disable_startup`) or Windows Service mode changes (`service_change`), terminating a live OS process (`terminate_process`) destroys its volatile in-memory state. System Command Center truthfully marks process termination as **Non-Reversible**.
