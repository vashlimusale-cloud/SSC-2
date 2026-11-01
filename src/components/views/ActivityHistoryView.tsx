import React from 'react';
import {
  History,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Zap,
  Server,
  Cloud,
  HardDrive,
  Clock,
  Terminal,
  SlidersHorizontal,
  ShieldAlert,
} from 'lucide-react';
import { useSystemCommand } from '../../context/SystemCommandContext';
import { ActivityLog } from '../../types/system';
import { FluentCard } from '../FluentMotion';

export const ActivityHistoryView: React.FC = () => {
  const { activityLogs, undoAction } = useSystemCommand();

  const getActionIcon = (type: ActivityLog['actionType']) => {
    switch (type) {
      case 'terminate_process':
        return <Trash2 className="w-4 h-4 text-rose-400" />;
      case 'toggle_startup':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'service_control':
        return <Server className="w-4 h-4 text-[#10b981]" />;
      case 'mount_drive':
      case 'rclone_upload':
        return <Cloud className="w-4 h-4 text-cyan-400" />;
      case 'command_exec':
        return <Terminal className="w-4 h-4 text-[#a855f7]" />;
      case 'optimization_apply':
        return <SlidersHorizontal className="w-4 h-4 text-[#10b981]" />;
      case 'rclone_restore':
        return <RotateCcw className="w-4 h-4 text-blue-400" />;
      default:
        return <HardDrive className="w-4 h-4 text-[#a855f7]" />;
    }
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <History className="w-5 h-5 text-[#a855f7]" />
            Activity History &amp; SQLite Audit Journal
          </h1>
          <p className="text-xs text-[#a1a1aa] mt-0.5">
            SQLite-persisted log of system actions. Genuine restore is provided only for reversible state changes.
          </p>
        </div>

        <div className="text-xs text-[#a1a1aa] font-mono bg-[#171619] px-3 py-1.5 rounded-xl border border-white/10">
          {activityLogs.length} SQLite Audit Entries
        </div>
      </div>

      {/* Integrity Notice on Reversibility (Section 12 Requirement) */}
      <div className="p-3.5 rounded-2xl bg-[#171619] border border-white/[0.08] text-xs text-[#a1a1aa] flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
        <div>
          <strong className="text-white">Genuine Restore Policy:</strong> Configuration changes (Startup entries, Service states, Virtual Drive mounts, Optimizations, and Settings) store their prior state in SQLite and support 1-click restoration. Process terminations (<code className="text-rose-300">terminate_process</code>) cannot resurrect killed OS process memory and are truthfully recorded as permanent audit events.
        </div>
      </div>

      {/* Activity Log List */}
      <FluentCard interactive={false} accentColor="purple" className="overflow-hidden">
        <div className="p-3.5 border-b border-white/10 bg-[#09090b]/50 flex items-center justify-between text-xs text-[#71717a]">
          <span>Persisted Action Ledger</span>
          <span>Reversible operations display Restore button</span>
        </div>

        <div className="divide-y divide-white/5">
          {activityLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#71717a]">
              No actions recorded yet.
            </div>
          ) : (
            activityLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#09090b] border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    {getActionIcon(log.actionType)}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-white tracking-wide">
                        {log.target}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/5 text-[#a1a1aa]">
                        {log.actionType.replace('_', ' ')}
                      </span>
                      {log.undone && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] font-semibold">
                          Restored
                        </span>
                      )}
                    </div>
                    <p className="text-[#d4d4d8] text-xs leading-relaxed">{log.details}</p>
                    <div className="text-[10px] text-[#71717a] flex items-center gap-1 font-mono pt-0.5">
                      <Clock className="w-3 h-3" /> {log.timestamp}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {log.actionType !== 'terminate_process' && log.undoable && !log.undone ? (
                    <button
                      onClick={() => undoAction(log.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-[#09090b] text-xs font-bold shadow transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restore State
                    </button>
                  ) : log.undone ? (
                    <span className="text-[11px] text-[#10b981] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Restored
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#71717a] font-mono px-2 py-1 rounded bg-white/[0.03]">
                      {log.actionType === 'terminate_process'
                        ? 'Permanent (Process Exited)'
                        : 'Audit Record'}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </FluentCard>
    </div>
  );
};
