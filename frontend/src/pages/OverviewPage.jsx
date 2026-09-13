import React, { useState } from 'react';
import KPICards from '../components/KPICards';
import FleetRiskChart from '../components/FleetRiskChart';
import { 
  AlertTriangle, 
  Sparkles, 
  ArrowRight, 
  Thermometer, 
  Wind, 
  HeartPulse, 
  Train, 
  ShieldAlert,
  Zap,
  Activity,
  Search,
  Filter,
  ArrowUpDown,
  Building2,
  Clock,
  CheckCircle2,
  FileText
} from 'lucide-react';

export default function OverviewPage({ 
  summary, 
  assets = [], 
  weather, 
  substations = [], 
  onSelectTab, 
  onGenerateWorkOrder 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('risk_desc');

  const topHazard = assets[0]; // TX-401 (highest risk)

  // Filter and sort for the Transformer Table
  const filteredAssets = assets
    .filter(a => {
      if (filterCategory !== 'ALL' && a.risk_category !== filterCategory) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        a.asset_id?.toLowerCase().includes(q) ||
        a.substation_name?.toLowerCase().includes(q) ||
        a.model?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'risk_desc') return b.composite_risk_score - a.composite_risk_score;
      if (sortBy === 'temp_desc') return (b.oil_temp_c || 0) - (a.oil_temp_c || 0);
      return 0;
    });

  const getDgaSummary = (asset) => {
    const c2h2 = asset.dga_ppm?.acetylene || 0;
    const c2h4 = asset.dga_ppm?.ethylene || 0;
    if (c2h2 >= 35) return { label: `Arcing (${c2h2} ppm)`, color: 'text-red-700 bg-red-50 border-red-200 font-bold' };
    if (c2h2 > 2) return { label: `Discharge (${c2h2} ppm)`, color: 'text-amber-800 bg-amber-50 border-amber-200' };
    if (c2h4 > 100) return { label: `Thermal (${c2h4} ppm)`, color: 'text-amber-800 bg-amber-50 border-amber-200' };
    return { label: 'Condition 1 Normal', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* 1. Page Title and Subtitle */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Executive Operations Overview
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-normal">
          Real-time failure risk index, dissolved gas diagnostics, and meteorological contingency dispatch.
        </p>
      </div>

      {/* 2. Critical Emergency Alert */}
      {topHazard && (
        <div className="rounded-xl border border-red-200 bg-red-50/70 p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Alert Content */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-red-600 text-white shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                  <span>IMMEDIATE DISPATCH ADVISORY</span>
                </span>
                <span className="text-xs font-mono font-bold text-red-900">
                  {topHazard.asset_id} • {topHazard.substation_name}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-white border border-red-200 text-red-700 font-bold">
                  Score: {topHazard.composite_risk_score} / 100
                </span>
              </div>

              <div className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                <strong>Primary Cause:</strong> Active high-energy electrical arcing (C2H2 = 85 ppm) and severe thermal runaway (C2H4 = 280 ppm).
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-slate-400" />
                  <span>Weather: {weather?.event_name || 'Tropical Storm Alex'} ({weather?.wind_speed_kmh || 85} km/h gusts)</span>
                </span>
                <span className="flex items-center gap-1">
                  <HeartPulse className="w-3.5 h-3.5 text-red-500" />
                  <span>Feeds: Trauma Center Hospital & Metro Rail ({(topHazard.customers_served || 85000).toLocaleString()} customers)</span>
                </span>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => onGenerateWorkOrder(topHazard)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Generate IBM Granite Work Order</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

          </div>
        </div>
      )}

      {/* 3. Four or Five Important KPI Cards */}
      <KPICards summary={summary} />

      {/* 4. Main Comparative Fleet Risk Chart */}
      <FleetRiskChart 
        assets={assets} 
        onSelectAsset={(a) => onGenerateWorkOrder(a)} 
      />

      {/* 5. Transformer Risk Ranking Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-3 p-5">
        
        {/* Table Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-blue-600" />
              <span>Transformer Failure Risk Ranking</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-normal">
              Continuous IEEE C57.104 dissolved gas status and weather compounding
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search asset or station..."
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 w-44"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50 text-xs">
              {['ALL', 'CRITICAL', 'HIGH', 'NORMAL'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
                    filterCategory === cat
                      ? 'bg-white text-blue-600 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-mono font-bold text-slate-400 uppercase bg-slate-50/50">
                <th className="py-2.5 px-3">Transformer ID</th>
                <th className="py-2.5 px-3">Location & Substation</th>
                <th className="py-2.5 px-3 text-center">Risk Score</th>
                <th className="py-2.5 px-3">DGA Status</th>
                <th className="py-2.5 px-3 text-center">Weather Mult</th>
                <th className="py-2.5 px-3">Criticality Load</th>
                <th className="py-2.5 px-3">Recommended Action</th>
                <th className="py-2.5 px-3 text-right">Dispatch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredAssets.map((asset) => {
                const dga = getDgaSummary(asset);
                const isCritical = asset.risk_category === 'CRITICAL';
                const isHigh = asset.risk_category === 'HIGH';

                return (
                  <tr key={asset.asset_id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono">
                      <div className="font-bold text-slate-900 text-sm">{asset.asset_id}</div>
                      <div className="text-[11px] text-slate-400 font-sans">{asset.model?.split(' ')[0]} {asset.model?.split(' ')[1]}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{asset.substation_name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{(asset.customers_served || 0).toLocaleString()} customers</div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className={`font-mono font-bold text-sm ${
                        isCritical ? 'text-red-600' :
                        isHigh ? 'text-amber-600' :
                        'text-slate-800'
                      }`}>
                        {asset.composite_risk_score}
                      </div>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border uppercase font-bold ${
                        isCritical ? 'bg-red-50 text-red-700 border-red-200' :
                        isHigh ? 'bg-amber-50 text-amber-800 border-amber-200' :
                        'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}>
                        {asset.risk_category}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono text-xs">
                      <span className={`px-2 py-0.5 rounded border text-[11px] ${dga.color}`}>
                        {dga.label}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-semibold text-slate-700">
                      {asset.weather_multiplier || 1.42}×
                    </td>

                    <td className="py-3 px-3 text-slate-600 font-medium">
                      {asset.risk_factors?.[asset.risk_factors.length - 1] || 'Standard grid feeder'}
                    </td>

                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                      {asset.suggested_action}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => onGenerateWorkOrder(asset)}
                        className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                          isCritical
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                        }`}
                      >
                        Dispatch
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Weather and Criticality Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Left: Weather Meteorological Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">Meteorological Compounding Stress</h3>
            </div>
            <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {summary?.weather_multiplier || 1.42}× Stress
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-slate-400 font-mono text-[10px] mb-0.5">AMBIENT TEMP</div>
              <div className="text-base font-mono font-bold text-slate-900">{weather?.ambient_temp_c || 39.4}°C</div>
              <span className="text-[10px] font-mono text-red-600 font-bold">HEATWAVE</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-slate-400 font-mono text-[10px] mb-0.5">WIND GUSTS</div>
              <div className="text-base font-mono font-bold text-slate-900">{weather?.wind_speed_kmh || 85} km/h</div>
              <span className="text-[10px] font-mono text-amber-700 font-bold">GALE FORCE</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-slate-400 font-mono text-[10px] mb-0.5">LIGHTNING</div>
              <div className="text-base font-mono font-bold text-slate-900">{weather?.lightning_strikes_last_hour || 42}/hr</div>
              <span className="text-[10px] font-mono text-amber-700 font-bold">SURGE ALERT</span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between font-mono text-[11px]">
              <span>Weather Risk Compounding</span>
              <strong className="text-amber-800">{summary?.weather_multiplier || 1.42}×</strong>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 rounded-full" 
                style={{ width: `${Math.min(100, (((summary?.weather_multiplier || 1.42) - 1.0) / 0.5) * 100)}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectTab('weather')}
            className="w-full py-2 text-center text-xs font-semibold text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
          >
            Inspect Meteorological Stress Model ➔
          </button>
        </div>

        {/* Right: Grid & Societal Criticality Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-red-600" />
              <h3 className="text-sm font-bold text-slate-900">Societal & Infrastructure Criticality</h3>
            </div>
            <span className="text-xs font-mono font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
              HIGH IMPACT
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <HeartPulse className="w-4 h-4 text-red-600 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900">Metro Trauma Center Hospital</div>
                  <div className="text-[11px] text-slate-500">Fed by SUB-METRO-09 (TX-401 arcing)</div>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                CRITICAL
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Train className="w-4 h-4 text-purple-600 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900">Regional Electrified Transit Line</div>
                  <div className="text-[11px] text-slate-500">Fed by SUB-METRO-09 (85,000 riders/day)</div>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                AT RISK
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Population dependent on high-risk nodes: <strong className="text-slate-900">{(summary?.customers_at_risk || 130000).toLocaleString()} citizens</strong>.
          </div>

          <button
            type="button"
            onClick={() => onSelectTab('criticality')}
            className="w-full py-2 text-center text-xs font-semibold text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
          >
            View Full Topology & Societal Priority ➔
          </button>
        </div>

      </div>

      {/* 7. Recent Work-Order Activity */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Recent IBM Granite Work-Order Directives</h3>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab('work_orders')}
            className="text-xs font-mono font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            Dispatch Console ➔
          </button>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900">WO-2026-401</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                  READY FOR SIGN-OFF
                </span>
                <span className="text-[11px] text-slate-400 font-mono">12m ago</span>
              </div>
              <p className="text-slate-600">
                TX-401 High-Voltage Rapid Response Crew #3 pre-positioning with mobile degasification trailer near Metro Central.
              </p>
            </div>
            <button
              onClick={() => onGenerateWorkOrder(topHazard)}
              className="self-start sm:self-center px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer shrink-0"
            >
              Inspect Directive
            </button>
          </div>

          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900">WO-2026-102</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200">
                  CREW DISPATCHED
                </span>
                <span className="text-[11px] text-slate-400 font-mono">1h ago</span>
              </div>
              <p className="text-slate-600">
                TX-102 Healthcare auxiliary tie-line contingency switching pre-authorized to offload cooling circuit ahead of storm peak.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400 self-start sm:self-center">
              Crew En Route
            </span>
          </div>

          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900">WO-2026-205</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                  COMPLETED
                </span>
                <span className="text-[11px] text-slate-400 font-mono">4h ago</span>
              </div>
              <p className="text-slate-600">
                TX-205 Routine SCADA DGA chromatographic baseline audit logged and verified nominal by operations supervisor.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400 self-start sm:self-center">
              Verified
            </span>
          </div>

        </div>
      </div>

    </div>
  );
}
