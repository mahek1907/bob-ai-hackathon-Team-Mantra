import React from 'react';
import CriticalityPanel from '../components/CriticalityPanel';
import { 
  Network, 
  Building2, 
  HeartPulse, 
  Train, 
  Droplets, 
  Users, 
  ShieldCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function CriticalityPage({ substations = [] }) {
  const totalCustomers = substations.reduce((acc, s) => acc + (s.customers_served || 0), 0) || 190000;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Grid Topology & Societal Criticality Matrix
          </h1>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200">
            {totalCustomers.toLocaleString()} Customers Monitored
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          Quantifying downstream human and societal impact to prioritize emergency equipment staging
        </p>
      </div>

      {/* Critical Infrastructure Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl border border-red-200 bg-red-50/50 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-red-700 uppercase tracking-wider">
              Priority 1 Infrastructure
            </span>
            <div className="p-2 rounded-xl bg-red-100 text-red-600">
              <HeartPulse className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 mb-1">Regional Trauma Hospitals</div>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Emergency surgeries and life-support wards fed by Substation METRO-09 and NORTH-01 (+35 pts criticality weight).
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-purple-200 bg-purple-50/50 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
              Priority 2 Infrastructure
            </span>
            <div className="p-2 rounded-xl bg-purple-100 text-purple-600">
              <Train className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 mb-1">Electrified Rail Transit</div>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Metropolitan subway and passenger rail line feeds carrying 85,000 riders/day (+25 pts criticality weight).
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-cyan-200 bg-cyan-50/50 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider">
              Priority 3 Infrastructure
            </span>
            <div className="p-2 rounded-xl bg-cyan-100 text-cyan-600">
              <Droplets className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 mb-1">Municipal Water Treatment</div>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Potable water filtration and emergency firefighting reservoir feeds (+20 pts criticality weight).
          </p>
        </div>
      </div>

      {/* Main Substation Grid List & Scoring Formula */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CriticalityPanel substations={substations} />
        </div>

        {/* Scoring Breakdown Card */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Network className="w-4 h-4 text-blue-600" />
              <span>Criticality Scoring Model</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Substation criticality is deterministically calculated in <code className="text-blue-700 font-mono font-semibold">src/criticality_engine.py</code>:
            </p>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-700 font-semibold">Hospital Connection</span>
                <span className="text-emerald-700 font-bold">+35 pts</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-700 font-semibold">Transit / Rail Network</span>
                <span className="text-emerald-700 font-bold">+25 pts</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-700 font-semibold">Water Plant Feed</span>
                <span className="text-emerald-700 font-bold">+20 pts</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-700 font-semibold">Population &gt; 50,000</span>
                <span className="text-emerald-700 font-bold">+20 pts</span>
              </div>
            </div>

            <div className="pt-2 text-xs text-slate-500 border-t border-slate-100 font-medium">
              Total score is clamped between 0 and 100 and weighted at 20% in the final composite risk score.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
