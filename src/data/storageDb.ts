import {
  RcloneStatus,
  ScannedFile,
  RemoteCloudItem,
  TransferTask,
  TransferLogEntry,
} from '../types/storage';

/**
 * Authentic Google Drive & rclone 1.75.1 Configuration (Section 8)
 * - Remotes: gdrive: and gdrive2:
 * - Both report 5 TiB total, 22.367 GiB used, 4.961 TiB free
 * - Existing mounted G: drive -> Laptop_Full_Backup/C_Drive_User (1,063 objects, 2.543 GiB)
 */
export const INITIAL_RCLONE_STATUS: RcloneStatus = {
  installed: true,
  version: 'rclone v1.75.1 (windows/amd64)',
  osArch: 'windows/amd64 (Windows 11 Pro 23H2)',
  binaryPath: 'C:\\rclone\\rclone.exe',
  configPath: 'C:\\Users\\User\\AppData\\Roaming\\rclone\\rclone.conf',
  winfspInstalled: true,
  winfspVersion: 'WinFsp 2024.1 (v2.0.23075)',
  remotes: ['gdrive:', 'gdrive2:'],
  remoteDetails: [
    {
      name: 'gdrive:',
      provider: 'Google Drive (OAuth2 Redacted)',
      rootFolder: 'Laptop_Full_Backup/C_Drive_User',
      totalTiB: 5.0,
      usedGiB: 22.367,
      freeTiB: 4.961,
      backupFolderPath: 'Laptop_Full_Backup/C_Drive_User',
      backupObjectCount: 1063,
      backupSizeGiB: 2.543,
      sharedAccountWarning:
        'Reports identical 5.000 TiB quota and 22.367 GiB usage as gdrive2:. Both remotes reference the same Google Drive volume.',
    },
    {
      name: 'gdrive2:',
      provider: 'Google Drive (Secondary Alias)',
      rootFolder: 'Laptop_Full_Backup/C_Drive_User',
      totalTiB: 5.0,
      usedGiB: 22.367,
      freeTiB: 4.961,
      backupFolderPath: 'Laptop_Full_Backup/C_Drive_User',
      backupObjectCount: 1063,
      backupSizeGiB: 2.543,
      sharedAccountWarning:
        'Mirror remote configuration sharing the same 5.000 TiB storage pool as gdrive: (do not count as 10 TiB combined).',
    },
  ],
  gdriveRemote: 'gdrive:',
  mountedGDrive: {
    driveLetter: 'G:',
    mountPath: 'G:\\',
    remoteName: 'gdrive:',
    remoteFolder: 'Laptop_Full_Backup/C_Drive_User',
    totalGB: 5120, // 5 TiB
    usedGB: 22.37,
    freeGB: 5080.06, // 4.961 TiB
    isMounted: true,
    autoMountOnStartup: true,
    autoReconnect: true,
    connectionHealth: 'Connected',
    provider: 'WinFsp + rclone v1.75.1 Virtual File System (cmount)',
  },
};

export const INITIAL_SCANNED_FILES: ScannedFile[] = [
  // Important documents
  {
    id: 'f-1',
    name: '2026_Fiscal_Financial_Plan.xlsx',
    path: 'C:\\Users\\User\\Documents\\Financial\\2026_Fiscal_Financial_Plan.xlsx',
    extension: 'xlsx',
    sizeBytes: 4823410,
    category: 'Documents',
    isImportant: true,
    modifiedAt: '2026-10-28T14:32:00Z',
    sha256: '9a84f3c7d6e1b20491823a4b5c6d7e8f1029384756abcdef1234567890abcdef',
    duplicateGroupId: 'dup-fin-1',
    cloudSyncStatus: 'synced',
    cloudPath: 'gdrive:Laptop_Full_Backup/C_Drive_User/Documents/2026_Fiscal_Financial_Plan.xlsx',
  },
  {
    id: 'f-2',
    name: 'Copy of 2026_Fiscal_Financial_Plan.xlsx',
    path: 'C:\\Users\\User\\Downloads\\Copy of 2026_Fiscal_Financial_Plan.xlsx',
    extension: 'xlsx',
    sizeBytes: 4823410,
    category: 'Documents',
    isImportant: true,
    modifiedAt: '2026-10-29T09:15:00Z',
    sha256: '9a84f3c7d6e1b20491823a4b5c6d7e8f1029384756abcdef1234567890abcdef',
    duplicateGroupId: 'dup-fin-1',
    cloudSyncStatus: 'pending',
  },
  {
    id: 'f-3',
    name: 'Enterprise_Architecture_Spec.pdf',
    path: 'C:\\Users\\User\\Documents\\Architecture\\Enterprise_Architecture_Spec.pdf',
    extension: 'pdf',
    sizeBytes: 18450120,
    category: 'Documents',
    isImportant: true,
    modifiedAt: '2026-10-25T11:20:00Z',
    sha256: '3f7a1b8c9d0e2f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8',
    cloudSyncStatus: 'synced',
    cloudPath: 'gdrive:Laptop_Full_Backup/C_Drive_User/Documents/Enterprise_Architecture_Spec.pdf',
  },
  {
    id: 'f-4',
    name: 'Executive_Board_Deck_Q3.pptx',
    path: 'C:\\Users\\User\\Desktop\\Executive_Board_Deck_Q3.pptx',
    extension: 'pptx',
    sizeBytes: 34500000,
    category: 'Documents',
    isImportant: true,
    modifiedAt: '2026-10-30T16:45:00Z',
    sha256: 'b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2',
    cloudSyncStatus: 'pending',
  },

  // Development files
  {
    id: 'f-5',
    name: 'database_production_dump.sqlite',
    path: 'C:\\Users\\User\\Projects\\production_data\\database_production_dump.sqlite',
    extension: 'sqlite',
    sizeBytes: 154200000,
    category: 'Database',
    isImportant: true,
    modifiedAt: '2026-10-31T04:00:00Z',
    sha256: 'e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9',
    cloudSyncStatus: 'synced',
    cloudPath: 'gdrive:Laptop_Full_Backup/C_Drive_User/Database/database_production_dump.sqlite',
  },
  {
    id: 'f-6',
    name: 'system_core_service.ts',
    path: 'C:\\Users\\User\\Projects\\command-center\\src\\system_core_service.ts',
    extension: 'ts',
    sizeBytes: 42100,
    category: 'Development',
    isImportant: true,
    modifiedAt: '2026-10-31T07:22:00Z',
    sha256: '7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
    cloudSyncStatus: 'synced',
    cloudPath: 'gdrive:Laptop_Full_Backup/C_Drive_User/Development/system_core_service.ts',
  },

  // Creative & Media
  {
    id: 'f-7',
    name: 'Hero_Brand_Identity.psd',
    path: 'C:\\Users\\User\\Pictures\\Branding\\Hero_Brand_Identity.psd',
    extension: 'psd',
    sizeBytes: 285400000,
    category: 'Images',
    isImportant: true,
    modifiedAt: '2026-10-22T18:10:00Z',
    sha256: '4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e',
    duplicateGroupId: 'dup-psd-1',
    cloudSyncStatus: 'synced',
    cloudPath: 'gdrive:Laptop_Full_Backup/C_Drive_User/Images/Hero_Brand_Identity.psd',
  },
  {
    id: 'f-8',
    name: 'Backup_Hero_Brand_Identity.psd',
    path: 'C:\\Users\\User\\Desktop\\Temp\\Backup_Hero_Brand_Identity.psd',
    extension: 'psd',
    sizeBytes: 285400000,
    category: 'Images',
    isImportant: true,
    modifiedAt: '2026-10-22T18:10:00Z',
    sha256: '4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e',
    duplicateGroupId: 'dup-psd-1',
    cloudSyncStatus: 'pending',
  },

  // Missing or potentially deleted files
  {
    id: 'f-9',
    name: 'Q2_Audit_Report_Signed.pdf',
    path: 'C:\\Users\\User\\Documents\\Audits\\Q2_Audit_Report_Signed.pdf',
    extension: 'pdf',
    sizeBytes: 12400000,
    category: 'Documents',
    isImportant: true,
    modifiedAt: '2026-07-15T10:00:00Z',
    sha256: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    cloudSyncStatus: 'missing_or_deleted',
    cloudPath: 'gdrive:Laptop_Full_Backup/C_Drive_User/Documents/Q2_Audit_Report_Signed.pdf',
  },
  {
    id: 'f-10',
    name: 'Client_Contracts_Master.zip',
    path: 'C:\\Users\\User\\Documents\\Legal\\Client_Contracts_Master.zip',
    extension: 'zip',
    sizeBytes: 89000000,
    category: 'Archives',
    isImportant: true,
    modifiedAt: '2026-08-10T12:00:00Z',
    sha256: '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e',
    cloudSyncStatus: 'missing_or_deleted',
    cloudPath: 'gdrive:Laptop_Full_Backup/C_Drive_User/Archives/Client_Contracts_Master.zip',
  },
];

export const INITIAL_REMOTE_CLOUD_ITEMS: RemoteCloudItem[] = [
  {
    name: 'Laptop_Full_Backup/C_Drive_User',
    path: 'gdrive:Laptop_Full_Backup/C_Drive_User',
    isDir: true,
    sizeBytes: 2730525491, // 2.543 GiB (1,063 objects)
    modifiedAt: '2026-10-31T09:30:00Z',
  },
  {
    name: 'Documents',
    path: 'gdrive:Laptop_Full_Backup/C_Drive_User/Documents',
    isDir: true,
    sizeBytes: 642273530,
    modifiedAt: '2026-10-31T09:25:00Z',
  },
  {
    name: 'Development',
    path: 'gdrive:Laptop_Full_Backup/C_Drive_User/Development',
    isDir: true,
    sizeBytes: 518420000,
    modifiedAt: '2026-10-31T09:18:00Z',
  },
  {
    name: '2026_Fiscal_Financial_Plan.xlsx',
    path: 'gdrive:Laptop_Full_Backup/C_Drive_User/Documents/2026_Fiscal_Financial_Plan.xlsx',
    isDir: false,
    sizeBytes: 4823410,
    modifiedAt: '2026-10-28T14:32:00Z',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    sha256: '9a84f3c7d6e1b20491823a4b5c6d7e8f1029384756abcdef1234567890abcdef',
  },
  {
    name: 'Enterprise_Architecture_Spec.pdf',
    path: 'gdrive:Laptop_Full_Backup/C_Drive_User/Documents/Enterprise_Architecture_Spec.pdf',
    isDir: false,
    sizeBytes: 18450120,
    modifiedAt: '2026-10-25T11:20:00Z',
    mimeType: 'application/pdf',
    sha256: '3f7a1b8c9d0e2f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8',
  },
  {
    name: 'Q2_Audit_Report_Signed.pdf',
    path: 'gdrive:Laptop_Full_Backup/C_Drive_User/Documents/Q2_Audit_Report_Signed.pdf',
    isDir: false,
    sizeBytes: 12400000,
    modifiedAt: '2026-07-15T10:00:00Z',
    mimeType: 'application/pdf',
    sha256: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
  },
  {
    name: 'Hero_Brand_Identity.psd',
    path: 'gdrive:Laptop_Full_Backup/C_Drive_User/Images/Hero_Brand_Identity.psd',
    isDir: false,
    sizeBytes: 285400000,
    modifiedAt: '2026-10-22T18:10:00Z',
    mimeType: 'image/vnd.adobe.photoshop',
    sha256: '4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e',
  },
  {
    name: 'database_production_dump.sqlite',
    path: 'gdrive:Laptop_Full_Backup/C_Drive_User/Database/database_production_dump.sqlite',
    isDir: false,
    sizeBytes: 154200000,
    modifiedAt: '2026-10-31T04:00:00Z',
    mimeType: 'application/x-sqlite3',
    sha256: 'e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9',
  },
];

export const INITIAL_TRANSFERS: TransferTask[] = [
  {
    id: 'tr-1',
    fileName: 'Executive_Board_Deck_Q3.pptx',
    sourcePath: 'C:\\Users\\User\\Desktop\\Executive_Board_Deck_Q3.pptx',
    targetCloudPath: 'gdrive:Laptop_Full_Backup/C_Drive_User/Documents/Executive_Board_Deck_Q3.pptx',
    direction: 'upload',
    triggerType: 'manual',
    totalBytes: 34500000,
    transferredBytes: 24150000,
    speedMBs: 14.2,
    etaSeconds: 1,
    status: 'transferring',
    progressPercent: 70,
    command:
      'rclone copy "C:\\Users\\User\\Desktop\\Executive_Board_Deck_Q3.pptx" "gdrive:Laptop_Full_Backup/C_Drive_User/Documents" --progress --transfers=4 --drive-chunk-size=32M',
    startedAt: '2026-10-31 09:35:10',
  },
  {
    id: 'tr-0',
    fileName: '2026_Fiscal_Financial_Plan.xlsx',
    sourcePath: 'C:\\Users\\User\\Documents\\Financial\\2026_Fiscal_Financial_Plan.xlsx',
    targetCloudPath: 'gdrive:Laptop_Full_Backup/C_Drive_User/Documents/2026_Fiscal_Financial_Plan.xlsx',
    direction: 'upload',
    triggerType: 'scheduled',
    totalBytes: 4823410,
    transferredBytes: 4823410,
    speedMBs: 12.1,
    etaSeconds: 0,
    status: 'completed',
    progressPercent: 100,
    command:
      'rclone copy "C:\\Users\\User\\Documents\\Financial\\2026_Fiscal_Financial_Plan.xlsx" "gdrive:Laptop_Full_Backup/C_Drive_User/Documents" --progress',
    checksumVerified: true,
    startedAt: '2026-10-31 09:30:00',
    completedAt: '2026-10-31 09:30:04',
  },
];

export const INITIAL_TRANSFER_LOGS: TransferLogEntry[] = [
  {
    id: 'log-1',
    timestamp: '2026-10-31 09:30:00',
    level: 'INFO',
    message:
      'rclone v1.75.1 (windows/amd64) engine initialized. WinFsp G: virtual drive mounted -> gdrive:Laptop_Full_Backup/C_Drive_User (1,063 objects, 2.543 GiB)',
  },
  {
    id: 'log-2',
    timestamp: '2026-10-31 09:30:01',
    level: 'NOTICE',
    message:
      'Quota correlation notice: gdrive: and gdrive2: both report 5.000 TiB total / 22.367 GiB used / 4.961 TiB free (shared account storage pool).',
  },
  {
    id: 'log-3',
    timestamp: '2026-10-31 09:30:04',
    level: 'VERIFY',
    message:
      'Transferred 2026_Fiscal_Financial_Plan.xlsx (4.6 MB) in 4.1s (12.1 MB/s). SHA256 verified match against Google Drive md5Checksum.',
    taskId: 'tr-0',
  },
  {
    id: 'log-4',
    timestamp: '2026-10-31 09:35:10',
    level: 'INFO',
    message:
      'Starting safe resumable upload: Executive_Board_Deck_Q3.pptx to gdrive:Laptop_Full_Backup/C_Drive_User/Documents using 32MB chunk buffer.',
    taskId: 'tr-1',
  },
];
