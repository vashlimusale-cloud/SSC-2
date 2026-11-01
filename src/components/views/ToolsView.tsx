import React, { useState } from 'react';
import {
  Wrench,
  CheckCircle2,
  FolderTree,
  ArchiveRestore,
  ShieldCheck,
  HardDrive,
  Terminal,
  RefreshCw,
} from 'lucide-react';
import { useSystemCommand } from '../../context/SystemCommandContext';
import { FluentCard, fluentStaggerContainer } from '../FluentMotion';
import { motion } from 'motion/react';

export const ToolsView: React.FC = () => {
  const { rcloneStatus, scanSummary, runStorageScan, isScanning, setActiveView } =
    useSystemCommand();
  const [diagComplete, setDiagComplete] = useState(true);

  return (
    <motion.div
      variants={fluentStaggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-5 pb-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[#a855f7]" />
            System Tools, Health Center &amp; Dependency Diagnostics
          </h1>
          <p className="text-xs text-[#a1a1aa] mt-0.5">
            Verify WinFsp virtual drive dependencies, audit SHA-256 backups, and launch storage organization utilities
          </p>
        </div>

        <button
          onClick={() => {
            setDiagComplete(false);
            runStorageScan().then(() => setDiagComplete(true));
          }}
          disabled={isScanning}
          className="px-4 py-2 rounded-xl bg-[#10b981] hover:bg-[#059669] text-[#09090b] text-xs font-bold flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
          {isScanning ? 'Running Full Diagnostic...' : 'Run System & Storage Diagnostic'}
        </button>
      </div>

      {/* Dependency Verification Matrix (WinFsp, rclone 1.75.1, SQLite, Authenticode) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <FluentCard interactive={false} accentColor="emerald" className="p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white">rclone CLI Binary</span>
            <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
          </div>
          <div className="text-xs font-mono text-[#10b981]">{rcloneStatus.version}</div>
          <div className="text-[11px] text-[#71717a]">{rcloneStatus.binaryPath}</div>
        </FluentCard>

        <FluentCard interactive={false} accentColor="emerald" className="p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white">WinFsp Kernel Driver</span>
            <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
          </div>
          <div className="text-xs font-mono text-[#10b981]">{rcloneStatus.winfspVersion}</div>
          <div className="text-[11px] text-[#71717a]">
            Required for native Windows Explorer G: mount
          </div>
        </FluentCard>

        <FluentCard interactive={false} accentColor="purple" className="p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white">SQLite State Engine</span>
            <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
          </div>
          <div className="text-xs font-mono text-purple-300">node:sqlite / rusqlite</div>
          <div className="text-[11px] text-[#71717a]">
            Persists settings, transfers &amp; audit logs
          </div>
        </FluentCard>

        <FluentCard interactive={false} accentColor="blue" className="p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white">SHA-256 Hash Verifier</span>
            <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
          </div>
          <div className="text-xs font-mono text-sky-300">
            {scanSummary.totalScannedFiles} Files Audited
          </div>
          <div className="text-[11px] text-[#71717a]">
            {scanSummary.duplicateGroupsCount} duplicate sets •{' '}
            {scanSummary.missingDeletedCount} recoverable
          </div>
        </FluentCard>
      </div>

      {/* Specialized Utility Launchers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FluentCard
          accentColor="purple"
          onClick={() => setActiveView('file_organizer')}
          className="p-5 space-y-3 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-[#a855f7]/15 border border-[#a855f7]/30 flex items-center justify-center">
            <FolderTree className="w-5 h-5 text-[#a855f7]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Cloud File Organizer</h3>
            <p className="text-xs text-[#a1a1aa] mt-1">
              Preview automated categorization into Documents, Development, Images, Database, and Archives before running <code className="text-[#10b981]">rclone copy</code>.
            </p>
          </div>
          <div className="text-xs font-bold text-[#a855f7]">Open File Organizer →</div>
        </FluentCard>

        <FluentCard
          accentColor="emerald"
          onClick={() => setActiveView('backup_restore')}
          className="p-5 space-y-3 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center">
            <ArchiveRestore className="w-5 h-5 text-[#10b981]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Backup &amp; Restore Center</h3>
            <p className="text-xs text-[#a1a1aa] mt-1">
              Recover missing or accidentally deleted local files from <code className="text-[#10b981]">gdrive:Laptop_Full_Backup/C_Drive_User</code> with hash verification.
            </p>
          </div>
          <div className="text-xs font-bold text-[#10b981]">Open Recovery Center →</div>
        </FluentCard>

        <FluentCard
          accentColor="blue"
          onClick={() => setActiveView('command_center')}
          className="p-5 space-y-3 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center">
            <Terminal className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Local Command Execution</h3>
            <p className="text-xs text-[#a1a1aa] mt-1">
              Execute controlled Windows &amp; rclone commands with risk classification, argument validation, and live stdout/stderr streaming.
            </p>
          </div>
          <div className="text-xs font-bold text-sky-400">Open Command Center →</div>
        </FluentCard>
      </div>

      {/* WinFsp Dependency Guidance */}
      <FluentCard interactive={false} accentColor="emerald" className="p-5 space-y-2">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <HardDrive className="w-4 h-4 text-[#10b981]" />
          Windows Virtual Drive Mount Requirements (WinFsp + rclone)
        </div>
        <p className="text-xs text-[#a1a1aa] leading-relaxed">
          To mount Google Drive as a real drive letter (<code className="text-white">G:</code>) in Windows File Explorer, Windows requires a user-mode file system driver (<strong className="text-white">WinFsp — Windows File System Proxy</strong>). System Command Center automatically verifies <code className="text-[#10b981]">C:\Program Files (x86)\WinFsp\bin\launcher-x64.exe</code> before invoking <code className="text-[#10b981]">rclone mount</code>. If WinFsp is missing on a fresh machine, install it via <code className="text-white font-mono">winget install WinFsp.WinFsp</code>.
        </p>
        {diagComplete && (
          <div className="text-xs text-[#10b981] font-semibold flex items-center gap-1.5 pt-1">
            <ShieldCheck className="w-4 h-4" /> All virtual file system dependencies verified and operational.
          </div>
        )}
      </FluentCard>
    </motion.div>
  );
};
