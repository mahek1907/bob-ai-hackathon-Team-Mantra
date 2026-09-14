import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Sparkles,
  Thermometer,
  Activity,
  Gauge,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  FileText
} from 'lucide-react';
import RiskGauge from './RiskGauge';

export default function AssetCard({ asset, onGenerateWorkOrder, isGenerating }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getCategoryBadge = (cat) => {
    switch (cat?.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-red-50 text-red-700 border-red-200 font-semibold';
      case 'HIGH':
        return 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';
      case 'MEDIUM':
        return 'bg-blue-50 text-blue-700 border-blue-200 font-semibold';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold';
    }
  };

  const getDgaGasStatus = (gas, ppm) => {
    const limits = {
      hydrogen: 100,
      methane: 120,
      ethane: 65,
      ethylene: 50,
      acetylene: 1,
    };
    const limit = limits[gas] || 100;
    if (ppm > limit * 3) return { label: 'CRITICAL', color: 'bg-red-50 text-red-700 font-semibold border border-red-200' };
    if (ppm > limit) return { label: 'ELEVATED', color: 'bg-amber-50 text-amber-700 font-semibold border border-amber-200' };
    return { label: 'NORMAL', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
  };

  const dga = asset.dga_ppm || {};
  const isCritical = asset.risk_category === 'CRITICAL';
  const isHigh = asset.risk_category === 'HIGH';

  return (
    <div className={`rounded-xl border transition-all bg-white p-5 shadow-xs hover:border-slate-300 ${
      isCritical
        ? 'border-red-200 bg-red-50/15'
        : isHigh
        ? 'border-amber-200'
        : 'border-slate-200'
    }`}>

      {/* Top Bar: Asset Info & Risk Gauge */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-lg text-slate-900">
              {asset.asset_id}
            </span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded border uppercase ${getCategoryBadge(asset.risk_category)}`}>
              {asset.risk_category}
            </span>
            <span className="text-xs font-mono text-slate-500">
              {asset.age_years} yrs in service
            </span>
          </div>

          <div className="text-sm font-semibold text-slate-900 mt-1">
            {asset.substation_name || asset.substation_id}
          </div>
          <div className="text-xs text-slate-500 font-normal">
            {asset.model}
          </div>
        </div>

        {/* Circular Gauge */}
        <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-mono font-bold text-slate-500 uppercase">COMPOSITE RISK</div>
            <div className="text-xs font-mono text-slate-600 font-medium">IEEE + Weather</div>
          </div>
          <RiskGauge score={asset.composite_risk_score} size={58} strokeWidth={6} />
        </div>
      </div>

      {/* Operational Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
          <div className="text-[11px] text-slate-500 font-medium mb-0.5">Oil Temp</div>
          <div className={`font-mono text-sm font-bold ${asset.oil_temp_c > 100 ? 'text-red-700' : 'text-slate-900'}`}>
            {asset.oil_temp_c ? `${asset.oil_temp_c}°C` : 'N/A'}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
          <div className="text-[11px] text-slate-500 font-medium mb-0.5">Winding Temp</div>
          <div className="font-mono text-sm font-bold text-slate-900">
            {asset.winding_temp_c ? `${asset.winding_temp_c}°C` : 'N/A'}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
          <div className="text-[11px] text-slate-500 font-medium mb-0.5">Vibration</div>
          <div className={`font-mono text-sm font-bold ${asset.vibration_mms > 6 ? 'text-amber-700' : 'text-slate-900'}`}>
            {asset.vibration_mms ? `${asset.vibration_mms} mm/s` : 'N/A'}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
          <div className="text-[11px] text-slate-500 font-medium mb-0.5">Grid Load</div>
          <div className="font-mono text-sm font-bold text-slate-900">
            {asset.load_pct ? `${asset.load_pct}%` : 'N/A'}
          </div>
        </div>
      </div>

      {/* Active Fault Flags */}
      {asset.risk_factors && asset.risk_factors.length > 0 && (
        <div className="mb-4">
          <div className="text-[11px] font-mono font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
            Diagnostic Risk Flags
          </div>
          <div className="flex flex-wrap gap-1.5">
            {asset.risk_factors.map((factor, idx) => (
              <span
                key={idx}
                className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700"
              >
                {factor}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Expandable DGA Gas Breakdown */}
      {Object.keys(dga).length > 0 && (
        <div className="border-t border-slate-100 pt-3 mb-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between text-xs font-mono font-semibold text-blue-600 hover:text-blue-700 py-1 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>IEEE C57.104 Dissolved Gas Analysis (5 Key Gases)</span>
            </span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {isExpanded && (
            <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
              <div className="grid grid-cols-5 gap-2 text-center border-b border-slate-200 pb-1.5 font-mono text-[10px] font-bold text-slate-500 uppercase">
                <div>Gas</div>
                <div>Formula</div>
                <div>Observed (ppm)</div>
                <div>Condition</div>
                <div className="text-left">Fault Indication</div>
              </div>

              {[
                { name: 'Hydrogen', formula: 'H2', val: dga.hydrogen || 0, fault: 'Corona / Partial Discharge' },
                { name: 'Methane', formula: 'CH4', val: dga.methane || 0, fault: 'Low-Temp Thermal' },
                { name: 'Ethane', formula: 'C2H6', val: dga.ethane || 0, fault: 'High-Temp Thermal' },
                { name: 'Ethylene', formula: 'C2H4', val: dga.ethylene || 0, fault: 'Severe Thermal Runaway' },
                { name: 'Acetylene', formula: 'C2H2', val: dga.acetylene || 0, fault: 'High-Energy Electrical Arcing' },
              ].map((g, idx) => {
                const status = getDgaGasStatus(g.name.toLowerCase(), g.val);
                return (
                  <div key={idx} className="grid grid-cols-5 gap-2 text-center py-0.5 font-mono items-center">
                    <span className="text-slate-900 font-sans font-medium">{g.name}</span>
                    <span className="text-slate-500">{g.formula}</span>
                    <span className="font-bold text-slate-900">{g.val}</span>
                    <div>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-600 truncate font-sans text-left">
                      {g.fault}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Suggested Action & IBM Granite Dispatch Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
        <div className="text-slate-600">
          <strong className="text-slate-900">Recommended Action:</strong> {asset.suggested_action}
        </div>

        <button
          onClick={() => onGenerateWorkOrder(asset)}
          disabled={isGenerating}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-colors cursor-pointer shrink-0 ${
            isCritical || isHigh
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-xs'
          } ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          <span>Dispatch Work Order</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
