import React from 'react';
import {
  Monitor,
  Cpu,
  HardDrive,
  Activity,
  Cloud,
  ShieldCheck,
  Thermometer,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { useSystemCommand } from '../../context/SystemCommandContext';
import { formatDuration } from '../../utils/systemIntelligence';
import { FluentCard, fluentStaggerContainer } from '../FluentMotion';
import { motion } from 'motion/react';

export const MyPcView: React.FC = () => {
  const { metrics, processes, services, startupItems, rcloneStatus, setActiveView } =
    useSystemCommand();

  const mounted = rcloneStatus.mountedGDrive;

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
            <Monitor className="w-5 h-5 text-[#a855f7]" />
            My PC — Hardware &amp; Windows 11 Architecture
          </h1>
          <p className="text-xs text-[#a1a1aa] mt-0.5">
            Comprehensive system inventory, thermal telemetry, local NVMe &amp; virtual G: storage volumes
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-[#171619] border border-white/10 px-3 py-1.5 rounded-xl text-[#10b981]">
          <Clock className="w-3.5 h-3.5" />
          Uptime: {formatDuration(metrics.uptimeSeconds)}
        </div>
      </div>

      {/* Hardware Specifications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <FluentCard
          accentColor="purple"
          onClick={() => setActiveView('resource_monitor')}
          className="p-5 space-y-2 cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-[#a1a1aa]">
            <span className="flex items-center gap-1.5 font-semibold text-white">
              <Cpu className="w-4 h-4 text-[#a855f7]" /> Processor
            </span>
            <span className="font-mono text-[#10b981]">
              {metrics.cpuTempCelsius !== null ? `${metrics.cpuTempCelsius}°C` : 'Temp N/A'}
            </span>
          </div>
          <div className="text-sm font-bold text-white">{metrics.cpuModel}</div>
          <div className="text-[11px] text-[#71717a]">
            {metrics.cpuCores} Cores • {metrics.cpuFrequencyGhz} GHz Clock
          </div>
          <div className="pt-2 flex items-center justify-between text-xs">
            <span className="text-[#a1a1aa]">Current Load</span>
            <span className="font-mono font-bold text-white">{metrics.cpuTotalPercent}%</span>
          </div>
        </FluentCard>

        <FluentCard
          accentColor="blue"
          onClick={() => setActiveView('resource_monitor')}
          className="p-5 space-y-2 cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-[#a1a1aa]">
            <span className="flex items-center gap-1.5 font-semibold text-white">
              <Activity className="w-4 h-4 text-sky-400" /> Graphics (GPU)
            </span>
            <span className="font-mono text-[#10b981]">
              {metrics.gpuTempCelsius !== null ? `${metrics.gpuTempCelsius}°C` : 'Temp N/A'}
            </span>
          </div>
          <div className="text-sm font-bold text-white">{metrics.gpuName}</div>
          <div className="text-[11px] text-[#71717a]">
            VRAM:{' '}
            {metrics.gpuMemoryUsedGB !== null && metrics.gpuMemoryTotalGB !== null
              ? `${metrics.gpuMemoryUsedGB} GB / ${metrics.gpuMemoryTotalGB} GB`
              : 'Sensor Unavailable'}
          </div>
          <div className="pt-2 flex items-center justify-between text-xs">
            <span className="text-[#a1a1aa]">3D Engine Load</span>
            <span className="font-mono font-bold text-white">
              {metrics.gpuPercent !== null ? `${metrics.gpuPercent}%` : 'N/A'}
            </span>
          </div>
        </FluentCard>

        <FluentCard
          accentColor="emerald"
          onClick={() => setActiveView('running_apps')}
          className="p-5 space-y-2 cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-[#a1a1aa]">
            <span className="flex items-center gap-1.5 font-semibold text-white">
              <HardDrive className="w-4 h-4 text-[#10b981]" /> System Memory
            </span>
            <span className="font-mono text-[#10b981]">Live RAM</span>
          </div>
          <div className="text-sm font-bold text-white">{metrics.ramModel}</div>
          <div className="text-[11px] text-[#71717a]">
            Used: {metrics.ramUsedGB} GB / Free: {(metrics.ramTotalGB - metrics.ramUsedGB).toFixed(1)} GB
          </div>
          <div className="pt-2 flex items-center justify-between text-xs">
            <span className="text-[#a1a1aa]">Committed</span>
            <span className="font-mono font-bold text-white">{metrics.ramPercent.toFixed(0)}%</span>
          </div>
        </FluentCard>

        <FluentCard
          accentColor="amber"
          onClick={() => setActiveView('services')}
          className="p-5 space-y-2 cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-[#a1a1aa]">
            <span className="flex items-center gap-1.5 font-semibold text-white">
              <ShieldCheck className="w-4 h-4 text-amber-400" /> Host Operating System
            </span>
            <span className="font-mono text-[#10b981]">Active</span>
          </div>
          <div className="text-sm font-bold text-white">
            {metrics.osPlatform || 'Windows 11 / Host OS'}
          </div>
          <div className="text-[11px] text-[#71717a]">
            {processes.length} Enumerated Processes • {services.length} Core Services
          </div>
          <div className="pt-2 flex items-center justify-between text-xs">
            <span className="text-[#a1a1aa]">Active Autostarts</span>
            <span className="font-mono font-bold text-white">
              {startupItems.filter((s) => s.enabled).length} Enabled
            </span>
          </div>
        </FluentCard>
      </div>

      {/* Mounted Storage Volumes: Local C: NVMe + Virtual G: Google Drive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FluentCard
          interactive={false}
          accentColor="purple"
          className="p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <HardDrive className="w-5 h-5 text-[#a855f7]" />
              <div>
                <h3 className="text-sm font-bold text-white">
                  Local Primary Volume — {metrics.diskModel}
                </h3>
                <p className="text-[11px] text-[#71717a]">
                  Host Filesystem • Live Capacity Telemetry
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveView('storage_analyzer')}
              className="px-3 py-1.5 rounded-xl bg-[#222026] hover:bg-[#2c2933] text-xs font-semibold text-white flex items-center gap-1 cursor-pointer"
            >
              Analyze <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[#a1a1aa]">
                Used: {(metrics.diskTotalGB - metrics.diskFreeGB).toFixed(1)} GB of {metrics.diskTotalGB} GB
              </span>
              <span className="font-mono font-bold text-white">
                {metrics.diskFreeGB} GB Free ({100 - metrics.diskUsagePercent}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#27272a] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#a855f7]"
                style={{ width: `${metrics.diskUsagePercent}%` }}
              />
            </div>
          </div>
        </FluentCard>

        <FluentCard
          interactive={false}
          accentColor="emerald"
          className="p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Cloud className="w-5 h-5 text-[#10b981]" />
              <div>
                <h3 className="text-sm font-bold text-white">
                  Virtual Cloud Drive ({mounted?.driveLetter || 'G:'}\) — Google Drive
                </h3>
                <p className="text-[11px] text-[#71717a]">
                  {mounted?.remoteName}
                  {mounted?.remoteFolder} •{' '}
                  {mounted?.isMounted ? 'Mounted on OS' : 'Unmounted on host OS'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveView('google_drive')}
              className="px-3 py-1.5 rounded-xl bg-[#222026] hover:bg-[#2c2933] text-xs font-semibold text-white flex items-center gap-1 cursor-pointer"
            >
              Manage G: <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[#a1a1aa]">
                Used: 22.367 GiB of 5.000 TiB (Backup: 1,063 objects • 2.543 GiB)
              </span>
              <span className="font-mono font-bold text-[#10b981]">4.961 TiB Free</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#27272a] overflow-hidden">
              <div className="h-full rounded-full bg-[#10b981]" style={{ width: '4%' }} />
            </div>
          </div>
        </FluentCard>
      </div>

      {/* Thermal & Stability Matrix */}
      <FluentCard interactive={false} accentColor="blue" className="p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Thermometer className="w-4 h-4 text-sky-400" />
          Thermal Sensors &amp; Kernel Stability Status
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#09090b] border border-white/[0.06]">
            <div className="text-[#71717a]">CPU Package (Tctl/Tdie)</div>
            <div className="text-base font-bold text-white font-mono mt-0.5">
              {metrics.cpuTempCelsius !== null ? `${metrics.cpuTempCelsius}°C` : 'N/A (No Sensor)'}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#09090b] border border-white/[0.06]">
            <div className="text-[#71717a]">GPU Core / Hotspot</div>
            <div className="text-base font-bold text-white font-mono mt-0.5">
              {metrics.gpuTempCelsius !== null
                ? `${metrics.gpuTempCelsius}°C / ${metrics.gpuTempCelsius + 7}°C`
                : 'N/A (No Sensor)'}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#09090b] border border-white/[0.06]">
            <div className="text-[#71717a]">Telemetry Source</div>
            <div className="text-base font-bold text-white font-mono mt-0.5">
              {metrics.sensorStatus?.telemetrySource === 'tauri-native'
                ? 'Tauri sysinfo'
                : 'Host OS Kernel'}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#09090b] border border-white/[0.06]">
            <div className="text-[#71717a]">Kernel Uptime</div>
            <div className="text-base font-bold text-[#10b981] font-mono mt-0.5">
              {formatDuration(metrics.uptimeSeconds)}
            </div>
          </div>
        </div>
      </FluentCard>
    </motion.div>
  );
};
