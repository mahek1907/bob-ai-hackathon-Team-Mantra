import React from 'react';
import { Network, Train, Droplets, HeartPulse, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function CriticalityPanel({
  substations = [],
  selectedSubstationId,
  onSelectSubstation
}) {
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
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Substation Topological Criticality Ranking
            </h3>
            <span className="text-xs text-slate-500 font-medium">Ranked by downstream societal and life-safety priority</span>
          </div>
        </div>
        <span className="text-xs font-mono text-slate-600 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
          {displaySubs.length} Grid Nodes
        </span>
      </div>

      <div className="space-y-3">
        {displaySubs.map((sub, idx) => {
          const score = sub.computed_criticality ?? sub.criticality_score ?? 0;
          const isSelected = selectedSubstationId ? selectedSubstationId === sub.substation_id : idx === 0;

          return (
            <div
              key={sub.substation_id || idx}
              onClick={() => onSelectSubstation && onSelectSubstation(sub)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/20 ring-1 ring-blue-600 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 bg-white'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-blue-700 font-bold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                      {sub.substation_id}
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {sub.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${
                    score >= 80
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : score >= 40
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    Criticality: {score}/100
                  </span>
                </div>
              </div>

              {/* Infrastructure Tags */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
                {sub.hospital_connected && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                    <HeartPulse className="w-3.5 h-3.5 text-red-600" />
                    <span>Trauma Hospital Feed</span>
                  </span>
                )}
                {sub.transit_connected && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                    <Train className="w-3.5 h-3.5 text-purple-600" />
                    <span>Electrified Rail Transit</span>
                  </span>
                )}
                {sub.water_plant_connected && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
                    <Droplets className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Water Treatment</span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium text-slate-700 bg-slate-100 border border-slate-200">
                  {(sub.customers_served || 0).toLocaleString()} customers
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
