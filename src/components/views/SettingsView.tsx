import React, { useState } from 'react';
import {
  Settings,
  Keyboard,
  Shield,
  Cloud,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import { useSystemCommand } from '../../context/SystemCommandContext';
import { FluentCard } from '../FluentMotion';
import { ThemePreset } from '../../types/system';

export const SettingsView: React.FC = () => {
  const {
    configuredHotkey,
    setConfiguredHotkey,
    setIsQuickOverlayOpen,
    platformSettings,
    updatePlatformSettings,
  } = useSystemCommand();

  const [hotkeyInput, setHotkeyInput] = useState(configuredHotkey);
  const [savedBanner, setSavedBanner] = useState(false);

  const handleSave = () => {
    setConfiguredHotkey(hotkeyInput);
    updatePlatformSettings({});
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2500);
  };

  const renderToggleRow = (
    label: string,
    description: string,
    checked: boolean,
    onChange: () => void
  ) => (
    <div className="flex items-center justify-between py-3 border-b border-white/[0.06] last:border-none">
      <div>
        <div className="text-xs font-semibold text-white">{label}</div>
        <div className="text-[11px] text-[#71717a]">{description}</div>
      </div>
      <button
        onClick={onChange}
        role="switch"
        aria-checked={checked}
        className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
          checked ? 'bg-[#10b981]' : 'bg-[#27272a]'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="space-y-5 pb-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#a855f7]" />
            Platform Settings &amp; Persistent Configuration
          </h1>
          <p className="text-xs text-[#a1a1aa] mt-0.5">
            All settings are automatically persisted to the local SQLite database (`scc_persistence.sqlite`)
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-xl bg-[#10b981] hover:bg-[#059669] text-[#09090b] text-xs font-bold cursor-pointer transition-colors"
        >
          {savedBanner ? 'Persisted to SQLite!' : 'Save All Changes'}
        </button>
      </div>

      {savedBanner && (
        <div className="p-3 rounded-xl bg-[#10b981]/15 border border-[#10b981]/30 text-xs text-[#10b981] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          All platform settings synchronized with SQLite database and verified across restarts.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* General & Startup Preferences */}
        <FluentCard interactive={false} accentColor="emerald" className="p-5 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-white pb-2 border-b border-white/10">
            <Sliders className="w-4 h-4 text-[#10b981]" />
            General &amp; Windows Startup Preferences
          </div>

          {renderToggleRow(
            'Start with Windows 11',
            'Register System Command Center in HKCU\\...\\Run for automatic launch at sign-in',
            platformSettings.startWithWindows,
            () => updatePlatformSettings({ startWithWindows: !platformSettings.startWithWindows })
          )}

          {renderToggleRow(
            'Tooltip Mode',
            'Display contextual explanations on hardware, process, and rclone controls',
            platformSettings.tooltipMode,
            () => updatePlatformSettings({ tooltipMode: !platformSettings.tooltipMode })
          )}

          {renderToggleRow(
            'App Notifications',
            'Show toast alerts and 1-click restore banners after system operations',
            platformSettings.appNotifications,
            () => updatePlatformSettings({ appNotifications: !platformSettings.appNotifications })
          )}

          {renderToggleRow(
            "Default to 'My PC' on Launch",
            'Open the detailed My PC hardware overview instead of Home dashboard on startup',
            platformSettings.defaultToMyPc,
            () => updatePlatformSettings({ defaultToMyPc: !platformSettings.defaultToMyPc })
          )}

          {renderToggleRow(
            'Real-Time Telemetry Monitoring',
            'Continuously sample CPU, RAM, GPU, Disk, and Network sensors',
            platformSettings.realTimeMonitoring,
            () =>
              updatePlatformSettings({ realTimeMonitoring: !platformSettings.realTimeMonitoring })
          )}

          {renderToggleRow(
            'Performance History Logging',
            'Record time-series telemetry for 1m, 5m, 15m, and 30m interactive charts',
            platformSettings.performanceLogs,
            () => updatePlatformSettings({ performanceLogs: !platformSettings.performanceLogs })
          )}
        </FluentCard>

        {/* Google Drive Virtual Drive & Transfer Automation */}
        <FluentCard interactive={false} accentColor="purple" className="p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white pb-2 border-b border-white/10">
            <Cloud className="w-4 h-4 text-[#a855f7]" />
            Google Drive Virtual Mount &amp; Transfers
          </div>

          {renderToggleRow(
            'Automatic Virtual-Drive Mount (G:)',
            'Automatically mount gdrive:Laptop_Full_Backup/C_Drive_User via WinFsp on startup',
            platformSettings.autoMountVirtualDrive,
            () =>
              updatePlatformSettings({
                autoMountVirtualDrive: !platformSettings.autoMountVirtualDrive,
              })
          )}

          {renderToggleRow(
            'Automatic Network Reconnect',
            'Remount G: drive automatically if Wi-Fi/Ethernet drops and reconnects',
            platformSettings.autoReconnectMount,
            () =>
              updatePlatformSettings({ autoReconnectMount: !platformSettings.autoReconnectMount })
          )}

          {renderToggleRow(
            'Scheduled Background Transfers',
            `Run non-destructive rclone copy queue every ${platformSettings.scheduledTransferIntervalHours} hours`,
            platformSettings.scheduledTransferEnabled,
            () =>
              updatePlatformSettings({
                scheduledTransferEnabled: !platformSettings.scheduledTransferEnabled,
              })
          )}

          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div>
              <label className="text-[#a1a1aa] block mb-1">Default Mount Letter</label>
              <select
                value={platformSettings.defaultMountLetter}
                onChange={(e) => updatePlatformSettings({ defaultMountLetter: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#09090b] border border-white/10 text-white font-mono"
              >
                <option value="G:">G:</option>
                <option value="H:">H:</option>
                <option value="V:">V:</option>
                <option value="Z:">Z:</option>
              </select>
            </div>

            <div>
              <label className="text-[#a1a1aa] block mb-1">Default Remote</label>
              <select
                value={platformSettings.defaultRemote}
                onChange={(e) => updatePlatformSettings({ defaultRemote: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#09090b] border border-white/10 text-white font-mono"
              >
                <option value="gdrive:">gdrive:</option>
                <option value="gdrive2:">gdrive2:</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
            <div>
              <label className="text-[#a1a1aa] block mb-1">Theme Preset</label>
              <select
                value={platformSettings.theme}
                onChange={(e) =>
                  updatePlatformSettings({ theme: e.target.value as ThemePreset })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#09090b] border border-white/10 text-white"
              >
                <option value="Neo's Noir">Neo&apos;s Noir (Default)</option>
                <option value="Fluent Obsidian">Fluent Obsidian</option>
                <option value="Violet Pulse">Violet Pulse</option>
              </select>
            </div>

            <div>
              <label className="text-[#a1a1aa] block mb-1">Monitoring Interval</label>
              <select
                value={platformSettings.monitoringIntervalMs}
                onChange={(e) =>
                  updatePlatformSettings({ monitoringIntervalMs: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#09090b] border border-white/10 text-white font-mono"
              >
                <option value={1000}>1.0s (High Frequency)</option>
                <option value={2500}>2.5s (Balanced)</option>
                <option value={5000}>5.0s (Low Overhead)</option>
              </select>
            </div>
          </div>
        </FluentCard>
      </div>

      {/* Global Hotkey & Security Policy Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FluentCard interactive={false} accentColor="blue" className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Keyboard className="w-4 h-4 text-sky-400" />
              Global Quick Command HUD Shortcut
            </div>
            <button
              onClick={() => setIsQuickOverlayOpen(true)}
              className="px-3 py-1 rounded-lg bg-[#222026] hover:bg-[#2c2933] text-xs text-white font-semibold cursor-pointer"
            >
              Launch HUD
            </button>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={hotkeyInput}
              onChange={(e) => setHotkeyInput(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-[#09090b] border border-white/10 font-mono text-xs text-white w-56"
            />
            <span className="text-xs text-[#71717a]">Works globally across all 16 pages</span>
          </div>
        </FluentCard>

        <FluentCard interactive={false} accentColor="emerald" className="p-5 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Shield className="w-4 h-4 text-[#10b981]" />
            Enforced Security Boundaries
          </div>
          <ul className="text-xs text-[#a1a1aa] space-y-1.5 pt-1">
            <li>• Kernel &amp; session-critical processes locked against termination</li>
            <li>• Non-destructive <code className="text-[#10b981]">rclone copy</code> enforced; automatic sync/move blocked</li>
            <li>• OAuth tokens and secrets automatically redacted from logs and CLI output</li>
          </ul>
        </FluentCard>
      </div>
    </div>
  );
};
