# System Command Center v2.5.0 — Release Notes

## Highlights
1. **Neo's Noir Windows 11 UI**: Matches the reference Bento Dashboard (`#09090B` background, `#111013` sidebar, `#171619` charcoal cards, `#A855F7` purple and `#10B981` emerald accents, SVG temperature gauges, and purple network sparkline).
2. **All 16 Navigation Modules**: Home Dashboard, My PC, Processes, Startup Manager, Windows Services, Performance Monitor, Optimize, Network, Storage, Google Drive (`G:`), Transfers, Tools, Command Center, Activity History, Settings, and Help & Docs.
3. **Google Drive Virtual Disk (`G:`)**: Full WinFsp mount/unmount/reconnect control for `gdrive:Laptop_Full_Backup/C_Drive_User` (`1,063` objects, `2.543 GiB`) and automatic quota correlation across `gdrive:` and `gdrive2:` (`5.000 TiB` shared pool).
4. **Controlled Local Command Execution Engine**: Pre-execution safety gate, destructive command blocking, Admin approval prompt, and automatic OAuth/Bearer secret redaction.
5. **SQLite Persistence**: Built-in `node:sqlite` database (`data/scc_persistence.sqlite`) persisting settings, activity history (`terminate_process` strictly non-reversible), command history, and virtual drive mount state.

## Package Contents (`release/`)
- `Install-System-Command-Center-Windows.ps1` — Automated Windows 11 setup & `G:` mount wizard
- `Launch-System-Command-Center.bat` — Instant desktop app window launcher (`msedge --app=http://localhost:3000`)
- `VERSION.json` — Release version & environment manifest
- `SHA256SUMS.txt` — Cryptographic SHA-256 checksums of release artifacts and production bundles
- `../dist/` — Pre-compiled production frontend bundle
- `../src-tauri/` — Native Tauri 2 + Rust Windows desktop source (`cargo build --release` / `npx tauri build`)
