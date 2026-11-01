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
