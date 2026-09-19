import React, { useState } from 'react';
import {
  Sparkles,
  Cpu,
  Copy,
  Check,
  Download,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Activity,
  Zap,
  Flame,
  CloudRain,
  Building2,
  Users,
  Clock,
  CheckCircle2,
  FileText,
  Thermometer,
  Wind,
  Gauge,
  UserCheck,
  Sliders,
  ChevronRight
} from 'lucide-react';
import { normalizeDirective } from '../utils/directiveParser';

export default function StructuredDirectiveConsole({
  directive,
  structuredDirective = null,
  asset = {},
  weather = {},
  isLiveGranite = false,
  engineName = 'IBM Granite 3.0 — Template Fallback',
  signOffResult = null,
  onOpenSignOff = null,
  isModal = false
}) {
  const [viewMode, setViewMode] = useState('console'); // 'console' | 'raw'
  const [copied, setCopied] = useState(false);

  // Normalize into strongly typed structured directive
  const data = normalizeDirective(
    directive,
    asset,
    weather,
    structuredDirective,
    engineName,
    isLiveGranite
  );

  const handleCopy = () => {
    if (!directive && !data) return;
    const textToCopy = directive || JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const textToDownload = directive || JSON.stringify(data, null, 2);
    const blob = new Blob([textToDownload], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GridSentinel-Directive-${data.asset.id || 'TX'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Badge helpers
  const getRiskTheme = (level) => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL':
        return {
          badge: 'bg-red-50 text-red-700 border-red-200',
          accent: 'text-red-600',
          border: 'border-red-200',
          bg: 'bg-red-50/50',
          stepBg: 'bg-red-600 text-white',
          cardBorder: 'border-red-200 hover:border-red-300',
          pill: 'bg-red-100 text-red-800'
        };
      case 'HIGH':
        return {
          badge: 'bg-amber-50 text-amber-700 border-amber-200',
          accent: 'text-amber-600',
          border: 'border-amber-200',
          bg: 'bg-amber-50/50',
          stepBg: 'bg-amber-600 text-white',
          cardBorder: 'border-amber-200 hover:border-amber-300',
          pill: 'bg-amber-100 text-amber-800'
        };
      case 'MEDIUM':
        return {
          badge: 'bg-blue-50 text-blue-700 border-blue-200',
          accent: 'text-blue-600',
          border: 'border-blue-200',
          bg: 'bg-blue-50/50',
          stepBg: 'bg-blue-600 text-white',
          cardBorder: 'border-blue-200 hover:border-blue-300',
          pill: 'bg-blue-100 text-blue-800'
        };
      default:
        return {
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          accent: 'text-emerald-600',
          border: 'border-emerald-200',
          bg: 'bg-emerald-50/50',
          stepBg: 'bg-emerald-600 text-white',
          cardBorder: 'border-emerald-200 hover:border-emerald-300',
          pill: 'bg-emerald-100 text-emerald-800'
        };
    }
  };

  const theme = getRiskTheme(data.asset.risk_level);

  return (
    <div className="space-y-5">
      {/* 1. Header Toolbar & Metadata Strip */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-900 tracking-tight">
                  OPERATIONAL PRE-POSITIONING DIRECTIVE
                </span>
                <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded-full border ${theme.badge}`}>
                  {data.asset.risk_level} PRIORITY
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                  Risk: {Number(data.asset.risk_score).toFixed(1)}/100
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Target: <span className="font-bold text-slate-800">{data.asset.id}</span> ({data.asset.model}) · <span className="font-medium text-slate-700">{data.asset.location}</span>
              </p>
            </div>
          </div>

          {/* Right Action Tools: Engine Badge & View Toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Transparent Generation Engine Source Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium bg-slate-50 border-slate-200 text-slate-700">
              <span className={`w-2 h-2 rounded-full ${data.is_live_granite ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
              <span>{data.engine}</span>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setViewMode('console')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'console'
                    ? 'bg-white text-blue-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Action Cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode('raw')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'raw'
                    ? 'bg-white text-blue-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Markdown View
              </button>
            </div>

            {/* Copy / Export buttons */}
            <button
              type="button"
              onClick={handleCopy}
              title="Copy directive text"
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              title="Download directive (.md)"
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Timestamp strip */}
        <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Generated: {new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} (Dynamic telemetry sync)
          </span>
          <span className="font-mono text-slate-600">
            Asset ID: {data.asset.id}
          </span>
        </div>
      </div>

      {/* Raw Markdown View (Optional view for operator inspection) */}
      {viewMode === 'raw' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-inner text-slate-100 font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-[550px] overflow-y-auto">
          {directive || JSON.stringify(data, null, 2)}
        </div>
      )}

      {/* Structured Operations Console View (Default) */}
      {viewMode === 'console' && (
        <div className="space-y-5">
          {/* ========================================================================= */}
          {/* SECTION 1: RECOMMENDED ACTION (Hero Focus with Numbered Action Cards)    */}
          {/* ========================================================================= */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Recommended Action Sequence
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dynamic operational sequence formulated from current electrical, thermal, and atmospheric risks
                </p>
              </div>
              <span className="text-[11px] font-medium text-slate-500">
                {data.recommendations?.length || 0} Action Step(s) Defined
              </span>
            </div>

            {/* Numbered Cards Stack */}
            <div className="space-y-3">
              {data.recommendations?.map((rec, index) => {
                const stepTheme = getRiskTheme(rec.urgency);
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border transition-all bg-slate-50/70 hover:bg-white ${stepTheme.cardBorder} shadow-xs space-y-2`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {/* Big Step Number Circle */}
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-xs ${stepTheme.stepBg}`}>
                          {rec.step || index + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                              {rec.title}
                            </h4>
                            <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${stepTheme.badge}`}>
                              {rec.urgency}
                            </span>
                            {rec.type && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-200/70 text-slate-700 capitalize">
                                {rec.type}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">
                            {rec.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: Why This Asset Is Currently [Level] Risk (Diagnostic Baseline) */}
          {/* ========================================================================= */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                  <Activity className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Why {data.asset.id} Is Currently <span className={theme.accent}>{data.asset.risk_level}</span> Risk ({Number(data.asset.risk_score).toFixed(1)}/100)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Current physics-informed diagnostic baseline: dissolved gas concentrations, physical telemetry, and external storm compounding
              </p>
            </div>

            {/* 4 Multi-Variable Diagnostic Baseline Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Card 1: IEEE C57.104 Gas Diagnostics */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-600" />
                    <span>IEEE C57.104 Gas Signature</span>
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                    data.dga.c2h2_ppm >= 35 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {data.dga.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-snug">
                  Primary Risk: <strong className="text-slate-800 font-semibold">{data.dga.primary_risk_factor}</strong>
                </p>
                {/* 4 Dissolved Gases Chips */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">C2H2 (Acetylene)</span>
                    <span className={`text-xs font-mono font-bold ${data.dga.c2h2_ppm >= 35 ? 'text-red-600' : 'text-slate-900'}`}>
                      {data.dga.c2h2_ppm?.toFixed(1)} ppm
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">C2H4 (Ethylene)</span>
                    <span className={`text-xs font-mono font-bold ${data.dga.c2h4_ppm >= 100 ? 'text-amber-600' : 'text-slate-900'}`}>
                      {data.dga.c2h4_ppm?.toFixed(1)} ppm
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">H2 (Hydrogen)</span>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {data.dga.h2_ppm?.toFixed(1)} ppm
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">CH4 (Methane)</span>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {data.dga.ch4_ppm?.toFixed(1)} ppm
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Operational SCADA Telemetry */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-blue-600" />
                    <span>Operational SCADA Telemetry</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                    Live Polling
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="p-2 rounded-lg bg-white border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-500 block font-medium">Top-Oil Temp</span>
                    <span className={`text-xs font-mono font-bold block mt-1 ${data.telemetry.oil_temperature_c >= 105 ? 'text-red-600' : 'text-slate-900'}`}>
                      {data.telemetry.oil_temperature_c?.toFixed(1)}°C
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-500 block font-medium">Core Vibration</span>
                    <span className={`text-xs font-mono font-bold block mt-1 ${data.telemetry.vibration_mms >= 7 ? 'text-red-600' : 'text-slate-900'}`}>
                      {data.telemetry.vibration_mms?.toFixed(2)} mm/s
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-500 block font-medium">Electrical Load</span>
                    <span className={`text-xs font-mono font-bold block mt-1 ${data.telemetry.load_percent >= 90 ? 'text-amber-600' : 'text-slate-900'}`}>
                      {data.telemetry.load_percent?.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  Arrhenius thermal degradation acceleration factored into composite physical index.
                </p>
              </div>

              {/* Card 3: Weather Compounding */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <CloudRain className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Atmospheric Weather Compounding</span>
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {data.weather.source}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-600 font-medium">{data.weather.event_name}</span>
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {data.weather.stress_multiplier?.toFixed(2)}x Stress Multiplier
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
                  <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">Ambient Temp</span>
                    <span className="font-mono font-bold text-slate-900">{data.weather.temperature_c?.toFixed(1)}°C</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">Wind Gusts</span>
                    <span className="font-mono font-bold text-slate-900">{data.weather.wind_gust_kmh?.toFixed(0)} km/h</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Grid Criticality & Impact */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Grid Criticality & Outage Impact</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                    {data.historical_context.incident_count} Past Outage(s)
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500 font-medium">Affected Customers:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {data.grid_impact.customers_affected?.toLocaleString()} Accounts
                  </span>
                </div>
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-slate-500 font-medium block">Critical Infrastructure Feeds:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {data.grid_impact.critical_infrastructure?.map((infra, idx) => (
                      <span key={idx} className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                        {infra}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 3: Crew Requirement & Pre-Positioning Logistics                   */}
          {/* ========================================================================= */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Crew Requirement & Pre-Positioning Logistics
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Staging directives, field technician allocations, and hot-standby equipment requirements
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Crew Allocation */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                  Crew Allocation & Discipline
                </span>
                <p className="text-xs text-slate-800 font-medium leading-relaxed">
                  {data.crew.deployment}
                </p>
              </div>

              {/* Pre-Positioning Directive */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                  Pre-Positioning Directive
                </span>
                <p className="text-xs text-slate-800 font-medium leading-relaxed">
                  {data.crew.pre_positioning}
                </p>
              </div>

              {/* Diagnostic Tools */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                  Required Diagnostic Tools
                </span>
                <p className="text-xs text-slate-800 font-medium leading-relaxed">
                  {data.crew.diagnostic_equipment}
                </p>
              </div>

              {/* Spare Parts */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                  Spare Parts on Hot Standby
                </span>
                <p className="text-xs text-slate-800 font-medium leading-relaxed">
                  {data.crew.spare_parts}
                </p>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 4: Safety Considerations & Urgency                                */}
          {/* ========================================================================= */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Safety Considerations & Operational Safeguards
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Arc-flash exclusion boundaries, remote trip safeguards, and field team health protocols
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                  Reason for Urgency Tier
                </span>
                <p className="text-xs text-slate-800 font-medium leading-relaxed">
                  {data.safety_and_urgency.reason}
                </p>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                  Safety Safeguards & Protocols
                </span>
                <p className="text-xs text-slate-800 font-medium leading-relaxed">
                  {data.safety_and_urgency.safety}
                </p>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 5: Human Review & Approval Mandate (Countersignature Advisory)    */}
          {/* ========================================================================= */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-600 text-white shadow-xs shrink-0 mt-0.5">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Human-in-the-Loop Mandate
                  </h4>
                  {signOffResult ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      Approved & Countersigned
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                      Awaiting Operator Approval
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {data.human_review.mandate}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
