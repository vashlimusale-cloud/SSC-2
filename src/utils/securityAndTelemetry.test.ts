import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp, SESSION_TOKEN } from '../../server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

test('Source audit: SystemCommandContext.tsx has zero Math.random() calls', () => {
  const ctxSource = fs.readFileSync(
    path.join(rootDir, 'src/context/SystemCommandContext.tsx'),
    'utf8'
  );
  assert.equal(
    ctxSource.includes('Math.random()'),
    false,
    'SystemCommandContext.tsx must not use Math.random() for telemetry or state'
  );
});

test('Source audit: server.ts binds to 127.0.0.1 and has no hardcoded fake command outputs', () => {
  const serverSource = fs.readFileSync(path.join(rootDir, 'server.ts'), 'utf8');
  assert.equal(serverSource.includes("process.env.SCC_BIND_HOST || '127.0.0.1'"), true);
  assert.equal(
    serverSource.includes('Windows Resource Protection did not find any integrity violations'),
    false,
    'server.ts must not contain hardcoded fake sfc output'
  );
  assert.equal(
    serverSource.includes('Ethernet adapter Ethernet (Intel I225-V 2.5GbE)'),
    false,
    'server.ts must not contain hardcoded fake ipconfig output'
  );
  assert.equal(
    serverSource.includes('- os/kernel: 10.0.22631.4317'),
    false,
    'server.ts must not contain hardcoded fake rclone version output'
  );
});

test('Source audit: src-tauri/src/main.rs exposes full native Tauri commands and tracks rclone child process', () => {
  const rustSource = fs.readFileSync(path.join(rootDir, 'src-tauri/src/main.rs'), 'utf8');
  assert.equal(rustSource.includes('pub struct MountProcessState'), true);
  assert.equal(rustSource.includes('fn check_gdrive_dependencies'), true);
  assert.equal(rustSource.includes('fn mount_gdrive_winfsp'), true);
  assert.equal(rustSource.includes('fn unmount_gdrive_winfsp'), true);
  assert.equal(rustSource.includes('fn verify_gdrive_mount'), true);
  assert.equal(rustSource.includes('fn open_in_explorer'), true);
  assert.equal(rustSource.includes('fn get_live_telemetry'), true);
  assert.equal(rustSource.includes('fn list_processes_native'), true);
  assert.equal(rustSource.includes('fn terminate_process_safe'), true);
  assert.equal(rustSource.includes('fn execute_command_native'), true);
});

test('API security: unauthenticated or cross-origin POST requests to /api/command/execute and /api/mount/action are rejected', async () => {
  const app = await createApp();
  const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const addr = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${addr.port}`;

  try {
    // 1. Missing X-SCC-Session-Token -> 401 Unauthorized
    const unauthCmdRes = await fetch(`${baseUrl}/api/command/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: 'whoami', approved: true }),
    });
    assert.equal(unauthCmdRes.status, 401);

    // 2. Cross-origin Origin header -> 403 Forbidden
    const csrfRes = await fetch(`${baseUrl}/api/command/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SCC-Session-Token': SESSION_TOKEN,
        Origin: 'https://malicious-attacker.example.com',
      },
      body: JSON.stringify({ command: 'whoami', approved: true }),
    });
    assert.equal(csrfRes.status, 403);

    // 3. Unauthenticated POST to /api/mount/action -> 401 Unauthorized
    const unauthMountRes = await fetch(`${baseUrl}/api/mount/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mount', driveLetter: 'G:' }),
    });
    assert.equal(unauthMountRes.status, 401);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('API execution & telemetry: authenticated real commands, missing binary exitCode 127, real OS mount check, and real host telemetry', async () => {
  const app = await createApp();
  const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const addr = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${addr.port}`;

  try {
    // 1. Real command execution: whoami
    const whoamiRes = await fetch(`${baseUrl}/api/command/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SCC-Session-Token': SESSION_TOKEN,
      },
      body: JSON.stringify({ command: 'whoami', workingDir: '/tmp', approved: true }),
    });
    assert.equal(whoamiRes.status, 200);
    const whoamiData = await whoamiRes.json();
    assert.equal(whoamiData.status, 'completed');
    assert.equal(whoamiData.exitCode, 0);
    assert.equal(whoamiData.stdout.length > 0, true);

    // 2. Missing binary (sfc on Linux container) returns real exitCode 127 instead of fake output
    if (process.platform !== 'win32') {
      const sfcRes = await fetch(`${baseUrl}/api/command/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SCC-Session-Token': SESSION_TOKEN,
        },
        body: JSON.stringify({ command: 'sfc /scannow', workingDir: '/tmp', approved: true }),
      });
      const sfcData = await sfcRes.json();
      assert.equal(sfcData.status, 'failed');
      assert.equal(sfcData.exitCode, 127);
      assert.equal(sfcData.stderr.includes("Executable 'sfc' was not found"), true);
    }

    // 3. Real OS mount verification reports isMounted: false when G:\ does not exist
    const mountVerifyRes = await fetch(`${baseUrl}/api/mount/verify?driveLetter=G:`);
    const mountVerifyData = await mountVerifyRes.json();
    if (!fs.existsSync('G:\\')) {
      assert.equal(mountVerifyData.isMounted, false);
      assert.equal(mountVerifyData.connectionHealth, 'Unmounted');
    }

    // 4. Real host telemetry endpoint returns real CPU/RAM/Disk and honest sensor status
    const telemetryRes = await fetch(`${baseUrl}/api/telemetry`);
    const telemetryData = await telemetryRes.json();
    assert.equal(typeof telemetryData.cpuTotalPercent, 'number');
    assert.equal(telemetryData.ramTotalGB > 0, true);
    assert.equal(telemetryData.processCount > 0, true);
    assert.equal(telemetryData.gpuPercent, null);
    assert.equal(telemetryData.sensorStatus.telemetrySource, 'host-os-kernel');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
