import React from 'react';
import { CloudRain, Wind, Thermometer, Zap, AlertCircle, TrendingUp } from 'lucide-react';

export default function WeatherPanel({ weather, multiplier = 1.42 }) {
  const isHeatwave = weather?.heatwave_alert || (weather?.ambient_temp_c || 39.4) > 35;
  const windSpeed = weather?.wind_speed_kmh || 85.0;
  const temp = weather?.ambient_temp_c || 39.4;
  const strikes = weather?.lightning_strikes_last_hour || 42;
  const eventName = weather?.event_name || 'Tropical Storm Alex & Heatwave Inflow';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
            <CloudRain className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Meteorological Compounding
            </h3>
            <span className="text-xs text-slate-400 font-mono">Live Doppler SCADA Feed</span>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
          SEVERE ALERT
        </span>
      </div>

      {/* Active Storm Box */}
      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-0.5">
        <div className="text-slate-500 font-mono text-[10px] uppercase font-bold">Active Inflow System</div>
        <div className="text-slate-900 font-bold text-sm">{eventName}</div>
      </div>

      {/* Sensor Grid */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <div className="text-slate-400 font-mono text-[10px] mb-0.5">AMBIENT</div>
          <div className="font-mono font-bold text-slate-900 text-base">{temp}°C</div>
          {isHeatwave && <span className="text-[10px] font-mono text-red-600 font-bold">HEATWAVE</span>}
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <div className="text-slate-400 font-mono text-[10px] mb-0.5">GUSTS</div>
          <div className="font-mono font-bold text-slate-900 text-base">{windSpeed} <span className="text-[10px] text-slate-400">km/h</span></div>
          <span className="text-[10px] font-mono text-amber-700 font-bold">GALE FORCE</span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <div className="text-slate-400 font-mono text-[10px] mb-0.5">LIGHTNING</div>
          <div className="font-mono font-bold text-slate-900 text-base">{strikes} <span className="text-[10px] text-slate-400">/hr</span></div>
          <span className="text-[10px] font-mono text-amber-700 font-bold">HIGH SURGE</span>
        </div>
      </div>

      {/* Multiplier Progress Bar */}
      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-700 text-[11px]">Compounded Risk Multiplier</span>
          <span className="font-mono font-bold text-amber-800 text-sm">{multiplier}×</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-amber-500 h-2 rounded-full transition-all"
            style={{ width: `${Math.min(100, Math.max(0, ((multiplier - 1.0) / 0.5) * 100))}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-0.5">
          <span>1.0× (Nominal)</span>
          <span>1.25× (Elevated)</span>
          <span>1.5× (Extreme)</span>
        </div>
      </div>
    </div>
  );
}
