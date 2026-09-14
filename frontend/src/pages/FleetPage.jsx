import React, { useState } from 'react';
import AssetCard from '../components/AssetCard';
import DgaRadarChart from '../components/DgaRadarChart';
import { 
  Search, 
  Filter, 
  LayoutGrid, 
  Table, 
  Sparkles, 
  FileText, 
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  Thermometer,
  Activity
} from 'lucide-react';

export default function FleetPage({ assets = [], onGenerateWorkOrder, isGenerating, selectedAssetId }) {
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('risk_desc');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [activeChartAsset, setActiveChartAsset] = useState(assets[0]);

  const counts = {
    ALL: assets.length,
    CRITICAL: assets.filter(a => a.risk_category === 'CRITICAL').length,
    HIGH: assets.filter(a => a.risk_category === 'HIGH').length,
    MEDIUM: assets.filter(a => a.risk_category === 'MEDIUM').length,
    LOW: assets.filter(a => a.risk_category === 'LOW').length,
  };

  const filtered = assets
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
      if (sortBy === 'vibration_desc') return (b.vibration_mms || 0) - (a.vibration_mms || 0);
      if (sortBy === 'age_desc') return (b.age_years || 0) - (a.age_years || 0);
      return 0;
    });

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/60 pb-4 animate-fade-in-up">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
            <span>Transformer Fleet & DGA Diagnostic Matrix</span>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/30">
              IEEE C57.104
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Continuous health monitoring, dissolved combustible gas analysis, and failure ranking
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-dark-700 border border-slate-700/60 rounded-xl">
          <button
            onClick={() => setViewMode('cards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'cards' ? 'bg-dark-800 text-blue-400 shadow-panel' : 'text-slate-300 hover:text-slate-100'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Card View</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'table' ? 'bg-dark-800 text-blue-400 shadow-panel' : 'text-slate-300 hover:text-slate-100'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>SCADA Data Grid</span>
          </button>
        </div>
      </div>

      {/* Interactive Gas Breakdown Chart */}
      <div className="grid grid-cols-1 gap-6">
        <DgaRadarChart asset={activeChartAsset || assets[0]} />
      </div>

      {/* Filter and Search Toolbar */}
      <div className="rounded-2xl border border-slate-700/60 bg-dark-800 p-4 shadow-panel flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterCategory === cat
                  ? cat === 'CRITICAL'
                    ? 'bg-red-600 text-white font-bold shadow-panel'
                    : cat === 'HIGH'
                    ? 'bg-amber-500 text-white font-bold shadow-panel'
                    : 'bg-blue-600 text-white font-bold shadow-panel'
                  : 'bg-dark-700 text-slate-300 hover:bg-dark-600'
              }`}
            >
              {cat} <span className="opacity-80">({counts[cat] || 0})</span>
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search asset, sub, model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-dark-900 border border-slate-700/60 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono shadow-panel"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-dark-900 border border-slate-700/60 text-slate-200 font-semibold focus:outline-none focus:border-blue-500 font-mono cursor-pointer shadow-panel"
          >
            <option value="risk_desc">Risk: Highest First</option>
            <option value="temp_desc">Oil Temp: Highest</option>
            <option value="vibration_desc">Vibration: Highest</option>
            <option value="age_desc">Age: Oldest First</option>
          </select>
        </div>
      </div>

      {/* Main Content: Cards or SCADA Table */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((asset, idx) => (
            <div
              key={asset.asset_id}
              onClick={() => setActiveChartAsset(asset)}
              className="stagger-item"
              style={{ animationDelay: `${idx * 70}ms` }}
            >
              <AssetCard
                asset={asset}
                onGenerateWorkOrder={onGenerateWorkOrder}
                isGenerating={isGenerating && selectedAssetId === asset.asset_id}
              />
            </div>
          ))}
        </div>
      ) : (
        /* Detailed SCADA Data Grid View in Light Mode */
        <div className="rounded-2xl border border-slate-700/60 bg-dark-800 shadow-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700/60 bg-dark-900/80 text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Asset & Substation</th>
                  <th className="py-3.5 px-3 text-center">Composite Risk</th>
                  <th className="py-3.5 px-3 text-center">Oil Temp</th>
                  <th className="py-3.5 px-3 text-center">Vibration</th>
                  <th className="py-3.5 px-3 text-center">Load</th>
                  <th className="py-3.5 px-3">H₂ (ppm)</th>
                  <th className="py-3.5 px-3">CH₄ (ppm)</th>
                  <th className="py-3.5 px-3">C₂H₄ (ppm)</th>
                  <th className="py-3.5 px-3">C₂H₂ (ppm)</th>
                  <th className="py-3.5 px-4 text-right">Emergency Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
                {filtered.map((asset) => {
                  const dga = asset.dga_ppm || {};
                  return (
                    <tr 
                      key={asset.asset_id} 
                      className="hover:bg-blue-500/10 transition-colors cursor-pointer"
                      onClick={() => setActiveChartAsset(asset)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 font-bold text-slate-100">
                          <span>{asset.asset_id}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                            asset.risk_category === 'CRITICAL' ? 'bg-red-500/15 text-red-400 border border-red-500/30' :
                            asset.risk_category === 'HIGH' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                            asset.risk_category === 'MEDIUM' ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' :
                            'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {asset.risk_category}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-sans">{asset.substation_name}</div>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className={`text-sm font-extrabold ${
                          asset.composite_risk_score >= 80 ? 'text-red-400' :
                          asset.composite_risk_score >= 60 ? 'text-amber-400' :
                          asset.composite_risk_score >= 30 ? 'text-yellow-400' :
                          'text-emerald-400'
                        }`}>
                          {asset.composite_risk_score}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className={asset.oil_temp_c > 100 ? 'text-red-400 font-bold' : 'text-slate-200 font-semibold'}>
                          {asset.oil_temp_c}°C
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className={asset.vibration_mms > 6 ? 'text-red-400 font-bold' : 'text-slate-200 font-semibold'}>
                          {asset.vibration_mms} mm/s
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center text-slate-200 font-semibold">
                        {asset.load_pct}%
                      </td>

                      <td className="py-3.5 px-3 font-semibold">
                        <span className={dga.hydrogen > 200 ? 'text-red-400 font-bold' : 'text-slate-200'}>
                          {dga.hydrogen || 0}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-semibold">
                        <span className={dga.methane > 250 ? 'text-red-400 font-bold' : 'text-slate-200'}>
                          {dga.methane || 0}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-semibold">
                        <span className={dga.ethylene > 150 ? 'text-red-400 font-bold' : 'text-slate-200'}>
                          {dga.ethylene || 0}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-semibold">
                        <span className={dga.acetylene > 5 ? 'text-red-400 font-extrabold underline' : 'text-slate-200'}>
                          {dga.acetylene || 0}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); onGenerateWorkOrder(asset); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-panel cursor-pointer"
                        >
                          Synthesize Directive
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
