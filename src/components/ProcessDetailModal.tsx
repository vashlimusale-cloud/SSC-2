import React, { useState } from 'react';
import {
  X,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Cpu,
  HardDrive,
  Activity,
  Network,
  Folder,
  FileCheck,
  Clock,
  Layers,
  Info,
  Lock,
  Trash2,
} from 'lucide-react';
import { useSystemCommand } from '../context/SystemCommandContext';
import { checkTerminationSafety, formatNetworkSpeed, formatDuration } from '../utils/systemIntelligence';

export const ProcessDetailModal: React.FC = () => {
  const { selectedProcess, setSelectedProcess, terminateProcessWithApproval } = useSystemCommand();
  const [showConfirm, setShowConfirm] = useState(false);

  if (!selectedProcess) return null;

  const safety = checkTerminationSafety(selectedProcess);

  const getRiskBadge = () => {
    switch (selectedProcess.category) {
      case 'Protected System Process':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <Lock className="w-3.5 h-3.5 text-rose-400" />
            Protected System Process
          </span>
        );
      case 'Review Required':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Review Required
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Safe Optional
          </span>
        );
    }
  };

  const handleTerminateClick = () => {
    if (!safety.allowed) return;
    setShowConfirm(true);
  };

  const confirmTermination = () => {
    terminateProcessWithApproval(selectedProcess.pid);
    setShowConfirm(false);
    setSelectedProcess(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl win-card rounded-xl border border-white/20 bg-[#161a24] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  {selectedProcess.name}
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/10 text-gray-300">
                  PID: {selectedProcess.pid}
                </span>
                {getRiskBadge()}
              </div>
              <p className="text-xs text-gray-400">{selectedProcess.appAssociation}</p>
            </div>
          </div>
          <button
            onClick={() => setSelectedProcess(null)}
            className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close process details modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-gray-300">
          {/* Architectural Purpose Card */}
          <div className="p-3.5 rounded-lg bg-white/5 border border-white/10 space-y-1.5">
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs">
              <Info className="w-4 h-4" />
              Windows 11 Architectural Purpose & Function
            </div>
            <p className="text-gray-300 leading-relaxed text-xs">
              {selectedProcess.purposeExplanation}
            </p>
          </div>

          {/* Performance & Resource Telemetry Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
              <div className="text-[10px] text-gray-400 uppercase font-medium flex items-center gap-1">
                <Cpu className="w-3 h-3 text-amber-400" /> CPU Usage
              </div>
              <div className="text-base font-bold text-white mt-1">
                {selectedProcess.cpuPercent.toFixed(1)}%
              </div>
              <div className="text-[10px] text-gray-400">{selectedProcess.threads} active threads</div>
            </div>

            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
              <div className="text-[10px] text-gray-400 uppercase font-medium flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-blue-400" /> RAM Footprint
              </div>
              <div className="text-base font-bold text-white mt-1">
                {selectedProcess.ramMB >= 1024
                  ? `${(selectedProcess.ramMB / 1024).toFixed(2)} GB`
                  : `${selectedProcess.ramMB.toFixed(0)} MB`}
              </div>
              <div className="text-[10px] text-gray-400">Working Set memory</div>
            </div>

            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
              <div className="text-[10px] text-gray-400 uppercase font-medium flex items-center gap-1">
                <Network className="w-3 h-3 text-emerald-400" /> Network Activity
              </div>
              <div className="text-base font-bold text-white mt-1">
                {formatNetworkSpeed(selectedProcess.networkKbps)}
              </div>
              <div className="text-[10px] text-gray-400">Disk I/O: {selectedProcess.diskKbps} KB/s</div>
            </div>

            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
              <div className="text-[10px] text-gray-400 uppercase font-medium flex items-center gap-1">
                <Activity className="w-3 h-3 text-purple-400" /> GPU Load
              </div>
              <div className="text-base font-bold text-white mt-1">
                {selectedProcess.gpuPercent.toFixed(1)}%
              </div>
              <div className="text-[10px] text-gray-400">{selectedProcess.handles} OS handles</div>
            </div>
          </div>

          {/* Detailed Windows Properties Table */}
          <div className="border border-white/10 rounded-lg overflow-hidden divide-y divide-white/5 bg-white/[0.02]">
            <div className="px-3 py-2 flex items-center justify-between text-xs">
              <span className="text-gray-400 flex items-center gap-2">
                <Folder className="w-3.5 h-3.5 text-blue-400" /> Executable Path
              </span>
              <span className="font-mono text-gray-200 text-right truncate max-w-sm" title={selectedProcess.exePath}>
                {selectedProcess.exePath}
              </span>
            </div>

            <div className="px-3 py-2 flex items-center justify-between text-xs">
              <span className="text-gray-400 flex items-center gap-2">
                <FileCheck className="w-3.5 h-3.5 text-purple-400" /> Publisher
              </span>
              <span className="font-medium text-gray-200 text-right">{selectedProcess.publisher}</span>
            </div>

            <div className="px-3 py-2 flex items-center justify-between text-xs">
              <span className="text-gray-400 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Digital Signature
              </span>
              <span
                className={`text-right font-medium ${
                  selectedProcess.isSignatureValid ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {selectedProcess.digitalSignature}
              </span>
            </div>

            <div className="px-3 py-2 flex items-center justify-between text-xs">
              <span className="text-gray-400 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-cyan-400" /> Parent Process
              </span>
              <span className="font-medium text-gray-200 text-right">{selectedProcess.parentName}</span>
            </div>

            <div className="px-3 py-2 flex items-center justify-between text-xs">
              <span className="text-gray-400 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-indigo-400" /> Process Classification
              </span>
              <span className="font-medium text-gray-200 text-right">{selectedProcess.status}</span>
            </div>

            <div className="px-3 py-2 flex items-center justify-between text-xs">
              <span className="text-gray-400 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> Startup Registration
              </span>
              <span className="font-medium text-gray-200 text-right">{selectedProcess.startupStatus}</span>
            </div>
          </div>

          {/* Protection Safety Warning Box */}
          {!safety.allowed ? (
            <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
              <Lock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-200 space-y-1">
                <div className="font-semibold text-rose-300">Protected System Process Enforcement</div>
                <div>{safety.reason}</div>
                <div className="text-[11px] text-rose-300/80">
                  Per system design guidelines, termination is strictly locked to prevent kernel corruption and unintended session termination.
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <strong>RAM Assessment Notice:</strong> Never assume that a process is unnecessary merely because it consumes RAM.
                Terminating applications will close unsaved user sessions.
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
          <div className="text-[11px] text-gray-400">
            Selected PID: <strong className="text-gray-200">{selectedProcess.pid}</strong>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSelectedProcess(null)}
              className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Close
            </button>

            {safety.allowed ? (
              <button
                onClick={handleTerminateClick}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Terminate Process...
              </button>
            ) : (
              <button
                disabled
                className="px-3.5 py-1.5 rounded-lg bg-gray-800 text-gray-500 text-xs font-semibold flex items-center gap-1.5 cursor-not-allowed border border-white/5"
                title="Protected System Process: Cannot be terminated"
              >
                <Lock className="w-3.5 h-3.5" />
                Termination Blocked
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Sub-Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md win-card bg-[#1a1e2a] border border-red-500/40 rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Confirm Process Termination
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to terminate <strong>{selectedProcess.name}</strong> (PID {selectedProcess.pid})?
              Any unsaved work inside this application will be lost.
            </p>
            <div className="p-2.5 rounded bg-white/5 border border-white/5 text-[11px] text-gray-400">
              Freed Memory: <strong>{selectedProcess.ramMB.toFixed(0)} MB</strong>. An undo checkpoint will be created in Activity History.
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-gray-200 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmTermination}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg cursor-pointer"
              >
                Yes, Terminate Process
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
