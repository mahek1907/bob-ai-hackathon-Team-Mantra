/**
 * ContingencySimulator.jsx
 * Operational Contingency Simulator — GridSentinel AI
 *
 * Scenario estimate using the existing 60/20/20 composite risk formula:
 *   Composite Risk = 0.60 × Physical Health + 0.20 × Normalized Weather Risk + 0.20 × Grid Criticality
 *
 * This is a scenario estimate for operational planning, NOT a failure probability.
 * Three scenarios: Weather Escalation, Transformer Outage, Combined Stress.
 * Reuses existing asset/risk/weather/criticality data — frontend-only, no backend changes.
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  CloudLightning,
  Zap,
  AlertTriangle,
  ChevronDown,
  Activity,
  ShieldAlert,
  Thermometer,
  Users,
  HeartPulse,
  Train,
  Droplets,
  TrendingUp,
  Info
} from 'lucide-react';

// ─── Risk formula constants matching src/risk_engine.py ───────────────────────
const PHYSICAL_WEIGHT = 0.60;
const WEATHER_WEIGHT  = 0.20;
const CRIT_WEIGHT     = 0.20;

// Thresholds matching risk_engine.py
function classifyRiskCategory(score) {
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

// ─── Scenario Definitions ─────────────────────────────────────────────────────
const SCENARIOS = [
  {
    id: 'weather_escalation',
    label: 'Weather Escalation',
    icon: CloudLightning,
    iconColor: 'text-amber-600',
    borderColor: 'border-amber-300',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Simulates a severe storm escalation increasing weather risk to its maximum multiplier (1.5×). Physical health and criticality remain unchanged.',
  },
  {
    id: 'transformer_outage',
    label: 'Transformer Outage',
    icon: Zap,
    iconColor: 'text-red-600',
    borderColor: 'border-red-300',
    badgeBg: 'bg-red-50 text-red-700 border-red-200',
    description: 'Transformer state: NORMAL → OUTAGE. Physical-risk contribution is set to 100 (maximum) in the scenario model — this represents worst-case physical risk input to the composite formula, not a health percentage. Weather and criticality remain unchanged. Reveals downstream infrastructure and customer impact.',
  },
  {
    id: 'combined_stress',
    label: 'Combined Stress',
    icon: AlertTriangle,
    iconColor: 'text-purple-600',
    borderColor: 'border-purple-300',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'Combines maximum weather escalation (1.5×) with elevated physical-risk contribution. Scenario assumption: +30 physical-risk points (capped at 100). This is a planning assumption, not a validated degradation coefficient. Worst-case compound scenario.',
  },
];

// ─── Compute scenario scores using 60/20/20 formula ──────────────────────────
function computeScenario(asset, scenarioId) {
  // Current baseline values from asset
  const physicalHealth    = asset.physical_health_score ?? asset.composite_risk_score ?? 50;
  // weather_multiplier is in [1.0, 1.5]; normalize to 0-100
  const weatherMult       = asset.weather_multiplier ?? 1.0;
  const weatherRiskNorm   = ((weatherMult - 1.0) / 0.5) * 100.0;
  const gridCriticality   = asset.grid_criticality_score ?? 50;

  let scenarioPhysical    = physicalHealth;
  let scenarioWeatherNorm = weatherRiskNorm;
  let scenarioWeatherMult = weatherMult;
  let scenarioCriticality = gridCriticality;

  switch (scenarioId) {
    case 'weather_escalation':
      // Escalate to max weather multiplier 1.5× → 100 normalized
      scenarioWeatherMult = 1.5;
      scenarioWeatherNorm = 100.0;
      break;

    case 'transformer_outage':
      // Full outage: physical-risk contribution set to 100 (max) in the scenario model
      scenarioPhysical = 100.0;
      break;

    case 'combined_stress':
      // Max weather + scenario assumption: +30 physical-risk points, capped at 100
      scenarioWeatherMult = 1.5;
      scenarioWeatherNorm = 100.0;
      scenarioPhysical    = Math.min(100, physicalHealth + 30);
      break;

    default:
      break;
  }

  const scenarioComposite = Math.round(
    Math.min(100, Math.max(0,
      PHYSICAL_WEIGHT * scenarioPhysical
      + WEATHER_WEIGHT * scenarioWeatherNorm
      + CRIT_WEIGHT   * scenarioCriticality
    )) * 10
  ) / 10;

  const currentComposite = Math.round(
    Math.min(100, Math.max(0,
      PHYSICAL_WEIGHT * physicalHealth
      + WEATHER_WEIGHT * weatherRiskNorm
      + CRIT_WEIGHT   * gridCriticality
    )) * 10
  ) / 10;

  return {
    // Current values
    currentPhysical:    Math.round(physicalHealth * 10) / 10,
    currentWeatherNorm: Math.round(weatherRiskNorm * 10) / 10,
    currentWeatherMult: weatherMult,
    currentCriticality: Math.round(gridCriticality * 10) / 10,
    currentComposite,
    currentTier:        classifyRiskCategory(currentComposite),

    // Scenario values
    scenarioPhysical:    Math.round(scenarioPhysical * 10) / 10,
    scenarioWeatherNorm: Math.round(scenarioWeatherNorm * 10) / 10,
    scenarioWeatherMult,
    scenarioCriticality: Math.round(scenarioCriticality * 10) / 10,
    scenarioComposite,
    scenarioTier:        classifyRiskCategory(scenarioComposite),

    delta: Math.round((scenarioComposite - currentComposite) * 10) / 10,
  };
}

// ─── Outage Impact Info ───────────────────────────────────────────────────────
function buildOutageImpact(asset) {
  const customers  = asset.customers_served ?? 0;
  const hospital   = asset.hospital_connected ?? false;
  const transit    = asset.transit_connected  ?? false;
  const water      = asset.water_plant_connected ?? false;

  const critInfra = [];
  if (hospital) critInfra.push({ icon: HeartPulse, label: 'Regional Trauma / Hospital Center', color: 'text-red-600' });
  if (transit)  critInfra.push({ icon: Train,      label: 'Electrified Transit / Rail Network',  color: 'text-purple-600' });
  if (water)    critInfra.push({ icon: Droplets,   label: 'Municipal Water Treatment Facility', color: 'text-blue-600' });

  // Operational impact text
  const gridCriticality = asset.grid_criticality_score ?? 50;
  let operationalImpact;
  let recommendedPriority;
  if (gridCriticality >= 80) {
    operationalImpact    = 'Severe — critical life-safety infrastructure disruption expected. Emergency protocols required.';
    recommendedPriority  = 'IMMEDIATE — Deploy rapid-response crew within 1 hour. Initiate mutual-aid request.';
  } else if (gridCriticality >= 50) {
    operationalImpact    = 'High — significant community infrastructure disruption. Priority contingency switching required.';
    recommendedPriority  = 'PRIORITY — Schedule crew dispatch within 4 hours. Pre-position backup equipment.';
  } else if (gridCriticality >= 20) {
    operationalImpact    = 'Moderate — residential and commercial service interrupted. Planned switching can restore partial service.';
    recommendedPriority  = 'STANDARD — Dispatch crew within 8 hours. Review alternate feed options.';
  } else {
    operationalImpact    = 'Limited — localized service interruption. Standard maintenance and switching protocol applies.';
    recommendedPriority  = 'ROUTINE — Schedule within 24 hours. Normal restoration sequence.';
  }

  return { customers, critInfra, operationalImpact, recommendedPriority };
}

// ─── Comparison Row ───────────────────────────────────────────────────────────
function CompareRow({ label, currentVal, scenarioVal, formatter, higherIsBad = true }) {
  const diff = scenarioVal - currentVal;
  const changed = Math.abs(diff) >= 0.05;
  const worse = changed && (higherIsBad ? diff > 0 : diff < 0);
  const better = changed && (higherIsBad ? diff < 0 : diff > 0);

  return (
    <div className="grid grid-cols-3 gap-3 py-2 border-b border-slate-100 last:border-0 items-center text-xs">
      <span className="font-medium text-slate-600">{label}</span>
      <span className="font-mono font-semibold text-slate-700 text-center">{formatter(currentVal)}</span>
      <div className="flex items-center justify-center gap-1.5">
        <span className={`font-mono font-bold ${worse ? 'text-red-700' : better ? 'text-emerald-700' : 'text-slate-700'}`}>
          {formatter(scenarioVal)}
        </span>
        {changed && (
          <span className={`text-[10px] font-mono px-1 py-0.5 rounded font-semibold ${
            worse  ? 'bg-red-50 text-red-700 border border-red-200' :
            better ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                     'bg-slate-50 text-slate-600 border border-slate-200'
          }`}>
            {diff > 0 ? '+' : ''}{formatter(diff)}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ContingencySimulator({ isOpen, onClose, assets = [] }) {
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState('weather_escalation');

  // Initialize to highest-risk asset
  useEffect(() => {
    if (assets.length > 0 && !selectedAssetId) {
      setSelectedAssetId(assets[0].asset_id);
    }
  }, [assets]);

  if (!isOpen) return null;

  const asset = assets.find(a => a.asset_id === selectedAssetId) ?? assets[0];
  if (!asset) return null;

  const scenario = SCENARIOS.find(s => s.id === selectedScenario);
  const result   = computeScenario(asset, selectedScenario);
  const outage   = buildOutageImpact(asset);

  const tierDegraded = result.scenarioTier !== result.currentTier && (
    ['LOW','MEDIUM','HIGH','CRITICAL'].indexOf(result.scenarioTier) >
    ['LOW','MEDIUM','HIGH','CRITICAL'].indexOf(result.currentTier)
  );

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">

        {/* ── Header ── */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50 rounded-t-2xl sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-800 text-white">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Operational Contingency Simulator</h2>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Scenario estimate · 60/20/20 composite risk architecture · Not a failure probability
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* ── Asset Selector ── */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
              Target Asset
            </label>
            <div className="relative">
              <select
                value={selectedAssetId ?? ''}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2 text-xs rounded-lg bg-white border border-slate-300 text-slate-900 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 cursor-pointer shadow-xs"
              >
                {assets.map(a => (
                  <option key={a.asset_id} value={a.asset_id}>
                    {a.asset_id} — {a.substation_name || a.substation_id} · Risk: {a.composite_risk_score} ({a.risk_category})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* ── Scenario Selector ── */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
              Contingency Scenario
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {SCENARIOS.map((s) => {
                const Icon = s.icon;
                const isActive = selectedScenario === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedScenario(s.id)}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      isActive
                        ? `${s.borderColor} ring-1 ring-offset-0 bg-white shadow-sm`
                        : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
                    }`}
                    style={isActive ? { ringColor: 'currentColor' } : {}}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? s.iconColor : 'text-slate-400'}`} />
                      <span className={`text-xs font-semibold ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>
                        {s.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">
                      {s.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Scenario Description Banner ── */}
          <div className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs ${scenario.badgeBg}`}>
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-70" />
            <p className="leading-relaxed">{scenario.description}</p>
          </div>

          {/* ── Current vs Scenario Comparison ── */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-bold text-slate-900">Risk Profile: Current vs Scenario</span>
            </div>

            {/* Column Headers */}
            <div className="grid grid-cols-3 gap-3 px-4 py-2 bg-slate-50 border-b border-slate-100 text-[10px] font-mono font-bold text-slate-500 uppercase">
              <span>Metric</span>
              <span className="text-center">Current Baseline</span>
              <span className="text-center">{scenario.label}</span>
            </div>

            <div className="px-4 py-1">
              <CompareRow
                label="Phys. Risk Contribution"
                currentVal={result.currentPhysical}
                scenarioVal={result.scenarioPhysical}
                formatter={(v) => v.toFixed(1)}
                higherIsBad={true}
              />
              <CompareRow
                label="Weather Risk (norm.)"
                currentVal={result.currentWeatherNorm}
                scenarioVal={result.scenarioWeatherNorm}
                formatter={(v) => `${v.toFixed(1)}`}
                higherIsBad={true}
              />
              <CompareRow
                label="Weather Multiplier"
                currentVal={result.currentWeatherMult}
                scenarioVal={result.scenarioWeatherMult}
                formatter={(v) => `${v.toFixed(2)}×`}
                higherIsBad={true}
              />
              <CompareRow
                label="Grid Criticality"
                currentVal={result.currentCriticality}
                scenarioVal={result.scenarioCriticality}
                formatter={(v) => v.toFixed(1)}
                higherIsBad={true}
              />
            </div>

            {/* Outage scenario: clarify physical-risk contribution = 100 means OUTAGE state */}
            {selectedScenario === 'transformer_outage' && (
              <div className="mx-4 mb-2 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-[10px] text-red-700 font-medium leading-relaxed">
                <strong>Transformer State: NORMAL → OUTAGE.</strong>{' '}
                Physical-risk contribution set to 100 (maximum scenario input). This does not mean the transformer is 100% healthy — 100 is the worst-case physical-risk value in the composite formula.
              </div>
            )}

            {/* Combined stress: flag the +30 as a scenario assumption */}
            {selectedScenario === 'combined_stress' && (
              <div className="mx-4 mb-2 px-3 py-2 rounded-lg bg-purple-50 border border-purple-100 text-[10px] text-purple-700 font-medium leading-relaxed">
                <strong>Scenario assumption: +30 physical-risk points</strong> applied to current baseline (capped at 100). This is a planning assumption for worst-case analysis, not a validated degradation coefficient.
              </div>
            )}

            {/* Composite Risk Scores — highlighted */}
            <div className="grid grid-cols-3 gap-3 px-4 py-3 bg-slate-50 border-t border-slate-200 items-center">
              <span className="text-xs font-bold text-slate-700">Composite Risk Score</span>

              {/* Current */}
              <div className="flex flex-col items-center gap-1">
                <span className={`text-lg font-mono font-bold ${categoryTextColor(result.currentTier)}`}>
                  {result.currentComposite}
                </span>
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border uppercase ${categoryStyle(result.currentTier)}`}>
                  {result.currentTier}
                </span>
              </div>

              {/* Scenario */}
              <div className="flex flex-col items-center gap-1">
                <span className={`text-lg font-mono font-bold ${categoryTextColor(result.scenarioTier)}`}>
                  {result.scenarioComposite}
                </span>
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border uppercase ${categoryStyle(result.scenarioTier)}`}>
                  {result.scenarioTier}
                </span>
                {result.delta !== 0 && (
                  <span className={`text-[10px] font-mono font-bold ${result.delta > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                    {result.delta > 0 ? '▲' : '▼'} {Math.abs(result.delta)} pts
                  </span>
                )}
              </div>
            </div>

            {/* Tier escalation warning */}
            {tierDegraded && (
              <div className="px-4 py-2.5 bg-red-50 border-t border-red-200 flex items-center gap-2 text-xs text-red-700 font-semibold">
                <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                Risk tier escalates from <span className="font-mono">{result.currentTier}</span> →{' '}
                <span className="font-mono">{result.scenarioTier}</span> under this scenario.
              </div>
            )}
          </div>

          {/* ── Outage Impact (only for outage + combined scenarios) ── */}
          {(selectedScenario === 'transformer_outage' || selectedScenario === 'combined_stress') && (
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-red-600" />
                  <span className="text-xs font-bold text-slate-900">Outage Impact Assessment</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 font-medium">
                  Scenario estimate only · No dispatch action
                </span>
              </div>

              <div className="p-4 space-y-4">
                {/* Customers Potentially Affected */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-slate-900">Customers Potentially Affected</div>
                      <div className="text-[11px] text-slate-500">Connected to {asset.substation_name || asset.substation_id}</div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-base text-slate-900">
                    {outage.customers.toLocaleString()}
                  </span>
                </div>

                {/* Critical Infrastructure */}
                {outage.critInfra.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                      Critical Infrastructure at Risk
                    </div>
                    {outage.critInfra.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <div key={idx} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-red-50/50 border border-red-100 text-xs">
                          <Icon className={`w-3.5 h-3.5 shrink-0 ${item.color}`} />
                          <span className="font-semibold text-slate-800">{item.label}</span>
                          <span className="ml-auto text-[10px] font-mono font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                            IMPACTED
                          </span>
                        </div>
                      );
                    })}
                    {outage.critInfra.length === 0 && (
                      <div className="text-xs text-slate-500 font-medium px-1">
                        No directly connected critical infrastructure for this asset.
                      </div>
                    )}
                  </div>
                )}

                {/* Operational Impact */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                    Operational Impact
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed px-1">{outage.operationalImpact}</p>
                </div>

                {/* Recommended Priority */}
                <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/50 flex items-start gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] font-mono font-bold text-blue-700 uppercase mb-0.5">
                      Recommended Priority
                    </div>
                    <p className="text-xs text-slate-800 font-medium leading-relaxed">{outage.recommendedPriority}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Formula Disclosure ── */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-500 space-y-0.5">
            <div className="font-bold text-slate-600 uppercase tracking-wider mb-1">Formula Applied</div>
            <div>Composite Risk = 0.60 × Physical Health + 0.20 × Normalized Weather Risk + 0.20 × Grid Criticality</div>
            <div className="text-[10px] text-slate-400 mt-1 font-sans">
              Scenario estimate for operational planning only · Not a failure probability · Human countersign required for dispatch decisions
            </div>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}
