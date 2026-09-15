import React, { useEffect } from 'react';
import {
  X,
  Info,
  AlertTriangle,
  TrendingUp,
  Thermometer,
  Activity,
  Cloud,
  Zap,
  ShieldAlert,
  Users,
  CheckCircle2
} from 'lucide-react';

/**
 * ExplainRiskModal — "Why Is This Asset At Risk?" Explainability Panel
 *
 * Renders an enterprise modal that decompose the Composite Risk Score for a
 * selected transformer using the canonical 60/20/20 formula:
 *
 *   Composite Risk = 0.60 × physical_health_score
 *                  + 0.20 × weather_risk_normalized      (normalized from weather_multiplier)
 *                  + 0.20 × grid_criticality_score
 *
 * All values are sourced directly from the existing asset record already
 * enriched by the backend — no new telemetry is invented.
 */
export default function ExplainRiskModal({ isOpen, onClose, asset }) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !asset) return null;

  // ─── Derive contribution components from existing asset fields ───────────
  const physicalHealth = typeof asset.physical_health_score === 'number'
    ? asset.physical_health_score
    : typeof asset.dga_health_index === 'number'
    ? asset.dga_health_index
    : null;

  // weather_multiplier is in [1.0, 1.5]; normalize to 0-100
  const weatherMultiplier = typeof asset.weather_multiplier === 'number'
    ? asset.weather_multiplier
    : null;
  const weatherNormalized = weatherMultiplier !== null
    ? Math.min(100, Math.max(0, ((weatherMultiplier - 1.0) / 0.5) * 100))
    : null;

  const gridCriticality = typeof asset.grid_criticality_score === 'number'
    ? asset.grid_criticality_score
    : null;

  // Weighted contributions
  const physContrib = physicalHealth !== null ? 0.60 * physicalHealth : null;
  const weatherContrib = weatherNormalized !== null ? 0.20 * weatherNormalized : null;
  const critContrib = gridCriticality !== null ? 0.20 * gridCriticality : null;

  const dga = asset.dga_ppm || {};

  // ─── Category styling ───────────────────────────────────────────────────
  const catStyles = {
    CRITICAL: { badge: 'bg-red-50 text-red-700 border-red-200', bar: 'bg-red-500', accent: 'text-red-700', ring: 'ring-red-200' },
    HIGH:     { badge: 'bg-amber-50 text-amber-700 border-amber-200', bar: 'bg-amber-500', accent: 'text-amber-700', ring: 'ring-amber-200' },
    MEDIUM:   { badge: 'bg-blue-50 text-blue-700 border-blue-200', bar: 'bg-blue-500', accent: 'text-blue-700', ring: 'ring-blue-200' },
    LOW:      { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', bar: 'bg-emerald-500', accent: 'text-emerald-700', ring: 'ring-emerald-200' },
  };
  const style = catStyles[asset.risk_category] || catStyles.LOW;

  // ─── Recommended operator attention based on risk category ───────────────
  const operatorAction = {
    CRITICAL: { label: 'Immediate operator review', icon: AlertTriangle, color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
    HIGH:     { label: 'Priority operator review', icon: AlertTriangle, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
    MEDIUM:   { label: 'Planned inspection', icon: TrendingUp, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
    LOW:      { label: 'Routine monitoring', icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  }[asset.risk_category] || { label: 'Routine monitoring', icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' };
  const ActionIcon = operatorAction.icon;

  // ─── Primary risk drivers: sort contributions descending ─────────────────
  const drivers = [
    { label: 'Physical Health', value: physContrib, raw: physicalHealth, weight: '0.60', color: 'bg-slate-700' },
    { label: 'Weather Stress', value: weatherContrib, raw: weatherNormalized, weight: '0.20', color: 'bg-sky-500' },
    { label: 'Grid Criticality', value: critContrib, raw: gridCriticality, weight: '0.20', color: 'bg-violet-500' },
  ]
    .filter(d => d.value !== null)
    .sort((a, b) => b.value - a.value);

  // ─── Contribution bar helper ──────────────────────────────────────────────
  const ContribBar = ({ label, contribution, rawValue, weight, barColor, icon: Icon }) => {
    const pct = contribution !== null ? Math.min(100, Math.max(0, contribution)) : 0;
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            {Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />}
            <span>{label}</span>
            <span className="font-mono text-slate-400 text-[11px]">(×{weight})</span>
          </div>
          <div className="font-mono font-bold text-slate-900">
            {contribution !== null ? contribution.toFixed(1) : 'N/A'}
            <span className="text-slate-400 font-normal text-[11px]"> / 100</span>
          </div>
        </div>
        <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="text-[11px] text-slate-500 font-mono">
          Raw input: {rawValue !== null ? rawValue.toFixed(1) : 'Unavailable'}
        </div>
      </div>
    );
  };

  // ─── Evidence row helper ──────────────────────────────────────────────────
  const EvidenceRow = ({ label, value, unit = '', highlight = false }) => (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-600">{label}</span>
      <span className={`text-xs font-mono font-semibold ${highlight ? 'text-red-700' : 'text-slate-900'}`}>
        {value !== null && value !== undefined ? `${value}${unit}` : 'Unavailable'}
      </span>
    </div>
  );

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Panel */}
      <div className="relative w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden my-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-800 text-white shadow-xs">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Why Is This Asset At Risk?</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Composite risk decomposition — {asset.asset_id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close explain panel"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6 bg-white">

          {/* 1. Asset Summary */}
          <div className={`p-4 rounded-xl border bg-slate-50 space-y-2`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="font-mono font-bold text-lg text-slate-900">{asset.asset_id}</span>
                <div className="text-xs text-slate-500 mt-0.5">{asset.substation_name || asset.substation_id || 'Unavailable'}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono font-semibold px-2.5 py-1 rounded border ${style.badge}`}>
                  {asset.risk_category}
                </span>
                <span className={`text-2xl font-mono font-bold ${style.accent}`}>
                  {asset.composite_risk_score ?? 'N/A'}
                  <span className="text-sm text-slate-400 font-normal"> / 100</span>
                </span>
              </div>
            </div>
          </div>

          {/* 2. Contribution Breakdown */}
          <div>
            <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-3">
              Score Contribution Breakdown (60 / 20 / 20)
            </h4>
            <div className="space-y-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
              <ContribBar
                label="Physical Health"
                contribution={physContrib}
                rawValue={physicalHealth}
                weight="0.60"
                barColor="bg-slate-700"
                icon={Activity}
              />
              <ContribBar
                label="Weather Stress"
                contribution={weatherContrib}
                rawValue={weatherNormalized}
                weight="0.20"
                barColor="bg-sky-500"
                icon={Cloud}
              />
              <ContribBar
                label="Grid Criticality"
                contribution={critContrib}
                rawValue={gridCriticality}
                weight="0.20"
                barColor="bg-violet-500"
                icon={Zap}
              />

              {/* Formula recap */}
              <div className="pt-2 border-t border-slate-200 text-[11px] font-mono text-slate-500 leading-relaxed">
                Composite = 0.60 × Physical Health + 0.20 × Normalized Weather Risk + 0.20 × Grid Criticality
                {physContrib !== null && weatherContrib !== null && critContrib !== null && (
                  <span className="ml-1 text-slate-700 font-semibold">
                    = {physContrib.toFixed(1)} + {weatherContrib.toFixed(1)} + {critContrib.toFixed(1)}
                    {' '}≈ <span className={style.accent}>{asset.composite_risk_score}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 3. Primary Risk Drivers */}
          {drivers.length > 0 && (
            <div>
              <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-3">
                Primary Risk Drivers
              </h4>
              <div className="space-y-1.5">
                {drivers.map((d, i) => (
                  <div key={d.label} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className={`w-5 h-5 flex items-center justify-center rounded-full text-white text-[10px] font-bold ${d.color}`}>
                      {i + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 flex-1">{d.label}</span>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {d.value !== null ? d.value.toFixed(1) : 'N/A'} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Underlying Evidence */}
          <div>
            <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-3">
              Underlying Sensor Evidence
            </h4>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-0">
              <EvidenceRow
                label="Physical / DGA Health Index"
                value={physicalHealth !== null ? physicalHealth.toFixed(1) : null}
                highlight={physicalHealth !== null && physicalHealth >= 70}
              />
              <EvidenceRow
                label="Oil Temperature"
                value={asset.oil_temp_c ?? null}
                unit="°C"
                highlight={asset.oil_temp_c > 100}
              />
              <EvidenceRow
                label="Winding Temperature"
                value={asset.winding_temp_c ?? null}
                unit="°C"
                highlight={asset.winding_temp_c > 120}
              />
              <EvidenceRow
                label="Vibration"
                value={asset.vibration_mms ?? null}
                unit=" mm/s"
                highlight={asset.vibration_mms > 6}
              />
              <EvidenceRow
                label="Weather Multiplier (raw)"
                value={weatherMultiplier !== null ? weatherMultiplier.toFixed(2) : null}
                unit="×"
                highlight={weatherMultiplier > 1.3}
              />
              <EvidenceRow
                label="Normalized Weather Risk"
                value={weatherNormalized !== null ? weatherNormalized.toFixed(1) : null}
                unit=" / 100"
              />
              <EvidenceRow
                label="Grid Criticality Score"
                value={gridCriticality !== null ? gridCriticality.toFixed(1) : null}
                unit=" / 100"
                highlight={gridCriticality > 75}
              />
              {asset.customers_served !== undefined && (
                <EvidenceRow
                  label="Downstream Customers"
                  value={asset.customers_served !== null ? asset.customers_served.toLocaleString() : null}
                />
              )}
              {(asset.hospital_connected || asset.transit_connected || asset.water_plant_connected) && (
                <div className="flex items-center gap-2 py-1.5 flex-wrap">
                  <span className="text-xs text-slate-600 mr-1">Critical Infrastructure:</span>
                  {asset.hospital_connected && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-semibold">Hospital</span>
                  )}
                  {asset.transit_connected && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold">Transit</span>
                  )}
                  {asset.water_plant_connected && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">Water Plant</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 5. Recommended Operator Attention */}
          <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${operatorAction.bg}`}>
            <ActionIcon className={`w-4 h-4 mt-0.5 shrink-0 ${operatorAction.color}`} />
            <div>
              <div className={`text-xs font-bold ${operatorAction.color}`}>Recommended Operator Attention</div>
              <div className={`text-xs mt-0.5 font-medium ${operatorAction.color}`}>{operatorAction.label}</div>
            </div>
          </div>

          {/* 6. Disclaimer */}
          <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-100 pt-4 italic">
            Operational prioritization score — not a statistically calibrated probability of failure.
            This decomposition reflects the deterministic 60/20/20 heuristic applied by the GridSentinel risk engine.
          </p>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
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
