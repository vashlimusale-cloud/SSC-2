import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  X,
  Cpu,
  HardDrive,
  Cloud,
  CornerDownLeft,
  Lock,
  Terminal,
  Wrench,
} from 'lucide-react';
import { useSystemCommand, ActiveView } from '../context/SystemCommandContext';
import { FLUENT_SPRING } from './FluentMotion';

interface QuickToolAction {
  id: string;
  title: string;
  subtitle: string;
  targetView: ActiveView;
}

const QUICK_TOOL_ACTIONS: QuickToolAction[] = [
  {
    id: 'tool-gdrive',
    title: 'Mount / Manage Google Drive G:',
    subtitle: 'WinFsp Virtual Drive • gdrive:Laptop_Full_Backup/C_Drive_User',
    targetView: 'google_drive',
  },
  {
    id: 'tool-cmd',
    title: 'Local Command Execution Center',
    subtitle: 'Run verified rclone & Windows diagnostics with safety preview',
    targetView: 'command_center',
  },
  {
    id: 'tool-opt',
    title: 'Performance Optimization Center',
    subtitle: 'Review confirmed CPU, RAM & Startup optimizations',
    targetView: 'optimize',
  },
  {
    id: 'tool-transfers',
    title: 'Resumable Transfer Queue',
    subtitle: 'Monitor rclone copy progress, speed & SHA-256 verification',
    targetView: 'transfers',
  },
  {
    id: 'tool-mypc',
    title: 'My PC Hardware & Thermal Overview',
    subtitle: 'Ryzen 9 7950X3D, RTX 4090, 32GB DDR5, 2TB 990 PRO',
    targetView: 'my_pc',
  },
];

export const QuickCommandOverlay: React.FC = () => {
  const {
    isQuickOverlayOpen,
    setIsQuickOverlayOpen,
    processes,
    metrics,
    setActiveView,
    terminateProcessWithApproval,
    setSelectedProcess,
  } = useSystemCommand();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'apps' | 'daemons' | 'tools'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isQuickOverlayOpen) {
      setSelectedIndex(0);
      setSearchQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isQuickOverlayOpen]);

  const filteredProcesses = useMemo(() => {
    if (activeTab === 'tools') return [];
    const q = searchQuery.toLowerCase();
    return processes
      .filter((p) => {
        if (activeTab === 'apps' && p.status !== 'Foreground Application') return false;
        if (activeTab === 'daemons' && p.status === 'Foreground Application') return false;
        if (!q.trim()) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          p.appAssociation.toLowerCase().includes(q) ||
          p.publisher.toLowerCase().includes(q) ||
          p.pid.toString().includes(q)
        );
      })
      .slice(0, 8);
  }, [processes, searchQuery, activeTab]);

  const filteredTools = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return QUICK_TOOL_ACTIONS.filter(
      (t) =>
        !q.trim() ||
        t.title.toLowerCase().includes(q) ||
        t.subtitle.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const totalItemsCount =
    activeTab === 'tools' ? filteredTools.length : filteredProcesses.length;

  useEffect(() => {
    if (selectedIndex >= totalItemsCount && totalItemsCount > 0) {
      setSelectedIndex(totalItemsCount - 1);
    }
  }, [totalItemsCount, selectedIndex]);

  useEffect(() => {
    if (!isQuickOverlayOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, totalItemsCount));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev <= 0 ? Math.max(0, totalItemsCount - 1) : prev - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeTab === 'tools') {
          const tool = filteredTools[selectedIndex];
          if (tool) {
            setActiveView(tool.targetView);
            setIsQuickOverlayOpen(false);
          }
        } else {
          const selected = filteredProcesses[selectedIndex];
          if (selected) {
            setSelectedProcess(selected);
            setIsQuickOverlayOpen(false);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isQuickOverlayOpen,
    activeTab,
    filteredProcesses,
    filteredTools,
    totalItemsCount,
    selectedIndex,
    setSelectedProcess,
    setActiveView,
    setIsQuickOverlayOpen,
  ]);

  const handleQuickJump = (view: ActiveView) => {
    setActiveView(view);
    setIsQuickOverlayOpen(false);
  };

  return (
    <AnimatePresence>
      {isQuickOverlayOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14 }}
          className="fixed inset-0 z-50 bg-black/75 flex items-start justify-center pt-16 p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={FLUENT_SPRING}
            className="w-full max-w-2xl rounded-2xl border border-[#a855f7]/35 shadow-2xl overflow-hidden bg-[#171619]"
          >
            {/* Top Search Input */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-1 bg-[#09090b] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm">
                <Search className="w-4 h-4 text-[#a855f7] shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  placeholder="Search processes, apps, tools, rclone commands, PID..."
                  className="bg-transparent border-none text-white focus:outline-none w-full text-xs placeholder-[#71717a]"
                />
              </div>
              <button
                onClick={() => setIsQuickOverlayOpen(false)}
                className="p-2 rounded-xl hover:bg-white/10 text-[#a1a1aa] hover:text-white transition-colors cursor-pointer"
                aria-label="Close Quick Overlay"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Telemetry Strip */}
            <div className="px-4 py-2 bg-[#09090b]/60 border-b border-white/5 flex items-center justify-between text-[11px] text-[#a1a1aa]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-[#a855f7]" />
                  CPU: <strong className="text-white">{metrics.cpuTotalPercent}%</strong> ({metrics.cpuTempCelsius}°C)
                </span>
                <span className="flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-sky-400" />
                  RAM: <strong className="text-white">{metrics.ramUsedGB} GB</strong> / {metrics.ramTotalGB} GB
                </span>
                <span className="flex items-center gap-1">
                  <Cloud className="w-3 h-3 text-[#10b981]" />
                  GDrive: <strong className="text-[#10b981]">G: Mounted</strong>
                </span>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-[#71717a] font-mono">
                <span><kbd className="bg-white/10 px-1 rounded">↑↓</kbd> Select</span>
                <span><kbd className="bg-white/10 px-1 rounded">↵</kbd> Open</span>
                <span><kbd className="bg-white/10 px-1 rounded">Esc</kbd> Close</span>
              </div>
            </div>

            {/* Category Tabs & Quick Page Jumps */}
            <div className="p-3 border-b border-white/5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1 text-xs">
                {(['all', 'apps', 'daemons', 'tools'] as const).map((tabKey) => {
                  const label =
                    tabKey === 'all'
                      ? 'All Processes'
                      : tabKey === 'apps'
                      ? 'Apps'
                      : tabKey === 'daemons'
                      ? 'Daemons'
                      : 'Tools & Commands';
                  const isActive = activeTab === tabKey;
                  return (
                    <button
                      key={tabKey}
                      onClick={() => {
                        setActiveTab(tabKey);
                        setSelectedIndex(0);
                      }}
                      className={`relative px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer text-xs ${
                        isActive ? 'text-[#09090b]' : 'text-[#a1a1aa] hover:text-white'
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="hud-active-tab"
                          transition={FLUENT_SPRING}
                          className="absolute inset-0 rounded-lg bg-[#10b981] -z-0"
                        />
                      )}
                      <span className="relative z-10">{label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <button
                  onClick={() => handleQuickJump('overview')}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#d4d4d8] text-[11px] cursor-pointer"
                >
                  Home
                </button>
                <button
                  onClick={() => handleQuickJump('google_drive')}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#d4d4d8] text-[11px] cursor-pointer"
                >
                  G: Drive
                </button>
                <button
                  onClick={() => handleQuickJump('command_center')}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#d4d4d8] text-[11px] cursor-pointer"
                >
                  Command CLI
                </button>
              </div>
            </div>

            {/* Results List */}
            <div className="p-3 max-h-80 overflow-y-auto space-y-1">
              {activeTab === 'tools' ? (
                filteredTools.map((tool, idx) => {
                  const isSelected = selectedIndex === idx;
                  return (
                    <div
                      key={tool.id}
                      onClick={() => {
                        setActiveView(tool.targetView);
                        setIsQuickOverlayOpen(false);
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#a855f7]/20 border-[#a855f7]/50'
                          : 'bg-[#09090b] border-white/5 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Wrench className="w-4 h-4 text-[#10b981]" />
                        <div>
                          <div className="text-xs font-bold text-white">{tool.title}</div>
                          <div className="text-[11px] text-[#71717a]">{tool.subtitle}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-[#10b981] bg-white/5 px-2 py-0.5 rounded">
                        ↵ Launch
                      </span>
                    </div>
                  );
                })
              ) : filteredProcesses.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#71717a]">
                  No matching processes found for &quot;{searchQuery}&quot;
                </div>
              ) : (
                filteredProcesses.map((proc, idx) => {
                  const isSelected = selectedIndex === idx;
                  return (
                    <div
                      key={proc.pid}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#a855f7]/20 border-[#a855f7]/50'
                          : 'bg-[#09090b] border-white/5 hover:bg-white/5'
                      }`}
                      onClick={() => {
                        setSelectedProcess(proc);
                        setIsQuickOverlayOpen(false);
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            proc.category === 'Protected System Process'
                              ? 'bg-rose-500'
                              : proc.category === 'Review Required'
                              ? 'bg-amber-400'
                              : 'bg-[#10b981]'
                          }`}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span className="truncate">{proc.name}</span>
                            <span className="text-[10px] text-[#71717a] font-mono">
                              PID {proc.pid}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#71717a] truncate">
                            {proc.appAssociation} • {proc.ramMB.toFixed(0)} MB RAM • {proc.cpuPercent}% CPU
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {proc.category === 'Protected System Process' ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Protected
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              terminateProcessWithApproval(proc.pid);
                            }}
                            className="text-[11px] px-2 py-1 rounded bg-rose-600/20 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-500/30 transition-colors cursor-pointer"
                          >
                            End Task
                          </button>
                        )}

                        <span className="text-[#a1a1aa] text-[10px] font-mono flex items-center gap-0.5 bg-white/5 px-1.5 py-0.5 rounded">
                          <CornerDownLeft className="w-2.5 h-2.5" /> Inspect
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
