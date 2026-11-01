# System Command Center — Changelog

## v2.5.0 — Unified Neo's Noir Desktop Release (2026-11-01)

### Added
- **Neo's Noir Visual Design System**: Complete dark UI overhaul matching the reference Bento Dashboard (`#09090B` background, `#111013` sidebar, `#171619` / `#1D1A20` cards, `#A855F7` purple and `#10B981` emerald accents, circular SVG hardware temperature gauges, purple network area sparkline, expandable tree sidebar, and top header bar with `Tooltip Mode`).
- **All 16 Functional Modules**:
  - `Home Dashboard`, `My PC Overview`, `Processes` (Running Apps & Background Processes), `Startup Manager`, `Windows Services`, `Performance Monitor`, `Optimize`, `Network`, `Storage Analyzer`, `Google Drive Virtual Storage (G:)`, `Transfers`, `Tools` (File Organizer, Duplicate Finder, Recovery), `Command Center`, `Activity History`, `Settings`, and `Help & Documentation`.
- **WinFsp Virtual Drive (`G:`) & Remote Quota Correlation**:
  - Added full control for mounting `gdrive:Laptop_Full_Backup/C_Drive_User` (`1,063` objects, `2.543 GiB`) as Windows drive `G:\` via `rclone v1.75.1` and `WinFsp 2024.1`.
  - Added automatic quota correlation analysis explaining why `gdrive:` and `gdrive2:` both report `5.000 TiB` total / `22.367 GiB` used / `4.961 TiB` free (shared underlying 5 TiB Google Drive pool).
- **Controlled Local Command Execution Engine**:
  - Pre-execution risk classification (`Safe Read-Only`, `Requires Confirmation`, `Blocked Destructive`), automatic OAuth/Bearer secret redaction, and persistent SQLite command history.
- **SQLite Persistence (`data/scc_persistence.sqlite`)**:
  - Implemented zero-dependency persistence using Node.js built-in `node:sqlite` (`DatabaseSync`) for Platform Settings, Activity History, Command History, and Virtual Drive Mount state.
- **Tauri 2 Native Windows Foundation (`src-tauri/`) & Automated Windows Installer (`release/`)**:
  - Added `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`, `src-tauri/src/main.rs`, and PowerShell/Batch installer scripts in `release/`.

### Fixed
- Enforced strict non-reversibility (`reversible: false`) for `terminate_process` in both domain logic (`isOperationReversible`) and the SQLite Activity History audit log.
