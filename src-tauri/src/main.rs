#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::process::Command;
use sysinfo::System;

#[derive(Serialize, Deserialize)]
pub struct NativeMountResult {
    pub success: bool,
    pub drive_letter: String,
    pub remote_target: String,
    pub message: String,
}

#[derive(Serialize, Deserialize)]
pub struct NativeCommandResult {
    pub exit_code: i32,
    pub stdout: String,
    pub stderr: String,
}

const PROTECTED_BINARIES: &[&str] = &[
    "system",
    "smss.exe",
    "csrss.exe",
    "wininit.exe",
    "services.exe",
    "lsass.exe",
    "dwm.exe",
    "winlogon.exe",
    "fontdrvhost.exe",
    "securityhealthservice.exe",
    "msmpeng.exe",
    "sihost.exe",
];

#[tauri::command]
fn mount_gdrive_winfsp(remote_name: String, remote_folder: String, drive_letter: String) -> NativeMountResult {
    let clean_letter = drive_letter.trim_end_matches(':').to_uppercase();
    let target = if remote_folder.trim().is_empty() {
        format!("{}:", remote_name.trim_end_matches(':'))
    } else {
        format!("{}:{}", remote_name.trim_end_matches(':'), remote_folder.trim_matches('/'))
    };

    let child = Command::new("rclone")
        .args([
            "mount",
            &target,
            &format!("{}:", clean_letter),
            "--vfs-cache-mode",
            "full",
            "--volname",
            &format!("Google Drive ({}:)", clean_letter),
            "--network-mode",
        ])
        .spawn();

    match child {
        Ok(_) => NativeMountResult {
            success: true,
            drive_letter: format!("{}:", clean_letter),
            remote_target: target,
            message: "Mounted virtual drive via WinFsp + rclone".to_string(),
        },
        Err(e) => NativeMountResult {
            success: false,
            drive_letter: format!("{}:", clean_letter),
            remote_target: target,
            message: format!("Failed to spawn rclone mount: {}. Ensure rclone and WinFsp are installed.", e),
        },
    }
}

#[tauri::command]
fn terminate_process_safe(pid: u32, process_name: String) -> Result<String, String> {
    let lower = process_name.to_lowercase();
    if pid == 0 || pid == 4 || PROTECTED_BINARIES.contains(&lower.as_str()) {
        return Err(format!(
            "Protected System Process Lockout: {} (PID {}) cannot be terminated.",
            process_name, pid
        ));
    }

    let mut sys = System::new_all();
    sys.refresh_all();
    if let Some(process) = sys.process(sysinfo::Pid::from_u32(pid)) {
        if process.kill() {
            return Ok(format!("Terminated {} (PID {})", process_name, pid));
        }
    }
    Err(format!("Unable to terminate PID {}", pid))
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            mount_gdrive_winfsp,
            terminate_process_safe
        ])
        .run(tauri::generate_context!())
        .expect("error while running System Command Center Tauri application");
}
