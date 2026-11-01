import {
  ActivityLog,
  CommandValidationResult,
  ProcessInfo,
  RiskCategory,
  StartupItem,
} from '../types/system';

/**
 * Well-known core Windows protected processes that must NEVER be terminated.
 * Terminating these will cause immediate BSOD (Bug Check) or system instability.
 */
export const CRITICAL_PROTECTED_WINDOWS_BINARIES = new Set([
  'system',
  'smss.exe',
  'csrss.exe',
  'wininit.exe',
  'services.exe',
  'lsass.exe',
  'dwm.exe',
  'winlogon.exe',
  'fontdrvhost.exe',
  'securityhealthservice.exe',
  'msmpeng.exe',
  'sihost.exe',
]);

/**
 * Classifies a Windows process into:
 * - 'Protected System Process'
 * - 'Review Required'
 * - 'Safe Optional'
 *
 * Note: A digital signature alone does not make a core kernel binary optional,
 * and high RAM consumption alone never marks a process as unnecessary.
 */
export function classifyProcessRisk(
  name: string,
  exePath: string,
  publisher: string,
  isSignatureValid: boolean,
  _ramMB: number
): RiskCategory {
  const lowerName = name.toLowerCase();
  const lowerPath = exePath.toLowerCase();
  const lowerPub = publisher.toLowerCase();

  // 1. Check critical protected OS binaries
  if (CRITICAL_PROTECTED_WINDOWS_BINARIES.has(lowerName)) {
    return 'Protected System Process';
  }

  // 2. Check for suspicious or unsigned binaries, scripts, or processes in Temp/AppData root
  if (!isSignatureValid || lowerPub.includes('unknown') || lowerPub.includes('unsigned')) {
    return 'Review Required';
  }

  if (
    lowerPath.includes('\\temp\\') ||
    lowerPath.includes('/tmp/') ||
    lowerPath.endsWith('.ps1') ||
    lowerPath.endsWith('.vbs') ||
    lowerPath.endsWith('.bat') ||
    (lowerPath.includes('appdata\\local\\temp') && !lowerPub.includes('microsoft'))
  ) {
    return 'Review Required';
  }

  // Masquerading detection: e.g. svchost.exe running outside System32 or SysWOW64
  if (lowerName === 'svchost.exe' && !lowerPath.includes('system32') && !lowerPath.includes('syswow64')) {
    return 'Review Required';
  }

  // 3. Known valid publisher or non-critical user application
  return 'Safe Optional';
}

/**
 * Determines whether a process can be safely terminated.
 * Critical rule: Never terminate protected system processes!
 */
export function checkTerminationSafety(process: Pick<ProcessInfo, 'name' | 'category' | 'pid'>): {
  allowed: boolean;
  reason?: string;
} {
  const lowerName = process.name.toLowerCase();

  if (process.pid === 0 || process.pid === 4) {
    return {
      allowed: false,
      reason: 'Protected System Core (System Idle / Kernel PID 4): Termination strictly prohibited by OS.',
    };
  }

  if (process.category === 'Protected System Process' || CRITICAL_PROTECTED_WINDOWS_BINARIES.has(lowerName)) {
    return {
      allowed: false,
      reason: `Protected System Process: "${process.name}" is essential to Windows 11 stability. Terminating it would trigger a kernel bug check (BSOD).`,
    };
  }

  return { allowed: true };
}

/**
 * Strictly determines whether an operation can genuinely be reversed/restored.
 * Requirement 12: "Implement genuine restore functionality only for operations that can actually be reversed.
 * Do not call process termination reversible."
 */
export function isOperationReversible(actionType: ActivityLog['actionType']): boolean {
  switch (actionType) {
    case 'terminate_process':
    case 'scan_storage':
    case 'command_exec':
    case 'rclone_upload':
      return false;
    case 'toggle_startup':
    case 'service_control':
    case 'mount_drive':
    case 'optimization_apply':
    case 'settings_update':
    case 'rclone_restore':
      return true;
    default:
      return false;
  }
}

/**
 * Validates and classifies local Windows / system commands before execution.
 * Enforces Section 9 & 13 security rules:
 * - Blocks destructive disk/OS commands
 * - Detects command chaining injection when suspicious
 * - Identifies Administrator-level actions
 * - Explains what the command will do before execution
 */
export function validateLocalCommand(rawCommand: string, workingDir = 'C:\\Users\\Admin'): CommandValidationResult {
  const trimmed = rawCommand.trim();
  const lower = trimmed.toLowerCase();

  if (!trimmed) {
    return {
      allowed: false,
      riskLevel: 'Blocked Destructive',
      requiresAdmin: false,
      requiresApproval: false,
      explanation: 'Empty command cannot be executed.',
      blockedReason: 'Command string is empty.',
    };
  }

  // Block destructive system/file commands
  const destructivePatterns = [
    /\bformat\s+[a-z]:/i,
    /\bdel\s+.*\/[fsq]/i,
    /\brd\s+\/s\s+\/q\s+c:\\windows/i,
    /\brmdir\s+\/s\s+\/q\s+c:\\/i,
    /\brm\s+-rf\s+\/($|\s|\*)/i,
    /\breg\s+delete\s+hklm\\(system|sam|security)/i,
    /\bbcdedit\s+\/delete/i,
    /\bdiskpart\b/i,
    /\bcipher\s+\/w:/i,
    /\brclone\s+(purge|delete)\b/i,
    /\bpowershell.*-enc(odedcommand)?\b/i,
    /\biex\s*\(/i,
    /\binvoke-expression\b/i,
  ];

  for (const pattern of destructivePatterns) {
    if (pattern.test(trimmed)) {
      return {
        allowed: false,
        riskLevel: 'Blocked Destructive',
        requiresAdmin: true,
        requiresApproval: true,
        explanation: `Blocked command targeting critical OS or user storage in "${workingDir}".`,
        blockedReason:
          'Security Policy Violation: Destructive disk, registry, encoded payload, or automatic deletion commands are strictly prohibited.',
      };
    }
  }

  // Identify Administrator-level commands
  const adminPatterns = [
    /\bsfc\s+\/scannow/i,
    /\bdism(\.exe)?\s+\/online/i,
    /\bchkdsk\b/i,
    /\bnetsh\s+(winsock|int|advfirewall)/i,
    /\bipconfig\s+\/(flushdns|release|renew)/i,
    /\bsc(\.exe)?\s+(config|stop|start)/i,
    /\bnet\s+(stop|start|user)/i,
    /\bpowercfg\b/i,
    /\bwevtutil\b/i,
  ];

  for (const pattern of adminPatterns) {
    if (pattern.test(trimmed)) {
      return {
        allowed: true,
        riskLevel: 'Privileged Admin',
        requiresAdmin: true,
        requiresApproval: true,
        explanation: `Executes elevated Windows administrative utility ("${trimmed.split(' ')[0]}") in ${workingDir}. Requires explicit User Approval and Administrator privileges.`,
      };
    }
  }

  // Identify System or Cloud Modification commands
  const modificationPatterns = [
    /\brclone\s+(copy|mount|mkdir|check)\b/i,
    /\btaskkill\b/i,
    /\breg\s+add\b/i,
    /\bmkdir\b/i,
    /\bcopy\b/i,
    /\bxcopy\b/i,
    /\brobocopy\b/i,
  ];

  for (const pattern of modificationPatterns) {
    if (pattern.test(trimmed)) {
      return {
        allowed: true,
        riskLevel: 'System Modification',
        requiresAdmin: false,
        requiresApproval: true,
        explanation: `Performs controlled state or non-destructive file/mount operation ("${trimmed}") inside ${workingDir}. Explicit confirmation required.`,
      };
    }
  }

  // Default: Safe Read-Only inspection command (e.g., systeminfo, tasklist, rclone listremotes,rclone about, dir, whoami, hostname, netstat, ping)
  return {
    allowed: true,
    riskLevel: 'Safe Read-Only',
    requiresAdmin: false,
    requiresApproval: lower.includes('&&') || lower.includes(';'),
    explanation: `Runs read-only diagnostic inspection ("${trimmed}") in working directory ${workingDir}. Does not modify system state or user files.`,
  };
}

/**
 * Redacts OAuth tokens, client secrets, and bearer tokens from logs and terminal output.
 */
export function redactSecretsFromOutput(input: string): string {
  if (!input) return '';
  return input
    .replace(/(access_token|refresh_token|client_secret|password|api_key)\s*["':=]\s*["']?([^"'\s,}]+)["']?/gi, '$1="[REDACTED]"')
    .replace(/ya29\.[0-9A-Za-z\-_]+/g, 'ya29.[REDACTED_GOOGLE_OAUTH_TOKEN]')
    .replace(/AIza[0-9A-Za-z\-_]{30,}/g, 'AIza[REDACTED_API_KEY]');
}

/**
 * Formats byte values into readable strings
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const safeI = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, safeI)).toFixed(dm))} ${sizes[safeI]}`;
}

/**
 * Formats megabytes into human-readable memory string
 */
export function formatMB(megabytes: number): string {
  if (megabytes >= 1024) {
    return `${(megabytes / 1024).toFixed(2)} GB`;
  }
  return `${megabytes.toFixed(0)} MB`;
}

/**
 * Formats network speed in KB/s or MB/s
 */
export function formatNetworkSpeed(kbps: number): string {
  if (kbps >= 1024) {
    return `${(kbps / 1024).toFixed(1)} MB/s`;
  }
  return `${kbps.toFixed(0)} KB/s`;
}

/**
 * Formats process uptime / start time duration
 */
export function formatDuration(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/**
 * Toggle startup item state safely with undo snapshot
 */
export function toggleStartupState(
  item: StartupItem
): { updatedItem: StartupItem; previousEnabled: boolean } {
  const previousEnabled = item.enabled;
  const updatedItem: StartupItem = {
    ...item,
    enabled: !item.enabled,
  };
  return { updatedItem, previousEnabled };
}
