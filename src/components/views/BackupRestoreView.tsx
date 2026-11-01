import React, { useState } from 'react';
import {
  ArchiveRestore,
  Upload,
  CheckCircle2,
  RefreshCw,
  Terminal,
  Shield,
  FileCheck,
  AlertTriangle,
  Play,
  RotateCcw,
  Clock,
  HardDrive,
} from 'lucide-react';
import { useSystemCommand } from '../../context/SystemCommandContext';
import { formatBytes } from '../../utils/systemIntelligence';

export const BackupRestoreView: React.FC = () => {
  const {
    transfers,
    transferLogs,
    verifyFileIntegrity,
    restoreCloudFile,
    cloudRemoteFiles,
  } = useSystemCommand();

  const [selectedLogFilter, setSelectedLogFilter] = useState<string>('all');
  const [restoreModalItem, setRestoreModalItem] = useState<any | null>(null);
  const [customRestoreDest, setCustomRestoreDest] = useState<string>('C:\\Users\\User\\Restored_Files');

  const filteredLogs = transferLogs.filter((log) => {
    if (selectedLogFilter === 'all') return true;
    return log.level === selectedLogFilter;
  });

  const handleConfirmRestore = () => {
    if (restoreModalItem) {
      restoreCloudFile(restoreModalItem, `${customRestoreDest}\\${restoreModalItem.name}`);
      setRestoreModalItem(null);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <ArchiveRestore className="w-5 h-5 text-emerald-400" />
            rclone Backup Queue & Recovery Workflows
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Safe resumable uploads with checksum verification and recovery pipelines
          </p>
        </div>

        {/* Safety Rule Badge */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-400" />
            rclone copy Enforced (sync & move blocked)
          </span>
        </div>
      </div>

      {/* Active Transfer Queue */}
      <div className="win-card rounded-xl border border-white/10 overflow-hidden bg-[#161a24] space-y-0">
        <div className="p-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
          <span className="text-xs font-semibold text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-blue-400" /> Active & Completed Cloud Transfers
          </span>
          <span className="text-xs text-gray-400 font-mono">
            {transfers.filter((t) => t.status === 'transferring').length} active,{' '}
            {transfers.filter((t) => t.status === 'completed').length} completed
          </span>
        </div>

        <div className="divide-y divide-white/5">
          {transfers.map((task) => {
            const isDone = task.status === 'completed';
            const isTransferring = task.status === 'transferring';
            const isVerifying = task.status === 'verifying';

            return (
              <div key={task.id} className="p-4 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-xs">{task.fileName}</span>
                      <span
                        className={`text-[10px] px-2 py-0.2 rounded font-semibold ${
                          isDone
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : isVerifying
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}
                      >
                        {task.status.toUpperCase()}
                      </span>
                      {task.checksumVerified && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Checksum Verified
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-[10px] text-gray-400 truncate max-w-xl" title={task.command}>
                      {task.command}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs shrink-0">
                    <span className="text-gray-300 font-mono">
                      {formatBytes(task.transferredBytes)} / {formatBytes(task.totalBytes)} ({task.progressPercent}%)
                    </span>
                    {isTransferring && (
                      <span className="text-emerald-400 font-mono font-medium">
                        {task.speedMBs} MB/s (ETA: {task.etaSeconds}s)
                      </span>
                    )}
                    {isDone && !task.checksumVerified && (
                      <button
                        onClick={() => verifyFileIntegrity(task.id)}
                        className="px-2.5 py-1 rounded bg-purple-600/30 hover:bg-purple-600 text-purple-200 text-xs font-medium border border-purple-500/30 transition-colors cursor-pointer"
                      >
                        Verify Checksum
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isDone
                        ? 'bg-emerald-400'
                        : isVerifying
                        ? 'bg-purple-400 animate-pulse'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${task.progressPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-time Transfer Logs & Terminal Stream */}
      <div className="win-card rounded-xl border border-white/10 overflow-hidden bg-[#161a24]">
        <div className="p-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-white">Live rclone Execution Log Stream</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setSelectedLogFilter('all')}
              className={`px-2 py-0.5 rounded font-medium ${
                selectedLogFilter === 'all' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedLogFilter('VERIFY')}
              className={`px-2 py-0.5 rounded font-medium ${
                selectedLogFilter === 'VERIFY' ? 'bg-purple-600/30 text-purple-300' : 'text-gray-400 hover:text-white'
              }`}
            >
              Verifications
            </button>
          </div>
        </div>

        <div className="p-4 font-mono text-[11px] space-y-1.5 bg-black/50 max-h-56 overflow-y-auto">
          {filteredLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-2.5">
              <span className="text-gray-400 shrink-0">{log.timestamp}</span>
              <span
                className={`font-semibold shrink-0 ${
                  log.level === 'VERIFY'
                    ? 'text-purple-400'
                    : log.level === 'ERROR'
                    ? 'text-rose-400'
                    : 'text-emerald-400'
                }`}
              >
                [{log.level}]
              </span>
              <span className="text-gray-300 leading-relaxed">{log.message}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Restore Launcher from Cloud */}
      <div className="p-4 rounded-xl win-card bg-[#161a24] border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-blue-400" /> Quick File Restore from Google Drive
          </span>
          <span className="text-xs text-gray-400">Select any cloud backup to recover</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {cloudRemoteFiles
            .filter((f) => !f.isDir)
            .slice(0, 3)
            .map((item) => (
              <div
                key={item.path}
                className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-white text-xs truncate">{item.name}</div>
                  <div className="text-[10px] text-gray-400 font-mono">{formatBytes(item.sizeBytes)}</div>
                </div>
                <button
                  onClick={() => setRestoreModalItem(item)}
                  className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium shrink-0 cursor-pointer"
                >
                  Restore...
                </button>
              </div>
            ))}
        </div>
      </div>

      {/* Restore Destination Confirmation Modal */}
      {restoreModalItem && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md win-card bg-[#1a1e2a] border border-blue-500/40 rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-blue-400 font-bold text-sm">
              <RotateCcw className="w-5 h-5 text-blue-400" />
              Confirm Safe Cloud File Recovery
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Restore cloud object <strong>{restoreModalItem.name}</strong> ({formatBytes(restoreModalItem.sizeBytes)})
              back to your local drive:
            </p>

            <div className="space-y-1.5 text-xs">
              <label className="text-gray-400 font-medium">Destination Folder:</label>
              <input
                type="text"
                value={customRestoreDest}
                onChange={(e) => setCustomRestoreDest(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 font-mono text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setRestoreModalItem(null)}
                className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-gray-200 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRestore}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg cursor-pointer"
              >
                Execute Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
