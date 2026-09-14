import React, { useState } from 'react';
import {
  BarChart3,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Thermometer,
  Activity,
  Gauge,
  ShieldCheck
} from 'lucide-react';

export default function FleetRiskChart({ assets = [], onSelectAsset }) {
  const [selectedAsset, setSelectedAsset] = useState(assets[0]);
  const [hoveredAsset, setHoveredAsset] = useState(null);

  const activeAsset = selectedAsset || assets[0];

  const getBarColor = (score) => {
    if (score >= 80) return 'bg-red-600 hover:bg-red-700';
    if (score >= 60) return 'bg-amber-500 hover:bg-amber-600';
    if (score >= 30) return 'bg-yellow-500 hover:bg-yellow-600';
    return 'bg-emerald-600 hover:bg-emerald-700';
  };

  const getBadgeColor = (category) => {
    switch (category?.toUpperCase()) {
      case 'CRITICAL': return 'bg-red-50 text-red-700 border border-red-200 font-semibold';
      case 'HIGH': return 'bg-amber-50 text-amber-700 border border-amber-200 font-semibold';
      case 'MEDIUM': return 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold';
      default: return 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">

      {/* Chart Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span>Comparative Fleet Failure Risk Index</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational multi-variable scoring across IEEE C57.104 gas ratios, weather stress, and grid criticality
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-600"></span>
            <span className="text-slate-600">Critical (&ge;80)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="text-slate-600">High (60–79)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span className="text-slate-600">Normal (&lt;60)</span>
          </span>
        </div>
      </div>

      {/* Main Bar Chart Section */}
      <div className="p-6 relative bg-white">
        {/* Critical Threshold Line at 80% */}
        <div
          className="absolute left-6 right-6 border-b border-dashed border-red-300 z-10 flex items-center justify-end pointer-events-none"
          style={{ bottom: 'calc(80% * 0.75 + 56px)' }}
        >
          <span className="text-[10px] font-mono font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
            Critical Threshold (80/100)
          </span>
        </div>

        {/* The Bars Grid */}
        <div className="grid grid-cols-4 gap-6 sm:gap-12 h-64 items-end border-b border-slate-200 pb-2">
          {assets.map((asset) => {
            const heightPercent = Math.max(10, Math.min(100, asset.composite_risk_score));
            const isSelected = activeAsset?.asset_id === asset.asset_id;
            const isHovered = hoveredAsset?.asset_id === asset.asset_id;

            return (
              <div
                key={asset.asset_id}
                className="flex flex-col items-center h-full justify-end group cursor-pointer relative"
                onMouseEnter={() => setHoveredAsset(asset)}
                onMouseLeave={() => setHoveredAsset(null)}
                onClick={() => setSelectedAsset(asset)}
              >
                {/* Value pill on top of bar */}
                <span className={`text-xs font-mono font-bold mb-2 px-2 py-0.5 rounded transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 border border-slate-200 group-hover:bg-slate-200'
                }`}>
                  {asset.composite_risk_score}
                </span>

                {/* Vertical Bar */}
                <div
                  className={`w-full max-w-[72px] rounded-t-lg transition-all duration-300 ${getBarColor(asset.composite_risk_score)} ${
                    isSelected ? 'ring-2 ring-offset-2 ring-blue-600/30 shadow-xs' : 'opacity-90 group-hover:opacity-100'
                  }`}
                  style={{ height: `${heightPercent * 0.72}%` }}
                />

                {/* Asset Label */}
                <div className="text-center mt-3">
                  <div className={`font-mono font-bold text-xs sm:text-sm ${isSelected ? 'text-blue-600' : 'text-slate-900'}`}>
                    {asset.asset_id}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium truncate max-w-[90px] sm:max-w-[120px]">
                    {asset.substation_name?.split(' ')[0]}
                  </div>
                </div>

                {/* Hover Tooltip */}
                {isHovered && !isSelected && (
                  <div className="absolute bottom-full mb-8 z-30 w-56 bg-slate-900 text-white rounded-lg shadow-xl p-3 text-xs pointer-events-none animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-1 mb-1.5 font-mono">
                      <span className="font-bold text-blue-400">{asset.asset_id}</span>
                      <span className="text-[10px] font-bold">{asset.risk_category}</span>
                    </div>
                    <div className="space-y-1 text-slate-300 text-[11px]">
                      <div>{asset.substation_name}</div>
                      <div>Oil: <strong className="text-white">{asset.oil_temp_c}°C</strong> • Load: <strong className="text-white">{asset.load_pct}%</strong></div>
                      <div className="text-[10px] text-blue-300 pt-1">Click to inspect diagnostics</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Transformer Detail Panel */}
      {activeAsset && (
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

            {/* Left: Info */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-base text-slate-900">{activeAsset.asset_id}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${getBadgeColor(activeAsset.risk_category)}`}>
                  {activeAsset.risk_category} URGENCY
                </span>
                <span className="text-xs font-mono text-slate-500">
                  {activeAsset.substation_name} • {activeAsset.age_years} yrs in service
                </span>
              </div>
              <div className="text-xs text-slate-600 font-medium">
                Diagnosis: <strong className="text-slate-900 font-semibold">{activeAsset.risk_factors?.[0] || 'Nominal operating parameters'}</strong>
              </div>
            </div>

            {/* Middle: 4 Quick Telemetry Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] text-slate-500 block font-mono font-semibold">OIL TEMP</span>
                <span className={`font-mono font-bold ${activeAsset.oil_temp_c > 100 ? 'text-red-600' : 'text-slate-900'}`}>
                  {activeAsset.oil_temp_c}°C
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] text-slate-500 block font-mono font-semibold">VIBRATION</span>
                <span className={`font-mono font-bold ${activeAsset.vibration_mms > 6 ? 'text-amber-600' : 'text-slate-900'}`}>
                  {activeAsset.vibration_mms} mm/s
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] text-slate-500 block font-mono font-semibold">GRID LOAD</span>
                <span className="font-mono font-bold text-slate-900">
                  {activeAsset.load_pct}%
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] text-slate-500 block font-mono font-semibold">POPULATION</span>
                <span className="font-mono font-bold text-slate-900">
                  {(activeAsset.customers_served || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Right: Dispatch Button */}
            <button
              onClick={() => onSelectAsset && onSelectAsset(activeAsset)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dispatch Directive</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
