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

export function isProtectedSystemProcess(name: string, pid: number): boolean {
  if (pid === 0 || pid === 4) return true;
  return CRITICAL_PROTECTED_WINDOWS_BINARIES.has((name || '').trim().toLowerCase());
}

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
 * Strict allowlist of permitted command binaries for local execution.
 */
export const ALLOWED_COMMAND_BINARIES = new Set([
  'rclone',
  'c:\\rclone\\rclone.exe',
  'rclone.exe',
  'systeminfo',
  'hostname',
  'whoami',
  'tasklist',
  'ipconfig',
  'netstat',
  'ping',
  'sfc',
  'dism',
  'dism.exe',
  'chkdsk',
  'netsh',
  'sc',
  'sc.exe',
  'net',
  'powercfg',
  'wevtutil',
  'taskkill',
  'ver',
  'where',
  'dir',
  'echo',
  'uname',
  'uptime',
]);

/**
 * Tokenizes a command line string into an array of arguments while respecting quotes.
 */
export function tokenizeCommandArgs(commandLine: string): string[] {
  const args: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < commandLine.length; i++) {
    const ch = commandLine[i];
    if ((ch === '"' || ch === "'") && (!inQuotes || ch === quoteChar)) {
      if (inQuotes) {
        inQuotes = false;
        quoteChar = '';
      } else {
        inQuotes = true;
        quoteChar = ch;
      }
      continue;
    }
    if (/\s/.test(ch) && !inQuotes) {
      if (current.length > 0) {
        args.push(current);
        current = '';
      }
    } else {
      current += ch;
    }
  }
  if (current.length > 0) {
    args.push(current);
  }
  return args;
}

/**
 * Detects shell command chaining, redirection, or subshell injection operators outside quotes.
 */
export function hasCommandInjectionTokens(commandLine: string): {
  detected: boolean;
  operator?: string;
} {
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < commandLine.length; i++) {
    const ch = commandLine[i];
    const next = commandLine[i + 1] || '';

    if ((ch === '"' || ch === "'") && (!inQuotes || ch === quoteChar)) {
      inQuotes = !inQuotes;
      quoteChar = inQuotes ? ch : '';
      continue;
    }

    if (!inQuotes) {
      if (ch === ';' || ch === '|' || ch === '`' || ch === '>' || ch === '<' || ch === '\n' || ch === '\r') {
        return { detected: true, operator: ch === '\n' || ch === '\r' ? 'newline' : ch };
      }
      if (ch === '&' && next === '&') {
        return { detected: true, operator: '&&' };
      }
      if (ch === '&') {
        return { detected: true, operator: '&' };
      }
      if (ch === '$' && next === '(') {
        return { detected: true, operator: '$()' };
      }
    }
  }
  return { detected: false };
}

/**
 * Validates and classifies local Windows / system commands before execution.
 * Enforces Section 9 & 13 security rules:
 * - Blocks shell command chaining / injection metacharacters (&&, ||, ;, |, `, $(), >, <)
 * - Enforces binary allowlist
 * - Blocks destructive disk/OS/cloud commands
 * - Identifies Administrator-level actions and enforces explicit user approval gates
 */
export function validateLocalCommand(rawCommand: string, workingDir = 'C:\\Users\\Admin'): CommandValidationResult {
  const trimmed = rawCommand.trim();

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

  // 1. Block command chaining / shell injection attempts first
  const injection = hasCommandInjectionTokens(trimmed);
  if (injection.detected) {
    return {
      allowed: false,
      riskLevel: 'Blocked Destructive',
      requiresAdmin: false,
      requiresApproval: true,
      explanation: `Blocked shell command chaining or redirection operator ("${injection.operator}") in "${workingDir}".`,
      blockedReason: `Command Injection Protection: Shell chaining, pipe, redirection, or subshell operator ("${injection.operator}") is strictly prohibited.`,
    };
  }

  // 2. Block destructive system/file/cloud commands
  const destructivePatterns = [
    /\bformat\s+[a-z]:/i,
    /\bdel\s+.*\/[fsq]/i,
    /\brd\s+\/s/i,
    /\brmdir\s+\/s/i,
    /\brm\s+-[rf]/i,
    /\breg\s+delete\b/i,
    /\bbcdedit\s+\/delete/i,
    /\bdiskpart\b/i,
    /\bcipher\s+\/w:/i,
    /\brclone\s+(purge|delete|deletefile|rmdirs|sync|move)\b/i,
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
        explanation: `Blocked destructive command targeting OS or storage in "${workingDir}".`,
        blockedReason:
          'Security Policy Violation: Destructive disk, registry, encoded payload, rclone sync/move/purge/delete, or recursive deletion commands are strictly prohibited.',
      };
    }
  }

  // 3. Verify executable binary against allowlist
  const tokens = tokenizeCommandArgs(trimmed);
  const firstToken = (tokens[0] || '').toLowerCase();
  if (!ALLOWED_COMMAND_BINARIES.has(firstToken)) {
    return {
      allowed: false,
      riskLevel: 'Blocked Destructive',
      requiresAdmin: false,
      requiresApproval: true,
      explanation: `Executable "${tokens[0] || trimmed}" is not on the System Command Center verified allowlist.`,
      blockedReason: `Command Allowlist Violation: Binary "${tokens[0] || trimmed}" is not authorized for execution.`,
    };
  }

  // 4. Identify Administrator-level commands
  const adminPatterns = [
    /\bsfc\b/i,
    /\bdism(\.exe)?\b/i,
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
        explanation: `Executes elevated Windows administrative utility ("${tokens[0]}") in ${workingDir}. Requires explicit User Approval and Administrator privileges.`,
      };
    }
  }

  // 5. Identify System or Cloud Modification commands
  const modificationPatterns = [
    /\brclone\s+(copy|mount|mkdir|check)\b/i,
    /\btaskkill\b/i,
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

  // 6. Default: Verified allowlisted Safe Read-Only inspection command
  return {
    allowed: true,
    riskLevel: 'Safe Read-Only',
    requiresAdmin: false,
    requiresApproval: false,
    explanation: `Runs read-only diagnostic inspection ("${trimmed}") in working directory ${workingDir}. Does not modify system state or user files.`,
  };
}

/**
 * Redacts OAuth tokens, client secrets, GitHub PATs, and bearer tokens from logs and terminal output.
 */
export function redactSecretsFromOutput(input: string): string {
  if (!input) return '';
  return input
    .replace(
      /(access_token|refresh_token|client_secret|password|api_key|github_token|gh_token|token)\s*["':=]\s*["']?([^"'\s,}]+)["']?/gi,
      '$1="[REDACTED]"'
    )
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, 'Bearer [REDACTED_BEARER_TOKEN]')
    .replace(/ghp_[0-9A-Za-z]{20,}/g, 'ghp_[REDACTED_GITHUB_PAT]')
    .replace(/github_pat_[0-9A-Za-z_]{20,}/g, 'github_pat_[REDACTED_GITHUB_PAT]')
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
