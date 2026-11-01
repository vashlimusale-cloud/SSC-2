import React, { useState, useMemo } from 'react';
import {
  AppWindow,
  Search,
  Filter,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Trash2,
  Info,
  CheckCircle2,
  ArrowUpDown,
} from 'lucide-react';
import { useSystemCommand } from '../../context/SystemCommandContext';
import { ProcessInfo, RiskCategory } from '../../types/system';
import { checkTerminationSafety, formatNetworkSpeed } from '../../utils/systemIntelligence';

export const RunningAppsView: React.FC = () => {
  const { processes, setSelectedProcess, terminateProcessWithApproval } = useSystemCommand();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'ram' | 'cpu' | 'name' | 'pid'>('ram');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [confirmPid, setConfirmPid] = useState<number | null>(null);

  // Filter running foreground / user applications
  const filteredProcesses = useMemo(() => {
    return processes
      .filter((p) => {
        // Match user applications or foreground applications
        const matchesCategory =
          selectedCategory === 'all' || p.category === selectedCategory;

        const q = search.toLowerCase();
        const matchesSearch =
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.appAssociation.toLowerCase().includes(q) ||
          p.publisher.toLowerCase().includes(q) ||
          p.pid.toString().includes(q);

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        let valA: any = a.ramMB;
        let valB: any = b.ramMB;

        if (sortBy === 'cpu') {
          valA = a.cpuPercent;
          valB = b.cpuPercent;
        } else if (sortBy === 'name') {
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
        } else if (sortBy === 'pid') {
          valA = a.pid;
          valB = b.pid;
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [processes, search, selectedCategory, sortBy, sortOrder]);

  const toggleSort = (field: 'ram' | 'cpu' | 'name' | 'pid') => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleEndTaskClick = (e: React.MouseEvent, proc: ProcessInfo) => {
    e.stopPropagation();
    const safety = checkTerminationSafety(proc);
    if (!safety.allowed) {
      setSelectedProcess(proc);
      return;
    }
    setConfirmPid(proc.pid);
  };

  const executeTermination = () => {
    if (confirmPid !== null) {
      terminateProcessWithApproval(confirmPid);
      setConfirmPid(null);
    }
  };

  const targetConfirmProc = processes.find((p) => p.pid === confirmPid);

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <AppWindow className="w-5 h-5 text-blue-400" />
            Running Applications & Process Intelligence
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Real-time process telemetry, publisher verification, and user-approved termination
          </p>
        </div>

        {/* Search & Category Filter Toolbar */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search process, publisher, PID..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 w-56"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-200 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">All Classifications</option>
            <option value="Safe Optional">Safe Optional</option>
            <option value="Review Required">Review Required</option>
            <option value="Protected System Process">Protected System Process</option>
          </select>
        </div>
      </div>

      {/* Safety Policy Notice */}
      <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <strong>Intelligence Rule:</strong> Every process displays verified executable path, parent process mapping, and digital signature status.
          Protected System Processes (marked in red/purple) cannot be terminated to preserve Windows stability.
          High RAM usage alone does not qualify a process as unnecessary.
        </div>
      </div>

      {/* Process Table */}
      <div className="win-card rounded-xl border border-white/10 overflow-hidden bg-[#161a24]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="text-[11px] uppercase tracking-wider text-gray-400 border-b border-white/10 bg-white/[0.03]">
              <tr>
                <th
                  className="py-3 px-3 cursor-pointer hover:text-white"
                  onClick={() => toggleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Process Name & App <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="py-3 px-2 cursor-pointer hover:text-white"
                  onClick={() => toggleSort('pid')}
                >
                  <div className="flex items-center gap-1">
                    PID <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Publisher & Signature</th>
                <th className="py-3 px-3">Parent Process</th>
                <th
                  className="py-3 px-3 text-right cursor-pointer hover:text-white"
                  onClick={() => toggleSort('ram')}
                >
                  <div className="flex items-center justify-end gap-1">
                    RAM Footprint <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="py-3 px-3 text-right cursor-pointer hover:text-white"
                  onClick={() => toggleSort('cpu')}
                >
                  <div className="flex items-center justify-end gap-1">
                    CPU % <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 text-right">Network</th>
                <th className="py-3 px-3 text-center">Risk Classification</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-normal">
              {filteredProcesses.map((proc) => {
                const safety = checkTerminationSafety(proc);
                return (
                  <tr
                    key={proc.pid}
                    className="hover:bg-white/5 transition-colors cursor-pointer group"
                    onClick={() => setSelectedProcess(proc)}
                  >
                    {/* Process Name & App Association */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            proc.category === 'Protected System Process'
                              ? 'bg-rose-500'
                              : proc.category === 'Review Required'
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          }`}
                        />
                        <div>
                          <div className="font-semibold text-white tracking-wide group-hover:text-blue-300 transition-colors">
                            {proc.name}
                          </div>
                          <div className="text-[11px] text-gray-400 truncate max-w-xs">
                            {proc.appAssociation}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* PID */}
                    <td className="py-3 px-2 font-mono text-gray-400">{proc.pid}</td>

                    {/* Publisher & Signature */}
                    <td className="py-3 px-3">
                      <div className="text-gray-200 font-medium truncate max-w-[160px]">{proc.publisher}</div>
                      <div
                        className={`text-[10px] flex items-center gap-1 ${
                          proc.isSignatureValid ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {proc.isSignatureValid ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <AlertTriangle className="w-3 h-3" />
                        )}
                        <span className="truncate max-w-[150px]">{proc.digitalSignature}</span>
                      </div>
                    </td>

                    {/* Parent Process */}
                    <td className="py-3 px-3 text-gray-300">
                      <span className="font-mono text-[11px] bg-white/5 px-1.5 py-0.5 rounded text-gray-300">
                        {proc.parentName}
                      </span>
                    </td>

                    {/* RAM */}
                    <td className="py-3 px-3 text-right font-medium text-white font-mono">
                      {proc.ramMB >= 1024
                        ? `${(proc.ramMB / 1024).toFixed(2)} GB`
                        : `${proc.ramMB.toFixed(0)} MB`}
                    </td>

                    {/* CPU */}
                    <td className="py-3 px-3 text-right font-mono text-gray-300">
                      {proc.cpuPercent.toFixed(1)}%
                    </td>

                    {/* Network */}
                    <td className="py-3 px-3 text-right font-mono text-gray-400">
                      {formatNetworkSpeed(proc.networkKbps)}
                    </td>

                    {/* Classification */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${
                          proc.category === 'Protected System Process'
                            ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                            : proc.category === 'Review Required'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {proc.category === 'Protected System Process' && <Lock className="w-2.5 h-2.5" />}
                        {proc.category === 'Review Required' && <AlertTriangle className="w-2.5 h-2.5" />}
                        {proc.category === 'Safe Optional' && <ShieldCheck className="w-2.5 h-2.5" />}
                        {proc.category}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      {safety.allowed ? (
                        <button
                          onClick={(e) => handleEndTaskClick(e, proc)}
                          className="px-2.5 py-1 rounded bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white text-[11px] font-medium border border-red-500/30 transition-colors cursor-pointer"
                        >
                          End Task
                        </button>
                      ) : (
                        <span
                          className="text-[10px] text-gray-400 font-mono px-2 py-0.5 rounded bg-white/5 cursor-not-allowed"
                          title="Protected System Process: Termination Blocked"
                        >
                          Locked
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmPid !== null && targetConfirmProc && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md win-card bg-[#1a1e2a] border border-red-500/40 rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-red-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              User Approval Required: Terminate Process
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to terminate <strong>{targetConfirmProc.name}</strong> (PID {targetConfirmProc.pid})?
            </p>
            <div className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1 text-xs">
              <div>Publisher: <strong className="text-white">{targetConfirmProc.publisher}</strong></div>
              <div>RAM to be freed: <strong className="text-white">{targetConfirmProc.ramMB.toFixed(0)} MB</strong></div>
              <div className="text-[11px] text-gray-400 mt-1">
                An undo entry will be created in Activity History so you can review or undo this change.
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setConfirmPid(null)}
                className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-gray-200 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={executeTermination}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg cursor-pointer"
              >
                Approve & Terminate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
