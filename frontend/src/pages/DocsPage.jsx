import React, { useState } from 'react';
import {
  BookOpen,
  ShieldCheck,
  Cpu,
  Layers,
  CheckCircle2,
  ExternalLink,
  Activity,
  Zap,
  Server,
  AlertTriangle,
  CloudRain,
  Building2,
  Users,
  Check,
  FileText,
  Lock,
  Scale,
  HelpCircle,
  Info,
  ArrowRight,
  ChevronRight
} from 'lucide-react';

export default function DocsPage({ health }) {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', title: 'System Overview' },
    { id: 'risk-formula', title: 'Risk Architecture (60/20/20)' },
    { id: 'dga-diagnostics', title: 'DGA Diagnostics & Physics' },
    { id: 'weather-stress', title: 'Environmental Weather Stress' },
    { id: 'grid-criticality', title: 'Grid Criticality & Impact' },
    { id: 'granite-copilot', title: 'IBM Granite AI Dispatcher' },
    { id: 'human-in-the-loop', title: 'Human-in-the-Loop Governance' },
    { id: 'limitations', title: 'Limitations & Operational Boundaries' },
    { id: 'api-reference', title: 'FastAPI Microservices Reference' },
  ];

  const apiEndpoints = [
    { path: '/api/health', method: 'GET', name: 'Health & IBM watsonx Connectivity', status: health?.status === 'healthy' ? 'ONLINE' : 'ACTIVE' },
    { path: '/api/risk/ranked', method: 'GET', name: 'Ranked Multi-Variable Fleet Risk Pipeline', status: 'ONLINE' },
    { path: '/api/weather', method: 'GET', name: 'Meteorological Weather Telemetry Feed', status: 'ONLINE' },
    { path: '/api/substations', method: 'GET', name: 'Substation Topology & Criticality Feed', status: 'ONLINE' },
    { path: '/api/work-order/generate', method: 'POST', name: 'IBM Granite 3.0 Work-Order Synthesis', status: 'READY' },
    { path: '/api/work-order/countersign', method: 'POST', name: 'Human Operator Countersign & Dispatch', status: 'READY' },
  ];

  return (
    <div className="space-y-6">

      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              GridSentinel Documentation
            </h1>
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Engineering Specification
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Operational reference for risk analytics, grid criticality, weather stress, AI-assisted work orders, and human-controlled dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Server className="w-3.5 h-3.5 text-slate-500" />
            <span>FastAPI Swagger Docs</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>

      {/* 2. Main Layout with Left Navigation & Right Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

        {/* Left Navigation Sidebar */}
        <div className="lg:col-span-1 lg:sticky lg:top-4 space-y-2">
          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Table of Contents
            </div>
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => {
                  setActiveSection(sec.id);
                  const el = document.getElementById(sec.id);
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${
                  activeSection === sec.id
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span>{sec.title}</span>
                {activeSection === sec.id && <ChevronRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
              </button>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Standards Compliance</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Diagnostic heuristics are grounded in IEEE C57.104 dissolved combustible gas limits and NERC CIP dispatch protocols.
            </p>
          </div>
        </div>

        {/* Right Content Stream */}
        <div className="lg:col-span-3 space-y-6">

          {/* Section 1: System Overview */}
          <div id="overview" className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Layers className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                1. System Overview & Core Architecture
              </h2>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              GridSentinel AI is an intelligent operations platform designed for transmission utility dispatchers. It integrates real-time physical sensor telemetry, meteorological storm forecasting, and downstream topological consequence modeling into a unified operational risk score, driving human-governed AI maintenance directives.
            </p>

            {/* Architecture Flow Strip */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                Operational Data Flow Pipeline
              </div>
              <div className="flex items-center justify-between text-xs font-mono overflow-x-auto gap-2 py-1">
                <div className="px-2.5 py-1.5 rounded bg-white border border-slate-200 font-bold text-slate-800 shrink-0">
                  Telemetry Ingestion
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <div className="px-2.5 py-1.5 rounded bg-white border border-slate-200 font-bold text-slate-800 shrink-0">
                  DGA Health (60%)
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <div className="px-2.5 py-1.5 rounded bg-white border border-slate-200 font-bold text-slate-800 shrink-0">
                  Weather Stress (20%)
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <div className="px-2.5 py-1.5 rounded bg-white border border-slate-200 font-bold text-slate-800 shrink-0">
                  Criticality (20%)
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <div className="px-2.5 py-1.5 rounded bg-blue-50 border border-blue-200 font-bold text-blue-700 shrink-0">
                  Composite Risk
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <div className="px-2.5 py-1.5 rounded bg-purple-50 border border-purple-200 font-bold text-purple-700 shrink-0">
                  Granite Directive
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <div className="px-2.5 py-1.5 rounded bg-emerald-50 border border-emerald-200 font-bold text-emerald-700 shrink-0">
                  Human Sign-off
                </div>
              </div>
            </div>

            {/* Component Roles Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                <span className="font-bold text-slate-900 block">Physical Health Index</span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Evaluates internal dielectric oil condition, IEEE C57.104 combustible gas ratios, thermal winding stress, and mechanical vibration.
                </p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                <span className="font-bold text-slate-900 block">Weather Stress Multiplier</span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Calculates environmental amplification from extreme ambient temperature, wind gusts, and lightning surge vulnerability.
                </p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                <span className="font-bold text-slate-900 block">Grid Criticality Score</span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Quantifies societal and grid consequence based on connected hospital feeds, electrified transit, water treatment, and population.
                </p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                <span className="font-bold text-slate-900 block">IBM Granite Copilot & Human Sign-off</span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Synthesizes advisory crew pre-positioning directives. The system is strictly non-autonomous: human review and countersign are required before dispatch.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Risk Architecture */}
          <div id="risk-formula" className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Activity className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                2. Risk Architecture & Heuristic Formulation
              </h2>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Composite Operational Risk is synthesized using a linear multi-variable heuristic in <code className="text-blue-700 font-mono font-semibold">src/risk_engine.py</code>. The score is strictly bounded in the range <span className="font-mono font-semibold text-slate-900">[0.0, 100.0]</span> and serves as an <strong>operational prioritization score</strong> for maintenance and staging triage, rather than a statistical probability of instantaneous physical failure.
            </p>

            {/* Formula Callout */}
            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-2">
              <div className="text-xs font-mono font-bold text-blue-800 uppercase tracking-wider">
                Verified Risk Weighting Formula
              </div>
              <div className="p-3 rounded-lg bg-white font-mono text-xs font-bold text-slate-900 border border-blue-200 shadow-xs overflow-x-auto">
                COMPOSITE RISK = (0.60 × PHYSICAL HEALTH) + (0.20 × NORMALIZED WEATHER RISK) + (0.20 × GRID CRITICALITY)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
                <div>
                  <strong className="text-slate-900 block font-mono">60% Physical Health:</strong>
                  <span className="text-slate-600 text-[11px]">Primary indicator grounded in internal dissolved combustible gas degradation.</span>
                </div>
                <div>
                  <strong className="text-slate-900 block font-mono">20% Normalized Weather Risk:</strong>
                  <span className="text-slate-600 text-[11px]">Linear normalization of weather multiplier [1.0–1.5] mapped to a 0–100 scale.</span>
                </div>
                <div>
                  <strong className="text-slate-900 block font-mono">20% Grid Criticality:</strong>
                  <span className="text-slate-600 text-[11px]">Societal consequence weighting ensuring high-impact assets ascend to top priority.</span>
                </div>
              </div>
            </div>

            {/* Risk Categories Table */}
            <div className="pt-2">
              <div className="text-xs font-bold text-slate-900 mb-2">Priority Classification Tiers</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800">
                  <div className="font-bold font-mono">CRITICAL (≥80)</div>
                  <div className="text-[11px] mt-0.5">Immediate staging & crew dispatch</div>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                  <div className="font-bold font-mono">HIGH (60–79)</div>
                  <div className="text-[11px] mt-0.5">Pre-emptive load transfer & inspection</div>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800">
                  <div className="font-bold font-mono">MEDIUM (30–59)</div>
                  <div className="text-[11px] mt-0.5">Heightened telemetry sampling rate</div>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
                  <div className="font-bold font-mono">LOW (&lt;30)</div>
                  <div className="text-[11px] mt-0.5">Normal baseline SCADA monitoring</div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: DGA Diagnostics */}
          <div id="dga-diagnostics" className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Zap className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                3. Dissolved Gas Analysis (DGA) Diagnostics
              </h2>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Dissolved Gas Analysis is the electric utility industry gold standard for detecting incipient transformer faults. Under thermal and dielectric electrical stress, mineral oil molecules break down into characteristic combustible gases. Reference thresholds in <code className="text-blue-700 font-mono font-semibold">src/dga_engine.py</code> are physics-informed heuristics inspired by the IEEE C57.104 standard.
            </p>

            {/* Diagnostic Thresholds Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px]">
                    <th className="py-2.5 pr-4">Key Gas</th>
                    <th className="py-2.5 px-3">Formula</th>
                    <th className="py-2.5 px-3">Condition 1 (Normal)</th>
                    <th className="py-2.5 px-3">Condition 2 (Warning)</th>
                    <th className="py-2.5 px-3">Condition 3/4 (Action)</th>
                    <th className="py-2.5 pl-3">Primary Fault Indication</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  <tr>
                    <td className="py-2.5 pr-4 font-sans font-bold">Hydrogen</td>
                    <td className="py-2.5 px-3 text-slate-500 font-bold">H₂</td>
                    <td className="py-2.5 px-3 text-emerald-700">≤ 100 ppm</td>
                    <td className="py-2.5 px-3 text-amber-700">101–700 ppm</td>
                    <td className="py-2.5 px-3 text-red-700 font-bold">&gt; 700 ppm</td>
                    <td className="py-2.5 pl-3 font-sans text-slate-600">Corona discharge / partial discharge</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-sans font-bold">Methane</td>
                    <td className="py-2.5 px-3 text-slate-500 font-bold">CH₄</td>
                    <td className="py-2.5 px-3 text-emerald-700">≤ 120 ppm</td>
                    <td className="py-2.5 px-3 text-amber-700">121–400 ppm</td>
                    <td className="py-2.5 px-3 text-red-700 font-bold">&gt; 400 ppm</td>
                    <td className="py-2.5 pl-3 font-sans text-slate-600">Low-temperature thermal decomposition</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-sans font-bold">Ethane</td>
                    <td className="py-2.5 px-3 text-slate-500 font-bold">C₂H₆</td>
                    <td className="py-2.5 px-3 text-emerald-700">≤ 65 ppm</td>
                    <td className="py-2.5 px-3 text-amber-700">66–100 ppm</td>
                    <td className="py-2.5 px-3 text-red-700 font-bold">&gt; 100 ppm</td>
                    <td className="py-2.5 pl-3 font-sans text-slate-600">Moderate thermal oil breakdown</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-sans font-bold">Ethylene</td>
                    <td className="py-2.5 px-3 text-slate-500 font-bold">C₂H₄</td>
                    <td className="py-2.5 px-3 text-emerald-700">≤ 50 ppm</td>
                    <td className="py-2.5 px-3 text-amber-700">51–100 ppm</td>
                    <td className="py-2.5 px-3 text-red-700 font-bold">&gt; 100 ppm</td>
                    <td className="py-2.5 pl-3 font-sans text-slate-600">Severe thermal overheating (&gt;300°C)</td>
                  </tr>
                  <tr className="bg-red-50/50">
                    <td className="py-2.5 pr-4 font-sans font-extrabold text-red-900">Acetylene</td>
                    <td className="py-2.5 px-3 text-red-700 font-bold">C₂H₂</td>
                    <td className="py-2.5 px-3 text-emerald-700">≤ 1 ppm</td>
                    <td className="py-2.5 px-3 text-amber-700">2–9 ppm</td>
                    <td className="py-2.5 px-3 text-red-700 font-bold">&gt; 9 ppm (Arcing!)</td>
                    <td className="py-2.5 pl-3 font-sans font-bold text-red-800">High-energy electrical arcing (&gt;700°C)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
              <span className="font-bold text-slate-900 block">Classified Fault Taxonomies:</span>
              <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px]">
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-semibold text-red-700">ARCING</span>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-semibold text-amber-700">THERMAL_OVERHEAT</span>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-semibold text-blue-700">MECHANICAL_STRESS</span>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-semibold text-purple-700">DATA_QUALITY</span>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-semibold text-emerald-700">NONE</span>
              </div>
            </div>
          </div>

          {/* Section 4: Weather Stress */}
          <div id="weather-stress" className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <CloudRain className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                4. Environmental Weather Stress Engine
              </h2>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Implemented in <code className="text-blue-700 font-mono font-semibold">src/weather_engine.py</code>, this component ingests local meteorological feeds and evaluates how adverse weather exacerbates physical transformer degradation. High ambient heatwaves inhibit radiator oil dissipation, high winds cause conductor galloping and debris strikes, and lightning storms introduce extreme electrical surge transients.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-900 block">Weather Stress Multiplier</span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Strictly bounded between <span className="font-mono font-semibold text-slate-900">1.0×</span> (nominal, fair weather) and <span className="font-mono font-semibold text-slate-900">1.5×</span> (maximum compounding storm conditions).
                </p>
                <div className="font-mono text-[11px] text-slate-700 pt-1">
                  Formula: <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200">base = 1.0 + heat_factor + wind_factor + storm_factor</code>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-900 block">Meteorological Ingestion Vectors</span>
                <ul className="text-slate-600 text-[11px] space-y-1 list-disc list-inside">
                  <li><strong>Ambient Temperature:</strong> Thermal barrier above 35°C</li>
                  <li><strong>Sustained Wind & Gusts:</strong> Conductor contact risk &gt;70 km/h</li>
                  <li><strong>Lightning Surge Rate:</strong> High lightning flash density alerts</li>
                  <li><strong>Storm Category:</strong> Compound tropical storm warning alerts</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 5: Grid Criticality */}
          <div id="grid-criticality" className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building2 className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                5. Grid Criticality & Topological Consequence
              </h2>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Implemented in <code className="text-blue-700 font-mono font-semibold">src/criticality_engine.py</code>, grid criticality establishes that <strong>criticality is independent of physical health</strong>. A brand-new, perfectly healthy transformer serving a regional trauma hospital and electrified transit network carries a criticality score of 100/100, reflecting the catastrophic societal consequence of its unexpected outage.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-medium block">Hospital Connection</span>
                <span className="text-base font-bold text-slate-900 mt-1 block">+35 pts</span>
                <span className="text-[11px] text-slate-500">Trauma center emergency power</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-medium block">Electrified Rail Transit</span>
                <span className="text-base font-bold text-slate-900 mt-1 block">+25 pts</span>
                <span className="text-[11px] text-slate-500">Urban transit commuter network</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-medium block">Water Treatment Plant</span>
                <span className="text-base font-bold text-slate-900 mt-1 block">+20 pts</span>
                <span className="text-[11px] text-slate-500">Municipal potable water feed</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-medium block">Population &gt; 50k</span>
                <span className="text-base font-bold text-slate-900 mt-1 block">+20 pts</span>
                <span className="text-[11px] text-slate-500">High-density customer footprint</span>
              </div>
            </div>
          </div>

          {/* Section 6: IBM Granite Work Orders */}
          <div id="granite-copilot" className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Cpu className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                6. IBM Granite 3.0 Work-Order Synthesis
              </h2>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              <strong className="text-slate-900">IBM Granite 3.0 (ibm/granite-3-8b-instruct)</strong> on <strong className="text-slate-900">IBM watsonx.ai</strong> serves as the advisory decision-support layer. Granite does not compute underlying DGA math, weather multipliers, or risk formulas. Instead, it receives verified deterministic risk evidence and synthesizes actionable maintenance directives detailing required equipment, replacement parts, and emergency load transfers.
            </p>

            <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-200 text-xs text-slate-700 space-y-1.5">
              <span className="font-bold text-blue-900 block">Deterministic Offline Fallback Architecture:</span>
              <p className="text-[11px] leading-relaxed">
                When watsonx credentials are not present or network connectivity is restricted, the platform automatically engages a deterministic fallback template engine in <code className="text-blue-800 font-mono font-semibold">src/work_order_generator.py</code>. This guarantees zero downtime and provides fully populated pre-positioning directives even in isolated grid control centers.
              </p>
            </div>
          </div>

          {/* Section 7: Human-in-the-Loop */}
          <div id="human-in-the-loop" className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                7. Human-in-the-Loop Operator Governance
              </h2>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
              "AI-generated directives require operator review and countersign before dispatch."
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              To guarantee strict adherence to utility regulatory mandates and NERC reliability frameworks, GridSentinel AI enforces a closed-loop human validation protocol:
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                <div>
                  <strong className="text-slate-900 block">Deterministic Risk Assessment:</strong>
                  <span className="text-slate-600 text-[11px]">Sensor telemetry and IEEE standards establish objective physical risk factors.</span>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                <div>
                  <strong className="text-slate-900 block">AI Directive Synthesis:</strong>
                  <span className="text-slate-600 text-[11px]">IBM Granite drafts crew staging, equipment, and contingency instructions.</span>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                <div>
                  <strong className="text-slate-900 block">Licensed Operator Review:</strong>
                  <span className="text-slate-600 text-[11px]">Dispatcher reviews the draft directive against live SCADA telemetry and operating limits.</span>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-[11px]">4</span>
                <div>
                  <strong className="text-slate-900 block">Cryptographic Countersign & Dispatch:</strong>
                  <span className="text-slate-600 text-[11px]">Operator signs with Operator ID and Badge, generating an immutable Dispatch ID.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 8: Limitations */}
          <div id="limitations" className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Scale className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                8. Operational Limitations & Responsible AI Boundaries
              </h2>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block">Physics-Informed Heuristic vs. Predictive ML:</strong>
                <p className="text-[11px] leading-relaxed">
                  The risk engine calculates deterministic priority ranks based on physical sensor rules. It does not claim statistical regression certainty or predict exact minutes-to-failure.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block">IEEE C57.104 Reference Thresholds:</strong>
                <p className="text-[11px] leading-relaxed">
                  Gas limits and thermal penalties are reference values calibrated for high-voltage oil-filled transformers. Site-specific oil testing laboratories must corroborate critical alarms.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block">Demonstration Dataset Context:</strong>
                <p className="text-[11px] leading-relaxed">
                  Fleet telemetry and weather records reflect simulated severe weather scenarios for hackathon evaluation and operational training.
                </p>
              </div>
            </div>
          </div>

          {/* Section 9: API Reference */}
          <div id="api-reference" className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Server className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                9. FastAPI REST Microservices Reference
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px]">
                    <th className="py-2.5 pr-3">Method</th>
                    <th className="py-2.5 px-3">Endpoint Path</th>
                    <th className="py-2.5 px-3">Service Name</th>
                    <th className="py-2.5 pl-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {apiEndpoints.map((ep, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 pr-3 font-bold text-blue-700">{ep.method}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{ep.path}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-600">{ep.name}</td>
                      <td className="py-2.5 pl-3 text-right">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {ep.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
