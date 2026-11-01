import React, { useState } from 'react';
import {
  HardDrive,
  RefreshCw,
  FileCheck,
  Files,
  Trash2,
  AlertTriangle,
  Folder,
  FileText,
  Upload,
  Search,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { useSystemCommand } from '../../context/SystemCommandContext';
import { detectDuplicateGroups } from '../../utils/storageIntelligence';
import { formatBytes } from '../../utils/systemIntelligence';
import { ScannedFile } from '../../types/storage';

export const StorageAnalyzerView: React.FC = () => {
  const {
    scannedFiles,
    scanSummary,
    runStorageScan,
    isScanning,
    deleteConfirmedDuplicate,
    startBatchRcloneUpload,
    restoreCloudFile,
  } = useSystemCommand();

  const [activeTab, setActiveTab] = useState<'all' | 'important' | 'duplicates' | 'missing'>('all');
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const duplicateGroups = detectDuplicateGroups(scannedFiles);

  const displayedFiles = scannedFiles.filter((f) => {
    if (activeTab === 'important') return f.isImportant;
    if (activeTab === 'missing') return f.cloudSyncStatus === 'missing_or_deleted';
    if (activeTab === 'duplicates') return f.duplicateGroupId !== undefined;
    return true;
  });

  const toggleSelectFile = (id: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    if (selectedFileIds.length === displayedFiles.length) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(displayedFiles.map((f) => f.id));
    }
  };

  const handleBatchUpload = () => {
    if (selectedFileIds.length === 0) return;
    startBatchRcloneUpload(selectedFileIds);
    setSelectedFileIds([]);
  };

  const confirmDeleteFile = scannedFiles.find((f) => f.id === confirmDeleteId);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-amber-400" />
            Storage Intelligence & Local Disk Analyzer
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Identify important documents, detect duplicate sets, and discover missing/deleted files
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => runStorageScan()}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Scanning Drives...' : 'Re-scan Local Storage'}
          </button>
        </div>
      </div>

      {/* Top 4 Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-xl win-card bg-[#161a24] border border-white/10">
          <div className="text-xs text-gray-400 flex items-center gap-1.5">
            <Folder className="w-3.5 h-3.5 text-blue-400" /> Total User Files
          </div>
          <div className="text-2xl font-bold text-white mt-1">{scanSummary.totalScannedFiles}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">{formatBytes(scanSummary.totalSizeBytes)} on disk</div>
        </div>

        <div className="p-3.5 rounded-xl win-card bg-[#161a24] border border-white/10">
          <div className="text-xs text-gray-400 flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-emerald-400" /> Important Assets
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{scanSummary.importantFilesCount}</div>
          <div className="text-[11px] text-emerald-300/70">{formatBytes(scanSummary.importantSizeBytes)} critical files</div>
        </div>

        <div className="p-3.5 rounded-xl win-card bg-[#161a24] border border-white/10">
          <div className="text-xs text-gray-400 flex items-center gap-1.5">
            <Files className="w-3.5 h-3.5 text-indigo-400" /> Duplicate File Sets
          </div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">{scanSummary.duplicateGroupsCount} Sets</div>
          <div className="text-[11px] text-indigo-300/70">{formatBytes(scanSummary.potentialWastedBytes)} wasted space</div>
        </div>

        <div className="p-3.5 rounded-xl win-card bg-[#161a24] border border-white/10">
          <div className="text-xs text-gray-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Missing / Deleted
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{scanSummary.missingDeletedCount} Files</div>
          <div className="text-[11px] text-amber-300/70">Recoverable from Cloud</div>
        </div>
      </div>

      {/* Tabs & Batch Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/5 p-2 rounded-xl border border-white/10">
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === 'all' ? 'bg-blue-600 text-white shadow' : 'text-gray-300 hover:text-white'
            }`}
          >
            All Files ({scannedFiles.length})
          </button>
          <button
            onClick={() => setActiveTab('important')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === 'important' ? 'bg-blue-600 text-white shadow' : 'text-gray-300 hover:text-white'
            }`}
          >
            Important Files ({scanSummary.importantFilesCount})
          </button>
          <button
            onClick={() => setActiveTab('duplicates')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === 'duplicates' ? 'bg-blue-600 text-white shadow' : 'text-gray-300 hover:text-white'
            }`}
          >
            Duplicates ({duplicateGroups.length} sets)
          </button>
          <button
            onClick={() => setActiveTab('missing')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === 'missing' ? 'bg-blue-600 text-white shadow' : 'text-gray-300 hover:text-white'
            }`}
          >
            Missing/Deleted ({scanSummary.missingDeletedCount})
          </button>
        </div>

        {/* Batch action buttons */}
        <div className="flex items-center gap-2">
          {selectedFileIds.length > 0 && (
            <button
              onClick={handleBatchUpload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload {selectedFileIds.length} Selected (rclone copy)
            </button>
          )}
          <button
            onClick={selectAllFiltered}
            className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-gray-200 text-xs font-medium cursor-pointer"
          >
            {selectedFileIds.length === displayedFiles.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      </div>

      {/* Duplicate File Sets Breakdown (when in Duplicates view) */}
      {activeTab === 'duplicates' && (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-indigo-300 flex items-center gap-2">
            <Files className="w-4 h-4" />
            Duplicate Sets by SHA256 Content Hash
          </div>
          {duplicateGroups.map((group, idx) => (
            <div
              key={group.hash}
              className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-gray-400 text-[11px] truncate max-w-md">
                  SHA256: {group.hash.substring(0, 24)}...
                </span>
                <span className="text-indigo-300 font-semibold text-xs">
                  {group.fileCount} Copies • Wasted: {formatBytes(group.wastedBytes)}
                </span>
              </div>

              <div className="space-y-1.5 divide-y divide-white/5">
                {group.files.map((f, fIdx) => (
                  <div
                    key={f.id}
                    className="pt-1.5 flex items-center justify-between text-xs text-gray-300"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-white/10 text-gray-300">
                        {fIdx === 0 ? 'Master' : 'Duplicate'}
                      </span>
                      <span className="font-semibold text-white truncate">{f.name}</span>
                      <span className="text-[11px] text-gray-400 truncate max-w-sm" title={f.path}>
                        {f.path}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-[11px] text-gray-400">
                        {formatBytes(f.sizeBytes)}
                      </span>
                      {fIdx > 0 && (
                        <button
                          onClick={() => setConfirmDeleteId(f.id)}
                          className="px-2 py-1 rounded bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white text-[10px] font-medium transition-colors cursor-pointer"
                        >
                          Delete Copy
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Files Table */}
      <div className="win-card rounded-xl border border-white/10 overflow-hidden bg-[#161a24]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="text-[11px] uppercase tracking-wider text-gray-400 border-b border-white/10 bg-white/[0.03]">
              <tr>
                <th className="py-3 px-3 w-8">Select</th>
                <th className="py-3 px-3">File Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Local Storage Path</th>
                <th className="py-3 px-3 text-right">Size</th>
                <th className="py-3 px-3 text-center">Cloud Sync State</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-normal">
              {displayedFiles.map((file) => {
                const isSelected = selectedFileIds.includes(file.id);
                const isMissing = file.cloudSyncStatus === 'missing_or_deleted';
                const isSynced = file.cloudSyncStatus === 'synced';

                return (
                  <tr
                    key={file.id}
                    className={`hover:bg-white/5 transition-colors ${
                      isSelected ? 'bg-blue-600/10' : ''
                    }`}
                  >
                    <td className="py-3 px-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectFile(file.id)}
                        className="rounded bg-white/10 border-white/20 text-blue-600 focus:ring-0 cursor-pointer"
                        aria-label={`Select ${file.name}`}
                      />
                    </td>

                    <td className="py-3 px-3 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="truncate max-w-[200px]" title={file.name}>
                          {file.name}
                        </span>
                        {file.isImportant && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold uppercase">
                            Important
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-gray-300">
                      <span className="px-2 py-0.5 rounded bg-white/5 text-[11px]">
                        {file.category}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px] text-gray-400 truncate max-w-xs" title={file.path}>
                      {file.path}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-white">
                      {formatBytes(file.sizeBytes)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {isSynced ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Synced
                        </span>
                      ) : isMissing ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 font-semibold">
                          <AlertTriangle className="w-3 h-3 text-rose-400" /> Missing/Deleted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold">
                          Pending Backup
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {isMissing ? (
                        <button
                          onClick={() => restoreCloudFile(file)}
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Restore File
                        </button>
                      ) : !isSynced ? (
                        <button
                          onClick={() => startBatchRcloneUpload([file.id])}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          rclone copy
                        </button>
                      ) : (
                        <span className="text-[11px] text-gray-500 font-mono">Protected</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Duplicate Deletion */}
      {confirmDeleteId !== null && confirmDeleteFile && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md win-card bg-[#1a1e2a] border border-red-500/40 rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-red-400 font-bold text-sm">
              <Trash2 className="w-5 h-5 text-red-400" />
              Confirm Safe Duplicate Removal
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to delete this duplicate copy:
              <br />
              <strong className="text-white block mt-1">{confirmDeleteFile.path}</strong>
            </p>
            <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-xs text-gray-300 space-y-1">
              <div>Rule: <strong>Never delete local files without explicit confirmation.</strong></div>
              <div>Freed Space: <strong className="text-emerald-400">{formatBytes(confirmDeleteFile.sizeBytes)}</strong></div>
              <div className="text-[11px] text-gray-400">
                The primary master copy and SHA256 checksum have been validated intact.
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-gray-200 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteConfirmedDuplicate(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg cursor-pointer"
              >
                Yes, Delete Duplicate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
