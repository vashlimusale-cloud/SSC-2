import React, { useState } from 'react';
import {
  SlidersHorizontal,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Lock,
} from 'lucide-react';
import { useSystemCommand } from '../../context/SystemCommandContext';
import { OptimizationItem } from '../../types/system';
import { FluentCard, fluentStaggerContainer } from '../FluentMotion';
import { motion, AnimatePresence } from 'motion/react';

export const OptimizeView: React.FC = () => {
  const { optimizations, applyOptimizationWithApproval, metrics } = useSystemCommand();
  const [confirmOpt, setConfirmOpt] = useState<OptimizationItem | null>(null);

  const appliedCount = optimizations.filter((o) => o.applied).length;

  const handleTrigger = (opt: OptimizationItem) => {
    if (!opt.applied) {
      setConfirmOpt(opt);
    } else {
      // Reverting an already applied optimization
      applyOptimizationWithApproval(opt.id);
    }
  };

  const confirmExecution = () => {
    if (confirmOpt) {
      applyOptimizationWithApproval(confirmOpt.id);
      setConfirmOpt(null);
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
            <SlidersHorizontal className="w-5 h-5 text-[#a855f7]" />
            Performance Analyzer &amp; Confirmed Optimization Center
          </h1>
          <p className="text-xs text-[#a1a1aa] mt-0.5">
            Transparent, reversible optimizations with before/after measurements and explicit user confirmation
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-[#10b981]/15 border border-[#10b981]/30 text-xs font-bold text-[#10b981]">
          {appliedCount} / {optimizations.length} Optimizations Active
        </div>
      </div>

      {/* Policy Notice (Section 7) */}
      <div className="p-3.5 rounded-2xl bg-[#171619] border border-white/[0.08] text-xs text-[#a1a1aa] flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-[#a855f7] shrink-0 mt-0.5" />
        <div>
          <strong className="text-white">Zero Automatic Destructive Cleanup:</strong> Every suggestion below documents what it changes, why it is recommended, potential side effects, and whether Administrator privileges are required. Nothing is changed without your confirmation.
        </div>
      </div>

      {/* Live Telemetry Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FluentCard interactive={false} accentColor="purple" className="p-4">
          <div className="text-xs text-[#71717a]">Current CPU Utilization</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">
            {metrics.cpuTotalPercent}% ({metrics.cpuTempCelsius}°C)
          </div>
        </FluentCard>
        <FluentCard interactive={false} accentColor="emerald" className="p-4">
          <div className="text-xs text-[#71717a]">Active Memory Working Set</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">
            {metrics.ramUsedGB} GB / {metrics.ramTotalGB} GB
          </div>
        </FluentCard>
        <FluentCard interactive={false} accentColor="blue" className="p-4">
          <div className="text-xs text-[#71717a]">Reversible Profiles</div>
          <div className="text-2xl font-bold text-[#10b981] font-mono mt-1">
            100% Restorable
          </div>
        </FluentCard>
      </div>

      {/* Optimization Cards */}
      <div className="space-y-3.5">
        {optimizations.map((opt) => (
          <FluentCard
            key={opt.id}
            interactive={false}
            accentColor={opt.applied ? 'emerald' : 'purple'}
            className="p-5 space-y-3"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-white">{opt.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-[#a1a1aa] font-mono">
                    {opt.category}
                  </span>
                  {opt.requiresAdmin && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Requires Admin
                    </span>
                  )}
                  {opt.applied && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#10b981]/20 text-[#10b981] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Applied
                    </span>
                  )}
                </div>
                <div className="text-xs text-[#10b981] font-semibold">
                  Estimated Gain: {opt.estimatedGain}
                </div>
              </div>

              {/* Before / After Pill & Action Button */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="px-3 py-1.5 rounded-xl bg-[#09090b] border border-white/10 text-[11px] font-mono flex items-center gap-2">
                  <span className="text-[#a1a1aa]">{opt.beforeMetric}</span>
                  <ArrowRight className="w-3 h-3 text-[#10b981]" />
                  <span className="text-[#10b981] font-bold">{opt.afterMetric}</span>
                </div>

                <button
                  onClick={() => handleTrigger(opt)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    opt.applied
                      ? 'bg-[#222026] hover:bg-[#2c2933] text-white border border-white/10 flex items-center gap-1.5'
                      : 'bg-[#10b981] hover:bg-[#059669] text-[#09090b]'
                  }`}
                >
                  {opt.applied ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" /> Revert
                    </>
                  ) : (
                    'Review & Apply'
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-[#09090b] border border-white/[0.05]">
                <div className="text-[10px] uppercase font-bold text-[#71717a] mb-1">
                  What It Changes
                </div>
                <p className="text-[#d4d4d8] leading-relaxed">{opt.whatItChanges}</p>
              </div>
              <div className="p-3 rounded-xl bg-[#09090b] border border-white/[0.05]">
                <div className="text-[10px] uppercase font-bold text-[#71717a] mb-1">
                  Why It Is Suggested
                </div>
                <p className="text-[#d4d4d8] leading-relaxed">{opt.whySuggested}</p>
              </div>
              <div className="p-3 rounded-xl bg-[#09090b] border border-white/[0.05]">
                <div className="text-[10px] uppercase font-bold text-amber-400/90 mb-1">
                  Potential Risks &amp; Reversibility
                </div>
                <p className="text-[#d4d4d8] leading-relaxed">{opt.potentialRisks}</p>
              </div>
            </div>
          </FluentCard>
        ))}
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmOpt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl bg-[#171619] border border-[#a855f7]/40 p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-2.5 text-white font-bold text-base">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Confirm System Optimization
              </div>

              <div className="space-y-2 text-xs text-[#d4d4d8]">
                <div className="font-bold text-white text-sm">{confirmOpt.title}</div>
                <p>
                  <strong>Action:</strong> {confirmOpt.whatItChanges}
                </p>
                <p>
                  <strong>Risk Assessment:</strong> {confirmOpt.potentialRisks}
                </p>
                {confirmOpt.requiresAdmin && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
                    Administrator privileges are required to modify this system service configuration.
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setConfirmOpt(null)}
                  className="px-4 py-2 rounded-xl bg-[#222026] hover:bg-[#2c2933] text-xs font-semibold text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmExecution}
                  className="px-4 py-2 rounded-xl bg-[#10b981] hover:bg-[#059669] text-[#09090b] text-xs font-bold cursor-pointer"
                >
                  Approve &amp; Apply Optimization
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
