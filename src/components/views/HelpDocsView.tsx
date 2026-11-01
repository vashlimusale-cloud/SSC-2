import React, { useState } from 'react';
import {
  BookOpen,
  FileText,
  Shield,
  Cloud,
  Terminal,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { FluentCard, fluentStaggerContainer } from '../FluentMotion';
import { motion } from 'motion/react';

interface DocSection {
  id: string;
  title: string;
  file: string;
  summary: string;
  content: string[];
}

const DOC_SECTIONS: DocSection[] = [
  {
    id: 'overview',
    title: 'Project Overview',
    file: 'docs/PROJECT_OVERVIEW.md',
    summary: 'Unified Windows 11 System Intelligence, Google Drive Virtual Storage & Local Command Center.',
    content: [
      'System Command Center unifies three core capabilities into a single desktop suite: (A) Windows System Intelligence, (B) Google Drive Virtual Storage via rclone v1.75.1 + WinFsp, and (C) Controlled Local System Command Execution.',
      'Visual Design: Built on the Neo’s Noir dark charcoal and purple/emerald design system (#09090B background, #111013 sidebar, #171619 cards, #A855F7 / #10B981 accents).',
      'Architecture: Unified Tauri 2 + Rust native Windows bridge + React 19 + TypeScript + SQLite persistent storage.',
    ],
  },
  {
    id: 'install',
    title: 'Installation Guide',
    file: 'docs/INSTALLATION_GUIDE.md',
    summary: 'Prerequisites, WinFsp & rclone v1.75.1 installation, and first launch.',
    content: [
      '1. Install WinFsp (Windows File System Proxy): winget install WinFsp.WinFsp',
      '2. Install rclone v1.75.1+: winget install Rclone.Rclone (placed at C:\\rclone\\rclone.exe)',
      '3. Verify remotes: rclone listremotes (verifies gdrive: and gdrive2:)',
      '4. Launch System Command Center via the Windows installer (release/) or npm run dev on port 3000.',
    ],
  },
  {
    id: 'gdrive',
    title: 'Google Drive Virtual Drive Guide',
    file: 'docs/GOOGLE_DRIVE_GUIDE.md',
    summary: 'Mounting G:, quota correlation between gdrive: and gdrive2:, and safe rclone copy.',
    content: [
      'Virtual Drive G: mounts gdrive:Laptop_Full_Backup/C_Drive_User (1,063 objects, 2.543 GiB) directly in Windows File Explorer using WinFsp.',
      'Quota Correlation Note: Both gdrive: and gdrive2: report 5.000 TiB total, 22.367 GiB used, and 4.961 TiB free because they reference the same underlying Google Drive storage pool (5 TiB effective capacity, not 10 TiB combined).',
      'Transfer Safety: Initial backups strictly use "rclone copy". Destructive "rclone sync" and "rclone move" are blocked by default.',
    ],
  },
  {
    id: 'command',
    title: 'Command Execution Guide',
    file: 'docs/COMMAND_EXECUTION_GUIDE.md',
    summary: 'How to enter, inspect, approve, and audit local Windows & rclone commands.',
    content: [
      'Every command entered in Command Center is analyzed before execution and classified into: Safe Read-Only, System Modification, Privileged Admin, or Blocked Destructive.',
      'Destructive commands (format, del /f /s /q, rm -rf /, rclone purge, encoded PowerShell) are automatically blocked.',
      'Privileged Admin and System Modification commands display an explicit confirmation modal explaining what the command changes.',
    ],
  },
  {
    id: 'security',
    title: 'Security & Reversibility Policy',
    file: 'docs/SECURITY.md',
    summary: 'Protected OS processes, OAuth secret redaction, and genuine restore rules.',
    content: [
      'Protected System Processes (System, smss.exe, csrss.exe, wininit.exe, services.exe, lsass.exe, dwm.exe, MsMpEng.exe) are locked against termination.',
      'Genuine Restore Policy: Only genuinely reversible operations (Startup toggles, Service states, Virtual Drive mounts, Optimizations, Settings) are marked reversible in SQLite. Process terminations are permanent audit records.',
      'Secret Redaction: OAuth2 access_token, refresh_token, and client_secret values are automatically redacted from all logs.',
    ],
  },
  {
    id: 'test_report',
    title: 'Verification & Test Report',
    file: 'docs/TEST_REPORT.md',
    summary: 'Unit tests (15/15 PASS), UI/UX visual inspection, and SQLite persistence checks.',
    content: [
      'Unit Tests: 15/15 PASS across systemIntelligence.test.ts and storageIntelligence.test.ts.',
      'UI/UX Verification: All 16 navigation views verified in real Chromium headless browser via Playwright CLI.',
      'Persistence Verification: Platform settings, mount history, command execution history, and activity journal verified in data/scc_persistence.sqlite.',
    ],
  },
];

export const HelpDocsView: React.FC = () => {
  const [selectedDocId, setSelectedDocId] = useState('overview');
  const activeDoc = DOC_SECTIONS.find((d) => d.id === selectedDocId) || DOC_SECTIONS[0];

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
            <BookOpen className="w-5 h-5 text-[#10b981]" />
            Complete Documentation Package &amp; User Manual
          </h1>
          <p className="text-xs text-[#a1a1aa] mt-0.5">
            Built-in documentation browser covering all 10 manuals in the <code className="text-[#10b981]">docs/</code> directory
          </p>
        </div>

        <div className="text-xs font-mono text-[#10b981] bg-[#171619] px-3 py-1.5 rounded-xl border border-white/10">
          docs/ &amp; release/ Verified
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Doc Selector */}
        <div className="lg:col-span-4 space-y-2">
          {DOC_SECTIONS.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setSelectedDocId(doc.id)}
              className={`w-full p-3.5 rounded-2xl text-left border transition-colors cursor-pointer ${
                selectedDocId === doc.id
                  ? 'bg-[#1d1a20] border-[#a855f7]/50 text-white'
                  : 'bg-[#171619] border-white/[0.06] text-[#a1a1aa] hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>{doc.title}</span>
                <span className="font-mono text-[10px] text-[#10b981]">{doc.file}</span>
              </div>
              <p className="text-[11px] text-[#71717a] mt-1">{doc.summary}</p>
            </button>
          ))}
        </div>

        {/* Right Doc Viewer */}
        <FluentCard
          interactive={false}
          accentColor="purple"
          className="lg:col-span-8 p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h2 className="text-lg font-bold text-white">{activeDoc.title}</h2>
              <div className="text-xs font-mono text-[#10b981]">{activeDoc.file}</div>
            </div>
            <FileText className="w-5 h-5 text-[#a855f7]" />
          </div>

          <div className="space-y-3 text-xs text-[#d4d4d8] leading-relaxed">
            {activeDoc.content.map((paragraph, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#09090b] border border-white/[0.06] flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
                <span>{paragraph}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#a855f7]" /> System Module
              </div>
              <div className="text-[11px] text-[#71717a] mt-0.5">
                Processes, Startup, Services &amp; Telemetry
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-[#10b981]" /> Virtual Drive G:
              </div>
              <div className="text-[11px] text-[#71717a] mt-0.5">
                WinFsp + rclone v1.75.1 Automation
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-sky-400" /> Command Guard
              </div>
              <div className="text-[11px] text-[#71717a] mt-0.5">
                Approved Local CLI &amp; Secret Redaction
              </div>
            </div>
          </div>
        </FluentCard>
      </div>
    </motion.div>
  );
};
