import React from 'react';
import { motion } from 'motion/react';
import {
  ChevronRight,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useSystemCommand } from '../../context/SystemCommandContext';
import {
  FluentCard,
  fluentStaggerContainer,
} from '../FluentMotion';

/**
 * Circular Hardware Temperature Gauge matching Reference Screenshot
 */
const CircularTempGauge: React.FC<{ tempCelsius: number | null; maxTemp?: number }> = ({
  tempCelsius,
  maxTemp = 95,
}) => {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const hasTemp = tempCelsius !== null && !Number.isNaN(tempCelsius);
  const clamped = hasTemp ? Math.max(20, Math.min(maxTemp, tempCelsius)) : 20;
  const fraction = hasTemp ? (clamped / maxTemp) * 0.72 : 0.15;
  const strokeDashoffset = circumference * (1 - fraction);

  return (
    <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
      <svg className="w-24 h-24 -rotate-[215deg]" viewBox="0 0 96 96">
        {/* Track */}
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="#27272a"
          strokeWidth="6.5"
          strokeDasharray={`${circumference * 0.75} ${circumference}`}
          strokeLinecap="round"
        />
        {/* Active Glowing Cyan/Sky Arc */}
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="url(#tempArcGrad)"
          strokeWidth="6.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
        <defs>
          <linearGradient id="tempArcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xl font-bold text-white leading-none">
          {hasTemp ? `${tempCelsius}°` : 'N/A'}
        </span>
        <span className="text-[10px] text-[#71717a] mt-0.5">
          {hasTemp ? 'Celsius' : 'No Sensor'}
        </span>
      </div>
    </div>
  );
};

export const OverviewView: React.FC = () => {
  const {
    metrics,
    metricsHistory,
    processes,
    rcloneStatus,
    platformSettings,
    updatePlatformSettings,
    setActiveView,
  } = useSystemCommand();

  const reviewCount = processes.filter((p) => p.category === 'Review Required').length;

  // Build smooth SVG path for Network purple area chart
  const netPoints = metricsHistory.map((m) => m.net);
  const maxNet = Math.max(40, ...netPoints);
  const chartWidth = 360;
  const chartHeight = 76;
  const coords = netPoints.map((val, idx) => {
    const x = (idx / Math.max(1, netPoints.length - 1)) * chartWidth;
    const y = chartHeight - (val / maxNet) * (chartHeight - 14) - 6;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const linePath = coords.length > 0 ? `M ${coords.join(' L ')}` : '';
  const areaPath =
    coords.length > 0
      ? `${linePath} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`
      : '';

  return (
    <motion.div
      variants={fluentStaggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-4 pb-8"
    >
      {/* TOP BENTO GRID: Welcome Card (4 cols) + Processor & GPU (4 cols) + RAM/Storage/Network (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* 1. Welcome Back / System Overview Card (Col Span 4) */}
        <FluentCard
          interactive={false}
          accentColor="purple"
          className="lg:col-span-4 p-6 relative overflow-hidden flex flex-col justify-between min-h-[340px]"
        >
          {/* Decorative Purple Geometric Wireframe Mesh SVG */}
          <svg
            className="absolute right-[-30px] top-10 w-64 h-64 opacity-25 pointer-events-none"
            viewBox="0 0 200 200"
            fill="none"
          >
            {Array.from({ length: 14 }).map((_, idx) => (
              <polygon
                key={idx}
                points="100,15 185,100 100,185 15,100"
                stroke="#a855f7"
                strokeWidth="0.75"
                transform={`rotate(${idx * 6} 100 100) scale(${1 - idx * 0.045})`}
              />
            ))}
          </svg>

          <div className="relative z-10">
            <div className="text-xs text-[#a1a1aa] font-medium">Welcome back</div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight mt-0.5">
              System Admin
            </h2>
            {platformSettings.tooltipMode && (
              <p className="text-[11px] text-[#71717a] mt-1 max-w-[230px]">
                Live summary of host kernel health, temperatures, and Google Drive G: mount verification.
              </p>
            )}
          </div>

          <div className="relative z-10 space-y-3 mt-6">
            <div className="flex items-start gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] mt-1 shrink-0 shadow-[0_0_8px_#10b981]" />
              <div>
                <div className="text-xs font-bold text-white leading-tight">Temperatures</div>
                <div className="text-[11px] text-[#71717a]">
                  {metrics.cpuTempCelsius !== null
                    ? `${metrics.cpuTempCelsius}°C CPU`
                    : 'CPU Sensor N/A'}{' '}
                  /{' '}
                  {metrics.gpuTempCelsius !== null
                    ? `${metrics.gpuTempCelsius}°C GPU`
                    : 'GPU Sensor N/A'}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] mt-1 shrink-0 shadow-[0_0_8px_#10b981]" />
              <div>
                <div className="text-xs font-bold text-white leading-tight">Health</div>
                <div className="text-[11px] text-[#71717a]">
                  Live kernel poll • {processes.length} processes enumerated
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span
                className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${
                  rcloneStatus.mountedGDrive?.isMounted
                    ? 'bg-[#10b981] shadow-[0_0_8px_#10b981]'
                    : 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                }`}
              />
              <div>
                <div className="text-xs font-bold text-white leading-tight">
                  Virtual Drive ({rcloneStatus.mountedGDrive?.driveLetter || 'G:'})
                </div>
                <div className="text-[11px] text-[#71717a]">
                  {rcloneStatus.mountedGDrive?.isMounted
                    ? 'Verified Mounted on OS via WinFsp'
                    : 'Unmounted on host OS — Click Google Drive to verify/mount'}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span
                className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${
                  reviewCount > 0
                    ? 'bg-[#ef4444] shadow-[0_0_8px_#ef4444]'
                    : 'bg-[#10b981] shadow-[0_0_8px_#10b981]'
                }`}
              />
              <div>
                <div className="text-xs font-bold text-white leading-tight">Process Audit</div>
                <div className="text-[11px] text-[#71717a]">
                  {reviewCount > 0
                    ? `${reviewCount} processes flagged for review`
                    : 'All running processes verified'}
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex justify-end mt-4">
            <button
              onClick={() => setActiveView('my_pc')}
              className="px-3.5 py-1.5 rounded-xl bg-[#222026] hover:bg-[#2c2933] border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>My PC</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#a1a1aa]" />
            </button>
          </div>
        </FluentCard>

        {/* 2. Middle Column: Processor + Video Card Stacked (Col Span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Processor Card */}
          <FluentCard
            accentColor="blue"
            onClick={() => setActiveView('resource_monitor')}
            className="flex-1 p-5 flex flex-col justify-between cursor-pointer relative group"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Processor</h3>
                <div className="text-[11px] text-[#71717a]">{metrics.cpuModel}</div>
                <div className="flex items-center gap-2 pt-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]" />
                  <span className="text-xs font-semibold text-white">Optimal</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <CircularTempGauge tempCelsius={metrics.cpuTempCelsius} />
                <ChevronRight className="w-4 h-4 text-[#71717a] group-hover:text-white transition-colors" />
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#71717a]">Utilization</span>
                <span className="font-bold text-white font-mono">
                  {metrics.cpuTotalPercent.toFixed(0)}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#27272a] overflow-hidden">
                <div
                  className="h-full rounded-full bg-white transition-all duration-500"
                  style={{ width: `${Math.min(100, metrics.cpuTotalPercent)}%` }}
                />
              </div>
            </div>
          </FluentCard>

          {/* Video Card (GPU) */}
          <FluentCard
            accentColor="blue"
            onClick={() => setActiveView('resource_monitor')}
            className="flex-1 p-5 flex flex-col justify-between cursor-pointer relative group"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Video Card</h3>
                <div className="text-[11px] text-[#71717a]">{metrics.gpuName}</div>
                <div className="flex items-center gap-2 pt-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      metrics.gpuPercent !== null
                        ? 'bg-[#10b981] shadow-[0_0_8px_#10b981]'
                        : 'bg-zinc-500'
                    }`}
                  />
                  <span className="text-xs font-semibold text-white">
                    {metrics.gpuPercent !== null ? 'Optimal' : 'Sensor Unavailable'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <CircularTempGauge tempCelsius={metrics.gpuTempCelsius} />
                <ChevronRight className="w-4 h-4 text-[#71717a] group-hover:text-white transition-colors" />
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#71717a]">Utilization</span>
                <span className="font-bold text-white font-mono">
                  {metrics.gpuPercent !== null ? `${metrics.gpuPercent.toFixed(0)}%` : 'N/A'}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#27272a] overflow-hidden">
                <div
                  className="h-full rounded-full bg-white transition-all duration-500"
                  style={{ width: `${Math.min(100, metrics.gpuPercent ?? 0)}%` }}
                />
              </div>
            </div>
          </FluentCard>
        </div>

        {/* 3. Right Column: RAM + Storage Split Top, Network Graph Bottom (Col Span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Top Split: RAM & Storage */}
          <div className="grid grid-cols-2 gap-4 flex-1">
            {/* RAM Card */}
            <FluentCard
              accentColor="emerald"
              onClick={() => setActiveView('running_apps')}
              className="p-5 flex flex-col justify-between cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">RAM</h3>
                  <div className="text-[11px] text-[#71717a]">{metrics.ramModel}</div>
                  <div className="flex items-center gap-2 pt-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]" />
                    <span className="text-xs font-semibold text-white">Optimal</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#71717a] group-hover:text-white mt-1" />
              </div>

              <div className="space-y-1.5 pt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#71717a]">Utilization</span>
                  <span className="font-bold text-white font-mono">
                    {metrics.ramPercent.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#27272a] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-500"
                    style={{ width: `${metrics.ramPercent}%` }}
                  />
                </div>
              </div>
            </FluentCard>

            {/* Storage Card */}
            <FluentCard
              accentColor="emerald"
              onClick={() => setActiveView('storage_analyzer')}
              className="p-5 flex flex-col justify-between cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">Storage</h3>
                  <div className="text-[11px] text-[#71717a] truncate max-w-[115px]">
                    {metrics.diskModel}
                  </div>
                  <div className="flex items-center gap-2 pt-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]" />
                    <span className="text-xs font-semibold text-white">Optimal</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#71717a] group-hover:text-white mt-1" />
              </div>

              <div className="space-y-1.5 pt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#71717a]">Utilization</span>
                  <span className="font-bold text-white font-mono">
                    {metrics.diskUsagePercent}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#27272a] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-500"
                    style={{ width: `${metrics.diskUsagePercent}%` }}
                  />
                </div>
              </div>
            </FluentCard>
          </div>

          {/* Bottom Wide: Network Card with Purple/Violet Area Chart */}
          <FluentCard
            accentColor="purple"
            onClick={() => setActiveView('network')}
            className="flex-1 p-5 flex flex-col justify-between cursor-pointer group overflow-hidden"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-white">Network</h3>
                <div className="text-[11px] text-[#71717a]">{metrics.networkAdapterName}</div>
                <div className="flex items-center gap-2 pt-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]" />
                  <span className="text-xs font-semibold text-white">Connected</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[11px] font-mono text-[#e4e4e7]">
                <span className="flex items-center gap-1">
                  <ArrowUp className="w-3 h-3 text-[#a855f7]" />
                  {metrics.netUpMbps} MB/s
                </span>
                <span className="flex items-center gap-1">
                  <ArrowDown className="w-3 h-3 text-[#10b981]" />
                  {metrics.netDownMbps} MB/s
                </span>
                <ChevronRight className="w-4 h-4 text-[#71717a] group-hover:text-white" />
              </div>
            </div>

            {/* Purple Area Sparkline Graph (Reference Image Authority) */}
            <div className="pt-2 -mx-2 -mb-2">
              <svg
                className="w-full h-16 overflow-visible"
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="netPurpleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity="0.52" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {areaPath && <path d={areaPath} fill="url(#netPurpleGrad)" />}
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </svg>
            </div>
          </FluentCard>
        </div>
      </div>

      {/* BOTTOM BENTO GRID: Left (Performance Analyzer + Health Center) + Middle (Optimization + Cloud/Command) + Right (Platform Settings) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Stacked Column (Col Span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Performance Analyzer Card */}
          <FluentCard
            accentColor="purple"
            onClick={() => setActiveView('resource_monitor')}
            className="flex-1 p-5 relative overflow-hidden flex flex-col justify-between cursor-pointer min-h-[165px]"
          >
            {/* Dotted Wave Particle Pattern */}
            <svg
              className="absolute right-0 bottom-0 w-48 h-32 opacity-30 pointer-events-none"
              viewBox="0 0 180 120"
            >
              {Array.from({ length: 8 }).map((_, r) =>
                Array.from({ length: 12 }).map((__, c) => (
                  <circle
                    key={`${r}-${c}`}
                    cx={20 + c * 13}
                    cy={20 + r * 12 + Math.sin(c * 0.6 + r * 0.4) * 10}
                    r="1.4"
                    fill="#8b5cf6"
                  />
                ))
              )}
            </svg>

            <div className="relative z-10">
              <h3 className="text-lg font-bold text-white">Performance Analyzer</h3>
              <div className="text-[11px] text-[#71717a]">
                Real-Time Telemetry &amp; Bottleneck Tool
              </div>
              <div className="flex items-center gap-2 pt-2.5">
                <span className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]" />
                <span className="text-xs font-semibold text-white">Run recently</span>
              </div>
            </div>

            <div className="relative z-10 pt-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveView('resource_monitor');
                }}
                className="px-4 py-2 rounded-xl bg-[#222026] hover:bg-[#2c2933] border border-white/10 text-xs font-semibold text-white inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>Analyze</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#a1a1aa]" />
              </button>
            </div>
          </FluentCard>

          {/* Health Center Card */}
          <FluentCard
            accentColor="amber"
            onClick={() => setActiveView('tools')}
            className="flex-1 p-5 relative overflow-hidden flex flex-col justify-between cursor-pointer min-h-[165px]"
          >
            {/* Warm Amber Particle Wave */}
            <svg
              className="absolute right-0 bottom-0 w-48 h-32 opacity-30 pointer-events-none"
              viewBox="0 0 180 120"
            >
              {Array.from({ length: 8 }).map((_, r) =>
                Array.from({ length: 12 }).map((__, c) => (
                  <circle
                    key={`${r}-${c}`}
                    cx={20 + c * 13}
                    cy={25 + r * 11 + Math.cos(c * 0.5) * 9}
                    r="1.4"
                    fill="#f59e0b"
                  />
                ))
              )}
            </svg>

            <div className="relative z-10">
              <h3 className="text-lg font-bold text-white">Health Center</h3>
              <div className="text-[11px] text-[#71717a]">
                Self-help tools, SHA-256 verification &amp; WinFsp checks
              </div>
              <div className="flex items-center gap-2 pt-2.5">
                <span className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]" />
                <span className="text-xs font-semibold text-white">Scanned Recently</span>
              </div>
            </div>

            <div className="relative z-10 pt-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveView('tools');
                }}
                className="px-4 py-2 rounded-xl bg-[#222026] hover:bg-[#2c2933] border border-white/10 text-xs font-semibold text-white inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>Health</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#a1a1aa]" />
              </button>
            </div>
          </FluentCard>
        </div>

        {/* Middle Stacked Column: Optimization + Google Drive / Command Center (Col Span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Optimization Card */}
          <FluentCard
            accentColor="violet"
            onClick={() => setActiveView('optimize')}
            className="flex-1 p-5 relative overflow-hidden flex flex-col justify-between cursor-pointer min-h-[165px]"
          >
            <svg
              className="absolute right-0 bottom-0 w-48 h-36 opacity-25 pointer-events-none"
              viewBox="0 0 200 140"
              fill="none"
            >
              {Array.from({ length: 9 }).map((_, idx) => (
                <path
                  key={idx}
                  d={`M 10 ${130 - idx * 8} Q 95 ${20 + idx * 10}, 195 ${80 - idx * 6}`}
                  stroke="#a855f7"
                  strokeWidth="1.2"
                />
              ))}
            </svg>

            <div className="relative z-10">
              <h3 className="text-lg font-bold text-white">Optimization</h3>
              <div className="text-[11px] text-[#71717a]">
                Increase performance with confirmed system changes
              </div>
              <div className="flex items-center gap-2 pt-2.5">
                <span className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]" />
                <span className="text-xs font-semibold text-white">Optimized</span>
              </div>
            </div>

            <div className="relative z-10 pt-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveView('optimize');
                }}
                className="px-4 py-2 rounded-xl bg-[#222026] hover:bg-[#2c2933] border border-white/10 text-xs font-semibold text-white inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>Optimize</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#a1a1aa]" />
              </button>
            </div>
          </FluentCard>

          {/* Google Drive G: & Command Execution Card */}
          <FluentCard
            accentColor="emerald"
            onClick={() => setActiveView('google_drive')}
            className="flex-1 p-5 relative overflow-hidden flex flex-col justify-between cursor-pointer min-h-[165px]"
          >
            <svg
              className="absolute right-0 bottom-0 w-48 h-36 opacity-25 pointer-events-none"
              viewBox="0 0 200 140"
              fill="none"
            >
              {Array.from({ length: 8 }).map((_, idx) => (
                <path
                  key={idx}
                  d={`M 20 ${135 - idx * 9} C 80 ${60 + idx * 6}, 140 ${30 + idx * 10}, 195 ${95 - idx * 7}`}
                  stroke="#10b981"
                  strokeWidth="1.2"
                />
              ))}
            </svg>

            <div className="relative z-10">
              <h3 className="text-lg font-bold text-white">Google Drive &amp; Command</h3>
              <div className="text-[11px] text-[#71717a]">
                G:\ Virtual Drive (1,063 objects • 2.543 GiB) &amp; Local CLI
              </div>
              <div className="flex items-center gap-2 pt-2.5">
                <span className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]" />
                <span className="text-xs font-semibold text-white">
                  {rcloneStatus.mountedGDrive?.isMounted ? 'Online • G: Mounted' : 'Standby'}
                </span>
              </div>
            </div>

            <div className="relative z-10 pt-4 flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveView('google_drive');
                }}
                className="px-3.5 py-2 rounded-xl bg-[#222026] hover:bg-[#2c2933] border border-white/10 text-xs font-semibold text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>G: Drive</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#a1a1aa]" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveView('command_center');
                }}
                className="px-3.5 py-2 rounded-xl bg-[#222026] hover:bg-[#2c2933] border border-white/10 text-xs font-semibold text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Command</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#a1a1aa]" />
              </button>
            </div>
          </FluentCard>
        </div>

        {/* Right Tall Column: Platform Settings Card (Col Span 4) */}
        <FluentCard
          interactive={false}
          accentColor="emerald"
          className="lg:col-span-4 p-6 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Platform Settings</h3>

            {/* GENERAL PREFERENCES */}
            <div className="space-y-3">
              <div className="text-[10px] font-bold tracking-wider uppercase text-[#71717a]">
                GENERAL PREFERENCES
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#e4e4e7]">App Notifications</span>
                <button
                  onClick={() =>
                    updatePlatformSettings({
                      appNotifications: !platformSettings.appNotifications,
                    })
                  }
                  role="switch"
                  aria-checked={platformSettings.appNotifications}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    platformSettings.appNotifications ? 'bg-[#10b981]' : 'bg-[#27272a]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      platformSettings.appNotifications ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#e4e4e7]">Automatically install updates when available</span>
                <button
                  onClick={() =>
                    updatePlatformSettings({
                      autoInstallUpdates: !platformSettings.autoInstallUpdates,
                    })
                  }
                  role="switch"
                  aria-checked={platformSettings.autoInstallUpdates}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    platformSettings.autoInstallUpdates ? 'bg-[#10b981]' : 'bg-[#27272a]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      platformSettings.autoInstallUpdates ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#e4e4e7]">Default to &apos;My PC&apos; when opening</span>
                <button
                  onClick={() =>
                    updatePlatformSettings({
                      defaultToMyPc: !platformSettings.defaultToMyPc,
                    })
                  }
                  role="switch"
                  aria-checked={platformSettings.defaultToMyPc}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    platformSettings.defaultToMyPc ? 'bg-[#10b981]' : 'bg-[#27272a]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      platformSettings.defaultToMyPc ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* SYSTEM TRACKING SETTINGS */}
            <div className="space-y-3 pt-2">
              <div className="text-[10px] font-bold tracking-wider uppercase text-[#71717a]">
                SYSTEM TRACKING SETTINGS
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#e4e4e7]">Real-Time Monitoring</span>
                <button
                  onClick={() =>
                    updatePlatformSettings({
                      realTimeMonitoring: !platformSettings.realTimeMonitoring,
                    })
                  }
                  role="switch"
                  aria-checked={platformSettings.realTimeMonitoring}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    platformSettings.realTimeMonitoring ? 'bg-[#10b981]' : 'bg-[#27272a]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      platformSettings.realTimeMonitoring ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#e4e4e7]">Performance Logs</span>
                <button
                  onClick={() =>
                    updatePlatformSettings({
                      performanceLogs: !platformSettings.performanceLogs,
                    })
                  }
                  role="switch"
                  aria-checked={platformSettings.performanceLogs}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    platformSettings.performanceLogs ? 'bg-[#10b981]' : 'bg-[#27272a]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      platformSettings.performanceLogs ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveView('settings')}
            className="w-full mt-5 py-2.5 px-4 rounded-xl bg-[#222026] hover:bg-[#2c2933] border border-white/10 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>All Settings</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#a1a1aa]" />
          </button>
        </FluentCard>
      </div>
    </motion.div>
  );
};
