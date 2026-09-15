import React, { useState, useEffect } from 'react';
import AssetCard from '../components/AssetCard';
import DgaRadarChart from '../components/DgaRadarChart';
import ContingencySimulator from '../components/ContingencySimulator';
import ExplainRiskModal from '../components/ExplainRiskModal';
import EventHistoryModal from '../components/EventHistoryModal';
import {
  Search,
  LayoutGrid,
  Table,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Activity,
  ShieldAlert,
  Zap,
  Gauge,
  FlaskConical,
  HelpCircle,
  Clock
} from 'lucide-react';
import { EVENT_TYPES } from '../hooks/useEventHistory';

export default function FleetPage({ assets = [], onGenerateWorkOrder, isGenerating, selectedAssetId, events = [], recordEvent }) {
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('risk_desc');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [activeChartAsset, setActiveChartAsset] = useState(() => {
    return assets.find(a => a.asset_id === selectedAssetId) || assets[0];
  });
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [explainAsset, setExplainAsset] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    if (selectedAssetId) {
      const found = assets.find(a => a.asset_id === selectedAssetId);
      if (found) setActiveChartAsset(found);
    } else if (!activeChartAsset && assets.length > 0) {
      setActiveChartAsset(assets[0]);
    }
  }, [selectedAssetId, assets]);

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
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* 1. Page Header */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>Transformer Fleet & DGA Diagnostic Matrix</span>
              <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                IEEE C57.104
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
              Continuous health monitoring, dissolved combustible gas analysis, and failure ranking.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center flex-wrap">
            <span className={`text-xs font-mono px-2.5 py-1 rounded-md border shadow-xs ${
              counts.CRITICAL > 0
                ? 'bg-red-50 text-red-700 border-red-200 font-semibold'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {counts.CRITICAL > 0 ? `${counts.CRITICAL} Critical Advisory` : 'Fleet Nominal'}
            </span>

            {/* Event History Button */}
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-colors cursor-pointer border border-slate-300"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Event History</span>
              {events.length > 0 && (
                <span className="ml-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-mono font-bold px-1">
                  {events.length}
                </span>
              )}
            </button>

            {/* Operational Contingency Simulator Button */}
            <button
              type="button"
              onClick={() => setIsSimulatorOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white shadow-xs transition-colors cursor-pointer border border-slate-700"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Simulate Contingency</span>
            </button>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>SCADA Grid</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Fleet Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { key: 'ALL', label: 'Monitored Assets', count: counts.ALL, sub: 'Total Substation Units', color: 'text-slate-900', border: 'border-slate-200', bg: 'bg-slate-50' },
          { key: 'CRITICAL', label: 'Critical Risk', count: counts.CRITICAL, sub: 'Score ≥80 • Urgent', color: 'text-red-700', border: 'border-red-200', bg: 'bg-red-50' },
          { key: 'HIGH', label: 'High Risk', count: counts.HIGH, sub: 'Score 60–79 • Priority', color: 'text-amber-700', border: 'border-amber-200', bg: 'bg-amber-50' },
          { key: 'MEDIUM', label: 'Medium Risk', count: counts.MEDIUM, sub: 'Score 30–59 • Advisory', color: 'text-amber-700', border: 'border-amber-200', bg: 'bg-amber-50' },
          { key: 'LOW', label: 'Low / Nominal', count: counts.LOW, sub: 'Score <30 • Baseline', color: 'text-emerald-700', border: 'border-emerald-200', bg: 'bg-emerald-50' },
        ].map(item => {
          const isSelected = filterCategory === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilterCategory(item.key === filterCategory && item.key !== 'ALL' ? 'ALL' : item.key)}
              className={`text-left p-3 rounded-xl border transition-all cursor-pointer bg-white shadow-xs ${
                isSelected
                  ? 'border-blue-600 ring-1 ring-blue-600 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-semibold uppercase text-slate-500">{item.label}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${item.bg} ${item.color} font-bold`}>
                  {item.key}
                </span>
              </div>
              <div className={`text-xl font-mono font-bold mt-1 ${item.color}`}>
                {item.count} <span className="text-xs font-sans text-slate-400 font-normal">units</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 truncate">{item.sub}</div>
            </button>
          );
        })}
      </div>

      {/* 3. Interactive Gas Breakdown Chart with Unit Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-500 uppercase">Inspecting Unit:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {assets.map((asset) => {
                const isCurrent = (activeChartAsset?.asset_id || assets[0]?.asset_id) === asset.asset_id;
                const isCrit = asset.risk_category === 'CRITICAL';
                return (
                  <button
                    key={asset.asset_id}
                    type="button"
                    onClick={() => setActiveChartAsset(asset)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
                      isCurrent
                        ? 'bg-slate-900 text-white shadow-xs'
                        : isCrit
                        ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {asset.asset_id} • {asset.composite_risk_score}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DgaRadarChart asset={activeChartAsset || assets[0]} />
      </div>

      {/* 4. Filter and Search Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                filterCategory === cat
                  ? cat === 'CRITICAL'
                    ? 'bg-red-600 text-white shadow-xs'
                    : cat === 'HIGH'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : cat === 'MEDIUM'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : cat === 'LOW'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {cat} <span className="opacity-80">({counts[cat] || 0})</span>
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search asset, sub, model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-mono shadow-xs"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg bg-white border border-slate-300 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono cursor-pointer shadow-xs"
          >
            <option value="risk_desc">Risk: Highest First</option>
            <option value="temp_desc">Oil Temp: Highest</option>
            <option value="vibration_desc">Vibration: Highest</option>
            <option value="age_desc">Age: Oldest First</option>
          </select>
        </div>
      </div>

      {/* 5. Main Content: Cards or SCADA Table */}
      {viewMode === 'cards' ? (
        filtered.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 text-xs shadow-xs">
            No transformers match the selected filter criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map((asset) => {
              const isSelected = (activeChartAsset?.asset_id || assets[0]?.asset_id) === asset.asset_id;
              return (
                <div
                  key={asset.asset_id}
                  onClick={() => setActiveChartAsset(asset)}
                  className={`cursor-pointer rounded-xl transition-all ${
                    isSelected ? 'ring-2 ring-blue-600 rounded-xl' : ''
                  }`}
                >
                  <AssetCard
                    asset={asset}
                    onGenerateWorkOrder={onGenerateWorkOrder}
                    isGenerating={isGenerating && selectedAssetId === asset.asset_id}
                    onExplainRisk={(e) => { e.stopPropagation(); setExplainAsset(asset); }}
                  />
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Detailed SCADA Data Grid View in Light Mode */
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-mono font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Asset & Substation</th>
                  <th className="py-3 px-3 text-center">Risk Score</th>
                  <th className="py-3 px-3 text-center">Oil Temp</th>
                  <th className="py-3 px-3 text-center">Vibration</th>
                  <th className="py-3 px-3 text-center">Load</th>
                  <th className="py-3 px-3 text-center">Weather</th>
                  <th className="py-3 px-3">H₂</th>
                  <th className="py-3 px-3">CH₄</th>
                  <th className="py-3 px-3">C₂H₄</th>
                  <th className="py-3 px-3">C₂H₂</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-mono">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-500 text-xs font-sans">
                      No transformers match the selected filter criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((asset) => {
                    const dga = asset.dga_ppm || {};
                    const isSelected = (activeChartAsset?.asset_id || assets[0]?.asset_id) === asset.asset_id;
                    const isCritical = asset.risk_category === 'CRITICAL';
                    const isHigh = asset.risk_category === 'HIGH';

                    return (
                      <tr
                        key={asset.asset_id}
                        className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/50'
                            : isCritical
                            ? 'bg-red-50/20'
                            : ''
                        }`}
                        onClick={() => setActiveChartAsset(asset)}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{asset.asset_id}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-semibold ${
                              isCritical ? 'bg-red-50 text-red-700 border-red-200' :
                              isHigh ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              asset.risk_category === 'MEDIUM' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {asset.risk_category}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 font-sans mt-0.5">{asset.substation_name}</div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className={`text-sm font-bold ${
                            asset.composite_risk_score >= 80 ? 'text-red-700' :
                            asset.composite_risk_score >= 60 ? 'text-amber-700' :
                            asset.composite_risk_score >= 30 ? 'text-slate-900' :
                            'text-emerald-700'
                          }`}>
                            {asset.composite_risk_score}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className={asset.oil_temp_c > 100 ? 'text-red-700 font-bold' : 'text-slate-700 font-medium'}>
                            {asset.oil_temp_c ? `${asset.oil_temp_c}°C` : 'N/A'}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className={asset.vibration_mms > 6 ? 'text-amber-700 font-bold' : 'text-slate-700 font-medium'}>
                            {asset.vibration_mms ? `${asset.vibration_mms} mm/s` : 'N/A'}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center text-slate-700 font-medium">
                          {asset.load_pct ? `${asset.load_pct}%` : 'N/A'}
                        </td>

                        <td className="py-3 px-3 text-center font-mono font-semibold text-slate-700">
                          {asset.weather_multiplier ? `${asset.weather_multiplier}×` : '1.0×'}
                        </td>

                        <td className="py-3 px-3">
                          <span className={dga.hydrogen > 200 ? 'text-red-700 font-bold' : 'text-slate-700'}>
                            {dga.hydrogen || 0}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span className={dga.methane > 250 ? 'text-red-700 font-bold' : 'text-slate-700'}>
                            {dga.methane || 0}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span className={dga.ethylene > 150 ? 'text-red-700 font-bold' : 'text-slate-700'}>
                            {dga.ethylene || 0}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span className={dga.acetylene > 2 ? 'text-red-700 font-bold underline' : 'text-slate-700'}>
                            {dga.acetylene || 0}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setExplainAsset(asset); }}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-xs"
                              title="Explain Risk Score"
                            >
                              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                              <span>Explain</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); onGenerateWorkOrder(asset); }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                                isCritical
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-xs'
                              }`}
                            >
                              Dispatch
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Operational Contingency Simulator Modal */}
      <ContingencySimulator
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        assets={assets}
        onSimulate={recordEvent ? (assetId, summary, detail) => {
          recordEvent(EVENT_TYPES.SIMULATION, assetId, summary, detail);
        } : undefined}
      />

      {/* Operational Maintenance Timeline & Event History Modal */}
      <EventHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        events={events}
      />

      {/* Why Is This Asset At Risk? Explainability Panel */}
      <ExplainRiskModal
        isOpen={!!explainAsset}
        onClose={() => setExplainAsset(null)}
        asset={explainAsset}
      />
    </div>
  );
}
