import React, { useState } from 'react';
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
  Activity
} from 'lucide-react';

export default function SettingsPage({ currentUser, onLogout }) {
  const [pollingInterval, setPollingInterval] = useState('30s');
  const [soundAlarms, setSoundAlarms] = useState(true);
  const [autoModal, setAutoModal] = useState(false);
  const [arcingThreshold, setArcingThreshold] = useState(80);
  const [tempLimit, setTempLimit] = useState(105);
  const [vibrationLimit, setVibrationLimit] = useState(7.0);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <SlidersHorizontal className="w-6 h-6 text-blue-600" />
            <span>Control Center & SCADA Configuration</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Fine-tune telemetry sampling rates, IEEE C57.104 alarm thresholds, and dispatcher security protocols.
          </p>
        </div>

        {isSaved && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Parameters Synced to SCADA Engine</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Section 1: SCADA Polling & Connectivity */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <Radio className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">SCADA Ingestion & Sampling Frequency</h2>
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
                    className={`py-2 text-xs font-mono font-bold rounded-xl border transition-all cursor-pointer ${
                      pollingInterval === rate
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {rate}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">
                Current mode: Evaluates 4 major substations every {pollingInterval}.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Automated Actions & Notifications
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <div className="flex items-center gap-2.5">
                  {soundAlarms ? <Volume2 className="w-4 h-4 text-blue-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                  <div>
                    <div className="text-xs font-bold text-slate-800">Critical Alarm Sound Alerts</div>
                    <div className="text-[11px] text-slate-500">Chime when composite hazard &ge;80/100</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={soundAlarms}
                  onChange={(e) => setSoundAlarms(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <Cpu className="w-4 h-4 text-indigo-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Auto-Draft IBM Granite Directives</div>
                    <div className="text-[11px] text-slate-500">Generate crew pre-positioning upon critical breach</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoModal}
                  onChange={(e) => setAutoModal(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Section 2: IEEE C57.104 Risk Thresholds */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <Activity className="w-5 h-5 text-red-600" />
            <h2 className="text-base font-bold text-slate-900">IEEE C57.104 DGA Diagnostic Thresholds</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">
            
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Arcing Trigger (C2H2)</span>
                <span className="font-mono font-bold text-red-600 px-2 py-0.5 rounded bg-red-50 border border-red-200">
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
              <p className="text-[11px] text-slate-500">IEEE standard: &gt;35 ppm indicates high-energy arc discharge.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Max Oil Temperature</span>
                <span className="font-mono font-bold text-amber-600 px-2 py-0.5 rounded bg-amber-50 border border-amber-200">
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
              <p className="text-[11px] text-slate-500">IEEE standard: &gt;105°C triggers immediate accelerated aging penalty.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Vibration Warning</span>
                <span className="font-mono font-bold text-blue-600 px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
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
              <p className="text-[11px] text-slate-500">ISO standard: &gt;7.0 mm/s flags core bolt or winding loose clamp.</p>
            </div>

          </div>
        </div>

        {/* Section 3: Active Dispatcher Session Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <User className="w-5 h-5 text-slate-700" />
              <h2 className="text-base font-bold text-slate-900">Current Workstation Operator Session</h2>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>SCADA AUTHENTICATED</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 font-mono uppercase text-[10px] block font-bold">Operator Name</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">{currentUser?.name || 'Elena Vance'}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 font-mono uppercase text-[10px] block font-bold">Work Email</span>
              <span className="font-semibold text-slate-700 mt-0.5 block truncate">{currentUser?.email || 'e.vance@gridcontrol.internal'}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 font-mono uppercase text-[10px] block font-bold">Assigned Role</span>
              <span className="font-semibold text-blue-700 mt-0.5 block">{currentUser?.role || 'Senior Reliability Dispatcher'}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 font-mono uppercase text-[10px] block font-bold">Grid Authority</span>
              <span className="font-semibold text-slate-700 mt-0.5 block">{currentUser?.org || 'Metro Power Authority'}</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
              <Key className="w-4 h-4 text-slate-400" />
              <span>Token: <strong className="text-slate-700">GRD-SCADA-8824-SEC-9</strong></span>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out Workstation</span>
            </button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Apply & Save Configuration</span>
          </button>
        </div>

      </form>
    </div>
  );
}
