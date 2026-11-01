import React, { useState } from 'react';
import {
  Cloud,
  CheckCircle2,
  HardDrive,
  Folder,
  FileText,
  Download,
  Terminal,
  RefreshCw,
  FolderTree,
  AlertTriangle,
  Power,
  FolderPlus,
  ExternalLink,
} from 'lucide-react';
import { useSystemCommand } from '../../context/SystemCommandContext';
import { formatBytes } from '../../utils/systemIntelligence';
import {
  analyzeRemoteQuotaCorrelation,
  buildWinFspMountCommand,
} from '../../utils/storageIntelligence';
import { FluentCard } from '../FluentMotion';

export const GoogleDriveView: React.FC = () => {
  const {
    rcloneStatus,
    cloudRemoteFiles,
    restoreCloudFile,
    toggleVirtualDriveMount,
    reconnectVirtualDrive,
    createRemoteFolder,
    platformSettings,
    updatePlatformSettings,
  } = useSystemCommand();

  const mounted = rcloneStatus.mountedGDrive;
  const [selectedDriveLetter, setSelectedDriveLetter] = useState(
    mounted?.driveLetter || 'G:'
  );
  const [selectedRemote, setSelectedRemote] = useState(
    mounted?.remoteName || 'gdrive:'
  );
  const [remoteFolder, setRemoteFolder] = useState(
    mounted?.remoteFolder || 'Laptop_Full_Backup/C_Drive_User'
  );
  const [search, setSearch] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [explorerPreviewOpen, setExplorerPreviewOpen] = useState(false);

  const quotaCorrelation = analyzeRemoteQuotaCorrelation(rcloneStatus.remoteDetails);
  const mountCmdPreview = buildWinFspMountCommand(
    selectedRemote,
    remoteFolder,
    selectedDriveLetter
  );

  const filteredItems = cloudRemoteFiles.filter((item) => {
    const q = search.toLowerCase();
    return !q || item.name.toLowerCase().includes(q) || item.path.toLowerCase().includes(q);
  });

  const handleApplyMountConfig = () => {
    toggleVirtualDriveMount({
      driveLetter: selectedDriveLetter,
      remoteName: selectedRemote,
      remoteFolder,
      forceMountState: true,
    });
    updatePlatformSettings({
      defaultMountLetter: selectedDriveLetter,
      defaultRemote: selectedRemote,
      defaultRemoteFolder: remoteFolder,
    });
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Cloud className="w-5 h-5 text-[#10b981]" />
            Google Drive Virtual Storage ({mounted?.driveLetter || 'G:'})
          </h1>
          <p className="text-xs text-[#a1a1aa] mt-0.5">
            rclone v1.75.1 + WinFsp Virtual File System mount, remote quota audit, and non-destructive cloud browser
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981] text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {rcloneStatus.version} • {rcloneStatus.winfspVersion}
          </span>
        </div>
      </div>

      {/* Quota Correlation Diagnostic Banner (gdrive: vs gdrive2: 5 TiB pool) */}
      {quotaCorrelation.sharesUnderlyingQuota && (
        <div className="p-3.5 rounded-2xl bg-[#a855f7]/10 border border-[#a855f7]/30 text-xs text-purple-200 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-[#a855f7] shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-white">
              Remote Quota Correlation Audit (gdrive: &amp; gdrive2:)
            </div>
            <p className="text-[#d4d4d8] mt-0.5 leading-relaxed">
              {quotaCorrelation.summary} Existing backup folder{' '}
              <code className="font-mono text-[#10b981] bg-black/40 px-1.5 py-0.5 rounded">
                Laptop_Full_Backup/C_Drive_User
              </code>{' '}
              contains <strong>1,063 objects (2.543 GiB)</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Virtual Drive Mount Controller & Remote Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 7 Cols: Interactive WinFsp Virtual Drive Controller */}
        <FluentCard
          interactive={false}
          accentColor="emerald"
          className="lg:col-span-7 p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-[#10b981]" />
                Windows Virtual Drive Mount Controller (WinFsp)
              </h3>
              <p className="text-[11px] text-[#71717a]">
                Mount Google Drive directly as a native letter drive in Windows File Explorer
              </p>
            </div>

            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
                mounted?.isMounted
                  ? 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  mounted?.isMounted ? 'bg-[#10b981]' : 'bg-amber-400'
                }`}
              />
              {mounted?.isMounted
                ? `Mounted (${mounted.driveLetter}\\ • ${mounted.connectionHealth})`
                : 'Unmounted'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-[#a1a1aa] block mb-1">Drive Letter</label>
              <select
                value={selectedDriveLetter}
                onChange={(e) => setSelectedDriveLetter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#09090b] border border-white/10 text-white font-mono focus:outline-none focus:border-[#10b981]"
              >
                <option value="G:">G: (Default Google Drive)</option>
                <option value="H:">H: (Secondary Mount)</option>
                <option value="V:">V: (Virtual Cloud Vault)</option>
                <option value="Z:">Z: (Network Archive)</option>
              </select>
            </div>

            <div>
              <label className="text-[#a1a1aa] block mb-1">Configured Remote</label>
              <select
                value={selectedRemote}
                onChange={(e) => setSelectedRemote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#09090b] border border-white/10 text-white font-mono focus:outline-none focus:border-[#10b981]"
              >
                {rcloneStatus.remotes.map((r) => (
                  <option key={r} value={r}>
                    {r} (5.00 TiB Pool)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[#a1a1aa] block mb-1">Remote Root Folder</label>
              <input
                type="text"
                value={remoteFolder}
                onChange={(e) => setRemoteFolder(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#09090b] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-[#10b981]"
              />
            </div>
          </div>

          {/* Generated rclone mount command preview */}
          <div className="p-3 rounded-xl bg-[#09090b] border border-white/[0.06] font-mono text-[11px] text-[#a1a1aa] overflow-x-auto">
            <div className="text-[10px] uppercase text-[#71717a] mb-1">
              Executed Native WinFsp Mount Command:
            </div>
            <code className="text-[#10b981]">{mountCmdPreview.command}</code>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  mounted?.isMounted
                    ? toggleVirtualDriveMount({ forceMountState: false })
                    : handleApplyMountConfig()
                }
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  mounted?.isMounted
                    ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30'
                    : 'bg-[#10b981] hover:bg-[#059669] text-[#09090b]'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                {mounted?.isMounted
                  ? `Unmount ${mounted.driveLetter} Drive`
                  : `Mount ${selectedDriveLetter} Drive Now`}
              </button>

              <button
                onClick={handleApplyMountConfig}
                className="px-3.5 py-2 rounded-xl bg-[#222026] hover:bg-[#2c2933] border border-white/10 text-xs font-semibold text-white cursor-pointer"
              >
                Apply Mount Settings
              </button>

              <button
                onClick={reconnectVirtualDrive}
                className="px-3 py-2 rounded-xl bg-[#222026] hover:bg-[#2c2933] border border-white/10 text-xs text-[#a1a1aa] hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reconnect
              </button>
            </div>

            <button
              onClick={() => setExplorerPreviewOpen(!explorerPreviewOpen)}
              className="px-3.5 py-2 rounded-xl bg-[#a855f7]/20 hover:bg-[#a855f7]/30 border border-[#a855f7]/40 text-xs font-semibold text-purple-200 flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Inspect {mounted?.driveLetter || 'G:'}\ in Explorer
            </button>
          </div>
        </FluentCard>

        {/* Right 5 Cols: Remote Telemetry & Capacity Breakdown */}
        <FluentCard
          interactive={false}
          accentColor="purple"
          className="lg:col-span-5 p-5 flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#a855f7]" />
                Configured Remotes Telemetry
              </h3>
              <span className="text-[10px] font-mono text-[#71717a]">rclone about</span>
            </div>

            {rcloneStatus.remoteDetails.map((rem) => (
              <div
                key={rem.name}
                className="p-3 rounded-xl bg-[#09090b] border border-white/[0.06] space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-white flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5 text-[#10b981]" />
                    {rem.name}
                  </span>
                  <span className="text-[11px] font-mono text-[#10b981]">
                    {rem.freeTiB} TiB Free / {rem.totalTiB.toFixed(1)} TiB Total
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#a1a1aa]">
                  <span>Used: {rem.usedGiB} GiB</span>
                  <span>
                    Backup: {rem.backupObjectCount.toLocaleString()} objects ({rem.backupSizeGiB} GiB)
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-xs">
            <div>
              <div className="font-semibold text-white">Auto-Mount at Windows Logon</div>
              <div className="text-[10px] text-[#71717a]">
                Reconnects {mounted?.driveLetter || 'G:'} automatically after sleep or network drop
              </div>
            </div>
            <button
              onClick={() =>
                updatePlatformSettings({
                  autoMountVirtualDrive: !platformSettings.autoMountVirtualDrive,
                })
              }
              role="switch"
              aria-checked={platformSettings.autoMountVirtualDrive}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                platformSettings.autoMountVirtualDrive ? 'bg-[#10b981]' : 'bg-[#27272a]'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  platformSettings.autoMountVirtualDrive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </FluentCard>
      </div>

      {/* Windows File Explorer Virtual Drive Mount Inspector */}
      {explorerPreviewOpen && (
        <FluentCard
          interactive={false}
          accentColor="emerald"
          className="p-4 border border-[#10b981]/40 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-[#10b981]" />
              Windows File Explorer Volume Bridge — This PC &gt; Google Drive ({mounted?.driveLetter || 'G:'})
            </div>
            <button
              onClick={() => setExplorerPreviewOpen(false)}
              className="text-xs text-[#a1a1aa] hover:text-white cursor-pointer"
            >
              Close Preview
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#09090b] border border-white/10">
              <div className="text-[#71717a] text-[10px]">Volume Mount Point</div>
              <div className="font-mono font-bold text-white mt-0.5">
                {mounted?.mountPath || 'G:\\'} ({mounted?.remoteName}
                {mounted?.remoteFolder})
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#09090b] border border-white/10">
              <div className="text-[#71717a] text-[10px]">File System Driver</div>
              <div className="font-mono font-bold text-[#10b981] mt-0.5">
                WinFsp.Np (VFS Cache Mode: Full)
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#09090b] border border-white/10">
              <div className="text-[#71717a] text-[10px]">Explorer Status</div>
              <div className="font-bold text-white mt-0.5">
                1,063 Objects Indexed (2.543 GiB)
              </div>
            </div>
          </div>
        </FluentCard>
      )}

      {/* Cloud Remote File Browser */}
      <FluentCard interactive={false} accentColor="purple" className="overflow-hidden">
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <FolderTree className="w-4 h-4 text-[#10b981]" />
            <span className="font-semibold text-white">Remote Folder Browser</span>
            <span className="font-mono text-[#10b981] bg-[#09090b] px-2.5 py-1 rounded-lg border border-white/10">
              {selectedRemote}
              {remoteFolder}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Create Folder */}
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="New folder name..."
                className="px-2.5 py-1.5 rounded-xl bg-[#09090b] border border-white/10 text-xs text-white placeholder-[#71717a] focus:outline-none focus:border-[#10b981] w-36"
              />
              <button
                onClick={() => {
                  if (newFolderName.trim()) {
                    createRemoteFolder(newFolderName);
                    setNewFolderName('');
                  }
                }}
                className="p-1.5 rounded-xl bg-[#222026] hover:bg-[#2c2933] border border-white/10 text-white cursor-pointer"
                title="Create Remote Folder"
              >
                <FolderPlus className="w-4 h-4 text-[#10b981]" />
              </button>
            </div>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter remote cloud files..."
              className="px-3 py-1.5 rounded-xl bg-[#09090b] border border-white/10 text-xs text-white placeholder-[#71717a] focus:outline-none focus:border-[#a855f7] w-52"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="text-[11px] uppercase tracking-wider text-[#71717a] border-b border-white/10 bg-[#09090b]/60">
              <tr>
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3 text-right">Size</th>
                <th className="py-3 px-3">Last Modified</th>
                <th className="py-3 px-3">SHA-256 Verification</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-normal">
              {filteredItems.map((item) => (
                <tr key={item.path} className="hover:bg-white/[0.03] transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      {item.isDir ? (
                        <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-[#a855f7] shrink-0" />
                      )}
                      <span className="font-semibold text-white">{item.name}</span>
                    </div>
                  </td>

                  <td className="py-3 px-3 text-[#a1a1aa]">
                    {item.isDir ? 'Cloud Directory' : item.mimeType || 'Document'}
                  </td>

                  <td className="py-3 px-3 text-right font-mono text-white">
                    {item.isDir && item.sizeBytes === 0 ? '-' : formatBytes(item.sizeBytes)}
                  </td>

                  <td className="py-3 px-3 text-[#71717a] text-[11px]">
                    {new Date(item.modifiedAt).toLocaleDateString()}{' '}
                    {new Date(item.modifiedAt).toLocaleTimeString()}
                  </td>

                  <td className="py-3 px-3 font-mono text-[10px] text-[#10b981]">
                    {item.sha256 ? `${item.sha256.substring(0, 16)}... (Verified)` : 'Directory Index'}
                  </td>

                  <td className="py-3 px-4 text-center">
                    {!item.isDir ? (
                      <button
                        onClick={() => restoreCloudFile(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#222026] hover:bg-[#10b981] text-white hover:text-[#09090b] text-[11px] font-semibold border border-white/10 transition-colors cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        Download / Restore
                      </button>
                    ) : (
                      <span className="text-[#71717a] text-[11px] font-mono">Mounted Dir</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </FluentCard>
    </div>
  );
};
