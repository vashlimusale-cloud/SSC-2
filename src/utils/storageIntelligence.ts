import {
  FileCategory,
  ScannedFile,
  DuplicateGroup,
  StorageScanSummary,
  RcloneRemoteDetail,
} from '../types/storage';

/**
 * File category map by extension
 */
export const EXTENSION_CATEGORIES: Record<string, FileCategory> = {
  // Documents
  pdf: 'Documents',
  doc: 'Documents',
  docx: 'Documents',
  txt: 'Documents',
  rtf: 'Documents',
  odt: 'Documents',
  xls: 'Documents',
  xlsx: 'Documents',
  csv: 'Documents',
  ppt: 'Documents',
  pptx: 'Documents',
  md: 'Documents',

  // Images
  jpg: 'Images',
  jpeg: 'Images',
  png: 'Images',
  gif: 'Images',
  webp: 'Images',
  svg: 'Images',
  bmp: 'Images',
  ico: 'Images',
  psd: 'Images',
  raw: 'Images',

  // Development
  ts: 'Development',
  tsx: 'Development',
  js: 'Development',
  jsx: 'Development',
  json: 'Development',
  py: 'Development',
  rs: 'Development',
  go: 'Development',
  cpp: 'Development',
  c: 'Development',
  h: 'Development',
  cs: 'Development',
  java: 'Development',
  html: 'Development',
  css: 'Development',
  sql: 'Development',

  // Archives
  zip: 'Archives',
  rar: 'Archives',
  '7z': 'Archives',
  tar: 'Archives',
  gz: 'Archives',

  // Audio / Video
  mp3: 'Audio/Video',
  wav: 'Audio/Video',
  flac: 'Audio/Video',
  mp4: 'Audio/Video',
  mkv: 'Audio/Video',
  mov: 'Audio/Video',
  avi: 'Audio/Video',

  // Database
  sqlite: 'Database',
  db: 'Database',
  mdb: 'Database',
};

export const IMPORTANT_EXTENSIONS = new Set([
  'pdf',
  'docx',
  'doc',
  'xlsx',
  'xls',
  'pptx',
  'ppt',
  'txt',
  'sqlite',
  'db',
  'sql',
  'ts',
  'tsx',
  'py',
  'rs',
  'psd',
  'blend',
  'zip',
]);

/**
 * Determines file category from filename/extension
 */
export function categorizeFile(filename: string): FileCategory {
  const parts = filename.split('.');
  if (parts.length <= 1) return 'Other';
  const ext = parts.pop()!.toLowerCase();
  return EXTENSION_CATEGORIES[ext] || 'Other';
}

/**
 * Checks if a file is considered an important user asset
 */
export function isImportantUserFile(filename: string): boolean {
  const parts = filename.split('.');
  if (parts.length <= 1) return false;
  const ext = parts.pop()!.toLowerCase();
  return IMPORTANT_EXTENSIONS.has(ext);
}

/**
 * Groups files by SHA256/MD5 hash to detect duplicates
 */
export function detectDuplicateGroups(files: ScannedFile[]): DuplicateGroup[] {
  const map = new Map<string, ScannedFile[]>();

  for (const file of files) {
    if (!file.sha256) continue;
    const existing = map.get(file.sha256) || [];
    existing.push(file);
    map.set(file.sha256, existing);
  }

  const groups: DuplicateGroup[] = [];

  for (const [hash, groupFiles] of map.entries()) {
    if (groupFiles.length > 1) {
      const singleFileSize = groupFiles[0].sizeBytes;
      const totalSizeBytes = singleFileSize * groupFiles.length;
      const wastedBytes = singleFileSize * (groupFiles.length - 1);

      groups.push({
        hash,
        fileCount: groupFiles.length,
        totalSizeBytes,
        wastedBytes,
        files: groupFiles,
      });
    }
  }

  // Sort by highest wasted storage space first
  return groups.sort((a, b) => b.wastedBytes - a.wastedBytes);
}

/**
 * Calculates storage scan summary
 */
export function calculateScanSummary(files: ScannedFile[], scanDurationMs = 850): StorageScanSummary {
  let totalSizeBytes = 0;
  let importantFilesCount = 0;
  let importantSizeBytes = 0;
  let missingDeletedCount = 0;

  const categoriesBreakdown: Record<FileCategory, { count: number; bytes: number }> = {
    Documents: { count: 0, bytes: 0 },
    Images: { count: 0, bytes: 0 },
    Development: { count: 0, bytes: 0 },
    Archives: { count: 0, bytes: 0 },
    'Audio/Video': { count: 0, bytes: 0 },
    Database: { count: 0, bytes: 0 },
    Other: { count: 0, bytes: 0 },
  };

  for (const file of files) {
    totalSizeBytes += file.sizeBytes;
    if (file.isImportant) {
      importantFilesCount++;
      importantSizeBytes += file.sizeBytes;
    }
    if (file.cloudSyncStatus === 'missing_or_deleted') {
      missingDeletedCount++;
    }

    const cat = file.category;
    if (categoriesBreakdown[cat]) {
      categoriesBreakdown[cat].count++;
      categoriesBreakdown[cat].bytes += file.sizeBytes;
    }
  }

  const duplicateGroups = detectDuplicateGroups(files);
  const potentialWastedBytes = duplicateGroups.reduce((acc, g) => acc + g.wastedBytes, 0);

  return {
    totalScannedFiles: files.length,
    totalSizeBytes,
    importantFilesCount,
    importantSizeBytes,
    duplicateGroupsCount: duplicateGroups.length,
    potentialWastedBytes,
    missingDeletedCount,
    categoriesBreakdown,
    scanDurationMs,
    lastScannedTime: new Date().toISOString(),
  };
}

/**
 * Generates an organized cloud folder structure path based on file category and name
 * e.g. "gdrive:Laptop_Full_Backup/C_Drive_User/Documents/Report.xlsx"
 */
export function generateCloudOrganizedPath(
  remoteName: string,
  baseBackupFolder: string,
  file: Pick<ScannedFile, 'category' | 'name' | 'path'>
): string {
  const cleanRemote = remoteName.endsWith(':') ? remoteName : `${remoteName}:`;
  const cleanBase = baseBackupFolder.replace(/^\/+|\/+$/g, '');

  return `${cleanRemote}${cleanBase}/${file.category}/${file.name}`;
}

/**
 * Validates that an rclone command follows the safety specification:
 * - Must use "rclone copy" for safe initial uploads
 * - Forbids "rclone sync" or "rclone move" for initial migration to prevent accidental local/cloud deletions
 */
export function validateRcloneCommandSafety(
  commandArgs: string[]
): { isSafe: boolean; rejectedReason?: string; correctedCommand?: string } {
  const cmd = commandArgs.join(' ').toLowerCase();

  if (cmd.includes('rclone sync')) {
    return {
      isSafe: false,
      rejectedReason:
        'Safety Violation: "rclone sync" is strictly forbidden for initial migration as it can delete target files not present in source.',
      correctedCommand: cmd.replace('rclone sync', 'rclone copy'),
    };
  }

  if (cmd.includes('rclone move')) {
    return {
      isSafe: false,
      rejectedReason:
        'Safety Violation: "rclone move" is strictly forbidden for initial migration. Local files must not be deleted.',
      correctedCommand: cmd.replace('rclone move', 'rclone copy'),
    };
  }

  if (cmd.includes('rclone delete') || cmd.includes('rclone purge')) {
    return {
      isSafe: false,
      rejectedReason:
        'Safety Violation: Destructive rclone commands require explicit verification confirmation first.',
    };
  }

  return { isSafe: true };
}

/**
 * Builds a validated Windows WinFsp virtual drive mount command for rclone.
 */
export function buildWinFspMountCommand(
  remoteName: string,
  remoteFolder: string,
  driveLetter: string
): { command: string; isSafe: boolean; error?: string } {
  const cleanDrive = driveLetter.replace(':', '').trim().toUpperCase();
  if (!/^[D-Z]$/.test(cleanDrive)) {
    return {
      command: '',
      isSafe: false,
      error: `Invalid drive letter "${driveLetter}". System drives A:, B:, and C: are reserved.`,
    };
  }
  const cleanRemote = remoteName.endsWith(':') ? remoteName : `${remoteName}:`;
  const cleanFolder = remoteFolder.replace(/^\/+|\/+$/g, '');
  const target = cleanFolder ? `${cleanRemote}${cleanFolder}` : cleanRemote;
  const command = `rclone mount "${target}" ${cleanDrive}: --vfs-cache-mode full --vfs-cache-max-age 24h --dir-cache-time 5m --volname "Google Drive (${cleanDrive}:)" --network-mode`;
  return { command, isSafe: true };
}

/**
 * Detects whether multiple configured remotes (e.g. gdrive: and gdrive2:)
 * report identical total/used/free storage, avoiding false 10 TiB combined capacity claims.
 */
export function analyzeRemoteQuotaCorrelation(remotes: RcloneRemoteDetail[]): {
  sharesUnderlyingQuota: boolean;
  effectiveTotalTiB: number;
  summary: string;
} {
  if (remotes.length < 2) {
    return {
      sharesUnderlyingQuota: false,
      effectiveTotalTiB: remotes[0]?.totalTiB || 0,
      summary: 'Single remote configured.',
    };
  }

  const first = remotes[0];
  const allMatch = remotes.every(
    (r) =>
      Math.abs(r.totalTiB - first.totalTiB) < 0.001 &&
      Math.abs(r.usedGiB - first.usedGiB) < 0.01 &&
      Math.abs(r.freeTiB - first.freeTiB) < 0.001
  );

  if (allMatch) {
    return {
      sharesUnderlyingQuota: true,
      effectiveTotalTiB: first.totalTiB,
      summary: `Remotes (${remotes.map((r) => r.name).join(', ')}) report identical quota (${first.totalTiB} TiB total, ${first.usedGiB} GiB used, ${first.freeTiB} TiB free). They reference the same underlying Google Drive storage pool (${first.totalTiB} TiB effective capacity, NOT ${first.totalTiB * remotes.length} TiB combined).`,
    };
  }

  return {
    sharesUnderlyingQuota: false,
    effectiveTotalTiB: remotes.reduce((sum, r) => sum + r.totalTiB, 0),
    summary: 'Independent remote storage pools detected.',
  };
}

/**
 * Handles existing drive letter conflicts (e.g., if G: is already occupied by a USB drive,
 * local partition, or existing rclone mount) without overwriting or unmounting unrelated volumes.
 */
export function resolveDriveLetterConflict(
  requestedLetter: string,
  occupiedDrives: Array<{ letter: string; type: 'system' | 'local_disk' | 'rclone_mount'; target?: string }>,
  desiredRemoteTarget = 'gdrive:Laptop_Full_Backup/C_Drive_User'
): {
  canMountDirectly: boolean;
  status: 'available' | 'already_mounted_same_target' | 'conflict_resolved_fallback' | 'blocked_reserved';
  selectedDriveLetter: string;
  message: string;
} {
  const cleanReq = requestedLetter.replace(':', '').trim().toUpperCase();
  if (!/^[D-Z]$/.test(cleanReq)) {
    return {
      canMountDirectly: false,
      status: 'blocked_reserved',
      selectedDriveLetter: 'G:',
      message: `Drive letter ${requestedLetter} is reserved by Windows. Defaulting to safe candidate G:.`,
    };
  }

  const existing = occupiedDrives.find((d) => d.letter.replace(':', '').toUpperCase() === cleanReq);
  if (!existing) {
    return {
      canMountDirectly: true,
      status: 'available',
      selectedDriveLetter: `${cleanReq}:`,
      message: `Drive letter ${cleanReq}: is free and ready for WinFsp virtual mount.`,
    };
  }

  if (existing.type === 'rclone_mount' && existing.target === desiredRemoteTarget) {
    return {
      canMountDirectly: true,
      status: 'already_mounted_same_target',
      selectedDriveLetter: `${cleanReq}:`,
      message: `Drive ${cleanReq}: is already mounted to ${desiredRemoteTarget}. Reusing active WinFsp mount.`,
    };
  }

  // Conflict detected: find next unoccupied letter from G..Z
  const occupiedSet = new Set(occupiedDrives.map((d) => d.letter.replace(':', '').toUpperCase()));
  const candidates = ['G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
  const fallback = candidates.find((c) => !occupiedSet.has(c)) || 'Z';

  return {
    canMountDirectly: false,
    status: 'conflict_resolved_fallback',
    selectedDriveLetter: `${fallback}:`,
    message: `Drive ${cleanReq}: is currently occupied (${existing.type}). Automatically selected non-conflicting fallback drive ${fallback}: to prevent overwriting existing volume.`,
  };
}

/**
 * Builds a non-destructive, resumable rclone copy command for uploads or downloads
 * that safely resumes interrupted transfers without overwriting unchanged files or deleting destination files.
 */
export function buildResumableTransferCommand(
  sourcePath: string,
  destinationPath: string
): {
  command: string;
  isNonDestructive: boolean;
  supportsResume: boolean;
} {
  const command = `rclone copy "${sourcePath}" "${destinationPath}" --transfers 4 --checkers 8 --retries 5 --low-level-retries 10 --contimeout 60s --timeout 300s --stats 1s`;
  return {
    command,
    isNonDestructive: true,
    supportsResume: true,
  };
}

/**
 * Evaluates actual backup coverage and checksum verification against the local source.
 * Strictly avoids claiming the entire computer is backed up when only a 2.543 GiB subset (1,063 objects) exists,
 * and documents Google Drive's MD5/SHA-1 vs Google Docs native export stream checksum limitations.
 */
export function verifyBackupComparisonAndChecksums(params: {
  localSystemUsedBytes: number;
  localUserProfileBytes: number;
  remoteConfirmedObjects: number;
  remoteConfirmedBytes: number;
  verifiedBinaryObjects: number;
  unsupportedNativeDocsCount: number;
}): {
  isEntireComputerBackedUp: boolean;
  isUserProfileFullyBackedUp: boolean;
  remoteConfirmedObjects: number;
  remoteConfirmedGiB: number;
  unbackedUserProfileGiB: number;
  profileCoveragePercent: number;
  verificationCommand: string;
  streamFallbackCommand: string;
  checksumSupportedCount: number;
  checksumUnsupportedCount: number;
  checksumLimitationReport: string;
} {
  const remoteGiB = +(params.remoteConfirmedBytes / 1024 ** 3).toFixed(3);
  const profileGiB = +(params.localUserProfileBytes / 1024 ** 3).toFixed(3);
  const unbackedBytes = Math.max(0, params.localUserProfileBytes - params.remoteConfirmedBytes);
  const unbackedGiB = +(unbackedBytes / 1024 ** 3).toFixed(3);
  const coverage =
    params.localUserProfileBytes > 0
      ? +((params.remoteConfirmedBytes / params.localUserProfileBytes) * 100).toFixed(1)
      : 0;

  return {
    isEntireComputerBackedUp: false,
    isUserProfileFullyBackedUp: unbackedBytes === 0,
    remoteConfirmedObjects: params.remoteConfirmedObjects,
    remoteConfirmedGiB: remoteGiB,
    unbackedUserProfileGiB: unbackedGiB,
    profileCoveragePercent: Math.min(100, coverage),
    verificationCommand: `rclone check "C:\\Users\\User" "gdrive:Laptop_Full_Backup/C_Drive_User" --one-way`,
    streamFallbackCommand: `rclone check "C:\\Users\\User" "gdrive:Laptop_Full_Backup/C_Drive_User" --one-way --download`,
    checksumSupportedCount: params.verifiedBinaryObjects,
    checksumUnsupportedCount: params.unsupportedNativeDocsCount,
    checksumLimitationReport: `Partial Backup Verified: ${params.remoteConfirmedObjects} objects (${remoteGiB} GiB) exist in gdrive:Laptop_Full_Backup/C_Drive_User out of ${profileGiB} GiB in C:\\Users\\User (${unbackedGiB} GiB local data not yet backed up; entire C: drive is NOT backed up). Checksum Verification: ${params.verifiedBinaryObjects} standard binary files verified via Google Drive MD5/SHA-1 hash parity; ${params.unsupportedNativeDocsCount} Google Workspace native/exported items lack static server-side hashes and require "--download" byte-stream comparison.`,
  };
}

