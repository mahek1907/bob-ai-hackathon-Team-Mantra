import React from 'react';
import { Activity } from 'lucide-react';

export default function DgaRadarChart({ asset }) {
  if (!asset) return null;
  const dga = asset.dga_ppm || {};

  const gases = [
    { name: 'Acetylene', formula: 'C2H2', val: dga.acetylene || 0, limit: 1, critical: 9, unit: 'ppm', fault: 'High-Energy Electrical Arcing' },
    { name: 'Ethylene', formula: 'C2H4', val: dga.ethylene || 0, limit: 50, critical: 200, unit: 'ppm', fault: 'Severe Thermal Runaway (>700°C)' },
    { name: 'Hydrogen', formula: 'H2', val: dga.hydrogen || 0, limit: 100, critical: 700, unit: 'ppm', fault: 'Corona & Partial Discharge' },
    { name: 'Methane', formula: 'CH4', val: dga.methane || 0, limit: 120, critical: 400, unit: 'ppm', fault: 'Low-Temp Oil Overheating' },
    { name: 'Ethane', formula: 'C2H6', val: dga.ethane || 0, limit: 65, critical: 100, unit: 'ppm', fault: 'Core Localized Hotspots' },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <span>IEEE C57.104 Gas Concentrations — {asset.asset_id}</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Observed ppm vs. IEEE Standard Condition 1 Normal Limits • {asset.substation_name || asset.substation_id}
          </p>
        </div>
        <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 self-start sm:self-auto">
          5-Gas Diagnostic
        </span>
      </div>

      {/* Gas meters */}
      <div className="space-y-3 pt-1">
        {gases.map((g) => {
          const ratio = Math.min(100, Math.round((g.val / (g.limit * 3)) * 100));
          const isCritical = g.val > g.critical || (g.formula === 'C2H2' && g.val > 2);
          const isElevated = g.val > g.limit;

          return (
            <div key={g.formula} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{g.name}</span>
                  <span className="font-mono text-slate-500">({g.formula})</span>
                  <span className="text-slate-500 hidden sm:inline">— {g.fault}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <span className={`font-bold ${
                    isCritical ? 'text-red-700' : isElevated ? 'text-amber-700' : 'text-emerald-700'
                  }`}>
                    {g.val} {g.unit}
                  </span>
                  <span className="text-slate-400">
                    / limit {g.limit}
                  </span>
                </div>
              </div>

              {/* Clean solid progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all ${
                    isCritical ? 'bg-red-600' : isElevated ? 'bg-amber-500' : 'bg-emerald-600'
                  }`}
                  style={{ width: `${Math.max(4, ratio)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
