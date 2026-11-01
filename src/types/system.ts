/**
 * System Intelligence, Optimization, Command Execution & Settings Data Types
 */

export type RiskCategory = 'Safe Optional' | 'Review Required' | 'Protected System Process';

export type ProcessStatus = 'Foreground Application' | 'Background Process' | 'Windows System Service';

export type StartupStatus = 'Enabled (Registry Run)' | 'Disabled' | 'Not in Startup' | 'Scheduled Task' | 'Startup Folder';

export interface ProcessInfo {
  pid: number;
  name: string;
  appAssociation: string;
  exePath: string;
  publisher: string;
  digitalSignature: string;
  isSignatureValid: boolean;
  parentPid: number;
  parentName: string;
  cpuPercent: number;
  ramMB: number;
  gpuPercent: number;
  diskKbps: number;
  networkKbps: number;
  status: ProcessStatus;
  startupStatus: StartupStatus;
  category: RiskCategory;
  purposeExplanation: string;
  startTime: string;
  threads: number;
  handles: number;
  canTerminate: boolean;
  terminationBlockReason?: string;
}

export type ServiceStatus = 'Running' | 'Stopped' | 'Paused';
export type ServiceStartupType = 'Automatic' | 'Manual' | 'Disabled';

export interface WindowsService {
  name: string;
  displayName: string;
  status: ServiceStatus;
  startupType: ServiceStartupType;
  exePath?: string;
  description: string;
  publisher: string;
  pid?: number;
  category: RiskCategory;
  logOnAs: string;
  dependencies: string[];
}

export interface StartupItem {
  id: string;
  name: string;
  command: string;
  publisher: string;
  location: 'Registry HKCU Run' | 'Registry HKLM Run' | 'Shell Startup' | 'Task Scheduler';
  enabled: boolean;
  impact: 'High' | 'Medium' | 'Low' | 'None';
  bootTimeImpactMs: number;
  description: string;
  category: RiskCategory;
}

export interface SystemResourceMetrics {
  deviceName: string;
  cpuModel: string;
  cpuTotalPercent: number;
  cpuTempCelsius: number;
  cpuCores: number;
  cpuFrequencyGhz: number;
  ramModel: string;
  ramUsedGB: number;
  ramTotalGB: number;
  ramPercent: number;
  gpuName: string;
  gpuPercent: number;
  gpuTempCelsius: number;
  gpuMemoryUsedGB: number;
  gpuMemoryTotalGB: number;
  diskModel: string;
  diskReadMBps: number;
  diskWriteMBps: number;
  diskUsagePercent: number;
  diskTotalGB: number;
  diskFreeGB: number;
  networkAdapterName: string;
  netDownMbps: number;
  netUpMbps: number;
  uptimeSeconds: number;
  processCount: number;
  threadCount: number;
  handleCount: number;
}

export interface OptimizationItem {
  id: string;
  title: string;
  category: 'Startup & Boot' | 'Background Services' | 'Memory & Cache' | 'Network & Cloud' | 'Storage Hygiene';
  whatItChanges: string;
  whySuggested: string;
  potentialRisks: string;
  requiresAdmin: boolean;
  estimatedGain: string;
  beforeMetric: string;
  afterMetric: string;
  applied: boolean;
  reversible: boolean;
}

export type CommandRiskLevel =
  | 'Safe Read-Only'
  | 'System Modification'
  | 'Privileged Admin'
  | 'Blocked Destructive';

export interface CommandValidationResult {
  allowed: boolean;
  riskLevel: CommandRiskLevel;
  requiresAdmin: boolean;
  requiresApproval: boolean;
  explanation: string;
  blockedReason?: string;
}

export interface CommandExecutionEntry {
  id: string;
  command: string;
  workingDir: string;
  explanation: string;
  riskLevel: CommandRiskLevel;
  requiresAdmin: boolean;
  approved: boolean;
  status: 'pending_approval' | 'running' | 'completed' | 'failed' | 'cancelled' | 'blocked';
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
  executedAt: string;
}

export type ThemePreset = "Neo's Noir" | 'Fluent Obsidian' | 'Violet Pulse';

export interface PlatformSettings {
  tooltipMode: boolean;
  appNotifications: boolean;
  autoInstallUpdates: boolean;
  defaultToMyPc: boolean;
  realTimeMonitoring: boolean;
  performanceLogs: boolean;
  startWithWindows: boolean;
  autoMountVirtualDrive: boolean;
  defaultMountLetter: string;
  defaultRemote: string;
  defaultRemoteFolder: string;
  autoReconnectMount: boolean;
  scheduledTransferEnabled: boolean;
  scheduledTransferIntervalHours: number;
  fileChangeWatchEnabled: boolean;
  monitoringIntervalMs: number;
  theme: ThemePreset;
}

/**
 * ActivityLog strictly distinguishes genuine reversible operations (startup toggles,
 * service startup type changes, virtual drive mount changes, optimization toggles)
 * from non-reversible operations (process termination).
 */
export interface ActivityLog {
  id: string;
  timestamp: string;
  actionType:
    | 'terminate_process'
    | 'toggle_startup'
    | 'rclone_upload'
    | 'rclone_restore'
    | 'scan_storage'
    | 'service_control'
    | 'mount_drive'
    | 'command_exec'
    | 'optimization_apply'
    | 'settings_update';
  target: string;
  details: string;
  undoable: boolean; // MUST be false for terminate_process
  undone: boolean;
  previousState?: any;
}
