# System Command Center — Security & Safety Architecture

## 1. Threat Model & Core Safeguards

1. **Kernel & Critical Process Protection**:
   - All Windows kernel, session, LSA, and display composition processes (`System`, `smss.exe`, `csrss.exe`, `wininit.exe`, `services.exe`, `lsass.exe`, `svchost.exe`, `dwm.exe`, `MsMpEng.exe`) are classified as `Protected System Process` and cannot be terminated via the UI or API.
2. **Non-Destructive Cloud Operations (`rclone copy` Enforcement)**:
   - Cloud backup workflows strictly invoke `rclone copy` followed by `rclone check --one-way` (SHA-256 hash verification).
   - Destructive operations (`rclone sync`, `rclone purge`, `rclone delete`, `rclone move`) are blocked from automated workflows and blocked in the Command Center safety gate.
3. **Command Validation & Injection Prevention**:
   - Every command submitted to `/api/command/execute` or the Tauri Rust command bridge is validated by `validateLocalCommand()`.
   - Destructive system commands (`format`, `diskpart`, `del /s`, `rd /s`, `rm -rf`, `bcdedit`, `cipher /w`) are hard-blocked (`Blocked Destructive`).
   - Administrative commands (`sfc`, `netsh`, `sc config`, `taskkill`) require explicit user approval (`Requires Confirmation`).
4. **Automatic Credential & OAuth Token Redaction**:
   - `redactSecretsFromOutput()` sanitizes all `stdout` and `stderr` streams before returning them to the frontend or saving them to SQLite (`data/scc_persistence.sqlite`).
   - `rclone.conf` tokens (`access_token`, `refresh_token`, `client_secret`, `Bearer`, `ya29.*`) are never exposed in the UI, logs, or repository.
