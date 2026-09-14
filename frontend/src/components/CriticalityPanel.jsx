import React from 'react';
import { Network, Building2, Train, Droplets, HeartPulse, CheckCircle2 } from 'lucide-react';

export default function CriticalityPanel({ substations = [] }) {
  const defaultSubstations = [
    {
      substation_id: 'SUB-METRO-09',
      name: 'Metro Central Transit Substation',
      customers_served: 85000,
      hospital_connected: true,
      water_plant_connected: true,
      transit_connected: true,
      computed_criticality: 100,
    },
    {
      substation_id: 'SUB-NORTH-01',
      name: 'North Regional Healthcare Hub',
      customers_served: 45000,
      hospital_connected: true,
      water_plant_connected: false,
      transit_connected: false,
      computed_criticality: 45,
    },
    {
      substation_id: 'SUB-WEST-02',
      name: 'Harbor Industrial Step-Down',
      customers_served: 38000,
      hospital_connected: false,
      water_plant_connected: true,
      transit_connected: false,
      computed_criticality: 30,
    },
    {
      substation_id: 'SUB-EAST-04',
      name: 'Pine Crest Residential Feeder',
      customers_served: 22000,
      hospital_connected: false,
      water_plant_connected: false,
      transit_connected: false,
      computed_criticality: 10,
    },
  ];

  const displaySubs = substations.length > 0 ? substations : defaultSubstations;

  return (
    <div className="bg-dark-800 rounded-2xl border border-slate-700/60 glass-panel-hover animate-fade-in-up shadow-panel p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Grid & Critical Infrastructure
            </h3>
            <span className="text-xs text-slate-500 font-medium">Topological Priority Matrix</span>
          </div>
        </div>
        <span className="text-xs font-mono font-bold text-slate-500">
          Downstream Mapping
        </span>
      </div>

      <div className="space-y-3">
        {displaySubs.map((sub, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-dark-900 border border-slate-700/60 transition-all hover:border-slate-600 hover:bg-dark-700/60"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <span className="text-xs font-mono text-blue-400 font-bold">
                  {sub.substation_id}
                </span>
                <div className="text-sm font-bold text-slate-100">
                  {sub.name}
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md ${
                  (sub.computed_criticality || 0) >= 80
                    ? 'bg-red-500/15 text-red-400 border border-red-300'
                    : (sub.computed_criticality || 0) >= 40
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-300'
                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-300'
                }`}>
                  Crit: {sub.computed_criticality || 0}/100
                </span>
              </div>
            </div>

            {/* Infrastructure Tags */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              {sub.hospital_connected && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
                  <HeartPulse className="w-3.5 h-3.5 text-red-400" />
                  <span>Trauma Hospital</span>
                </span>
              )}
              {sub.transit_connected && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                  <Train className="w-3.5 h-3.5 text-purple-400" />
                  <span>Transit / Rail</span>
                </span>
              )}
              {sub.water_plant_connected && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Water Plant</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold text-slate-300 bg-dark-800 border border-slate-700/60">
                {(sub.customers_served || 0).toLocaleString()} customers
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
