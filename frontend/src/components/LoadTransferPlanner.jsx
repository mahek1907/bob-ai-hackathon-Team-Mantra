/**
 * LoadTransferPlanner.jsx
 * Operational Load Transfer Planner — GridSentinel AI
 *
 * Planning-only tool. Lets the operator evaluate moving load from a source
 * transformer to a candidate destination transformer and see the projected
 * operational impact BEFORE taking any action.
 *
 * KEY RESTRICTIONS:
 *  - No live grid switching is performed. No backend data is mutated.
 *  - No new telemetry is invented.
 *  - The projected risk estimate reuses the canonical 60/20/20 formula
 *    from src/risk_engine.py (physical × 0.60 + weather × 0.20 + criticality × 0.20).
 *    Only load_pct changes; DGA, weather, and criticality are held constant,
 *    because load percentage is not a direct input to the current backend
 *    composite formula (it flows through physical_health_score via DGA).
 *    We therefore apply a conservative linear load-stress adjustment to the
 *    physical health component only when the destination would exceed 80%:
 *      +5 pts physical health risk per 10% above 80% load threshold.
 *    This is clearly labelled as a planning heuristic assumption.
 *  - All results are labelled "Simulation / Planning Estimate — no live grid
 *    switching performed."
 */

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Zap,
  Info,
  ShieldAlert,
  HeartPulse,
  Train,
  Droplets,
} from 'lucide-react';

// ─── Risk formula constants — must mirror src/risk_engine.py ─────────────────
const PHYSICAL_WEIGHT = 0.60;
const WEATHER_WEIGHT  = 0.20;
const CRIT_WEIGHT     = 0.20;

function classifyRisk(score) {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 30) return 'MEDIUM';
  return 'LOW';
}

function categoryStyle(cat) {
  switch (cat) {
    case 'CRITICAL': return 'bg-red-50 text-red-700 border-red-200';
    case 'HIGH':     return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'MEDIUM':   return 'bg-blue-50 text-blue-700 border-blue-200';
    default:         return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
}

function categoryTextColor(cat) {
  switch (cat) {
    case 'CRITICAL': return 'text-red-700';
    case 'HIGH':     return 'text-amber-700';
    case 'MEDIUM':   return 'text-slate-900';
    default:         return 'text-emerald-700';
  }
}

/**
 * Project post-transfer composite risk for an asset given a new load %.
 *
 * The canonical backend formula uses physical_health_score (from DGA), weather,
 * and criticality — load_pct is NOT a direct formula input. To give a meaningful
 * planning signal without fabricating DGA values, we apply a conservative
 * load-stress heuristic only above an 80% threshold:
 *   Δ physical = +5 risk points per each 10% of load above 80%, capped at +20.
 * This is explicitly labelled as a planning heuristic.
 *
 * @param {object} asset  — existing enriched asset record
 * @param {number} newLoad — projected load % after transfer (0–100)
 * @returns {{ projectedRisk, projectedCategory, physAdj, heuristicApplied }}
 */
function projectRisk(asset, newLoad) {
  const physBase    = asset.physical_health_score ?? asset.dga_health_index ?? asset.composite_risk_score ?? 50;
  const weatherMult = asset.weather_multiplier ?? 1.0;
  const weatherNorm = Math.min(100, Math.max(0, ((weatherMult - 1.0) / 0.5) * 100));
  const crit        = asset.grid_criticality_score ?? 50;

  // Load-stress heuristic — only applied if new load > 80
  const overload    = Math.max(0, newLoad - 80);
  const physAdj     = Math.min(20, Math.floor(overload / 10) * 5);
  const physScen    = Math.min(100, physBase + physAdj);

  const raw = PHYSICAL_WEIGHT * physScen + WEATHER_WEIGHT * weatherNorm + CRIT_WEIGHT * crit;
  const projectedRisk = Math.round(Math.min(100, Math.max(0, raw)) * 10) / 10;

  return {
    projectedRisk,
    projectedCategory: classifyRisk(projectedRisk),
    physAdj,
    heuristicApplied: physAdj > 0,
    physBase: Math.round(physBase * 10) / 10,
    physScen: Math.round(physScen * 10) / 10,
    weatherNorm: Math.round(weatherNorm * 10) / 10,
    crit: Math.round(crit * 10) / 10,
  };
}

/**
 * Determine transfer feasibility and produce a verdict + warnings.
 */
function evaluateTransfer({ source, dest, transferPct, srcNewLoad, destNewLoad }) {
  const warnings = [];
  let verdict = 'RECOMMENDED'; // 'RECOMMENDED' | 'REVIEW REQUIRED' | 'NOT RECOMMENDED'

  // 1. Destination overload
  if (destNewLoad > 100) {
    warnings.push('Destination would be overloaded (>100%). Transfer not possible at this amount.');
    verdict = 'NOT RECOMMENDED';
  } else if (destNewLoad > 95) {
    warnings.push(`Destination load would reach ${destNewLoad.toFixed(1)}% — critically near capacity.`);
    verdict = verdict !== 'NOT RECOMMENDED' ? 'NOT RECOMMENDED' : verdict;
  } else if (destNewLoad > 85) {
    warnings.push(`Destination load would reach ${destNewLoad.toFixed(1)}% — marginal headroom. High thermal stress risk.`);
    if (verdict === 'RECOMMENDED') verdict = 'REVIEW REQUIRED';
  } else if (destNewLoad > 75) {
    warnings.push(`Destination load would reach ${destNewLoad.toFixed(1)}% — elevated operational load.`);
    if (verdict === 'RECOMMENDED') verdict = 'REVIEW REQUIRED';
  }

  // 2. Destination asset is already CRITICAL or HIGH
  if (dest.risk_category === 'CRITICAL') {
    warnings.push(`Destination ${dest.asset_id} is already CRITICAL risk — additional load not advisable.`);
    verdict = 'NOT RECOMMENDED';
  } else if (dest.risk_category === 'HIGH') {
    warnings.push(`Destination ${dest.asset_id} is HIGH risk — review thermal headroom before transfer.`);
    if (verdict === 'RECOMMENDED') verdict = 'REVIEW REQUIRED';
  }

  // 3. Transfer amount is zero or negative
  if (transferPct <= 0) {
    warnings.push('Transfer amount must be greater than 0%.');
    verdict = 'NOT RECOMMENDED';
  }

  // 4. Insufficient capacity on destination
  const destCapacity = 100 - (dest.load_pct ?? 0);
  if (transferPct > destCapacity) {
    warnings.push(`Transfer of ${transferPct}% exceeds destination remaining capacity (${destCapacity.toFixed(1)}% free).`);
    verdict = 'NOT RECOMMENDED';
  }

  // 5. Source or destination has critical infrastructure
  const srcInfra = [];
  if (source.hospital_connected) srcInfra.push('Hospital');
  if (source.transit_connected)  srcInfra.push('Transit');
  if (source.water_plant_connected) srcInfra.push('Water Plant');
  if (srcInfra.length > 0) {
    warnings.push(`Source feeds critical infrastructure (${srcInfra.join(', ')}) — service interruption risk during switching.`);
    if (verdict === 'RECOMMENDED') verdict = 'REVIEW REQUIRED';
  }

  const destInfra = [];
  if (dest.hospital_connected) destInfra.push('Hospital');
  if (dest.transit_connected)  destInfra.push('Transit');
  if (dest.water_plant_connected) destInfra.push('Water Plant');
  if (destInfra.length > 0) {
    warnings.push(`Destination feeds critical infrastructure (${destInfra.join(', ')}) — increased load may stress feeds.`);
    if (verdict === 'RECOMMENDED') verdict = 'REVIEW REQUIRED';
  }

  // Build reason string
  let reason = '';
  if (verdict === 'RECOMMENDED') {
    reason = `Transfer appears operationally feasible. Destination ${dest.asset_id} has sufficient capacity and acceptable current risk level.`;
  } else if (verdict === 'REVIEW REQUIRED') {
    reason = `Transfer may be feasible but requires engineering review before action. Review warnings above.`;
  } else {
    reason = `Transfer is not advisable under current conditions. Address the warnings above before proceeding.`;
  }

  return { verdict, warnings, reason };
}

// ─── Sub-component: before/after comparison row ───────────────────────────────
function CompareRow({ label, before, after, suffix = '', higherIsBad = true }) {
  const changed = before !== after;
  const worse   = higherIsBad ? after > before : after < before;
  const better  = higherIsBad ? after < before : after > before;

  const deltaNum = typeof after === 'number' && typeof before === 'number'
    ? Math.round((after - before) * 10) / 10
    : null;

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0 gap-2">
      <span className="text-xs text-slate-600 shrink-0">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-slate-500">{before ?? 'N/A'}{suffix}</span>
        <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
        <span className={`text-xs font-mono font-semibold ${
          !changed ? 'text-slate-700'
          : worse   ? 'text-red-700'
          : better  ? 'text-emerald-700'
          : 'text-slate-700'
        }`}>
          {after ?? 'N/A'}{suffix}
        </span>
        {changed && deltaNum !== null && (
          <span className={`text-[10px] font-mono ${worse ? 'text-red-500' : 'text-emerald-600'}`}>
            ({deltaNum > 0 ? '+' : ''}{deltaNum})
          </span>
        )}
        {changed && (worse
          ? <TrendingUp className="w-3 h-3 text-red-500 shrink-0" />
          : better
          ? <TrendingDown className="w-3 h-3 text-emerald-600 shrink-0" />
          : <Minus className="w-3 h-3 text-slate-400 shrink-0" />
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LoadTransferPlanner({ isOpen, onClose, sourceAsset, assets = [] }) {
  const [destId, setDestId] = useState('');
  const [transferPct, setTransferPct] = useState(10);

  // Reset destination when source changes or modal opens
  useEffect(() => {
    if (isOpen) {
      const firstCandidate = assets.find(
        a => a.asset_id !== sourceAsset?.asset_id
      );
      setDestId(firstCandidate?.asset_id ?? '');
      setTransferPct(10);
    }
  }, [isOpen, sourceAsset?.asset_id]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const dest = useMemo(
    () => assets.find(a => a.asset_id === destId) ?? null,
    [assets, destId]
  );

  // Candidate destinations: any asset that is NOT the source
  const candidates = assets.filter(a => a.asset_id !== sourceAsset?.asset_id);

  // Projected loads
  const srcCurrentLoad  = sourceAsset?.load_pct ?? 0;
  const destCurrentLoad = dest?.load_pct ?? 0;
  const srcNewLoad  = Math.max(0, srcCurrentLoad - transferPct);
  const destNewLoad = destCurrentLoad + transferPct;
  const destCapacityRemaining = Math.max(0, 100 - destNewLoad);

  // Projected risk values
  const srcProj  = sourceAsset ? projectRisk(sourceAsset, srcNewLoad)  : null;
  const destProj = dest        ? projectRisk(dest, destNewLoad)         : null;

  // Evaluation
  const evaluation = (sourceAsset && dest)
    ? evaluateTransfer({ source: sourceAsset, dest, transferPct, srcNewLoad, destNewLoad })
    : null;

  if (!isOpen || !sourceAsset) return null;

  const verdictStyle = {
    'RECOMMENDED':    { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2, iconColor: 'text-emerald-600', bar: 'bg-emerald-500' },
    'REVIEW REQUIRED':{ badge: 'bg-amber-50 text-amber-700 border-amber-200',   icon: AlertTriangle,  iconColor: 'text-amber-600',   bar: 'bg-amber-500'   },
    'NOT RECOMMENDED':{ badge: 'bg-red-50 text-red-700 border-red-200',         icon: ShieldAlert,    iconColor: 'text-red-600',     bar: 'bg-red-500'     },
  };
  const vs = evaluation ? verdictStyle[evaluation.verdict] : verdictStyle['NOT RECOMMENDED'];
  const VerdictIcon = vs.icon;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden my-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-800 text-white shadow-xs">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Load Transfer Planner</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Source: <span className="font-mono font-bold text-slate-800">{sourceAsset.asset_id}</span>
                {' '}— Planning estimate only
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close load transfer planner"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6 bg-white">

          {/* Simulation banner */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800 font-medium leading-relaxed">
              <strong>Simulation / Planning Estimate — no live grid switching performed.</strong>{' '}
              Results are scenario projections using existing telemetry. No backend data is modified.
            </p>
          </div>

          {/* ── Transfer Configuration ── */}
          <div>
            <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-3">
              Transfer Configuration
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">

              {/* Source (fixed to the selected asset) */}
              <div>
                <label className="block text-[11px] font-mono font-semibold text-slate-500 uppercase mb-1.5">
                  Source Transformer
                </label>
                <div className="px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-700 shadow-xs">
                  <span className="font-bold text-slate-900">{sourceAsset.asset_id}</span>
                  <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded border font-semibold ${categoryStyle(sourceAsset.risk_category)}`}>
                    {sourceAsset.risk_category}
                  </span>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {sourceAsset.substation_name || sourceAsset.substation_id}
                  </div>
                </div>
              </div>

              {/* Destination selector */}
              <div>
                <label className="block text-[11px] font-mono font-semibold text-slate-500 uppercase mb-1.5">
                  Destination Transformer
                </label>
                {candidates.length === 0 ? (
                  <div className="px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-500 shadow-xs">
                    No other transformers available in fleet.
                  </div>
                ) : (
                  <select
                    value={destId}
                    onChange={(e) => setDestId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 cursor-pointer shadow-xs"
                  >
                    {candidates.map((a) => (
                      <option key={a.asset_id} value={a.asset_id}>
                        {a.asset_id} — {a.substation_name || a.substation_id} ({a.risk_category}, {a.load_pct ?? 'N/A'}% load)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Transfer % slider */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-mono font-semibold text-slate-500 uppercase mb-1.5">
                  Transfer Amount: <span className="text-blue-700">{transferPct}%</span> of rated load
                </label>
                <input
                  type="range"
                  min={1}
                  max={Math.min(srcCurrentLoad, 80)}
                  step={1}
                  value={transferPct}
                  onChange={(e) => setTransferPct(Number(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1">
                  <span>1%</span>
                  <span>{Math.min(srcCurrentLoad, 80)}% max</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Slider capped at min(current source load, 80%) to prevent projecting source below 0% or into unrealistic territory.
                </p>
              </div>
            </div>
          </div>

          {dest && (
            <>
              {/* ── Load Impact ── */}
              <div>
                <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Projected Load Impact
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* Source */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-slate-700">{sourceAsset.asset_id} (Source)</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold font-mono ${categoryStyle(sourceAsset.risk_category)}`}>
                        {sourceAsset.risk_category}
                      </span>
                    </div>
                    <CompareRow
                      label="Load %"
                      before={srcCurrentLoad}
                      after={Math.round(srcNewLoad * 10) / 10}
                      suffix="%"
                      higherIsBad={true}
                    />
                    <CompareRow
                      label="Composite Risk"
                      before={sourceAsset.composite_risk_score ?? '—'}
                      after={srcProj?.projectedRisk ?? '—'}
                      higherIsBad={true}
                    />
                    <CompareRow
                      label="Risk Category"
                      before={sourceAsset.risk_category}
                      after={srcProj?.projectedCategory ?? '—'}
                      higherIsBad={false}
                    />
                    <CompareRow
                      label="Customers"
                      before={(sourceAsset.customers_served ?? 0).toLocaleString()}
                      after={(sourceAsset.customers_served ?? 0).toLocaleString()}
                      higherIsBad={false}
                    />
                    {/* Load bar */}
                    <div className="pt-2">
                      <div className="text-[11px] text-slate-500 mb-1 font-mono">Projected load utilisation</div>
                      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            srcNewLoad > 90 ? 'bg-red-500' : srcNewLoad > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, srcNewLoad)}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 font-mono text-right">
                        {Math.round(srcNewLoad * 10) / 10}% projected
                      </div>
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-slate-700">{dest.asset_id} (Destination)</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold font-mono ${categoryStyle(dest.risk_category)}`}>
                        {dest.risk_category}
                      </span>
                    </div>
                    <CompareRow
                      label="Load %"
                      before={destCurrentLoad}
                      after={Math.round(destNewLoad * 10) / 10}
                      suffix="%"
                      higherIsBad={true}
                    />
                    <CompareRow
                      label="Composite Risk"
                      before={dest.composite_risk_score ?? '—'}
                      after={destProj?.projectedRisk ?? '—'}
                      higherIsBad={true}
                    />
                    <CompareRow
                      label="Risk Category"
                      before={dest.risk_category}
                      after={destProj?.projectedCategory ?? '—'}
                      higherIsBad={false}
                    />
                    <CompareRow
                      label="Customers"
                      before={(dest.customers_served ?? 0).toLocaleString()}
                      after={(dest.customers_served ?? 0).toLocaleString()}
                      higherIsBad={false}
                    />
                    {/* Load bar */}
                    <div className="pt-2">
                      <div className="text-[11px] text-slate-500 mb-1 font-mono">Projected load utilisation</div>
                      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            destNewLoad > 100 ? 'bg-red-700' :
                            destNewLoad > 90  ? 'bg-red-500' :
                            destNewLoad > 75  ? 'bg-amber-500' :
                            'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, destNewLoad)}%` }}
                        />
                      </div>
                      <div className={`text-[10px] mt-0.5 font-mono text-right ${destNewLoad > 100 ? 'text-red-700 font-bold' : 'text-slate-500'}`}>
                        {Math.round(destNewLoad * 10) / 10}% projected
                        {destNewLoad > 100 && ' — OVERLOAD'}
                      </div>
                    </div>
                    {/* Remaining capacity */}
                    <div className="text-[11px] text-slate-600 font-mono">
                      Estimated remaining capacity: <span className={`font-bold ${destCapacityRemaining < 5 ? 'text-red-700' : 'text-slate-900'}`}>
                        {Math.max(0, Math.round(destCapacityRemaining * 10) / 10)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Critical Infrastructure ── */}
              {(sourceAsset.hospital_connected || sourceAsset.transit_connected || sourceAsset.water_plant_connected ||
                dest.hospital_connected || dest.transit_connected || dest.water_plant_connected) && (
                <div>
                  <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Critical Infrastructure Affected
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { asset: sourceAsset, role: 'Source' },
                      { asset: dest, role: 'Destination' },
                    ].map(({ asset: a, role }) => (
                      (a.hospital_connected || a.transit_connected || a.water_plant_connected) && (
                        <div key={a.asset_id} className="p-3 rounded-lg bg-amber-50 border border-amber-200 space-y-1.5">
                          <div className="text-[11px] font-mono font-bold text-amber-700 uppercase">{role}: {a.asset_id}</div>
                          <div className="flex flex-wrap gap-1.5">
                            {a.hospital_connected && (
                              <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-white border border-red-200 text-red-700 font-semibold">
                                <HeartPulse className="w-3 h-3" /> Hospital
                              </span>
                            )}
                            {a.transit_connected && (
                              <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-white border border-amber-200 text-amber-700 font-semibold">
                                <Train className="w-3 h-3" /> Transit
                              </span>
                            )}
                            {a.water_plant_connected && (
                              <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-white border border-blue-200 text-blue-700 font-semibold">
                                <Droplets className="w-3 h-3" /> Water Plant
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* ── Warnings ── */}
              {evaluation && evaluation.warnings.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Warnings
                  </h4>
                  <div className="space-y-1.5">
                    {evaluation.warnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span className="text-xs text-amber-800 font-medium">{w}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Risk Projection Methodology Note ── */}
              {(srcProj?.heuristicApplied || destProj?.heuristicApplied) && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    <strong>Planning heuristic applied:</strong> The canonical risk formula uses DGA-based physical health (not load %) as input.
                    For loads above 80%, this planner applies +5 risk points per 10% of excess load as a conservative thermal-stress assumption.
                    {destProj?.heuristicApplied && ` Destination: base ${destProj.physBase} + ${destProj.physAdj} adj = ${destProj.physScen}.`}
                    {srcProj?.heuristicApplied && ` Source: base ${srcProj.physBase} + ${srcProj.physAdj} adj = ${srcProj.physScen}.`}
                    {' '}DGA, weather, and criticality inputs are held constant.
                  </p>
                </div>
              )}

              {/* ── Verdict ── */}
              {evaluation && (
                <div className={`p-4 rounded-xl border ${vs.badge} space-y-2`}>
                  <div className="flex items-center gap-2">
                    <VerdictIcon className={`w-4 h-4 ${vs.iconColor} shrink-0`} />
                    <span className="text-sm font-bold">{evaluation.verdict}</span>
                  </div>
                  <p className="text-xs font-medium leading-relaxed">{evaluation.reason}</p>
                </div>
              )}
            </>
          )}

          {!dest && candidates.length > 0 && (
            <div className="py-6 text-center text-xs text-slate-500">
              Select a destination transformer above to see the projected impact.
            </div>
          )}

          {candidates.length === 0 && (
            <div className="py-6 text-center text-xs text-slate-500">
              No other transformers available in the current fleet for load transfer analysis.
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-100 pt-4 italic">
            Simulation / Planning Estimate — no live grid switching performed.
            All projections use existing fleet telemetry and the canonical 60/20/20 risk formula.
            Do not use as the sole basis for operational decisions. A certified utility engineer must review before any real switching action.
          </p>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50">
          <span className="text-[11px] text-slate-400 font-mono italic">
            Planning estimate only — no switching performed
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
