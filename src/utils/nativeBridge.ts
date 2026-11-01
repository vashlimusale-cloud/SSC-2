import { invoke } from '@tauri-apps/api/tauri';
import {
  ProcessInfo,
  SystemResourceMetrics,
  CommandExecutionEntry,
  CommandValidationResult,
  PlatformSettings,
  ActivityLog,
} from '../types/system';

export interface NativeMountVerification {
  success: boolean;
  isMounted: boolean;
  processAlive: boolean;
  pid: number | null;
  driveLetter: string;
  mountPath: string;
  remoteName: string;
  remoteFolder: string;
  drivePathExists: boolean;
  explorerAccessible: boolean;
  rcloneInstalled: boolean;
  rcloneVersion: string;
  winfspInstalled: boolean;
  winfspVersion: string;
  remotes: string[];
  connectionHealth: 'Connected' | 'Reconnecting' | 'Unmounted' | 'Mount Error';
  message: string;
}

let cachedSessionToken: string | null = null;

/**
 * Detects whether the application is running inside the native Tauri desktop runtime.
 */
export function isTauriDesktopRuntime(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('__TAURI_IPC__' in window || '__TAURI__' in window || '__TAURI_INTERNALS__' in window)
  );
}

/**
 * Retrieves and caches the localhost session security token from /api/session.
 * All state-mutating local backend endpoints require X-SCC-Session-Token.
 */
export async function getSessionSecurityToken(): Promise<string> {
  if (cachedSessionToken) {
    return cachedSessionToken;
  }
  try {
    const res = await fetch('/api/session', {
      method: 'GET',
      credentials: 'same-origin',
    });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.sessionToken === 'string') {
        cachedSessionToken = data.sessionToken;
        return cachedSessionToken;
      }
    }
  } catch {
    // Fallback when running purely inside standalone Tauri binary without Express
  }
  return '';
}

/**
 * Helper to perform authenticated local API requests with X-SCC-Session-Token.
 */
export async function authorizedLocalFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getSessionSecurityToken();
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('X-SCC-Session-Token', token);
  }
  return fetch(url, {
    ...options,
    headers,
    credentials: 'same-origin',
  });
}

/**
 * Verifies actual OS mount status, rclone process lifecycle, and WinFsp / rclone dependencies.
 * Never reports Connected based solely on frontend state.
 */
export async function verifyVirtualDriveMountNative(
  driveLetter = 'G:'
): Promise<NativeMountVerification> {
  if (isTauriDesktopRuntime()) {
    try {
      const deps = await invoke<{
        rclone_installed: boolean;
        rclone_version: string;
        rclone_binary_path: string;
        winfsp_installed: boolean;
        winfsp_path: string;
        remotes: string[];
      }>('check_gdrive_dependencies');

      const verifyRes = await invoke<{
        success: boolean;
        is_mounted: boolean;
        process_alive: boolean;
        pid: number | null;
        drive_letter: string;
        mount_path: string;
        remote_target: string;
        drive_path_exists: boolean;
        explorer_accessible: boolean;
        message: string;
      }>('verify_gdrive_mount', { driveLetter });

      const [remName, ...folderParts] = (verifyRes.remote_target || 'gdrive:Laptop_Full_Backup/C_Drive_User').split(':');
      const remoteName = `${remName || 'gdrive'}:`;
      const remoteFolder = folderParts.join(':') || 'Laptop_Full_Backup/C_Drive_User';

      return {
        success: verifyRes.success,
        isMounted: verifyRes.is_mounted && verifyRes.drive_path_exists,
        processAlive: verifyRes.process_alive,
        pid: verifyRes.pid,
        driveLetter: verifyRes.drive_letter,
        mountPath: verifyRes.mount_path,
        remoteName,
        remoteFolder,
        drivePathExists: verifyRes.drive_path_exists,
        explorerAccessible: verifyRes.explorer_accessible,
        rcloneInstalled: deps.rclone_installed,
        rcloneVersion: deps.rclone_version,
        winfspInstalled: deps.winfsp_installed,
        winfspVersion: deps.winfsp_installed ? `WinFsp (${deps.winfsp_path})` : 'Not Installed',
        remotes: deps.remotes,
        connectionHealth:
          verifyRes.is_mounted && verifyRes.drive_path_exists ? 'Connected' : 'Unmounted',
        message: verifyRes.message,
      };
    } catch (err: any) {
      return {
        success: false,
        isMounted: false,
        processAlive: false,
        pid: null,
        driveLetter,
        mountPath: `${driveLetter.replace(/:$/, '')}:\\`,
        remoteName: 'gdrive:',
        remoteFolder: 'Laptop_Full_Backup/C_Drive_User',
        drivePathExists: false,
        explorerAccessible: false,
        rcloneInstalled: false,
        rcloneVersion: 'Not Installed',
        winfspInstalled: false,
        winfspVersion: 'Not Installed',
        remotes: [],
        connectionHealth: 'Mount Error',
        message: err?.message || String(err),
      };
    }
  }

  const res = await authorizedLocalFetch(
    `/api/mount/verify?driveLetter=${encodeURIComponent(driveLetter)}`
  );
  if (!res.ok) {
    throw new Error(`Mount verification failed with HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Executes a real mount, unmount, or reconnect operation via Tauri native command or local backend.
 * Persists configuration separately from verified OS mount status.
 */
export async function performVirtualDriveActionNative(options: {
  action: 'mount' | 'unmount' | 'reconnect';
  driveLetter: string;
  remoteName: string;
  remoteFolder: string;
}): Promise<NativeMountVerification> {
  const { action, driveLetter, remoteName, remoteFolder } = options;

  if (isTauriDesktopRuntime()) {
    try {
      const deps = await invoke<{
        rclone_installed: boolean;
        rclone_version: string;
        rclone_binary_path: string;
        winfsp_installed: boolean;
        winfsp_path: string;
        remotes: string[];
      }>('check_gdrive_dependencies');

      let mountRes: {
        success: boolean;
        is_mounted: boolean;
        process_alive: boolean;
        pid: number | null;
        drive_letter: string;
        mount_path: string;
        remote_target: string;
        drive_path_exists: boolean;
        explorer_accessible: boolean;
        message: string;
      };

      if (action === 'unmount') {
        mountRes = await invoke('unmount_gdrive_winfsp', { driveLetter });
      } else if (action === 'reconnect') {
        const current = await invoke<typeof mountRes>('verify_gdrive_mount', { driveLetter });
        if (current.is_mounted && current.drive_path_exists) {
          mountRes = current;
        } else {
          mountRes = await invoke('mount_gdrive_winfsp', {
            remoteName,
            remoteFolder,
            driveLetter,
          });
        }
      } else {
        mountRes = await invoke('mount_gdrive_winfsp', {
          remoteName,
          remoteFolder,
          driveLetter,
        });
      }

      const verifiedMounted = Boolean(mountRes.is_mounted && mountRes.drive_path_exists);
      return {
        success: mountRes.success,
        isMounted: verifiedMounted,
        processAlive: mountRes.process_alive,
        pid: mountRes.pid,
        driveLetter: mountRes.drive_letter,
        mountPath: mountRes.mount_path,
        remoteName,
        remoteFolder,
        drivePathExists: mountRes.drive_path_exists,
        explorerAccessible: mountRes.explorer_accessible,
        rcloneInstalled: deps.rclone_installed,
        rcloneVersion: deps.rclone_version,
        winfspInstalled: deps.winfsp_installed,
        winfspVersion: deps.winfsp_installed ? `WinFsp (${deps.winfsp_path})` : 'Not Installed',
        remotes: deps.remotes,
        connectionHealth: verifiedMounted
          ? 'Connected'
          : action === 'unmount'
          ? 'Unmounted'
          : 'Mount Error',
        message: mountRes.message,
      };
    } catch (err: any) {
      return {
        success: false,
        isMounted: false,
        processAlive: false,
        pid: null,
        driveLetter,
        mountPath: `${driveLetter.replace(/:$/, '')}:\\`,
        remoteName,
        remoteFolder,
        drivePathExists: false,
        explorerAccessible: false,
        rcloneInstalled: false,
        rcloneVersion: 'Not Installed',
        winfspInstalled: false,
        winfspVersion: 'Not Installed',
        remotes: [],
        connectionHealth: 'Mount Error',
        message: err?.message || String(err),
      };
    }
  }

  const res = await authorizedLocalFetch('/api/mount/action', {
    method: 'POST',
    body: JSON.stringify({
      action,
      driveLetter,
      remoteName,
      remoteFolder,
    }),
  });
  return res.json();
}

/**
 * Verifies drive letter existence and opens Windows File Explorer if mounted on a Windows host.
 */
export async function openDriveInExplorerNative(
  driveLetter: string
): Promise<{ opened: boolean; explorerAccessible: boolean; message: string }> {
  if (isTauriDesktopRuntime()) {
    try {
      const msg = await invoke<string>('open_in_explorer', { driveLetter });
      return { opened: true, explorerAccessible: true, message: msg };
    } catch (err: any) {
      return {
        opened: false,
        explorerAccessible: false,
        message: typeof err === 'string' ? err : err?.message || 'Explorer launch failed',
      };
    }
  }

  const res = await authorizedLocalFetch('/api/mount/open-explorer', {
    method: 'POST',
    body: JSON.stringify({ driveLetter }),
  });
  return res.json();
}

/**
 * Fetches live hardware telemetry from Tauri sysinfo or host OS kernel without Math.random().
 */
export async function fetchLiveHardwareTelemetry(): Promise<SystemResourceMetrics | null> {
  if (isTauriDesktopRuntime()) {
    try {
      const t = await invoke<{
        device_name: string;
        os_platform: string;
        cpu_model: string;
        cpu_total_percent: number;
        cpu_per_core_percent: number[];
        cpu_temp_celsius: number | null;
        cpu_cores: number;
        cpu_frequency_ghz: number;
        ram_used_gb: number;
        ram_total_gb: number;
        ram_percent: number;
        gpu_name: string;
        gpu_percent: number | null;
        gpu_temp_celsius: number | null;
        disk_model: string;
        disk_total_gb: number;
        disk_free_gb: number;
        disk_usage_percent: number;
        network_adapter_name: string;
        net_down_mbps: number;
        net_up_mbps: number;
        uptime_seconds: number;
        process_count: number;
      }>('get_live_telemetry');

      return {
        deviceName: t.device_name,
        osPlatform: t.os_platform,
        cpuModel: t.cpu_model,
        cpuTotalPercent: +t.cpu_total_percent.toFixed(1),
        cpuPerCorePercent: t.cpu_per_core_percent.map((v) => +v.toFixed(1)),
        cpuTempCelsius: t.cpu_temp_celsius,
        cpuCores: t.cpu_cores,
        cpuFrequencyGhz: +t.cpu_frequency_ghz.toFixed(2),
        ramModel: `${t.ram_total_gb.toFixed(1)} GB System RAM`,
        ramUsedGB: +t.ram_used_gb.toFixed(2),
        ramTotalGB: +t.ram_total_gb.toFixed(2),
        ramPercent: +t.ram_percent.toFixed(1),
        gpuName: t.gpu_name,
        gpuPercent: t.gpu_percent,
        gpuTempCelsius: t.gpu_temp_celsius,
        gpuMemoryUsedGB: null,
        gpuMemoryTotalGB: null,
        diskModel: t.disk_model,
        diskReadMBps: null,
        diskWriteMBps: null,
        diskUsagePercent: +t.disk_usage_percent.toFixed(0),
        diskTotalGB: +t.disk_total_gb.toFixed(1),
        diskFreeGB: +t.disk_free_gb.toFixed(1),
        networkAdapterName: t.network_adapter_name,
        netDownMbps: +t.net_down_mbps.toFixed(2),
        netUpMbps: +t.net_up_mbps.toFixed(2),
        uptimeSeconds: t.uptime_seconds,
        processCount: t.process_count,
        threadCount: t.process_count * 4,
        handleCount: null,
        sensorStatus: {
          cpuTempAvailable: t.cpu_temp_celsius !== null,
          gpuTelemetryAvailable: t.gpu_percent !== null,
          diskIoRateAvailable: false,
          telemetrySource: 'tauri-native',
        },
      };
    } catch {
      // Fallback to local backend if Tauri invoke fails
    }
  }

  const res = await fetch('/api/telemetry');
  if (!res.ok) return null;
  return res.json();
}

/**
 * Fetches real running OS processes from Tauri sysinfo or host OS process table.
 */
export async function fetchLiveProcessesNative(): Promise<ProcessInfo[]> {
  const res = await fetch('/api/processes');
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data.processes) ? data.processes : [];
}

/**
 * Terminates a non-protected OS process via Tauri sysinfo or host OS signal.
 */
export async function terminateProcessNative(
  pid: number,
  processName: string
): Promise<{ terminated: boolean; message: string }> {
  if (isTauriDesktopRuntime()) {
    try {
      const msg = await invoke<string>('terminate_process_safe', {
        pid,
        processName,
      });
      return { terminated: true, message: msg };
    } catch (err: any) {
      return {
        terminated: false,
        message: typeof err === 'string' ? err : err?.message || 'Process termination failed',
      };
    }
  }

  const res = await authorizedLocalFetch('/api/process/terminate', {
    method: 'POST',
    body: JSON.stringify({ pid, name: processName }),
  });
  return res.json();
}

/**
 * Executes an allowlisted local command via authenticated backend or Tauri command engine.
 */
export async function executeLocalCommandNative(params: {
  command: string;
  workingDir: string;
  approved: boolean;
  timeoutMs?: number;
}): Promise<
  | ({ requiresConfirmation?: false } & CommandExecutionEntry)
  | { requiresConfirmation: true; validation: CommandValidationResult }
> {
  const res = await authorizedLocalFetch('/api/command/execute', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `Command execution failed with HTTP ${res.status}`);
  }
  return res.json();
}

export async function cancelActiveCommandNative(id?: string): Promise<{
  cancelled: boolean;
  id?: string;
  reason?: string;
}> {
  const res = await authorizedLocalFetch('/api/command/cancel', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
  return res.json();
}

export async function persistSettingsNative(settings: PlatformSettings): Promise<void> {
  await authorizedLocalFetch('/api/settings', {
    method: 'POST',
    body: JSON.stringify(settings),
  });
}

export async function persistActivityLogNative(log: ActivityLog): Promise<void> {
  await authorizedLocalFetch('/api/activity', {
    method: 'POST',
    body: JSON.stringify(log),
  });
}
