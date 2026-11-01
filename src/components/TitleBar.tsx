import React, { useState } from 'react';
import {
  Keyboard,
  Laptop,
  Minus,
  Square,
  X,
  Copy,
  HelpCircle,
} from 'lucide-react';
import { useSystemCommand, ActiveView } from '../context/SystemCommandContext';
import { InstallGuideModal } from './InstallGuideModal';

const VIEW_TITLES: Record<ActiveView, string> = {
  overview: 'Home',
  my_pc: 'My PC',
  running_apps: 'Processes',
  background_processes: 'Background Processes',
  startup_manager: 'Startup Manager',
  services: 'Windows Services',
  resource_monitor: 'Performance Monitor',
  optimize: 'Optimization Center',
  network: 'Network Intelligence',
  storage_analyzer: 'Storage Analyzer',
  google_drive: 'Google Drive (G:)',
  transfers: 'Transfer Queue & Sync',
  file_organizer: 'File Organizer',
  backup_restore: 'Backup & Restore',
  tools: 'System Tools & Diagnostics',
  command_center: 'Local Command Center',
  activity_history: 'Activity History & Audit',
  settings: 'Platform Settings',
  help_docs: 'Help & Documentation',
};

export const TitleBar: React.FC = () => {
  const {
    activeView,
    metrics,
    configuredHotkey,
    setIsQuickOverlayOpen,
    platformSettings,
    updatePlatformSettings,
  } = useSystemCommand();

  const [isMaximized, setIsMaximized] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  return (
    <header className="h-16 w-full bg-[#09090b] border-b border-white/[0.06] flex items-center justify-between px-6 select-none z-40 shrink-0">
      {/* Left: PC Name & Current Page Title (Reference Image Authority) */}
      <div className="flex flex-col">
        <span className="text-[11px] font-medium text-[#71717a] tracking-wide">
          {metrics.deviceName || 'DESKTOP-SCC-W11'}
        </span>
        <h1 className="text-xl font-bold text-[#f4f4f5] tracking-tight leading-tight">
          {VIEW_TITLES[activeView] || 'Home'}
        </h1>
      </div>

      {/* Right: Tooltip Mode Card, Quick Command HUD, Install & User Profile */}
      <div className="flex items-center gap-3.5">
        {/* Tooltip Mode Box from Reference Image */}
        <div className="hidden md:flex items-center gap-4 px-3.5 py-2 rounded-xl bg-[#171619] border border-white/[0.07]">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-[#f4f4f5] flex items-center gap-1.5">
              Tooltip Mode
              {platformSettings.tooltipMode && (
                <HelpCircle className="w-3 h-3 text-emerald-400" />
              )}
            </span>
            <span className="text-[10px] text-[#71717a]">
              Turn it on, if you don&apos;t understand how something works
            </span>
          </div>
          <button
            onClick={() =>
              updatePlatformSettings({ tooltipMode: !platformSettings.tooltipMode })
            }
            role="switch"
            aria-checked={platformSettings.tooltipMode}
            aria-label="Toggle Tooltip Mode"
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
              platformSettings.tooltipMode ? 'bg-[#10b981]' : 'bg-[#27272a]'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                platformSettings.tooltipMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Global Quick Command HUD Trigger (Ctrl + Shift + Space) */}
        <button
          onClick={() => setIsQuickOverlayOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#171619] hover:bg-[#1d1a20] border border-white/[0.08] text-xs text-[#a1a1aa] hover:text-white transition-colors cursor-pointer"
          title="Open Global Quick Command HUD (Ctrl + Shift + Space)"
          aria-label="Open Quick Command Center overlay"
        >
          <Keyboard className="w-3.5 h-3.5 text-[#a855f7]" />
          <span className="hidden xl:inline font-mono text-[11px] text-[#f4f4f5]">
            {configuredHotkey}
          </span>
        </button>

        {/* Install Guide Modal Trigger */}
        <button
          onClick={() => setShowInstallModal(true)}
          className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#171619] hover:bg-[#1d1a20] border border-[#a855f7]/30 text-xs text-[#f4f4f5] transition-colors cursor-pointer"
          title="Windows 11 Installer & Setup Instructions"
          aria-label="Install this application on your laptop"
        >
          <Laptop className="w-3.5 h-3.5 text-[#a855f7]" />
          <span>Release & Setup</span>
        </button>

        {/* User Profile Area from Reference Image */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-white/[0.07]">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#a855f7] via-[#8b5cf6] to-[#10b981] p-[1.5px] shrink-0">
            <div className="w-full h-full rounded-full bg-[#171619] flex items-center justify-center text-xs font-bold text-white">
              VM
            </div>
          </div>
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="text-[10px] text-[#71717a]">vashlimusale@gmail.com</span>
            <span className="text-xs font-semibold text-[#f4f4f5]">System Admin</span>
          </div>
        </div>

        {/* Native Window Controls */}
        <div className="hidden xl:flex items-center ml-1 border-l border-white/[0.06] pl-2">
          <button
            onClick={() => {}}
            className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-[#a1a1aa] hover:text-white transition-colors cursor-pointer"
            title="Minimize"
            aria-label="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-[#a1a1aa] hover:text-white transition-colors cursor-pointer"
            title={isMaximized ? 'Restore Down' : 'Maximize'}
            aria-label={isMaximized ? 'Restore Down' : 'Maximize'}
          >
            {isMaximized ? <Copy className="w-3 h-3" /> : <Square className="w-3 h-3" />}
          </button>
          <button
            onClick={() => {}}
            className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-red-600/80 text-[#a1a1aa] hover:text-white transition-colors cursor-pointer"
            title="Close"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <InstallGuideModal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} />
    </header>
  );
};
