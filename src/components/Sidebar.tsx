import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutGrid,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  Cpu,
  Zap,
  Server,
  Activity,
  Wifi,
  HardDrive,
  Cloud,
  ArrowLeftRight,
  Wrench,
  Terminal,
  History,
  Settings,
  BookOpen,
  Monitor,
} from 'lucide-react';
import { useSystemCommand, ActiveView } from '../context/SystemCommandContext';
import { ThemePreset } from '../types/system';
import { FLUENT_SPRING } from './FluentMotion';

const THEMES: ThemePreset[] = ["Neo's Noir", 'Fluent Obsidian', 'Violet Pulse'];

export const Sidebar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    platformSettings,
    updatePlatformSettings,
    rcloneStatus,
    transfers,
  } = useSystemCommand();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [myPcExpanded, setMyPcExpanded] = useState(true);
  const [optimizeExpanded, setOptimizeExpanded] = useState(true);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);

  const activeTransfersCount = transfers.filter(
    (t) => t.status === 'transferring' || t.status === 'verifying'
  ).length;

  const myPcSubItems: { id: ActiveView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'my_pc', label: 'My PC Overview', icon: Monitor },
    { id: 'running_apps', label: 'Processes', icon: Cpu },
    { id: 'startup_manager', label: 'Startup Manager', icon: Zap },
    { id: 'services', label: 'Windows Services', icon: Server },
    { id: 'resource_monitor', label: 'Performance', icon: Activity },
  ];

  const optimizeTreeItems: {
    id: ActiveView;
    label: string;
    badge?: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'optimize', label: 'Optimize', icon: SlidersHorizontal },
    { id: 'network', label: 'Network', icon: Wifi },
    { id: 'storage_analyzer', label: 'Storage', icon: HardDrive },
    {
      id: 'google_drive',
      label: 'Google Drive',
      badge: rcloneStatus.mountedGDrive?.isMounted ? 'G:' : 'Off',
      icon: Cloud,
    },
    {
      id: 'transfers',
      label: 'Transfers',
      badge: activeTransfersCount > 0 ? `${activeTransfersCount}` : undefined,
      icon: ArrowLeftRight,
    },
    { id: 'tools', label: 'Tools', icon: Wrench },
    { id: 'command_center', label: 'Command Center', icon: Terminal },
    { id: 'activity_history', label: 'Activity History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'help_docs', label: 'Help & Docs', icon: BookOpen },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 68 : 244 }}
      transition={FLUENT_SPRING}
      className="h-screen bg-[#111013] border-r border-white/[0.06] flex flex-col justify-between p-3.5 select-none shrink-0 overflow-y-auto overflow-x-hidden"
    >
      {/* Top Section: Brand Logo + Home Pill + Expandable Tree Navigation */}
      <div className="space-y-4">
        {/* Brand Header (SCC beta) */}
        <div className="flex items-center justify-between px-1 pt-1">
          {!isCollapsed ? (
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-wider text-white">SCC</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30">
                beta
              </span>
            </div>
          ) : (
            <span className="text-base font-black text-white mx-auto">SCC</span>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-[#71717a] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Prominent Home Pill Button (Reference Image Authority) */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveView('overview')}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'
          } rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeView === 'overview'
              ? 'bg-gradient-to-r from-[#10b981]/20 via-[#10b981]/10 to-transparent border border-[#10b981]/40 text-white shadow-[0_0_20px_rgba(16,185,129,0.12)]'
              : 'bg-[#171619] border border-white/[0.06] text-[#a1a1aa] hover:text-white'
          }`}
          aria-label="Home"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#a855f7] to-[#10b981] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
            H
          </div>
          {!isCollapsed && <span>Home</span>}
        </motion.button>

        {/* MAIN Navigation Section */}
        <div className="space-y-1.5 pt-1">
          {!isCollapsed && (
            <div className="px-2 text-[10px] font-bold tracking-widest uppercase text-[#71717a]">
              MAIN
            </div>
          )}

          {/* Group 1: My PC */}
          <div>
            <button
              onClick={() => {
                if (isCollapsed) {
                  setActiveView('my_pc');
                } else {
                  setMyPcExpanded(!myPcExpanded);
                }
              }}
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center p-2.5' : 'justify-between px-2.5 py-2'
              } rounded-xl text-xs font-medium text-[#d4d4d8] hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer`}
            >
              <span className="flex items-center gap-2.5">
                <LayoutGrid className="w-4 h-4 text-[#a1a1aa]" />
                {!isCollapsed && <span>My PC</span>}
              </span>
              {!isCollapsed &&
                (myPcExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5 text-[#71717a]" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-[#71717a]" />
                ))}
            </button>

            <AnimatePresence initial={false}>
              {!isCollapsed && myPcExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.16 }}
                  className="ml-4 pl-3 border-l border-white/[0.08] space-y-0.5 mt-1 overflow-hidden"
                >
                  {myPcSubItems.map((item) => {
                    const isActive = activeView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        className={`relative w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                          isActive
                            ? 'text-white font-semibold bg-white/[0.06]'
                            : 'text-[#a1a1aa] hover:text-white hover:bg-white/[0.03]'
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span className="w-2 h-[1px] bg-white/20 -ml-3 mr-1" />
                          <span className="truncate">{item.label}</span>
                        </span>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Group 2: Optimize & System Modules Tree (Matches Reference Tree Connector) */}
          <div>
            <button
              onClick={() => {
                if (isCollapsed) {
                  setActiveView('optimize');
                } else {
                  setOptimizeExpanded(!optimizeExpanded);
                }
              }}
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center p-2.5' : 'justify-between px-2.5 py-2'
              } rounded-xl text-xs font-medium text-[#d4d4d8] hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer`}
            >
              <span className="flex items-center gap-2.5">
                <SlidersHorizontal className="w-4 h-4 text-[#a1a1aa]" />
                {!isCollapsed && <span>Optimize & Cloud</span>}
              </span>
              {!isCollapsed &&
                (optimizeExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5 text-[#71717a]" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-[#71717a]" />
                ))}
            </button>

            <AnimatePresence initial={false}>
              {!isCollapsed && optimizeExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.16 }}
                  className="ml-4 pl-3 border-l border-white/[0.08] space-y-0.5 mt-1 overflow-hidden"
                >
                  {optimizeTreeItems.map((item) => {
                    const isActive = activeView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        className={`relative w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                          isActive
                            ? 'text-white font-semibold bg-white/[0.06]'
                            : 'text-[#a1a1aa] hover:text-white hover:bg-white/[0.03]'
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span className="w-2 h-[1px] bg-white/20 -ml-3 mr-1" />
                          <span className="truncate">{item.label}</span>
                        </span>
                        {item.badge ? (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#10b981]/15 text-[#10b981]">
                            {item.badge}
                          </span>
                        ) : isActive ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#a855f7]" />
                        ) : null}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Bottom Section: Themes Selector & Need Help CTA Card (Reference Image Authority) */}
      {!isCollapsed ? (
        <div className="space-y-2.5 pt-4">
          {/* Themes Selector Card */}
          <div className="relative">
            <button
              onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
              className="w-full p-2.5 rounded-xl bg-[#171619] border border-white/[0.07] hover:border-white/[0.15] flex items-center justify-between text-left transition-colors cursor-pointer"
            >
              <div>
                <div className="text-[10px] text-[#71717a]">Themes</div>
                <div className="text-xs font-semibold text-white flex items-center gap-1.5 mt-0.5">
                  <span>{platformSettings.theme}</span>
                  <span className="w-3.5 h-3.5 rounded-full bg-[#10b981]/20 text-[#10b981] flex items-center justify-center">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#71717a]" />
            </button>

            {themeDropdownOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1.5 rounded-xl bg-[#1d1a20] border border-white/15 shadow-2xl p-1 z-30">
                {THEMES.map((themeName) => (
                  <button
                    key={themeName}
                    onClick={() => {
                      updatePlatformSettings({ theme: themeName });
                      setThemeDropdownOpen(false);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs text-left flex items-center justify-between hover:bg-white/10 text-gray-200 cursor-pointer"
                  >
                    <span>{themeName}</span>
                    {platformSettings.theme === themeName && (
                      <Check className="w-3 h-3 text-[#10b981]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Need Help Card with Emerald CTA */}
          <div className="p-3 rounded-xl bg-[#171619] border border-white/[0.07] space-y-2.5">
            <div>
              <div className="text-xs font-bold text-white">Need help?</div>
              <div className="text-[10px] text-[#71717a]">
                Complete manual &amp; rclone G: diagnostics
              </div>
            </div>
            <button
              onClick={() => setActiveView('help_docs')}
              className="w-full py-2 px-3 rounded-lg bg-[#10b981] hover:bg-[#059669] text-[#09090b] font-bold text-xs transition-colors cursor-pointer shadow-[0_0_16px_rgba(16,185,129,0.28)]"
            >
              Open Documentation
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setActiveView('help_docs')}
          className="p-2.5 rounded-xl bg-[#10b981]/20 text-[#10b981] flex justify-center cursor-pointer"
          title="Help & Documentation"
        >
          <BookOpen className="w-4 h-4" />
        </button>
      )}
    </motion.aside>
  );
};
