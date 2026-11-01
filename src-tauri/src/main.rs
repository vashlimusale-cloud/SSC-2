#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::path::Path;
use std::process::{Child, Command};
use std::sync::Mutex;
use std::thread;
use std::time::Duration;
use sysinfo::{Disks, Networks, System};
use tauri::State;

pub struct MountProcessState {
    pub child: Mutex<Option<Child>>,
    pub drive_letter: Mutex<String>,
    pub remote_target: Mutex<String>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct DependencyCheckResult {
    pub rclone_installed: bool,
    pub rclone_version: String,
    pub rclone_binary_path: String,
    pub winfsp_installed: bool,
    pub winfsp_path: String,
    pub remotes: Vec<String>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct NativeMountResult {
    pub success: bool,
    pub is_mounted: bool,
    pub process_alive: bool,
    pub pid: Option<u32>,
    pub drive_letter: String,
    pub mount_path: String,
    pub remote_target: String,
    pub drive_path_exists: bool,
    pub explorer_accessible: bool,
    pub message: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct NativeTelemetryResult {
    pub device_name: String,
    pub os_platform: String,
    pub cpu_model: String,
    pub cpu_total_percent: f32,
    pub cpu_per_core_percent: Vec<f32>,
    pub cpu_temp_celsius: Option<f32>,
    pub cpu_cores: usize,
    pub cpu_frequency_ghz: f32,
    pub ram_used_gb: f64,
    pub ram_total_gb: f64,
    pub ram_percent: f32,
    pub gpu_name: String,
    pub gpu_percent: Option<f32>,
    pub gpu_temp_celsius: Option<f32>,
    pub disk_model: String,
    pub disk_total_gb: f64,
    pub disk_free_gb: f64,
    pub disk_usage_percent: f32,
    pub network_adapter_name: String,
    pub net_down_mbps: f64,
    pub net_up_mbps: f64,
    pub uptime_seconds: u64,
    pub process_count: usize,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct NativeProcessItem {
    pub pid: u32,
    pub parent_pid: u32,
    pub name: String,
    pub exe_path: String,
    pub cpu_percent: f32,
    pub ram_mb: f64,
    pub can_terminate: bool,
    pub is_protected: bool,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct NativeCommandResult {
    pub exit_code: i32,
    pub stdout: String,
    pub stderr: String,
}

const PROTECTED_BINARIES: &[&str] = &[
    "system",
    "registry",
    "smss.exe",
    "csrss.exe",
    "wininit.exe",
    "services.exe",
    "lsass.exe",
    "svchost.exe",
    "dwm.exe",
    "winlogon.exe",
    "fontdrvhost.exe",
    "ntoskrnl.exe",
    "wudfhost.exe",
    "securityhealthservice.exe",
    "msmpeng.exe",
    "sihost.exe",
];

const ALLOWED_COMMAND_BINARIES: &[&str] = &[
    "rclone",
    "rclone.exe",
    "systeminfo",
    "ipconfig",
    "tasklist",
    "whoami",
    "hostname",
    "ver",
    "sfc",
    "dism",
    "chkdsk",
    "fltmc",
    "netstat",
    "ping",
    "echo",
    "uname",
    "uptime",
    "df",
    "free",
    "ps",
];

fn resolve_rclone_binary() -> Option<String> {
    let candidates = [
        "C:\\rclone\\rclone.exe",
        "C:\\Program Files\\rclone\\rclone.exe",
        "rclone.exe",
        "rclone",
    ];
    for candidate in candidates {
        if let Ok(output) = Command::new(candidate).arg("version").output() {
            if output.status.success() {
                return Some(candidate.to_string());
            }
        }
    }
    None
}

fn check_winfsp_installation() -> (bool, String) {
    let winfsp_paths = [
        "C:\\Program Files\\WinFsp\\bin\\launchctl-x64.exe",
        "C:\\Program Files (x86)\\WinFsp\\bin\\launchctl-x64.exe",
        "C:\\Program Files\\WinFsp",
        "C:\\Program Files (x86)\\WinFsp",
    ];
    for p in winfsp_paths {
        if Path::new(p).exists() {
            return (true, p.to_string());
        }
    }
    (false, String::new())
}

#[tauri::command]
fn check_gdrive_dependencies() -> DependencyCheckResult {
    let rclone_bin = resolve_rclone_binary();
    let (winfsp_installed, winfsp_path) = check_winfsp_installation();

    if let Some(bin) = rclone_bin {
        let ver_out = Command::new(&bin)
            .arg("version")
            .output()
            .ok()
            .and_then(|o| String::from_utf8(o.stdout).ok())
            .and_then(|s| s.lines().next().map(|l| l.trim().to_string()))
            .unwrap_or_else(|| "rclone (version unknown)".to_string());

        let remotes_out = Command::new(&bin)
            .arg("listremotes")
            .output()
            .ok()
            .and_then(|o| String::from_utf8(o.stdout).ok())
            .map(|s| {
                s.lines()
                    .map(|l| l.trim().to_string())
                    .filter(|l| !l.is_empty())
                    .collect::<Vec<String>>()
            })
            .unwrap_or_default();

        DependencyCheckResult {
            rclone_installed: true,
            rclone_version: ver_out,
            rclone_binary_path: bin,
            winfsp_installed,
            winfsp_path,
            remotes: remotes_out,
        }
    } else {
        DependencyCheckResult {
            rclone_installed: false,
            rclone_version: "Not Installed".to_string(),
            rclone_binary_path: String::new(),
            winfsp_installed,
            winfsp_path,
            remotes: Vec::new(),
        }
    }
}

#[tauri::command]
fn verify_gdrive_mount(
    drive_letter: String,
    state: State<'_, MountProcessState>,
) -> NativeMountResult {
    let clean_letter = drive_letter
        .trim_end_matches('\\')
        .trim_end_matches(':')
        .to_uppercase();
    let normalized_drive = format!("{}:", clean_letter);
    let mount_path = format!("{}:\\", clean_letter);

    let mut process_alive = false;
    let mut pid: Option<u32> = None;

    if let Ok(mut guard) = state.child.lock() {
        if let Some(child) = guard.as_mut() {
            match child.try_wait() {
                Ok(None) => {
                    process_alive = true;
                    pid = Some(child.id());
                }
                Ok(Some(_)) | Err(_) => {
                    *guard = None;
                }
            }
        }
    }

    let drive_path_exists = Path::new(&mount_path).exists();
    let explorer_accessible = drive_path_exists && std::fs::read_dir(&mount_path).is_ok();
    let is_mounted = drive_path_exists && explorer_accessible;

    let remote_target = state
        .remote_target
        .lock()
        .map(|g| g.clone())
        .unwrap_or_else(|_| "gdrive:Laptop_Full_Backup/C_Drive_User".to_string());

    let message = if is_mounted {
        format!(
            "Verified {} exists on OS and is accessible via Windows Explorer (PID: {:?}).",
            mount_path, pid
        )
    } else if process_alive && !drive_path_exists {
        format!(
            "rclone process (PID: {:?}) is running, but {} is not yet visible on the filesystem.",
            pid, mount_path
        )
    } else {
        format!("Drive {} is not mounted on the operating system.", mount_path)
    };

    NativeMountResult {
        success: is_mounted,
        is_mounted,
        process_alive,
        pid,
        drive_letter: normalized_drive,
        mount_path,
        remote_target,
        drive_path_exists,
        explorer_accessible,
        message,
    }
}

#[tauri::command]
fn mount_gdrive_winfsp(
    remote_name: String,
    remote_folder: String,
    drive_letter: String,
    state: State<'_, MountProcessState>,
) -> NativeMountResult {
    let clean_letter = drive_letter
        .trim_end_matches('\\')
        .trim_end_matches(':')
        .to_uppercase();
    let normalized_drive = format!("{}:", clean_letter);
    let mount_path = format!("{}:\\", clean_letter);

    let target = if remote_folder.trim().is_empty() {
        format!("{}:", remote_name.trim_end_matches(':'))
    } else {
        format!(
            "{}:{}",
            remote_name.trim_end_matches(':'),
            remote_folder.trim_matches('/')
        )
    };

    // 1. Check dependencies first
    let deps = check_gdrive_dependencies();
    if !deps.rclone_installed {
        return NativeMountResult {
            success: false,
            is_mounted: false,
            process_alive: false,
            pid: None,
            drive_letter: normalized_drive,
            mount_path,
            remote_target: target,
            drive_path_exists: false,
            explorer_accessible: false,
            message: "Cannot mount: rclone binary was not found on this machine.".to_string(),
        };
    }

    if cfg!(target_os = "windows") && !deps.winfsp_installed {
        return NativeMountResult {
            success: false,
            is_mounted: false,
            process_alive: false,
            pid: None,
            drive_letter: normalized_drive,
            mount_path,
            remote_target: target,
            drive_path_exists: false,
            explorer_accessible: false,
            message: "Cannot mount: WinFsp driver is not installed in C:\\Program Files\\WinFsp."
                .to_string(),
        };
    }

    // 2. Check if already mounted by us or conflicting drive
    if Path::new(&mount_path).exists() {
        let current = verify_gdrive_mount(normalized_drive.clone(), state);
        if current.process_alive && current.is_mounted {
            return current;
        }
        return NativeMountResult {
            success: false,
            is_mounted: false,
            process_alive: false,
            pid: None,
            drive_letter: normalized_drive,
            mount_path: mount_path.clone(),
            remote_target: target,
            drive_path_exists: true,
            explorer_accessible: false,
            message: format!(
                "Drive letter conflict: {} is already occupied by another volume on the system.",
                mount_path
            ),
        };
    }

    // 3. Spawn rclone mount and track its child process
    let spawn_res = Command::new(&deps.rclone_binary_path)
        .args([
            "mount",
            &target,
            &normalized_drive,
            "--vfs-cache-mode",
            "full",
            "--dir-cache-time",
            "5m",
            "--volname",
            &format!("Google Drive ({})", normalized_drive),
            "--network-mode",
        ])
        .spawn();

    match spawn_res {
        Ok(mut child) => {
            let pid = child.id();
            // Poll up to 2.5 seconds for WinFsp to register the volume letter
            for _ in 0..10 {
                thread::sleep(Duration::from_millis(250));
                if Path::new(&mount_path).exists() {
                    break;
                }
                if let Ok(Some(_)) = child.try_wait() {
                    break;
                }
            }

            let process_alive = matches!(child.try_wait(), Ok(None));
            let drive_path_exists = Path::new(&mount_path).exists();
            let explorer_accessible = drive_path_exists && std::fs::read_dir(&mount_path).is_ok();
            let is_mounted = process_alive && drive_path_exists;

            if process_alive {
                if let Ok(mut guard) = state.child.lock() {
                    *guard = Some(child);
                }
                if let Ok(mut d_guard) = state.drive_letter.lock() {
                    *d_guard = normalized_drive.clone();
                }
                if let Ok(mut t_guard) = state.remote_target.lock() {
                    *t_guard = target.clone();
                }
            }

            NativeMountResult {
                success: is_mounted,
                is_mounted,
                process_alive,
                pid: if process_alive { Some(pid) } else { None },
                drive_letter: normalized_drive,
                mount_path: mount_path.clone(),
                remote_target: target,
                drive_path_exists,
                explorer_accessible,
                message: if is_mounted {
                    format!("Mounted {} via WinFsp (PID {}).", mount_path, pid)
                } else {
                    format!(
                        "Spawned rclone mount (PID {}), but volume {} was not created on OS.",
                        pid, mount_path
                    )
                },
            }
        }
        Err(e) => NativeMountResult {
            success: false,
            is_mounted: false,
            process_alive: false,
            pid: None,
            drive_letter: normalized_drive,
            mount_path,
            remote_target: target,
            drive_path_exists: false,
            explorer_accessible: false,
            message: format!("Failed to spawn rclone mount: {}", e),
        },
    }
}

#[tauri::command]
fn unmount_gdrive_winfsp(
    drive_letter: String,
    state: State<'_, MountProcessState>,
) -> NativeMountResult {
    let clean_letter = drive_letter
        .trim_end_matches('\\')
        .trim_end_matches(':')
        .to_uppercase();
    let normalized_drive = format!("{}:", clean_letter);
    let mount_path = format!("{}:\\", clean_letter);

    if let Ok(mut guard) = state.child.lock() {
        if let Some(mut child) = guard.take() {
            let _ = child.kill();
            let _ = child.wait();
        }
    }

    thread::sleep(Duration::from_millis(300));
    let drive_path_exists = Path::new(&mount_path).exists();
    let remote_target = state
        .remote_target
        .lock()
        .map(|g| g.clone())
        .unwrap_or_default();

    NativeMountResult {
        success: !drive_path_exists,
        is_mounted: drive_path_exists,
        process_alive: false,
        pid: None,
        drive_letter: normalized_drive,
        mount_path: mount_path.clone(),
        remote_target,
        drive_path_exists,
        explorer_accessible: false,
        message: if !drive_path_exists {
            format!("Unmounted {} and terminated rclone child process.", mount_path)
        } else {
            format!("Warning: {} path still exists after child termination.", mount_path)
        },
    }
}

#[tauri::command]
fn open_in_explorer(drive_letter: String) -> Result<String, String> {
    let clean_letter = drive_letter
        .trim_end_matches('\\')
        .trim_end_matches(':')
        .to_uppercase();
    let mount_path = format!("{}:\\", clean_letter);

    if !Path::new(&mount_path).exists() {
        return Err(format!(
            "Cannot open Windows Explorer: {} is not mounted on the filesystem.",
            mount_path
        ));
    }

    #[cfg(target_os = "windows")]
    {
        Command::new("explorer.exe")
            .arg(&mount_path)
            .spawn()
            .map_err(|e| format!("Failed to launch explorer.exe: {}", e))?;
        return Ok(format!("Opened {} in Windows File Explorer.", mount_path));
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("Windows Explorer (explorer.exe) is only available on Windows hosts.".to_string())
    }
}

#[tauri::command]
fn get_live_telemetry() -> NativeTelemetryResult {
    let mut sys = System::new_all();
    sys.refresh_all();
    thread::sleep(Duration::from_millis(120));
    sys.refresh_cpu_all();

    let cpus = sys.cpus();
    let cpu_cores = cpus.len().max(1);
    let cpu_model = cpus
        .first()
        .map(|c| c.brand().to_string())
        .unwrap_or_else(|| "Unknown Processor".to_string());
    let cpu_freq_ghz = cpus
        .first()
        .map(|c| (c.frequency() as f32) / 1000.0)
        .unwrap_or(0.0);
    let cpu_per_core_percent: Vec<f32> = cpus.iter().map(|c| c.cpu_usage()).collect();
    let cpu_total_percent: f32 =
        cpu_per_core_percent.iter().sum::<f32>() / (cpu_cores as f32);

    let total_mem_bytes = sys.total_memory() as f64;
    let used_mem_bytes = sys.used_memory() as f64;
    let ram_total_gb = (total_mem_bytes / 1_073_741_824.0 * 100.0).round() / 100.0;
    let ram_used_gb = (used_mem_bytes / 1_073_741_824.0 * 100.0).round() / 100.0;
    let ram_percent = if total_mem_bytes > 0.0 {
        ((used_mem_bytes / total_mem_bytes) * 100.0) as f32
    } else {
        0.0
    };

    let disks = Disks::new_with_refreshed_list();
    let (disk_model, disk_total_gb, disk_free_gb, disk_usage_percent) =
        if let Some(d) = disks.list().first() {
            let total = d.total_space() as f64 / 1_073_741_824.0;
            let avail = d.available_space() as f64 / 1_073_741_824.0;
            let used_pct = if total > 0.0 {
                (((total - avail) / total) * 100.0) as f32
            } else {
                0.0
            };
            (
                d.name().to_string_lossy().to_string(),
                (total * 10.0).round() / 10.0,
                (avail * 10.0).round() / 10.0,
                used_pct.round(),
            )
        } else {
            ("System Disk".to_string(), 0.0, 0.0, 0.0)
        };

    let networks = Networks::new_with_refreshed_list();
    let mut net_name = "Loopback / Host Adapter".to_string();
    let mut rx_bytes: u64 = 0;
    let mut tx_bytes: u64 = 0;
    for (iface_name, data) in &networks {
        net_name = iface_name.clone();
        rx_bytes += data.received();
        tx_bytes += data.transmitted();
    }

    NativeTelemetryResult {
        device_name: System::host_name().unwrap_or_else(|| "LOCAL-HOST".to_string()),
        os_platform: System::long_os_version().unwrap_or_else(|| std::env::consts::OS.to_string()),
        cpu_model,
        cpu_total_percent,
        cpu_per_core_percent,
        cpu_temp_celsius: None,
        cpu_cores,
        cpu_frequency_ghz: (cpu_freq_ghz * 100.0).round() / 100.0,
        ram_used_gb,
        ram_total_gb,
        ram_percent,
        gpu_name: "Hardware GPU Sensor Unavailable".to_string(),
        gpu_percent: None,
        gpu_temp_celsius: None,
        disk_model,
        disk_total_gb,
        disk_free_gb,
        disk_usage_percent,
        network_adapter_name: net_name,
        net_down_mbps: ((rx_bytes as f64) / 1_048_576.0 * 100.0).round() / 100.0,
        net_up_mbps: ((tx_bytes as f64) / 1_048_576.0 * 100.0).round() / 100.0,
        uptime_seconds: System::uptime(),
        process_count: sys.processes().len(),
    }
}

#[tauri::command]
fn list_processes_native() -> Vec<NativeProcessItem> {
    let mut sys = System::new_all();
    sys.refresh_all();
    let mut list: Vec<NativeProcessItem> = sys
        .processes()
        .iter()
        .map(|(pid, proc_info)| {
            let name = proc_info.name().to_string_lossy().to_string();
            let lower = name.to_lowercase();
            let pid_u32 = pid.as_u32();
            let is_protected =
                pid_u32 == 0 || pid_u32 == 4 || PROTECTED_BINARIES.contains(&lower.as_str());
            NativeProcessItem {
                pid: pid_u32,
                parent_pid: proc_info.parent().map(|p| p.as_u32()).unwrap_or(0),
                name,
                exe_path: proc_info
                    .exe()
                    .map(|p| p.to_string_lossy().to_string())
                    .unwrap_or_default(),
                cpu_percent: proc_info.cpu_usage(),
                ram_mb: ((proc_info.memory() as f64) / 1_048_576.0 * 10.0).round() / 10.0,
                can_terminate: !is_protected,
                is_protected,
            }
        })
        .collect();

    list.sort_by(|a, b| {
        b.ram_mb
            .partial_cmp(&a.ram_mb)
            .unwrap_or(std::cmp::Ordering::Equal)
    });
    list.truncate(100);
    list
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

#[tauri::command]
fn execute_command_native(
    binary: String,
    args: Vec<String>,
    working_dir: String,
) -> Result<NativeCommandResult, String> {
    let clean_bin = binary.trim().to_lowercase();
    if !ALLOWED_COMMAND_BINARIES.contains(&clean_bin.as_str()) {
        return Err(format!(
            "Binary '{}' is not in the command execution allowlist.",
            binary
        ));
    }

    let mut cmd = Command::new(&binary);
    cmd.args(&args);
    if Path::new(&working_dir).exists() {
        cmd.current_dir(&working_dir);
    }

    match cmd.output() {
        Ok(output) => Ok(NativeCommandResult {
            exit_code: output.status.code().unwrap_or(1),
            stdout: String::from_utf8_lossy(&output.stdout).to_string(),
            stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        }),
        Err(e) => Ok(NativeCommandResult {
            exit_code: 127,
            stdout: String::new(),
            stderr: format!("Executable '{}' failed or is not installed: {}", binary, e),
        }),
    }
}

fn main() {
    tauri::Builder::default()
        .manage(MountProcessState {
            child: Mutex::new(None),
            drive_letter: Mutex::new("G:".to_string()),
            remote_target: Mutex::new("gdrive:Laptop_Full_Backup/C_Drive_User".to_string()),
        })
        .invoke_handler(tauri::generate_handler![
            check_gdrive_dependencies,
            mount_gdrive_winfsp,
            unmount_gdrive_winfsp,
            verify_gdrive_mount,
            open_in_explorer,
            get_live_telemetry,
            list_processes_native,
            terminate_process_safe,
            execute_command_native
        ])
        .run(tauri::generate_context!())
        .expect("error while running System Command Center Tauri application");
}

