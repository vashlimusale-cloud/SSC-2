import React, { useState, useMemo } from 'react';
import {
  Activity,
  Cpu,
  HardDrive,
  Network,
  Clock,
  Layers,
  Zap,
  Info,
  Sliders,
} from 'lucide-react';
import { useSystemCommand } from '../../context/SystemCommandContext';
import { formatDuration } from '../../utils/systemIntelligence';

type Timeframe = '1m' | '5m' | '15m' | '30m';

export const ResourceMonitorView: React.FC = () => {
  const { metrics, metricsHistory } = useSystemCommand();
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('5m');
  const [hoveredPoint, setHoveredPoint] = useState<{
    metric: string;
    value: number;
    time: string;
    x: number;
    y: number;
  } | null>(null);

  // Derive historical data according to timeframe
  const displayHistory = useMemo(() => {
    const pointsCount =
      selectedTimeframe === '1m'
        ? 12
        : selectedTimeframe === '5m'
        ? 20
        : selectedTimeframe === '15m'
        ? 25
        : 30;
    return metricsHistory.slice(-pointsCount);
  }, [metricsHistory, selectedTimeframe]);

  // High-fidelity interactive SVG chart renderer
  const renderInteractiveChart = (
    metricKey: 'cpu' | 'ram' | 'gpu' | 'disk' | 'net',
    label: string,
    strokeColor: string,
    fillGradientId: string,
    maxVal = 100,
    unit = '%'
  ) => {
    const width = 360;
    const height = 90;
    const data = displayHistory.map((d) => ({
      val: d[metricKey],
      time: d.time,
    }));

    if (data.length === 0) return null;

    const coords = data.map((item, idx) => {
      const x = (idx / Math.max(1, data.length - 1)) * width;
      const normalized = Math.max(0, Math.min(maxVal, item.val));
      const y = height - (normalized / maxVal) * (height - 14) - 6;
      return { x, y, val: item.val, time: item.time };
    });

    const pointsStr = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
    const areaStr = `0,${height} ${pointsStr} ${width},${height}`;

    // 80% Threshold reference line
    const thresholdY = height - (0.8 * (height - 14)) - 6;

    return (
      <div className="relative group select-none">
        <svg
          className="w-full h-24 overflow-visible cursor-crosshair"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          <defs>
            <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.32" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* 80% Alert threshold dashed guide */}
          <line
            x1="0"
            y1={thresholdY}
            x2={width}
            y2={thresholdY}
            stroke="rgba(244, 63, 94, 0.3)"
            strokeDasharray="3 3"
            strokeWidth="1"
          />

          {/* Gradient area fill */}
          <polygon fill={`url(#${fillGradientId})`} points={areaStr} />

          {/* Line curve */}
          <polyline
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={pointsStr}
          />

          {/* Interactive invisible hit areas for points */}
          {coords.map((c, i) => (
            <circle
              key={i}
              cx={c.x}
              cy={c.y}
              r="7"
              className="fill-transparent cursor-pointer hover:fill-white/80 transition-colors"
              onMouseEnter={() =>
                setHoveredPoint({
                  metric: label,
                  value: c.val,
                  time: c.time,
                  x: c.x,
                  y: c.y,
                })
              }
            />
          ))}
        </svg>

        {/* Hover Crosshair Tooltip */}
        {hoveredPoint && hoveredPoint.metric === label && (
          <div
            className="absolute -top-7 pointer-events-none transform -translate-x-1/2 px-2 py-0.5 rounded bg-black/90 border border-white/20 text-[10px] text-white font-mono shadow-xl z-20 whitespace-nowrap"
            style={{ left: `${(hoveredPoint.x / width) * 100}%` }}
          >
            <strong>{hoveredPoint.value.toFixed(1)}{unit}</strong> at {hoveredPoint.time}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header & Timeframe Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Hardware Resource Telemetry & Performance Charts
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Interactive multi-timeframe CPU, RAM, GPU 3D, and I/O graphs with live hover inspect
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10 text-xs">
          <span className="text-gray-400 text-[11px] px-2 font-medium">Timeframe:</span>
          {(['1m', '5m', '15m', '30m'] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setSelectedTimeframe(tf)}
              className={`px-2.5 py-1 rounded font-mono text-xs font-semibold transition-all cursor-pointer ${
                selectedTimeframe === tf
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Main 5 Resource Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* CPU */}
        <div className="p-4 rounded-xl win-card bg-[#161a24] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-semibold text-white">
              <Cpu className="w-4 h-4 text-amber-400" /> Central Processing Unit (CPU)
            </span>
            <span className="text-lg font-bold font-mono text-amber-400">
              {metrics.cpuTotalPercent.toFixed(1)}%
            </span>
          </div>

          <div className="bg-black/40 rounded-lg p-2.5 border border-white/5 pt-3">
            {renderInteractiveChart('cpu', 'CPU Load', '#fbbf24', 'cpuGrad', 100, '%')}
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px] text-gray-400 pt-1 border-t border-white/5">
            <div>
              <div>Cores:</div>
              <strong className="text-gray-200">{metrics.cpuCores} Threads</strong>
            </div>
            <div>
              <div>Clock Speed:</div>
              <strong className="text-gray-200">{metrics.cpuFrequencyGhz} GHz</strong>
            </div>
            <div>
              <div>Processes:</div>
              <strong className="text-gray-200">{metrics.processCount} active</strong>
            </div>
          </div>
        </div>

        {/* RAM */}
        <div className="p-4 rounded-xl win-card bg-[#161a24] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-semibold text-white">
              <HardDrive className="w-4 h-4 text-blue-400" /> System Memory (RAM)
            </span>
            <span className="text-lg font-bold font-mono text-blue-400">
              {metrics.ramPercent.toFixed(0)}%
            </span>
          </div>

          <div className="bg-black/40 rounded-lg p-2.5 border border-white/5 pt-3">
            {renderInteractiveChart('ram', 'RAM Usage', '#60a5fa', 'ramGrad', 100, '%')}
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px] text-gray-400 pt-1 border-t border-white/5">
            <div>
              <div>In Use:</div>
              <strong className="text-gray-200">{metrics.ramUsedGB} GB</strong>
            </div>
            <div>
              <div>Available:</div>
              <strong className="text-gray-200">
                {(metrics.ramTotalGB - metrics.ramUsedGB).toFixed(1)} GB
              </strong>
            </div>
            <div>
              <div>Hardware Total:</div>
              <strong className="text-gray-200">{metrics.ramTotalGB} GB DDR5</strong>
            </div>
          </div>
        </div>

        {/* GPU */}
        <div className="p-4 rounded-xl win-card bg-[#161a24] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-semibold text-white">
              <Activity className="w-4 h-4 text-purple-400" /> GPU 3D Graphics Engine
            </span>
            <span className="text-lg font-bold font-mono text-purple-400">
              {metrics.gpuPercent !== null ? `${metrics.gpuPercent.toFixed(1)}%` : 'N/A'}
            </span>
          </div>

          <div className="bg-black/40 rounded-lg p-2.5 border border-white/5 pt-3">
            {renderInteractiveChart('gpu', 'GPU Load', '#c084fc', 'gpuGrad', 100, '%')}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-400 pt-1 border-t border-white/5">
            <div>
              <div>Adapter:</div>
              <strong className="text-gray-200 truncate block">{metrics.gpuName}</strong>
            </div>
            <div>
              <div>Dedicated VRAM:</div>
              <strong className="text-gray-200">
                {metrics.gpuMemoryUsedGB !== null && metrics.gpuMemoryTotalGB !== null
                  ? `${metrics.gpuMemoryUsedGB} / ${metrics.gpuMemoryTotalGB} GB`
                  : 'N/A (No Sensor)'}
              </strong>
            </div>
          </div>
        </div>

        {/* Disk I/O */}
        <div className="p-4 rounded-xl win-card bg-[#161a24] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-semibold text-white">
              <HardDrive className="w-4 h-4 text-emerald-400" /> Primary Disk Utilization
            </span>
            <span className="text-lg font-bold font-mono text-emerald-400">
              {metrics.diskWriteMBps !== null
                ? `${metrics.diskWriteMBps} MB/s`
                : `${metrics.diskUsagePercent}% Used`}
            </span>
          </div>

          <div className="bg-black/40 rounded-lg p-2.5 border border-white/5 pt-3">
            {renderInteractiveChart('disk', 'Disk Usage', '#34d399', 'diskGrad', 100, '%')}
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px] text-gray-400 pt-1 border-t border-white/5">
            <div>
              <div>Read Rate:</div>
              <strong className="text-gray-200">
                {metrics.diskReadMBps !== null ? `${metrics.diskReadMBps} MB/s` : 'N/A'}
              </strong>
            </div>
            <div>
              <div>Free Space:</div>
              <strong className="text-gray-200">{metrics.diskFreeGB} GB</strong>
            </div>
            <div>
              <div>Capacity:</div>
              <strong className="text-gray-200">{metrics.diskTotalGB} GB</strong>
            </div>
          </div>
        </div>

        {/* Network Throughput */}
        <div className="p-4 rounded-xl win-card bg-[#161a24] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-semibold text-white">
              <Network className="w-4 h-4 text-cyan-400" /> Network Bandwidth
            </span>
            <span className="text-lg font-bold font-mono text-cyan-400">
              {metrics.netDownMbps} Mbps
            </span>
          </div>

          <div className="bg-black/40 rounded-lg p-2.5 border border-white/5 pt-3">
            {renderInteractiveChart('net', 'Network', '#22d3ee', 'netGrad', 50, ' Mbps')}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-400 pt-1 border-t border-white/5">
            <div>
              <div>Download Rate:</div>
              <strong className="text-gray-200">↓ {metrics.netDownMbps} Mbps</strong>
            </div>
            <div>
              <div>Upload Rate:</div>
              <strong className="text-gray-200">↑ {metrics.netUpMbps} Mbps</strong>
            </div>
          </div>
        </div>

        {/* System Uptime Card */}
        <div className="p-4 rounded-xl win-card bg-[#161a24] border border-white/10 space-y-3 flex flex-col justify-between">
          <div>
            <span className="flex items-center gap-2 text-xs font-semibold text-white">
              <Clock className="w-4 h-4 text-indigo-400" /> Host Kernel Telemetry
            </span>
            <div className="text-2xl font-bold font-mono text-white mt-3">
              {formatDuration(metrics.uptimeSeconds)}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {metrics.osPlatform || 'Host OS'} • Live kernel uptime
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-400 pt-2 border-t border-white/5">
            <div>
              <div>Total Threads:</div>
              <strong className="text-gray-200">{metrics.threadCount}</strong>
            </div>
            <div>
              <div>Total Handles:</div>
              <strong className="text-gray-200">
                {metrics.handleCount !== null ? metrics.handleCount : 'N/A'}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
