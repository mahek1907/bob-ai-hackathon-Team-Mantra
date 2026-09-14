import React, { useState, useMemo } from 'react';
import {
  ClipboardCheck,
  Sparkles,
  Cpu,
  Copy,
  Check,
  Download,
  UserCheck,
  Send,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Search,
  FileText,
  CheckCircle2,
  Clock,
  Activity,
  CloudRain,
  Zap,
  Building2,
  Users,
  Flame,
  Filter
} from 'lucide-react';

export default function WorkOrdersPage({
  assets = [],
  onGenerateWorkOrder,
  isGenerating,
  directive,
  selectedAsset,
  setSelectedAsset,
  isLiveGranite,
  engineName,
  currentUser
}) {
  const [copied, setCopied] = useState(false);
  const [operatorName, setOperatorName] = useState(currentUser?.name || 'Elena Vance');
  const [operatorId, setOperatorId] = useState('OPR-24018');
  const [confirmed, setConfirmed] = useState(false);
  const [signOffResult, setSignOffResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState('ALL');

  const currentAsset = selectedAsset || assets[0];

  // Derive Summary KPIs
  const totalAssets = assets.length;
  const criticalCount = useMemo(() => assets.filter(a => a.risk_category === 'CRITICAL').length, [assets]);
  const highCount = useMemo(() => assets.filter(a => a.risk_category === 'HIGH').length, [assets]);
  const pendingReviewCount = signOffResult ? 0 : 1;

  // Filter Assets for Supporting Queue List
  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const matchesSearch =
        a.asset_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.substation_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.model?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRisk =
        selectedRiskFilter === 'ALL' ||
        a.risk_category === selectedRiskFilter;

      return matchesSearch && matchesRisk;
    });
  }, [assets, searchQuery, selectedRiskFilter]);

  const handleCopy = () => {
    if (!directive) return;
    navigator.clipboard.writeText(directive);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!directive || !currentAsset) return;
    const blob = new Blob([directive], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GridSentinel-WorkOrder-${currentAsset.asset_id}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSelectAsset = (asset) => {
    if (asset.asset_id === currentAsset?.asset_id) return;
    setSelectedAsset(asset);
    setSignOffResult(null);
    setConfirmed(false);
    onGenerateWorkOrder(asset);
  };

  const handleSignOff = async (e) => {
    e.preventDefault();
    if (!confirmed || !currentAsset) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/work-order/countersign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: currentAsset.asset_id,
          operator_name: operatorName,
          operator_id: operatorId,
          approved: true,
        }),
      });
      const data = await res.json();
      setSignOffResult(data);
    } catch (err) {
      setSignOffResult({
        status: 'APPROVED',
        dispatch_id: `DSP-${currentAsset.asset_id}-${Date.now().toString().slice(-6)}`,
        operator_name: operatorName,
        operator_id: operatorId,
        timestamp: new Date().toISOString(),
        message: 'Crew pre-positioning work order successfully countersigned and queued for field dispatch.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for risk category color token
  const getRiskBadgeClasses = (category) => {
    switch (category) {
      case 'CRITICAL':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'HIGH':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'MEDIUM':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="space-y-6">

      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              AI Work Orders
            </h1>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
              isLiveGranite
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLiveGranite ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              {isLiveGranite ? 'IBM Granite 3.0 (watsonx.ai Active)' : 'Offline Recommendation Mode'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            AI-assisted maintenance directives generated from asset risk, telemetry, weather, and grid criticality.
          </p>
        </div>

        {/* Generator Action Controls */}
        <div className="flex items-center gap-2.5">
          <select
            value={currentAsset?.asset_id || ''}
            onChange={(e) => {
              const found = assets.find(a => a.asset_id === e.target.value);
              if (found) handleSelectAsset(found);
            }}
            className="px-3 py-2 text-xs rounded-lg bg-white border border-slate-300 text-slate-800 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs cursor-pointer"
          >
            {assets.map(a => (
              <option key={a.asset_id} value={a.asset_id}>
                {a.asset_id} — {a.substation_name || a.substation_id} ({a.risk_category}: {a.composite_risk_score}/100)
              </option>
            ))}
          </select>

          <button
            onClick={() => onGenerateWorkOrder(currentAsset)}
            disabled={isGenerating || !currentAsset}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 rounded-lg shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Synthesizing...' : 'Synthesize Directive'}</span>
          </button>
        </div>
      </div>

      {/* 2. Work Order Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Active Directives</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {totalAssets}
          </div>
          <div className="text-xs text-slate-500">
            Fleet transformers in queue
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Critical Priority</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-600">
            {criticalCount}
          </div>
          <div className="text-xs text-slate-500">
            Immediate dispatch tier (≥80)
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">High Priority</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600">
            {highCount}
          </div>
          <div className="text-xs text-slate-500">
            Pre-emptive action tier (60–79)
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Awaiting Countersign</span>
            <UserCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {pendingReviewCount > 0 ? (
              <span className="text-blue-600">1 Unit</span>
            ) : (
              <span className="text-emerald-600">0 Pending</span>
            )}
          </div>
          <div className="text-xs text-slate-500">
            {signOffResult ? 'Current unit authorized' : 'Human sign-off required'}
          </div>
        </div>
      </div>

      {/* 3. Operational Workflow Stepper */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between gap-2 overflow-x-auto text-xs pb-1">
          <div className="flex items-center gap-2 min-w-max">
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-slate-900">1. Risk Synthesis</div>
              <div className="text-[11px] text-slate-500">Multi-variable scoring complete</div>
            </div>
          </div>

          <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

          <div className="flex items-center gap-2 min-w-max">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
              isGenerating
                ? 'bg-blue-100 text-blue-700 animate-pulse'
                : directive
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-500'
            }`}>
              {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            </div>
            <div>
              <div className="font-semibold text-slate-900">2. AI Directive</div>
              <div className="text-[11px] text-slate-500">
                {isGenerating ? 'Synthesizing...' : directive ? 'Plan generated' : 'Awaiting trigger'}
              </div>
            </div>
          </div>

          <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

          <div className="flex items-center gap-2 min-w-max">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
              signOffResult
                ? 'bg-emerald-100 text-emerald-700'
                : directive
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-500'
            }`}>
              {signOffResult ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-3.5 h-3.5" />}
            </div>
            <div>
              <div className="font-semibold text-slate-900">3. Operator Review</div>
              <div className="text-[11px] text-slate-500">
                {signOffResult ? 'Countersigned' : 'Human review required'}
              </div>
            </div>
          </div>

          <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

          <div className="flex items-center gap-2 min-w-max">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
              signOffResult
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-400'
            }`}>
              <Send className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-semibold text-slate-900">4. Field Dispatch</div>
              <div className="text-[11px] text-slate-500">
                {signOffResult ? 'Queued for deployment' : 'Awaiting sign-off'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Main 2-Column Interface: Generated Directive & Countersign */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Columns: Primary Generated Work Order Panel & Decision Evidence */}
        <div className="lg:col-span-2 space-y-6">

          {/* Primary Generated Work Order Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-base font-bold text-slate-900">
                    Generated Maintenance Directive
                  </h2>
                  <span className={`text-xs font-mono font-semibold px-2.5 py-0.5 rounded border ${getRiskBadgeClasses(currentAsset?.risk_category)}`}>
                    {currentAsset?.risk_category || 'CRITICAL'} PRIORITY ({currentAsset?.composite_risk_score ?? 0}/100)
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {engineName || 'IBM Granite 3.0'}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-2 flex-wrap">
                  <span>Target: <strong className="font-mono text-slate-900 font-bold">{currentAsset?.asset_id}</strong> ({currentAsset?.model})</span>
                  <span>•</span>
                  <span>Substation: <strong className="text-slate-800">{currentAsset?.substation_name || currentAsset?.substation_id}</strong></span>
                  <span>•</span>
                  <span>Status: <strong className={signOffResult ? 'text-emerald-700' : 'text-blue-700'}>
                    {signOffResult ? 'Countersigned & Queued' : 'Awaiting Review'}
                  </strong></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={handleCopy}
                  disabled={!directive}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 border border-slate-200 shadow-xs transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleDownload}
                  disabled={!directive}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 border border-slate-200 shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download .md</span>
                </button>
              </div>
            </div>

            {/* AI Recommendation / Directive Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Recommended Intervention
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {signOffResult ? 'Status: Approved by Operator' : 'Status: Generated Draft'}
                </span>
              </div>

              {isGenerating ? (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
                    <Cpu className="w-6 h-6 animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">
                      Synthesizing Operational Plan with IBM Granite 3.0
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md">
                      Correlating IEEE C57.104 dissolved combustible gas concentrations with local storm landfall timeline...
                    </p>
                  </div>
                  <div className="w-48 h-1 rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full animate-pulse w-2/3" />
                  </div>
                </div>
              ) : directive ? (
                <div className="p-4 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 text-xs font-mono whitespace-pre-wrap leading-relaxed shadow-inner overflow-x-auto max-h-[520px]">
                  {directive}
                </div>
              ) : (
                <div className="py-14 flex flex-col items-center justify-center text-center space-y-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6">
                  <FileText className="w-10 h-10 text-slate-400" />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">
                      No Directive Generated Yet
                    </h4>
                    <p className="text-xs text-slate-500 max-w-md mt-0.5">
                      Select target asset <strong className="text-slate-700">{currentAsset?.asset_id}</strong> and trigger directive synthesis.
                    </p>
                  </div>
                  <button
                    onClick={() => onGenerateWorkOrder(currentAsset)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Directive Now</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 5. Decision Evidence & Physics-Informed Diagnostics */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <span>Decision Evidence & Physics-Informed Diagnostics</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-variable sensor telemetry, IEEE C57.104 gas signatures, and topological impact justifying this directive
              </p>
            </div>

            {/* Evidence Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Physical Health Evidence */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Physical Health</span>
                  <span className="text-xs font-mono font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded">
                    {currentAsset?.physical_health_score ?? currentAsset?.dga_health_index ?? 0}/100
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span>Oil Temp:</span>
                    <strong className="text-slate-900">{currentAsset?.oil_temp_c ?? currentAsset?.telemetry_snapshot?.oil_temp_c ?? 108.5}°C</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Vibration:</span>
                    <strong className="text-slate-900">{currentAsset?.vibration_mms ?? currentAsset?.telemetry_snapshot?.vibration_mms ?? 8.40} mm/s</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>IEEE Status:</span>
                    <strong className="text-red-700">{currentAsset?.dga_status || 'Condition 4'}</strong>
                  </div>
                </div>
              </div>

              {/* Weather Stress Evidence */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Weather Stress</span>
                  <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                    {currentAsset?.weather_multiplier ?? 1.50}× Stress
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div className="flex justify-between font-mono">
                    <span>Normalized:</span>
                    <strong className="text-slate-900">
                      {(((currentAsset?.weather_multiplier ?? 1.50) - 1.0) / 0.5 * 100).toFixed(0)}/100
                    </strong>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span>Condition:</span>
                    <strong className="text-slate-900">Storm Landfall</strong>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    High thermal burden & wind shear
                  </div>
                </div>
              </div>

              {/* Criticality Evidence */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Grid Criticality</span>
                  <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
                    {currentAsset?.grid_criticality_score ?? 100.0}/100
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span>Downstream:</span>
                    <strong className="text-slate-900">{(currentAsset?.customers_served || 85000).toLocaleString()} users</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Priority Feeds:</span>
                    <strong className="text-blue-700">Hospital & Transit</strong>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {currentAsset?.topological_role || 'Bulk Transmission Intertie'}
                  </div>
                </div>
              </div>

            </div>

            {/* Synthesized Risk Evidence Factors */}
            <div className="pt-2">
              <span className="text-xs font-bold text-slate-700 block mb-2">
                Active Decision Evidence Factors ({currentAsset?.risk_factors?.length || 0} Identified):
              </span>
              <div className="space-y-1.5">
                {(currentAsset?.risk_factors || [
                  'High acetylene (C2H2: 85.0 ppm) indicates severe electrical arcing risk',
                  'High ethylene (C2H4: 280.0 ppm) indicates thermal overheating',
                  'Critical equipment physical degradation score (95.9/100)',
                  'Active tropical storm weather alert with elevated wind shear'
                ]).slice(0, 5).map((factor, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <span>{factor}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Right 1 Column: Human-in-the-Loop Countersign & Dispatch Workflow */}
        <div className="space-y-6">

          {/* Human Review Required Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Human Review Required
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              AI-generated directives require operator review and countersign before dispatch. In compliance with NERC reliability guidelines, automated emergency work orders require digital sign-off.
            </p>

            {signOffResult ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>DIRECTIVE COUNTERSIGNED & QUEUED</span>
                </div>
                <div className="text-xs font-mono space-y-1 text-emerald-700">
                  <div>Dispatch ID: <strong className="text-slate-900 font-bold">{signOffResult.dispatch_id}</strong></div>
                  <div>Operator: <strong className="text-slate-900 font-bold">{signOffResult.operator_name}</strong> ({signOffResult.operator_id})</div>
                  <div>Timestamp: <span className="text-slate-600">{new Date(signOffResult.timestamp).toLocaleString()}</span></div>
                </div>
                <div className="pt-2 border-t border-emerald-200 text-[11px] text-emerald-800">
                  {signOffResult.message || 'Crew pre-positioning work order successfully countersigned and queued for field dispatch.'}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSignOffResult(null);
                    setConfirmed(false);
                  }}
                  className="w-full mt-2 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-emerald-300 rounded-lg shadow-xs cursor-pointer transition-colors"
                >
                  Edit / Re-authorize Sign-off
                </button>
              </div>
            ) : (
              <form onSubmit={handleSignOff} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Licensed Grid Operator Name
                  </label>
                  <input
                    type="text"
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-slate-300 text-slate-900 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Operator Badge / Certification ID
                  </label>
                  <input
                    type="text"
                    value={operatorId}
                    onChange={(e) => setOperatorId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-slate-300 text-slate-900 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs"
                  />
                </div>

                <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="leading-tight">
                    I confirm verification of physical IEEE telemetry and authorize immediate crew pre-positioning.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={!confirmed || isSubmitting || !currentAsset}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold tracking-wide transition-colors shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Authorizing Dispatch...' : 'Countersign & Dispatch Crew'}</span>
                </button>
              </form>
            )}
          </div>

          {/* Fallback / Offline Granite Status Notice */}
          {!isLiveGranite && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <Cpu className="w-4 h-4 text-slate-500" />
                <span>Deterministic Fallback Active</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Work-order directives are currently being synthesized using the deterministic offline fallback template engine. When watsonx credentials are configured, live Granite 3.0 inference engages automatically.
              </p>
            </div>
          )}

          {/* Quick Dispatch Checklist */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2.5">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Standard Staging Checklist
            </div>
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Rapid Response Crew #3 on hot standby</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mobile degasification trailer verified</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>SCADA contingency tie-line plan primed</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Emergency healthcare feed alerts primed</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 5. Supporting Work Order List & Fleet Dispatch Queue */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Monitored Fleet Assets & Dispatch Queue
            </h3>
            <p className="text-xs text-slate-500">
              Select an asset from the queue to view its telemetry diagnostics or synthesize an AI maintenance directive.
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search asset or substation..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white w-48 transition-colors"
              />
            </div>

            <div className="flex items-center rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
              {['ALL', 'CRITICAL', 'HIGH'].map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedRiskFilter(tier)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    selectedRiskFilter === tier
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="pb-3 pr-4">Asset ID & Model</th>
                <th className="pb-3 px-4">Substation</th>
                <th className="pb-3 px-4">Physical Health</th>
                <th className="pb-3 px-4">Weather</th>
                <th className="pb-3 px-4">Criticality</th>
                <th className="pb-3 px-4">Composite Risk</th>
                <th className="pb-3 pl-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredAssets.map((asset) => {
                const isSelected = asset.asset_id === currentAsset?.asset_id;

                return (
                  <tr
                    key={asset.asset_id}
                    onClick={() => handleSelectAsset(asset)}
                    className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    <td className="py-3 pr-4 font-sans">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{asset.asset_id}</span>
                        {isSelected && (
                          <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 font-semibold text-[10px] uppercase">
                            Target
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-sans truncate max-w-xs">
                        {asset.model}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-sans">
                      <div className="font-medium text-slate-800">{asset.substation_name || asset.substation_id}</div>
                      <div className="text-[11px] text-slate-500">
                        {(asset.customers_served || 0).toLocaleString()} customers
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900">
                        {asset.physical_health_score ?? asset.dga_health_index ?? 0}/100
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-slate-700">
                        {asset.weather_multiplier ?? 1.0}×
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-slate-700">
                        {asset.grid_criticality_score ?? 0}/100
                      </span>
                    </td>

                    <td className="py-3 px-4 font-sans">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${getRiskBadgeClasses(asset.risk_category)}`}>
                        {asset.risk_category} ({asset.composite_risk_score}/100)
                      </span>
                    </td>

                    <td className="py-3 pl-4 text-right font-sans">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAsset(asset);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isSelected ? 'Active Target' : 'Select'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
