import React, { useState, useMemo } from 'react';
import {
  Terminal,
  Play,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useSystemCommand } from '../../context/SystemCommandContext';
import { validateLocalCommand } from '../../utils/systemIntelligence';
import { FluentCard, fluentStaggerContainer } from '../FluentMotion';
import { motion, AnimatePresence } from 'motion/react';

const PRESET_COMMANDS = [
  { label: 'rclone version', cmd: 'rclone version', dir: 'C:\\rclone' },
  { label: 'rclone listremotes', cmd: 'rclone listremotes --long', dir: 'C:\\rclone' },
  { label: 'rclone about gdrive:', cmd: 'rclone about gdrive:', dir: 'C:\\rclone' },
  {
    label: 'rclone size Backup',
    cmd: 'rclone size "gdrive:Laptop_Full_Backup/C_Drive_User"',
    dir: 'C:\\rclone',
  },
  {
    label: 'rclone lsd Backup',
    cmd: 'rclone lsd "gdrive:Laptop_Full_Backup/C_Drive_User"',
    dir: 'C:\\rclone',
  },
  { label: 'System Info', cmd: 'systeminfo', dir: 'C:\\Windows\\System32' },
  { label: 'SFC Verify (Admin)', cmd: 'sfc /scannow', dir: 'C:\\Windows\\System32' },
];

export const CommandCenterView: React.FC = () => {
  const { commandHistory, executeLocalCommand } = useSystemCommand();

  const [commandInput, setCommandInput] = useState('rclone about gdrive:');
  const [workingDir, setWorkingDir] = useState('C:\\rclone');
  const [isRunning, setIsRunning] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<{
    command: string;
    workingDir: string;
    validation: ReturnType<typeof validateLocalCommand>;
  } | null>(null);

  // Live security & risk preview before execution
  const liveValidation = useMemo(
    () => validateLocalCommand(commandInput, workingDir),
    [commandInput, workingDir]
  );

  const handleRunClick = async () => {
    if (!commandInput.trim()) return;

    if (!liveValidation.allowed) {
      // Log blocked attempt via backend
      setIsRunning(true);
      await executeLocalCommand(commandInput, workingDir, false);
      setIsRunning(false);
      return;
    }

    if (liveValidation.requiresApproval) {
      setPendingApproval({
        command: commandInput,
        workingDir,
        validation: liveValidation,
      });
      return;
    }

    setIsRunning(true);
    await executeLocalCommand(commandInput, workingDir, true);
    setIsRunning(false);
  };

  const confirmApprovedExecution = async () => {
    if (!pendingApproval) return;
    const { command, workingDir: dir } = pendingApproval;
    setPendingApproval(null);
    setIsRunning(true);
    await executeLocalCommand(command, dir, true);
    setIsRunning(false);
  };

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
            <Terminal className="w-5 h-5 text-[#10b981]" />
            Controlled Local Windows Command Execution Engine
          </h1>
          <p className="text-xs text-[#a1a1aa] mt-0.5">
            Execute verified local system &amp; rclone commands with pre-execution risk explanation, secret redaction, and approval guardrails
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-[#171619] border border-white/10 text-xs font-mono text-[#10b981]">
          {commandHistory.length} Executed Commands Logged
        </div>
      </div>

      {/* Command Input & Pre-Execution Security Inspector */}
      <FluentCard interactive={false} accentColor="emerald" className="p-5 space-y-4">
        {/* Preset Quick Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-[#71717a] font-semibold mr-1">Quick Presets:</span>
          {PRESET_COMMANDS.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setCommandInput(p.cmd);
                setWorkingDir(p.dir);
              }}
              className="px-2.5 py-1 rounded-lg bg-[#222026] hover:bg-[#2c2933] border border-white/10 text-[11px] font-mono text-[#e4e4e7] cursor-pointer transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Input Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-3">
            <label className="text-[11px] text-[#a1a1aa] block mb-1">Working Directory</label>
            <input
              type="text"
              value={workingDir}
              onChange={(e) => setWorkingDir(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#09090b] border border-white/10 font-mono text-xs text-white focus:outline-none focus:border-[#10b981]"
            />
          </div>

          <div className="lg:col-span-7">
            <label className="text-[11px] text-[#a1a1aa] block mb-1">Command Line</label>
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRunClick();
              }}
              placeholder="Enter Windows or rclone command..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090b] border border-white/10 font-mono text-xs text-[#10b981] focus:outline-none focus:border-[#10b981]"
            />
          </div>

          <div className="lg:col-span-2 flex items-end">
            <button
              onClick={handleRunClick}
              disabled={isRunning}
              className="w-full py-2.5 px-4 rounded-xl bg-[#10b981] hover:bg-[#059669] text-[#09090b] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              {isRunning ? 'Running...' : 'Execute'}
            </button>
          </div>
        </div>

        {/* Live Pre-Execution Explanation & Security Classification Box */}
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-start justify-between gap-3 ${
            !liveValidation.allowed
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
              : liveValidation.riskLevel === 'Privileged Admin'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
              : 'bg-[#09090b] border-white/10 text-[#d4d4d8]'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {!liveValidation.allowed ? (
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold text-white flex items-center gap-2">
                <span>Command Preview &amp; Impact Assessment</span>
                {liveValidation.requiresAdmin && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                    Administrator Elevation Required
                  </span>
                )}
              </div>
              <p className="mt-0.5">{liveValidation.explanation}</p>
              {liveValidation.blockedReason && (
                <p className="text-rose-300 font-semibold mt-1">{liveValidation.blockedReason}</p>
              )}
            </div>
          </div>

          <span
            className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full shrink-0 ${
              !liveValidation.allowed
                ? 'bg-rose-500/20 text-rose-300'
                : liveValidation.riskLevel === 'Privileged Admin'
                ? 'bg-amber-500/20 text-amber-300'
                : liveValidation.riskLevel === 'System Modification'
                ? 'bg-[#a855f7]/20 text-purple-300'
                : 'bg-[#10b981]/20 text-[#10b981]'
            }`}
          >
            {liveValidation.riskLevel}
          </span>
        </div>
      </FluentCard>

      {/* Command Execution History & Live Stdout/Stderr Output */}
      <div className="space-y-3">
        {commandHistory.map((item) => (
          <FluentCard
            key={item.id}
            interactive={false}
            accentColor={item.status === 'completed' ? 'emerald' : 'rose'}
            className="p-4 space-y-2.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                {item.status === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400" />
                )}
                <code className="font-mono font-bold text-white bg-[#09090b] px-2.5 py-1 rounded border border-white/10">
                  {item.workingDir}&gt; {item.command}
                </code>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-[#a1a1aa] font-mono">
                  {item.riskLevel}
                </span>
              </div>

              <div className="flex items-center gap-3 text-[11px] font-mono text-[#71717a]">
                <span>Exit Code: {item.exitCode ?? 0}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {item.durationMs} ms
                </span>
                <span>{item.executedAt}</span>
              </div>
            </div>

            {item.stdout && (
              <pre className="p-3 rounded-xl bg-[#09090b] border border-white/[0.06] font-mono text-[11px] text-[#e4e4e7] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {item.stdout}
              </pre>
            )}

            {item.stderr && (
              <pre className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 font-mono text-[11px] text-rose-200 overflow-x-auto whitespace-pre-wrap">
                {item.stderr}
              </pre>
            )}
          </FluentCard>
        ))}
      </div>

      {/* Explicit Approval Modal for Sensitive / Admin Commands */}
      <AnimatePresence>
        {pendingApproval && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl bg-[#171619] border border-amber-500/40 p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-2.5 text-amber-400 font-bold text-base">
                <AlertTriangle className="w-5 h-5" />
                User Approval Required — Sensitive Command Execution
              </div>

              <div className="space-y-2 text-xs text-[#d4d4d8]">
                <div className="p-3 rounded-xl bg-[#09090b] border border-white/10 font-mono text-[#10b981]">
                  {pendingApproval.workingDir}&gt; {pendingApproval.command}
                </div>
                <p>{pendingApproval.validation.explanation}</p>
                {pendingApproval.validation.requiresAdmin && (
                  <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                    <Lock className="w-3.5 h-3.5" />
                    Requires Administrator-level execution privileges.
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setPendingApproval(null)}
                  className="px-4 py-2 rounded-xl bg-[#222026] hover:bg-[#2c2933] text-xs font-semibold text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmApprovedExecution}
                  className="px-4 py-2 rounded-xl bg-[#10b981] hover:bg-[#059669] text-[#09090b] text-xs font-bold cursor-pointer"
                >
                  Approve &amp; Execute Command
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
