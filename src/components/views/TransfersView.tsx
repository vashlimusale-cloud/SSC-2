import React from 'react';
import {
  ArrowLeftRight,
  Pause,
  Play,
  RotateCcw,
  CheckCircle2,
  UploadCloud,
  Terminal,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useSystemCommand } from '../../context/SystemCommandContext';
import { formatBytes } from '../../utils/systemIntelligence';
import { FluentCard, fluentStaggerContainer } from '../FluentMotion';
import { motion } from 'motion/react';

export const TransfersView: React.FC = () => {
  const {
    transfers,
    transferLogs,
    scannedFiles,
    startBatchRcloneUpload,
    pauseOrResumeTransfer,
    retryFailedTransfer,
    verifyFileIntegrity,
    platformSettings,
    updatePlatformSettings,
  } = useSystemCommand();

  const pendingFiles = scannedFiles.filter((f) => f.cloudSyncStatus !== 'synced');

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
            <ArrowLeftRight className="w-5 h-5 text-[#10b981]" />
            Automatic Transfer Queue &amp; Resumable rclone Engine
          </h1>
          <p className="text-xs text-[#a1a1aa] mt-0.5">
            Non-destructive <code className="text-[#10b981]">rclone copy</code> queue with pause/resume, scheduled sync, and SHA-256 verification
          </p>
        </div>

        <button
          onClick={() => startBatchRcloneUpload(pendingFiles.map((f) => f.id))}
          className="px-4 py-2 rounded-xl bg-[#10b981] hover:bg-[#059669] text-[#09090b] text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
        >
          <UploadCloud className="w-4 h-4" />
          Queue Pending Files ({pendingFiles.length})
        </button>
      </div>

      {/* Automation Controls Bar (Manual, Scheduled, File-Change Watch) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FluentCard interactive={false} accentColor="emerald" className="p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#10b981]" />
              Scheduled Auto-Transfer
            </div>
            <div className="text-[11px] text-[#71717a] mt-0.5">
              Every {platformSettings.scheduledTransferIntervalHours} hours via rclone copy
            </div>
          </div>
          <button
            onClick={() =>
              updatePlatformSettings({
                scheduledTransferEnabled: !platformSettings.scheduledTransferEnabled,
              })
            }
            role="switch"
            aria-checked={platformSettings.scheduledTransferEnabled}
            className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              platformSettings.scheduledTransferEnabled ? 'bg-[#10b981]' : 'bg-[#27272a]'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                platformSettings.scheduledTransferEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </FluentCard>

        <FluentCard interactive={false} accentColor="purple" className="p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-white">File-Change Watch Trigger</div>
            <div className="text-[11px] text-[#71717a] mt-0.5">
              Queue modified Documents automatically
            </div>
          </div>
          <button
            onClick={() =>
              updatePlatformSettings({
                fileChangeWatchEnabled: !platformSettings.fileChangeWatchEnabled,
              })
            }
            role="switch"
            aria-checked={platformSettings.fileChangeWatchEnabled}
            className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              platformSettings.fileChangeWatchEnabled ? 'bg-[#10b981]' : 'bg-[#27272a]'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                platformSettings.fileChangeWatchEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </FluentCard>

        <FluentCard interactive={false} accentColor="blue" className="p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              Conflict &amp; Safety Policy
            </div>
            <div className="text-[11px] text-[#71717a] mt-0.5">
              Non-destructive copy • Never deletes source
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#10b981]/15 text-[#10b981]">
            Enforced
          </span>
        </FluentCard>
      </div>

      {/* Active & Completed Transfer Queue */}
      <FluentCard interactive={false} accentColor="purple" className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Persistent Transfer Queue ({transfers.length})</h3>
          <span className="text-xs text-[#71717a]">Resumable 32MB chunked transfers</span>
        </div>

        <div className="space-y-3">
          {transfers.map((task) => (
            <div
              key={task.id}
              className="p-4 rounded-xl bg-[#09090b] border border-white/[0.07] space-y-2.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{task.fileName}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                        task.status === 'completed'
                          ? 'bg-[#10b981]/20 text-[#10b981]'
                          : task.status === 'paused'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-[#a855f7]/20 text-purple-300'
                      }`}
                    >
                      {task.status}
                    </span>
                    {task.checksumVerified && (
                      <span className="text-[10px] text-[#10b981] flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> SHA-256 Verified
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#71717a] font-mono truncate max-w-xl mt-0.5">
                    {task.sourcePath} → {task.targetCloudPath}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right font-mono text-xs mr-2">
                    <div className="text-white font-bold">{task.progressPercent}%</div>
                    <div className="text-[10px] text-[#71717a]">
                      {formatBytes(task.transferredBytes)} / {formatBytes(task.totalBytes)}
                      {task.speedMBs > 0 ? ` • ${task.speedMBs.toFixed(1)} MB/s` : ''}
                    </div>
                  </div>

                  {task.status !== 'completed' ? (
                    <button
                      onClick={() => pauseOrResumeTransfer(task.id)}
                      className="p-2 rounded-lg bg-[#222026] hover:bg-[#2c2933] text-white cursor-pointer"
                      title={task.status === 'paused' ? 'Resume Transfer' : 'Pause Transfer'}
                    >
                      {task.status === 'paused' ? (
                        <Play className="w-3.5 h-3.5 text-[#10b981]" />
                      ) : (
                        <Pause className="w-3.5 h-3.5 text-amber-400" />
                      )}
                    </button>
                  ) : (
                    !task.checksumVerified && (
                      <button
                        onClick={() => verifyFileIntegrity(task.id)}
                        className="px-2.5 py-1 rounded-lg bg-[#222026] hover:bg-[#10b981] text-white hover:text-[#09090b] text-[11px] font-semibold cursor-pointer"
                      >
                        Verify Hash
                      </button>
                    )
                  )}

                  {task.status === 'failed' && (
                    <button
                      onClick={() => retryFailedTransfer(task.id)}
                      className="p-2 rounded-lg bg-rose-500/20 text-rose-300 cursor-pointer"
                      title="Retry Failed Transfer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="w-full h-1.5 rounded-full bg-[#27272a] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    task.status === 'completed' ? 'bg-[#10b981]' : 'bg-[#a855f7]'
                  }`}
                  style={{ width: `${task.progressPercent}%` }}
                />
              </div>

              <div className="text-[10px] font-mono text-[#71717a] truncate">
                CLI: <code className="text-[#a1a1aa]">{task.command}</code>
              </div>
            </div>
          ))}
        </div>
      </FluentCard>

      {/* Transfer Audit Log Stream */}
      <FluentCard interactive={false} accentColor="emerald" className="p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Terminal className="w-4 h-4 text-[#10b981]" />
          rclone Transfer &amp; Verification Log Stream
        </div>
        <div className="p-3 rounded-xl bg-[#09090b] border border-white/10 font-mono text-[11px] space-y-1.5 max-h-52 overflow-y-auto">
          {transferLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-2">
              <span className="text-[#71717a] shrink-0">[{log.timestamp}]</span>
              <span
                className={`px-1.5 rounded text-[10px] font-bold shrink-0 ${
                  log.level === 'VERIFY'
                    ? 'bg-[#10b981]/20 text-[#10b981]'
                    : log.level === 'NOTICE'
                    ? 'bg-[#a855f7]/20 text-purple-300'
                    : 'bg-white/10 text-gray-300'
                }`}
              >
                {log.level}
              </span>
              <span className="text-[#d4d4d8]">{log.message}</span>
            </div>
          ))}
        </div>
      </FluentCard>
    </motion.div>
  );
};
