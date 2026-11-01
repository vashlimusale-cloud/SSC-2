/**
 * Storage Intelligence, Google Drive Virtual Drive & rclone Integration Data Types
 */

export interface RcloneRemoteDetail {
  name: string; // e.g. 'gdrive:' or 'gdrive2:'
  provider: string;
  rootFolder: string;
  totalTiB: number;
  usedGiB: number;
  freeTiB: number;
  backupFolderPath: string;
  backupObjectCount: number;
  backupSizeGiB: number;
  sharedAccountWarning?: string;
}

export interface RcloneStatus {
  installed: boolean;
  version: string;
  osArch: string;
  binaryPath: string;
  configPath: string;
  winfspInstalled: boolean;
  winfspVersion: string;
  remotes: string[];
  remoteDetails: RcloneRemoteDetail[];
  gdriveRemote: string | null;
  mountedGDrive: {
    driveLetter: string;
    mountPath: string;
    remoteName: string;
    remoteFolder: string;
    totalGB: number;
    usedGB: number;
    freeGB: number;
    isMounted: boolean;
    autoMountOnStartup: boolean;
    autoReconnect: boolean;
    connectionHealth: 'Connected' | 'Reconnecting' | 'Unmounted' | 'Mount Error';
    provider: string;
  } | null;
}

export type FileCategory =
  | 'Documents'
  | 'Images'
  | 'Development'
  | 'Archives'
  | 'Audio/Video'
  | 'Database'
  | 'Other';

export interface ScannedFile {
  id: string;
  name: string;
  path: string;
  extension: string;
  sizeBytes: number;
  category: FileCategory;
  isImportant: boolean;
  modifiedAt: string;
  sha256: string;
  duplicateGroupId?: string;
  cloudSyncStatus: 'synced' | 'pending' | 'missing_or_deleted' | 'modified';
  cloudPath?: string;
}

export interface DuplicateGroup {
  hash: string;
  fileCount: number;
  totalSizeBytes: number;
  wastedBytes: number;
  files: ScannedFile[];
}

export interface StorageScanSummary {
  totalScannedFiles: number;
  totalSizeBytes: number;
  importantFilesCount: number;
  importantSizeBytes: number;
  duplicateGroupsCount: number;
  potentialWastedBytes: number;
  missingDeletedCount: number;
  categoriesBreakdown: Record<FileCategory, { count: number; bytes: number }>;
  scanDurationMs: number;
  lastScannedTime: string;
}

export type TransferStatus =
  | 'queued'
  | 'transferring'
  | 'verifying'
  | 'completed'
  | 'failed'
  | 'paused';

export interface TransferTask {
  id: string;
  fileName: string;
  sourcePath: string;
  targetCloudPath: string;
  direction?: 'upload' | 'download';
  triggerType?: 'manual' | 'scheduled' | 'file_watch';
  totalBytes: number;
  transferredBytes: number;
  speedMBs: number;
  etaSeconds: number;
  status: TransferStatus;
  progressPercent: number;
  command: string; // Must use "rclone copy"
  checksumVerified?: boolean;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface TransferLogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'NOTICE' | 'ERROR' | 'VERIFY';
  message: string;
  taskId?: string;
}

export interface RemoteCloudItem {
  name: string;
  path: string;
  isDir: boolean;
  sizeBytes: number;
  modifiedAt: string;
  mimeType?: string;
  sha256?: string;
}
