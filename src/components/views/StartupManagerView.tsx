import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { useSystemCommand } from '../../context/SystemCommandContext';
import { StartupItem } from '../../types/system';
import {
  FluentCard,
  FLUENT_SPRING,
  fluentStaggerContainer,
} from '../FluentMotion';

export const StartupManagerView: React.FC = () => {
  const { startupItems, toggleStartupItemWithApproval } = useSystemCommand();
  const [confirmItem, setConfirmItem] = useState<StartupItem | null>(null);

  const enabledCount = startupItems.filter((s) => s.enabled).length;
  const totalBootDelayMs = startupItems
    .filter((s) => s.enabled)
    .reduce((acc, s) => acc + s.bootTimeImpactMs, 0);

  const handleToggleClick = (item: StartupItem) => {
    // If disabling, ask for explicit approval
    if (item.enabled) {
      setConfirmItem(item);
    } else {
      toggleStartupItemWithApproval(item.id);
    }
  };

  const confirmDisable = () => {
    if (confirmItem) {
      toggleStartupItemWithApproval(confirmItem.id);
      setConfirmItem(null);
    }
  };

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
            <Zap className="w-5 h-5 text-amber-400" />
            Startup Application Manager
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Optimize Windows 11 boot sequence, disable autostart applications with full Undo recovery
          </p>
        </div>

        {/* Boot impact badge */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-1.5 font-medium">
            <Clock className="w-4 h-4 text-amber-400" />
            Boot Delay: <strong>{(totalBootDelayMs / 1000).toFixed(2)}s</strong> ({enabledCount} active apps)
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <FluentCard accentColor="amber" className="p-3.5 rounded-xl">
          <div className="text-xs text-gray-400">Total Startup Entries</div>
          <div className="text-xl font-bold text-white mt-1">{startupItems.length} Programs</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Registry & Task Scheduler</div>
        </FluentCard>

        <FluentCard accentColor="emerald" className="p-3.5 rounded-xl">
          <div className="text-xs text-gray-400">Active Enabled</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{enabledCount} Enabled</div>
          <div className="text-[11px] text-emerald-300/70">Launching at user logon</div>
        </FluentCard>

        <FluentCard accentColor="blue" className="p-3.5 rounded-xl">
          <div className="text-xs text-gray-400">Disabled / Optimized</div>
          <div className="text-xl font-bold text-blue-400 mt-1">
            {startupItems.length - enabledCount} Disabled
          </div>
          <div className="text-[11px] text-blue-300/70">Ready to restore anytime</div>
        </FluentCard>
      </div>

      {/* Startup Items List */}
      <FluentCard
        interactive={false}
        accentColor="amber"
        className="rounded-xl overflow-hidden"
      >
        <div className="p-3 border-b border-white/10 bg-white/[0.02] flex items-center justify-between text-xs text-gray-400">
          <span>Configured Startup Programs</span>
          <span>Click switch to enable or disable with user confirmation</span>
        </div>

        <div className="divide-y divide-white/5">
          {startupItems.map((item) => {
            const isHigh = item.impact === 'High';
            const isMedium = item.impact === 'Medium';
            return (
              <motion.div
                key={item.id}
                whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                transition={{ duration: 0.14 }}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                {/* Details */}
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm tracking-wide">
                      {item.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-300 font-mono">
                      {item.location}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                        item.category === 'Review Required'
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {item.category}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed">{item.description}</p>

                  <div className="flex items-center gap-3 text-[11px] text-gray-400 pt-0.5">
                    <span>Publisher: <strong className="text-gray-200">{item.publisher}</strong></span>
                    <span>•</span>
                    <span className="font-mono text-[10px] truncate max-w-xs" title={item.command}>
                      {item.command}
                    </span>
                  </div>
                </div>

                {/* Right Controls: Impact Badge & Toggle */}
                <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end">
                  <div className="text-right">
                    <span
                      className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded ${
                        isHigh
                          ? 'bg-rose-500/20 text-rose-300'
                          : isMedium
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {item.impact} Impact (~{item.bootTimeImpactMs}ms)
                    </span>
                    <div className="text-[10px] text-gray-400 mt-0.5">Startup Latency</div>
                  </div>

                  {/* Toggle Button */}
                  <button
                    onClick={() => handleToggleClick(item)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      item.enabled ? 'bg-blue-600' : 'bg-gray-700'
                    }`}
                    role="switch"
                    aria-checked={item.enabled}
                    aria-label={`Toggle startup for ${item.name}`}
                  >
                    <motion.span
                      layout
                      transition={FLUENT_SPRING}
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 ${
                        item.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </FluentCard>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={FLUENT_SPRING}
              className="w-full max-w-md win-card bg-[#1a1e2a] border border-amber-500/40 rounded-xl p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Confirm Startup Application Disabling
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Are you sure you want to disable <strong>{confirmItem.name}</strong> from launching automatically on Windows startup?
              </p>
              <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-xs text-gray-300 space-y-1">
                <div>Estimated Boot Time Saved: <strong className="text-emerald-400">~{confirmItem.bootTimeImpactMs} ms</strong></div>
                <div>Publisher: {confirmItem.publisher}</div>
                <div className="text-[11px] text-gray-400">
                  You can easily re-enable this application at any time with the switch or via Activity History Undo.
                </div>
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setConfirmItem(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-gray-200 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDisable}
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-lg cursor-pointer"
                >
                  Approve & Disable
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
