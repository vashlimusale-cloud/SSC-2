import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  categorizeFile,
  isImportantUserFile,
  detectDuplicateGroups,
  calculateScanSummary,
  generateCloudOrganizedPath,
  validateRcloneCommandSafety,
  buildWinFspMountCommand,
  analyzeRemoteQuotaCorrelation,
  resolveDriveLetterConflict,
  buildResumableTransferCommand,
  verifyBackupComparisonAndChecksums,
} from './storageIntelligence';
import { ScannedFile, RcloneRemoteDetail } from '../types/storage';

describe('Storage Intelligence & rclone Safety Logic', () => {
  it('categorizes files and identifies important user files', () => {
    assert.equal(categorizeFile('Financial_Q4_2026.xlsx'), 'Documents');
    assert.equal(categorizeFile('main.rs'), 'Development');
    assert.equal(categorizeFile('family_photo.png'), 'Images');
    assert.equal(isImportantUserFile('Financial_Q4_2026.xlsx'), true);
    assert.equal(isImportantUserFile('readme_without_ext'), false);
  });

  it('detects duplicate groups by SHA-256 hash and calculates reclaimable wasted bytes', () => {
    const files: ScannedFile[] = [
      {
        id: '1',
        name: 'Contract_v1.pdf',
        path: 'C:\\Users\\Admin\\Documents\\Contract_v1.pdf',
        extension: 'pdf',
        sizeBytes: 5_000_000,
        category: 'Documents',
        isImportant: true,
        modifiedAt: '2026-10-01',
        sha256: 'abc123hash',
        cloudSyncStatus: 'synced',
      },
      {
        id: '2',
        name: 'Contract_v1_Copy.pdf',
        path: 'C:\\Users\\Admin\\Downloads\\Contract_v1_Copy.pdf',
        extension: 'pdf',
        sizeBytes: 5_000_000,
        category: 'Documents',
        isImportant: true,
        modifiedAt: '2026-10-02',
        sha256: 'abc123hash',
        cloudSyncStatus: 'pending',
      },
    ];

    const groups = detectDuplicateGroups(files);
    assert.equal(groups.length, 1);
    assert.equal(groups[0].wastedBytes, 5_000_000);

    const summary = calculateScanSummary(files);
    assert.equal(summary.duplicateGroupsCount, 1);
    assert.equal(summary.potentialWastedBytes, 5_000_000);
  });

  it('enforces rclone copy and rejects rclone sync / move / delete for initial migrations', () => {
    const safeCopy = validateRcloneCommandSafety([
      'rclone copy "C:\\Users\\Admin\\Documents" "gdrive:Laptop_Full_Backup/C_Drive_User/Documents"',
    ]);
    assert.equal(safeCopy.isSafe, true);

    const unsafeSync = validateRcloneCommandSafety([
      'rclone sync "C:\\Users\\Admin\\Documents" "gdrive:Laptop_Full_Backup/C_Drive_User/Documents"',
    ]);
    assert.equal(unsafeSync.isSafe, false);
    assert.ok(unsafeSync.correctedCommand?.includes('rclone copy'));

    const unsafeMove = validateRcloneCommandSafety([
      'rclone move "C:\\Users\\Admin\\Documents" "gdrive:Laptop_Full_Backup/C_Drive_User/Documents"',
    ]);
    assert.equal(unsafeMove.isSafe, false);
  });

  it('builds safe WinFsp mount commands and rejects reserved system drive C:', () => {
    const validMount = buildWinFspMountCommand('gdrive:', 'Laptop_Full_Backup/C_Drive_User', 'G:');
    assert.equal(validMount.isSafe, true);
    assert.ok(validMount.command.includes('rclone mount "gdrive:Laptop_Full_Backup/C_Drive_User" G:'));

    const invalidDriveC = buildWinFspMountCommand('gdrive:', 'Laptop_Full_Backup/C_Drive_User', 'C:');
    assert.equal(invalidDriveC.isSafe, false);
  });

  it('detects correlated quota between gdrive: and gdrive2: (5 TiB pool, not 10 TiB combined)', () => {
    const remotes: RcloneRemoteDetail[] = [
      {
        name: 'gdrive:',
        provider: 'Google Drive',
        rootFolder: 'Laptop_Full_Backup/C_Drive_User',
        totalTiB: 5.0,
        usedGiB: 22.367,
        freeTiB: 4.961,
        backupFolderPath: 'Laptop_Full_Backup/C_Drive_User',
        backupObjectCount: 1063,
        backupSizeGiB: 2.543,
      },
      {
        name: 'gdrive2:',
        provider: 'Google Drive',
        rootFolder: 'Laptop_Full_Backup/C_Drive_User',
        totalTiB: 5.0,
        usedGiB: 22.367,
        freeTiB: 4.961,
        backupFolderPath: 'Laptop_Full_Backup/C_Drive_User',
        backupObjectCount: 1063,
        backupSizeGiB: 2.543,
      },
    ];

    const correlation = analyzeRemoteQuotaCorrelation(remotes);
    assert.equal(correlation.sharesUnderlyingQuota, true);
    assert.equal(correlation.effectiveTotalTiB, 5.0);
    assert.ok(correlation.summary.includes('NOT 10 TiB combined'));
  });

  it('generates organized cloud target paths', () => {
    const path = generateCloudOrganizedPath('gdrive:', 'Laptop_Full_Backup/C_Drive_User', {
      name: 'Budget.xlsx',
      category: 'Documents',
      path: 'C:\\Users\\Admin\\Documents\\Budget.xlsx',
    });
    assert.equal(path, 'gdrive:Laptop_Full_Backup/C_Drive_User/Documents/Budget.xlsx');
  });

  it('handles existing G: drive conflicts safely without overwriting local disks', () => {
    const conflict = resolveDriveLetterConflict(
      'G:',
      [
        { letter: 'C:', type: 'system' },
        { letter: 'G:', type: 'local_disk' },
      ],
      'gdrive:Laptop_Full_Backup/C_Drive_User'
    );
    assert.equal(conflict.canMountDirectly, false);
    assert.equal(conflict.status, 'conflict_resolved_fallback');
    assert.equal(conflict.selectedDriveLetter, 'H:');

    const sameMount = resolveDriveLetterConflict(
      'G:',
      [
        { letter: 'C:', type: 'system' },
        { letter: 'G:', type: 'rclone_mount', target: 'gdrive:Laptop_Full_Backup/C_Drive_User' },
      ],
      'gdrive:Laptop_Full_Backup/C_Drive_User'
    );
    assert.equal(sameMount.canMountDirectly, true);
    assert.equal(sameMount.status, 'already_mounted_same_target');
  });

  it('builds non-destructive resumable transfer commands for interrupted uploads/downloads', () => {
    const resumable = buildResumableTransferCommand(
      'C:\\Users\\User\\Documents',
      'gdrive:Laptop_Full_Backup/C_Drive_User/Documents'
    );
    assert.equal(resumable.isNonDestructive, true);
    assert.equal(resumable.supportsResume, true);
    assert.ok(resumable.command.startsWith('rclone copy'));
    assert.ok(resumable.command.includes('--retries 5'));
  });

  it('verifies backup comparison truthfully (2.543 GiB / 1,063 objects is NOT entire computer) and reports Google Drive checksum limitations', () => {
    const audit = verifyBackupComparisonAndChecksums({
      localSystemUsedBytes: 1084 * 1024 ** 3,
      localUserProfileBytes: Math.round(16.743 * 1024 ** 3),
      remoteConfirmedObjects: 1063,
      remoteConfirmedBytes: 2730525491,
      verifiedBinaryObjects: 1049,
      unsupportedNativeDocsCount: 14,
    });
    assert.equal(audit.isEntireComputerBackedUp, false);
    assert.equal(audit.isUserProfileFullyBackedUp, false);
    assert.equal(audit.remoteConfirmedObjects, 1063);
    assert.equal(audit.remoteConfirmedGiB, 2.543);
    assert.equal(audit.checksumSupportedCount, 1049);
    assert.equal(audit.checksumUnsupportedCount, 14);
    assert.ok(audit.checksumLimitationReport.includes('entire C: drive is NOT backed up'));
    assert.ok(audit.checksumLimitationReport.includes('--download'));
  });
});

