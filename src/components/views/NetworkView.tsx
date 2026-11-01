import React from 'react';
import {
  Wifi,
  ArrowUp,
  ArrowDown,
  Cloud,
  Activity,
} from 'lucide-react';
import { useSystemCommand } from '../../context/SystemCommandContext';
import { formatNetworkSpeed } from '../../utils/systemIntelligence';
import { FluentCard, fluentStaggerContainer } from '../FluentMotion';
import { motion } from 'motion/react';

export const NetworkView: React.FC = () => {
  const { metrics, metricsHistory, processes, setSelectedProcess } = useSystemCommand();

  const networkProcesses = [...processes]
    .filter((p) => p.networkKbps > 0)
    .sort((a, b) => b.networkKbps - a.networkKbps);

  const netPoints = metricsHistory.map((m) => m.net);
  const maxNet = Math.max(45, ...netPoints);
  const w = 720;
  const h = 160;
  const coords = netPoints.map((val, idx) => {
    const x = (idx / Math.max(1, netPoints.length - 1)) * w;
    const y = h - (val / maxNet) * (h - 24) - 10;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const linePath = coords.length > 0 ? `M ${coords.join(' L ')}` : '';
  const areaPath = coords.length > 0 ? `${linePath} L ${w},${h} L 0,${h} Z` : '';

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
            <Wifi className="w-5 h-5 text-[#a855f7]" />
            Network Intelligence &amp; Bandwidth Telemetry
          </h1>
          <p className="text-xs text-[#a1a1aa] mt-0.5">
            Real-time adapter throughput, rclone G: stream bandwidth, and per-process socket activity
          </p>
        </div>

        <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-[#171619] border border-white/10 text-xs font-mono">
          <span className="flex items-center gap-1 text-[#a855f7]">
            <ArrowUp className="w-3.5 h-3.5" /> {metrics.netUpMbps} Mbps Up
          </span>
          <span className="flex items-center gap-1 text-[#10b981]">
            <ArrowDown className="w-3.5 h-3.5" /> {metrics.netDownMbps} Mbps Down
          </span>
        </div>
      </div>

      {/* Live Purple Bandwidth Graph Card */}
      <FluentCard interactive={false} accentColor="purple" className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">{metrics.networkAdapterName}</h3>
            <p className="text-[11px] text-[#71717a]">
              IPv4 Connected • DNS: 1.1.1.1 / 8.8.8.8 • rclone TLS 1.3 Tunnel Active
            </p>
          </div>
          <span className="text-xs font-semibold text-[#10b981] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10b981]" /> Optimal Latency (11 ms)
          </span>
        </div>

        <div className="pt-2">
          <svg className="w-full h-40 overflow-visible" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="netViewPurple" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.48" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {areaPath && <path d={areaPath} fill="url(#netViewPurple)" />}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="#a855f7"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}
          </svg>
        </div>
      </FluentCard>

      {/* Active Per-Process Network Consumers */}
      <FluentCard interactive={false} accentColor="emerald" className="overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Activity className="w-4 h-4 text-[#10b981]" />
            Per-Process Network Activity ({networkProcesses.length} Active Endpoints)
          </div>
          <span className="text-xs text-[#71717a]">Click any process to inspect digital signature</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="text-[11px] uppercase tracking-wider text-[#71717a] border-b border-white/10 bg-[#09090b]/50">
              <tr>
                <th className="py-3 px-4">Process</th>
                <th className="py-3 px-3">PID</th>
                <th className="py-3 px-3">Application / Service</th>
                <th className="py-3 px-3">Publisher</th>
                <th className="py-3 px-3 text-right">Throughput</th>
                <th className="py-3 px-4 text-center">Risk Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {networkProcesses.map((proc) => (
                <tr
                  key={proc.pid}
                  onClick={() => setSelectedProcess(proc)}
                  className="hover:bg-white/[0.03] transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                    {proc.name === 'rclone.exe' && <Cloud className="w-3.5 h-3.5 text-[#10b981]" />}
                    {proc.name}
                  </td>
                  <td className="py-3 px-3 font-mono text-[#a1a1aa]">{proc.pid}</td>
                  <td className="py-3 px-3 text-[#d4d4d8]">{proc.appAssociation}</td>
                  <td className="py-3 px-3 text-[#a1a1aa]">{proc.publisher}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-[#10b981]">
                    {formatNetworkSpeed(proc.networkKbps)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${
                        proc.category === 'Review Required'
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          : 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30'
                      }`}
                    >
                      {proc.category}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </FluentCard>
    </motion.div>
  );
};
