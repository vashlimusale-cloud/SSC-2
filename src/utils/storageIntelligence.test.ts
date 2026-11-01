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
});
