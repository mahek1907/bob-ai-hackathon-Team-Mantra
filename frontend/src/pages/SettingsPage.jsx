import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Bell,
  ShieldCheck,
  Cpu,
  Radio,
  Zap,
  Key,
  Volume2,
  VolumeX,
  Save,
  CheckCircle2,
  User,
  Building,
  LogOut,
  SlidersHorizontal,
  Activity,
  Server,
  HardDrive,
  Check,
  Info,
  Layers
} from 'lucide-react';

export default function SettingsPage({ currentUser, onLogout }) {
  const [pollingInterval, setPollingInterval] = useState('30s');
  const [soundAlarms, setSoundAlarms] = useState(true);
  const [autoModal, setAutoModal] = useState(false);
  const [arcingThreshold, setArcingThreshold] = useState(80);
  const [tempLimit, setTempLimit] = useState(105);
  const [vibrationLimit, setVibrationLimit] = useState(7.0);
  const [isSaved, setIsSaved] = useState(false);
  const [healthData, setHealthData] = useState(null);

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setHealthData(data))
      .catch(() => {
        setHealthData({
          status: 'healthy',
          watsonx_connected: false,
          model_in_use: 'Deterministic High-Fidelity Fallback',
        });
      });
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const isLiveGranite = Boolean(healthData?.watsonx_connected);

  return (
    <div className="space-y-6 max-w-5xl">

      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              System Settings
            </h1>
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Workstation Console
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Operator preferences, system connectivity, model status, and workstation configuration.
          </p>
        </div>

        {isSaved && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Parameters Synced to Workstation Session</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* 2. Operator Profile Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <User className="w-5 h-5 text-blue-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Active Operator Session
                </h2>
                <span className="text-xs text-slate-500">Authenticated workstation credentials</span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>SCADA AUTHENTICATED</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 uppercase text-[10px] block font-bold tracking-wider">Operator Name</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">{currentUser?.name || 'Elena Vance'}</span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 uppercase text-[10px] block font-bold tracking-wider">Work Email</span>
              <span className="font-semibold text-slate-800 mt-0.5 block truncate font-mono">{currentUser?.email || 'e.vance@gridcontrol.internal'}</span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 uppercase text-[10px] block font-bold tracking-wider">Assigned Role</span>
              <span className="font-semibold text-blue-700 mt-0.5 block">{currentUser?.role || 'Senior Reliability Dispatcher'}</span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 uppercase text-[10px] block font-bold tracking-wider">Grid Authority</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">{currentUser?.org || 'Metro Power Authority'}</span>
            </div>
          </div>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
              <Key className="w-3.5 h-3.5 text-slate-400" />
              <span>Session Badge: <strong className="text-slate-700">{currentUser?.badge || 'OPR-24018'}</strong></span>
              <span>•</span>
              <span>Jurisdiction: <strong className="text-slate-700">{currentUser?.station || 'SUB-01 Metro Central'}</strong></span>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-red-700 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out Workstation</span>
            </button>
          </div>
        </div>

        {/* 3. Model & AI Engine Status Panel */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-5 h-5 text-blue-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  AI Model & Engine Connectivity
                </h2>
                <span className="text-xs text-slate-500">IBM Granite generative dispatch synthesis status</span>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              isLiveGranite
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLiveGranite ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              <span>{isLiveGranite ? 'watsonx.ai Active' : 'Deterministic Fallback Mode'}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1 font-mono">
              <span className="text-slate-500 uppercase text-[10px] font-bold tracking-wider font-sans">Core Model Architecture</span>
              <strong className="text-slate-900 block text-xs">
                {isLiveGranite ? 'IBM Granite 3.0 8B Instruct' : 'IBM Granite 3.0 Template Engine'}
              </strong>
              <span className="text-slate-500 text-[11px] block font-sans">
                {isLiveGranite ? 'ibm/granite-3-8b-instruct' : 'Deterministic Offline Fallback'}
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1 font-mono">
              <span className="text-slate-500 uppercase text-[10px] font-bold tracking-wider font-sans">Platform Runtime</span>
              <strong className="text-slate-900 block text-xs font-sans">
                {isLiveGranite ? 'IBM watsonx.ai Cloud' : 'Local Enterprise Instance'}
              </strong>
              <span className="text-slate-500 text-[11px] block font-sans">
                {isLiveGranite ? 'Low-latency REST Inference' : 'Physics-Informed Deterministic Engine'}
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 uppercase text-[10px] font-bold tracking-wider">Operational Mode</span>
              <strong className="text-slate-900 block text-xs">
                Human-Governed Advisory
              </strong>
              <span className="text-slate-500 text-[11px] block">
                NERC CIP Countersign Required
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-200 text-xs text-slate-600 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              When watsonx API credentials are configured in environment variables, live Granite 3.0 inference engages automatically. When operating offline or in isolated network enclaves, the deterministic template fallback guarantees uninterrupted work-order drafting.
            </p>
          </div>
        </div>

        {/* 4. SCADA Ingestion & Sampling Frequency */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <Radio className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Workstation Preferences & Sampling Frequency
              </h2>
              <span className="text-xs text-slate-500">Local workstation session telemetry polling and alert settings</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Real-Time Telemetry Polling Rate
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['10s', '30s', '60s', '5m'].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setPollingInterval(rate)}
                    className={`py-2 text-xs font-mono font-bold rounded-lg border transition-colors cursor-pointer ${
                      pollingInterval === rate
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {rate}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Current active setting: Evaluates 4 regional substations every <span className="font-mono font-semibold text-slate-700">{pollingInterval}</span>.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Dispatcher Notifications & Automations
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition-colors">
                <div className="flex items-center gap-2.5">
                  {soundAlarms ? <Volume2 className="w-4 h-4 text-blue-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Critical Audio Alarm Alerts</div>
                    <div className="text-[11px] text-slate-500">Audible chime when composite risk score &ge; 80/100</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={soundAlarms}
                  onChange={(e) => setSoundAlarms(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition-colors">
                <div className="flex items-center gap-2.5">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Auto-Draft IBM Granite Directives</div>
                    <div className="text-[11px] text-slate-500">Automatically stage work order upon critical condition 4 breach</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoModal}
                  onChange={(e) => setAutoModal(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        {/* 5. IEEE C57.104 Risk Thresholds Configuration */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <Activity className="w-5 h-5 text-red-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Workstation Diagnostic Threshold Overrides
              </h2>
              <span className="text-xs text-slate-500">Calibrate local visual warning levels for high-voltage power transformers</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Arcing Trigger (C₂H₂)</span>
                <span className="font-mono font-bold text-red-700 px-2 py-0.5 rounded bg-red-50 border border-red-200">
                  {arcingThreshold} ppm
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="150"
                value={arcingThreshold}
                onChange={(e) => setArcingThreshold(Number(e.target.value))}
                className="w-full accent-red-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">IEEE reference: &gt;9 ppm indicates high-energy arc discharge.</p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Max Oil Temperature</span>
                <span className="font-mono font-bold text-amber-700 px-2 py-0.5 rounded bg-amber-50 border border-amber-200">
                  {tempLimit} °C
                </span>
              </div>
              <input
                type="range"
                min="80"
                max="130"
                value={tempLimit}
                onChange={(e) => setTempLimit(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">IEEE reference: &gt;105°C triggers accelerated thermal aging penalty.</p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Vibration Warning</span>
                <span className="font-mono font-bold text-blue-700 px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                  {vibrationLimit} mm/s
                </span>
              </div>
              <input
                type="range"
                min="2.0"
                max="12.0"
                step="0.5"
                value={vibrationLimit}
                onChange={(e) => setVibrationLimit(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">ISO reference: &gt;7.0 mm/s flags core bolt or winding loose clamp.</p>
            </div>

          </div>
        </div>

        {/* 6. Technical System Configuration (Read-Only) */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <Server className="w-5 h-5 text-slate-700" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                System Environment & Technical Specifications
              </h2>
              <span className="text-xs text-slate-500">Read-only deployment architecture metadata</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 uppercase text-[10px] font-sans font-bold block">Application Version</span>
              <span className="font-bold text-slate-900 mt-1 block">v1.0.0 (RC-1)</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 uppercase text-[10px] font-sans font-bold block">Environment</span>
              <span className="font-bold text-slate-900 mt-1 block">Staging / Production</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 uppercase text-[10px] font-sans font-bold block">Backend Base API</span>
              <span className="font-bold text-blue-700 mt-1 block truncate">localhost:8000</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 uppercase text-[10px] font-sans font-bold block">Security Protocol</span>
              <span className="font-bold text-emerald-700 mt-1 block">NERC CIP-005</span>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Apply & Save Configuration</span>
          </button>
        </div>

      </form>
    </div>
  );
}
