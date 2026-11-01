import React, { useState } from 'react';
import {
  Server,
  Search,
  Play,
  Square,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Layers,
  Info,
} from 'lucide-react';
import { useSystemCommand } from '../../context/SystemCommandContext';
import { WindowsService } from '../../types/system';

export const ServicesView: React.FC = () => {
  const { services, toggleServiceStatus } = useSystemCommand();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredServices = services.filter((svc) => {
    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'running' && svc.status === 'Running') ||
      (filterStatus === 'stopped' && svc.status === 'Stopped');

    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      svc.name.toLowerCase().includes(q) ||
      svc.displayName.toLowerCase().includes(q) ||
      svc.description.toLowerCase().includes(q);

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-400" />
            Windows Services (Service Control Manager)
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Inspect background NT services, startup triggers, account credentials, and dependency trees
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Windows services..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 w-52"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">All Services</option>
            <option value="running">Running Only</option>
            <option value="stopped">Stopped Only</option>
          </select>
        </div>
      </div>

      {/* Services Table */}
      <div className="win-card rounded-xl border border-white/10 overflow-hidden bg-[#161a24]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="text-[11px] uppercase tracking-wider text-gray-400 border-b border-white/10 bg-white/[0.03]">
              <tr>
                <th className="py-3 px-3">Service Display Name</th>
                <th className="py-3 px-2">Service Name</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-2 text-center">Status</th>
                <th className="py-3 px-2">Startup Type</th>
                <th className="py-3 px-2">Log On As</th>
                <th className="py-3 px-3 text-center">Protection</th>
                <th className="py-3 px-3 text-center">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-normal">
              {filteredServices.map((svc) => {
                const isRunning = svc.status === 'Running';
                const isProtected = svc.category === 'Protected System Process';

                return (
                  <tr key={svc.name} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white tracking-wide">{svc.displayName}</div>
                      <div className="text-[10px] text-gray-400 font-mono">
                        {svc.dependencies.length > 0
                          ? `Depends on: ${svc.dependencies.join(', ')}`
                          : 'No dependencies'}
                      </div>
                    </td>

                    <td className="py-3 px-2 font-mono text-gray-300">{svc.name}</td>

                    <td className="py-3 px-3 text-gray-400 text-xs truncate max-w-xs" title={svc.description}>
                      {svc.description}
                    </td>

                    <td className="py-3 px-2 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          isRunning
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                            : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isRunning ? 'bg-emerald-400' : 'bg-gray-400'
                          }`}
                        />
                        {svc.status}
                      </span>
                    </td>

                    <td className="py-3 px-2 text-gray-300 font-medium">{svc.startupType}</td>

                    <td className="py-3 px-2 text-gray-400 font-mono text-[11px]">{svc.logOnAs}</td>

                    <td className="py-3 px-3 text-center">
                      {isProtected ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 inline-flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          Core OS
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          Standard
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {isProtected ? (
                        <span className="text-[10px] text-gray-500 font-mono">Locked</span>
                      ) : (
                        <button
                          onClick={() => toggleServiceStatus(svc.name)}
                          className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                            isRunning
                              ? 'bg-amber-600/20 hover:bg-amber-600/40 text-amber-200 border-amber-500/30'
                              : 'bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-200 border-emerald-500/30'
                          }`}
                        >
                          {isRunning ? 'Stop Service' : 'Start Service'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
