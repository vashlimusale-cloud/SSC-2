import React, { useState } from 'react';
import {
  Cpu,
  Search,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Lock,
  CornerDownRight,
  Info,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { useSystemCommand } from '../../context/SystemCommandContext';
import { checkTerminationSafety, formatNetworkSpeed } from '../../utils/systemIntelligence';

export const BackgroundProcessesView: React.FC = () => {
  const { processes, setSelectedProcess, terminateProcessWithApproval } = useSystemCommand();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'flat' | 'tree'>('flat');

  // Filter background and system service processes
  const backgroundProcs = processes.filter((p) => {
    const isBg = p.status !== 'Foreground Application';
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.appAssociation.toLowerCase().includes(q) ||
      p.parentName.toLowerCase().includes(q) ||
      p.pid.toString().includes(q);
    return isBg && matchesSearch;
  });

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-400" />
            Background Processes & Windows Subsystems
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            System daemons, background broker hosts, and parent-to-child relationship mapping
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search background daemons..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 w-52"
            />
          </div>

          <div className="flex rounded-lg bg-white/5 p-0.5 border border-white/10 text-xs">
            <button
              onClick={() => setViewMode('flat')}
              className={`px-3 py-1 rounded font-medium transition-colors cursor-pointer ${
                viewMode === 'flat' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Flat List
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1 rounded font-medium transition-colors cursor-pointer ${
                viewMode === 'tree' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Tree Hierarchy
            </button>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <div>
          <strong>Windows 11 Architecture Note:</strong> Background processes like <code className="bg-purple-900/40 px-1 py-0.5 rounded text-white">svchost.exe</code> host essential system DLLs (RPC, CryptSvc, Audio).
          Processes marked as <strong>Protected System Process</strong> are verified by Early Launch Anti-Malware (ELAM) and cannot be terminated.
        </div>
      </div>

      {/* List or Tree View */}
      <div className="space-y-2.5">
        {backgroundProcs.map((proc) => {
          const safety = checkTerminationSafety(proc);
          return (
            <div
              key={proc.pid}
              onClick={() => setSelectedProcess(proc)}
              className="p-3.5 rounded-xl win-card bg-[#161a24] hover:bg-white/[0.04] border border-white/10 transition-all cursor-pointer group space-y-2.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full shrink-0 ${
                      proc.category === 'Protected System Process'
                        ? 'bg-rose-500'
                        : proc.category === 'Review Required'
                        ? 'bg-amber-400'
                        : 'bg-purple-400'
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm group-hover:text-purple-300 transition-colors">
                        {proc.name}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-300">
                        PID {proc.pid}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                          proc.category === 'Protected System Process'
                            ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                            : proc.category === 'Review Required'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {proc.category}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{proc.appAssociation}</div>
                  </div>
                </div>

                {/* Performance badges */}
                <div className="flex items-center gap-3 text-xs">
                  <div className="text-right">
                    <div className="font-semibold text-white font-mono">
                      {proc.ramMB >= 1024
                        ? `${(proc.ramMB / 1024).toFixed(2)} GB`
                        : `${proc.ramMB.toFixed(0)} MB`}
                    </div>
                    <div className="text-[10px] text-gray-400">RAM Footprint</div>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold text-white font-mono">{proc.cpuPercent.toFixed(1)}%</div>
                    <div className="text-[10px] text-gray-400">CPU Usage</div>
                  </div>

                  <div className="text-right hidden sm:block">
                    <div className="font-semibold text-white font-mono">{formatNetworkSpeed(proc.networkKbps)}</div>
                    <div className="text-[10px] text-gray-400">Network I/O</div>
                  </div>
                </div>
              </div>

              {/* Purpose & Parent mapping snippet */}
              <div className="pt-2 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs text-gray-400">
                <div className="flex items-center gap-1.5 truncate max-w-xl">
                  <CornerDownRight className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>
                    Parent: <strong className="text-gray-200">{proc.parentName}</strong>
                  </span>
                  <span className="text-gray-400 mx-1">•</span>
                  <span className="truncate text-gray-300" title={proc.purposeExplanation}>
                    {proc.purposeExplanation}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-gray-400 flex items-center gap-1 font-mono">
                    <Layers className="w-3 h-3 text-gray-400" /> {proc.threads} threads
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProcess(proc);
                    }}
                    className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 text-[11px] font-medium"
                  >
                    Inspect
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
