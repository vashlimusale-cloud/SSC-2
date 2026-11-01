import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyProcessRisk,
  checkTerminationSafety,
  toggleStartupState,
  formatBytes,
  isOperationReversible,
  validateLocalCommand,
  redactSecretsFromOutput,
} from './systemIntelligence';
import { StartupItem } from '../types/system';

describe('System Intelligence Pure Business Logic', () => {
  it('classifies critical Windows processes as Protected System Process regardless of RAM', () => {
    assert.equal(
      classifyProcessRisk(
        'lsass.exe',
        'C:\\Windows\\System32\\lsass.exe',
        'Microsoft Windows',
        true,
        45
      ),
      'Protected System Process'
    );
    assert.equal(
      classifyProcessRisk(
        'dwm.exe',
        'C:\\Windows\\System32\\dwm.exe',
        'Microsoft Windows',
        true,
        650
      ),
      'Protected System Process'
    );
  });

  it('never classifies a signed user application as Review Required solely due to high RAM usage', () => {
    const category = classifyProcessRisk(
      'chrome.exe',
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'Google LLC',
      true,
      4096 // 4 GB RAM
    );
    assert.equal(category, 'Safe Optional');
  });

  it('classifies unsigned or Temp-directory binaries as Review Required', () => {
    assert.equal(
      classifyProcessRisk(
        'updater_helper.exe',
        'C:\\Users\\Admin\\AppData\\Local\\Temp\\updater_helper.exe',
        'Unknown Publisher',
        false,
        18
      ),
      'Review Required'
    );
  });

  it('blocks termination of Protected System Processes and Kernel PIDs', () => {
    const lsassCheck = checkTerminationSafety({
      pid: 712,
      name: 'lsass.exe',
      category: 'Protected System Process',
    });
    assert.equal(lsassCheck.allowed, false);
    assert.ok(lsassCheck.reason?.includes('Protected System Process'));

    const chromeCheck = checkTerminationSafety({
      pid: 9420,
      name: 'chrome.exe',
      category: 'Safe Optional',
    });
    assert.equal(chromeCheck.allowed, true);
  });

  it('enforces genuine reversibility rules: terminate_process is NEVER reversible, while startup/mount/settings are reversible', () => {
    assert.equal(isOperationReversible('terminate_process'), false);
    assert.equal(isOperationReversible('command_exec'), false);
    assert.equal(isOperationReversible('toggle_startup'), true);
    assert.equal(isOperationReversible('mount_drive'), true);
    assert.equal(isOperationReversible('service_control'), true);
    assert.equal(isOperationReversible('optimization_apply'), true);
  });

  it('validates local commands: blocks destructive operations, flags Admin commands, and allows read-only diagnostics', () => {
    const destructive = validateLocalCommand('del /f /s /q C:\\Users\\Admin\\Documents');
    assert.equal(destructive.allowed, false);
    assert.equal(destructive.riskLevel, 'Blocked Destructive');

    const encodedPowerShell = validateLocalCommand('powershell -enc aGVsbG8=');
    assert.equal(encodedPowerShell.allowed, false);

    const adminCmd = validateLocalCommand('sfc /scannow');
    assert.equal(adminCmd.allowed, true);
    assert.equal(adminCmd.riskLevel, 'Privileged Admin');
    assert.equal(adminCmd.requiresAdmin, true);

    const safeReadOnly = validateLocalCommand('rclone listremotes');
    assert.equal(safeReadOnly.allowed, true);
    assert.equal(safeReadOnly.riskLevel, 'Safe Read-Only');
  });

  it('redacts OAuth tokens and API secrets from output', () => {
    const raw = 'Token: ya29.a0AfH6SMBx91234567890_secret and access_token="my_super_secret_token"';
    const redacted = redactSecretsFromOutput(raw);
    assert.ok(!redacted.includes('my_super_secret_token'));
    assert.ok(redacted.includes('[REDACTED'));
  });

  it('toggles startup item state and captures previousEnabled snapshot for Undo', () => {
    const mockItem: StartupItem = {
      id: 'startup-1',
      name: 'Docker Desktop',
      command: 'C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe',
      publisher: 'Docker Inc.',
      location: 'Registry HKCU Run',
      enabled: true,
      impact: 'High',
      bootTimeImpactMs: 1420,
      description: 'Container daemon',
      category: 'Safe Optional',
    };

    const { updatedItem, previousEnabled } = toggleStartupState(mockItem);
    assert.equal(previousEnabled, true);
    assert.equal(updatedItem.enabled, false);
  });

  it('formats byte values accurately', () => {
    assert.equal(formatBytes(0), '0 B');
    assert.equal(formatBytes(1024), '1 KB');
    assert.equal(formatBytes(1048576), '1 MB');
  });
});
