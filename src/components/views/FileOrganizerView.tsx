import React, { useState } from 'react';
import {
  FolderTree,
  Folder,
  ArrowRight,
  FileCheck,
  CheckCircle2,
  Sparkles,
  Upload,
} from 'lucide-react';
import { useSystemCommand } from '../../context/SystemCommandContext';
import { generateCloudOrganizedPath } from '../../utils/storageIntelligence';
import { formatBytes } from '../../utils/systemIntelligence';

export const FileOrganizerView: React.FC = () => {
  const { scannedFiles, startBatchRcloneUpload } = useSystemCommand();
  const [targetBaseFolder, setTargetBaseFolder] = useState('SystemCommandCenter_Backup');

  const pendingFiles = scannedFiles.filter((f) => f.cloudSyncStatus !== 'synced');

  const categories = ['Documents', 'Images', 'Development', 'Database', 'Archives'] as const;

  const handleOrganizeAndUploadAll = () => {
    const ids = pendingFiles.map((f) => f.id);
    startBatchRcloneUpload(ids);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-indigo-400" />
            Cloud Storage Structure & File Organizer
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Organize disordered local directories into standardized cloud folder structures
          </p>
        </div>

        {pendingFiles.length > 0 && (
          <button
            onClick={handleOrganizeAndUploadAll}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            Organize & Sync ({pendingFiles.length} files)
          </button>
        )}
      </div>

      {/* Target Cloud Hierarchy Specification */}
      <div className="p-4 rounded-xl win-card bg-[#161a24] border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white flex items-center gap-2">
            <Folder className="w-4 h-4 text-blue-400" /> Target Google Drive Root Hierarchy
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Cloud Prefix:</span>
            <input
              type="text"
              value={targetBaseFolder}
              onChange={(e) => setTargetBaseFolder(e.target.value)}
              className="px-2.5 py-1 rounded bg-white/5 border border-white/10 font-mono text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Tree display */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2">
          {categories.map((cat) => {
            const count = scannedFiles.filter((f) => f.category === cat).length;
            return (
              <div
                key={cat}
                className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1"
              >
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5 text-indigo-400" /> {cat}/
                </div>
                <div className="text-[11px] text-gray-400 font-mono truncate">
                  gdrive:{targetBaseFolder}/{cat}
                </div>
                <div className="text-[10px] text-indigo-300 font-medium">
                  {count} files mapped
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mapping Preview Table */}
      <div className="win-card rounded-xl border border-white/10 overflow-hidden bg-[#161a24]">
        <div className="p-3 border-b border-white/10 bg-white/[0.02] flex items-center justify-between text-xs text-gray-400">
          <span>Source Local Path ➔ Organized Cloud Destination</span>
          <span>{scannedFiles.length} Total Files Mapped</span>
        </div>

        <div className="divide-y divide-white/5">
          {scannedFiles.map((file) => {
            const targetCloudPath = generateCloudOrganizedPath('gdrive:', targetBaseFolder, file);
            return (
              <div
                key={file.id}
                className="p-3.5 hover:bg-white/[0.02] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <span>{file.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-gray-300">
                      {file.category}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-gray-400 truncate" title={file.path}>
                    {file.path}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <ArrowRight className="w-4 h-4 text-indigo-400" />
                  <div className="font-mono text-[11px] text-emerald-300 bg-white/5 px-2.5 py-1 rounded max-w-xs truncate" title={targetCloudPath}>
                    {targetCloudPath}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
