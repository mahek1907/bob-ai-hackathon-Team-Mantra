import React, { useState, useMemo } from 'react';
import {
  X,
  ArrowLeftRight,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';

function categoryStyle(cat) {
  switch (cat) {
    case 'CRITICAL': return 'bg-red-50 text-red-700 border-red-200';
    case 'HIGH':     return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'MEDIUM':   return 'bg-blue-50 text-blue-700 border-blue-200';
    default:         return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
}

function headroom(asset) {
  // Estimate available capacity headroom as 100 - load_pct
  return Math.max(0, 100 - (asset.load_pct || 0));
}

export default function LoadTransferPlanner({ isOpen, onClose, sourceAsset, assets = [] }) {
  const [targetId, setTargetId] = useState('');

  // Candidate targets: all assets except the source, sorted by headroom desc
  const candidates = useMemo(() => {
    if (!sourceAsset) return [];
    return assets
      .filter(a => a.asset_id !== sourceAsset.asset_id)
      .sort((a, b) => headroom(b) - headroom(a));
  }, [sourceAsset, assets]);

  // Auto-select best candidate when modal opens
  React.useEffect(() => {
    if (isOpen && candidates.length > 0) {
      setTargetId(candidates[0].asset_id);
    }
  }, [isOpen, candidates]);

  if (!isOpen || !sourceAsset) return null;

  const target = assets.find(a => a.asset_id === targetId);
  const sourceLoad = sourceAsset.load_pct || 0;
  const targetLoad = target?.load_pct || 0;
  const transferable = Math.min(sourceLoad, headroom(target || {}));
  const projectedSource = Math.max(0, sourceLoad - transferable).toFixed(1);
  const projectedTarget = Math.min(100, targetLoad + transferable).toFixed(1);
  const feasible = target && headroom(target) > 0 && transferable > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden my-8">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-800 text-white shadow-xs">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Load Transfer Planner</h3>
              <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                Scenario estimate only · No automated switching action
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">

          {/* Disclaimer */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600" />
            <span>
              <strong>Planning estimate only.</strong> Figures are based on current load telemetry. No actual switching action is initiated. A certified operator must authorize any real transfer.
            </span>
          </div>

          {/* Source Asset */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1">
            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Source (Offloading)</div>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="font-mono font-bold text-sm text-slate-900">{sourceAsset.asset_id}</span>
                <span className="text-xs text-slate-500 ml-2">{sourceAsset.substation_name}</span>
              </div>
              <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border uppercase ${categoryStyle(sourceAsset.risk_category)}`}>
                {sourceAsset.risk_category}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono mt-1">
              <span className="text-slate-600">Current load: <strong className="text-slate-900">{sourceLoad}%</strong></span>
              <span className="text-slate-600">Risk score: <strong className="text-slate-900">{sourceAsset.composite_risk_score}</strong></span>
            </div>
          </div>

          {/* Target Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
              Transfer Target Asset
            </label>
            <select
              value={targetId}
              onChange={e => setTargetId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-slate-300 text-slate-900 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer shadow-xs"
            >
              {candidates.map(a => (
                <option key={a.asset_id} value={a.asset_id}>
                  {a.asset_id} — {a.substation_name} · Load: {a.load_pct}% · Headroom: {headroom(a).toFixed(0)}%
                </option>
              ))}
              {candidates.length === 0 && (
                <option disabled>No other assets available</option>
              )}
            </select>
          </div>

          {/* Projected Outcome */}
          {target && (
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                Projected Load After Transfer
              </div>
              <div className="grid grid-cols-2 divide-x divide-slate-100 text-center">
                <div className="p-4">
                  <div className="text-[10px] font-mono text-slate-400 uppercase mb-1">{sourceAsset.asset_id} (source)</div>
                  <div className="text-xs font-mono text-slate-500">{sourceLoad}% → </div>
                  <div className={`text-xl font-mono font-bold mt-0.5 ${Number(projectedSource) < 60 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {projectedSource}%
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">load after offload</div>
                </div>
                <div className="p-4">
                  <div className="text-[10px] font-mono text-slate-400 uppercase mb-1">{target.asset_id} (target)</div>
                  <div className="text-xs font-mono text-slate-500">{targetLoad}% → </div>
                  <div className={`text-xl font-mono font-bold mt-0.5 ${Number(projectedTarget) >= 90 ? 'text-red-700' : Number(projectedTarget) >= 75 ? 'text-amber-700' : 'text-slate-900'}`}>
                    {projectedTarget}%
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">load after absorb</div>
                </div>
              </div>
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-xs font-mono text-slate-600">
                Estimated transfer: <strong className="text-slate-900">{transferable.toFixed(1)}% load</strong> · Target headroom: <strong>{headroom(target).toFixed(0)}%</strong>
              </div>
            </div>
          )}

          {/* Feasibility Badge */}
          {target && (
            feasible ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>Transfer feasible.</strong> {target.asset_id} has sufficient headroom to absorb offloaded load from {sourceAsset.asset_id}. Requires operator authorization before execution.</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 font-medium">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span><strong>Transfer not recommended.</strong> {target.asset_id} has insufficient headroom ({headroom(target).toFixed(0)}%) to safely absorb additional load.</span>
              </div>
            )
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
            <Zap className="w-3 h-3" />
            <span>Scenario estimate · Not a dispatch action</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
