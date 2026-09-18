import React from 'react';
import { CloudRain, Wind, Thermometer, Zap, AlertCircle, TrendingUp } from 'lucide-react';

export default function WeatherPanel({ weather, multiplier = 1.42 }) {
  const isHeatwave = weather?.heatwave_alert || (weather?.ambient_temp_c || 39.4) > 35;
  const windSpeed = weather?.wind_speed_kmh || 85.0;
  const temp = weather?.ambient_temp_c || 39.4;
  const strikes = weather?.lightning_strikes_last_hour || 42;
  const eventName = weather?.event_name || 'Tropical Storm Alex & Heatwave Inflow';

  const isSevere = multiplier >= 1.35;
  const isElevated = multiplier >= 1.15;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <CloudRain className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Meteorological Compounding
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-slate-500 font-mono">
                {weather?.source || (weather?.is_live ? 'Open-Meteo Live API' : 'SCADA Radar Feed')}
              </span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${weather?.is_live !== false ? 'bg-emerald-500' : 'bg-slate-400'}`}
                title={weather?.is_live !== false ? 'Live Open-Meteo atmospheric telemetry' : 'Offline demo fallback'}
              />
            </div>
          </div>
        </div>
        <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold border ${
          isSevere
            ? 'bg-red-50 text-red-700 border-red-200'
            : isElevated
            ? 'bg-amber-50 text-amber-700 border-amber-200'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }`}>
          {isSevere ? 'SEVERE ALERT' : isElevated ? 'ELEVATED' : 'NOMINAL'}
        </span>
      </div>

      {/* Active Storm Box */}
      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-0.5">
        <div className="text-slate-500 font-mono text-[10px] uppercase font-semibold">Active Inflow System</div>
        <div className="text-slate-900 font-bold text-sm">{eventName}</div>
      </div>

      {/* Sensor Grid */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <div className="text-slate-500 font-mono text-[10px] uppercase font-semibold mb-0.5">Ambient</div>
          <div className="font-mono font-bold text-slate-900 text-base">{temp}°C</div>
          {isHeatwave && <span className="text-[10px] font-mono text-red-700 font-semibold">HEATWAVE</span>}
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <div className="text-slate-500 font-mono text-[10px] uppercase font-semibold mb-0.5">Gusts</div>
          <div className="font-mono font-bold text-slate-900 text-base">{windSpeed} <span className="text-[10px] text-slate-500 font-normal">km/h</span></div>
          <span className="text-[10px] font-mono text-amber-700 font-semibold">GALE FORCE</span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <div className="text-slate-500 font-mono text-[10px] uppercase font-semibold mb-0.5">Lightning</div>
          <div className="font-mono font-bold text-slate-900 text-base">{strikes} <span className="text-[10px] text-slate-500 font-normal">/hr</span></div>
          <span className="text-[10px] font-mono text-amber-700 font-semibold">HIGH SURGE</span>
        </div>
      </div>

      {/* Environmental Supplementary Metrics (Open-Meteo) */}
      {(weather?.relative_humidity_pct != null || weather?.precipitation_mm != null) && (
        <div className="grid grid-cols-2 gap-2 text-center text-[11px] font-mono">
          <div className="p-1.5 rounded-md bg-slate-50/80 border border-slate-200 text-slate-600 flex items-center justify-between px-2.5">
            <span className="text-slate-500">Humidity</span>
            <span className="font-bold text-slate-800">{weather.relative_humidity_pct}%</span>
          </div>
          <div className="p-1.5 rounded-md bg-slate-50/80 border border-slate-200 text-slate-600 flex items-center justify-between px-2.5">
            <span className="text-slate-500">Precipitation</span>
            <span className="font-bold text-slate-800">{weather.precipitation_mm ?? 0} mm</span>
          </div>
        </div>
      )}

      {/* Multiplier Progress Bar */}
      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-700 text-xs">Compounded Risk Multiplier</span>
          <span className={`font-mono font-bold text-sm ${
            isSevere ? 'text-red-700' : isElevated ? 'text-amber-700' : 'text-emerald-700'
          }`}>{multiplier}×</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all ${
              isSevere ? 'bg-red-600' : isElevated ? 'bg-amber-500' : 'bg-emerald-600'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, ((multiplier - 1.0) / 0.5) * 100))}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-0.5">
          <span>1.0× (Nominal)</span>
          <span>1.25× (Elevated)</span>
          <span>1.50× (Extreme)</span>
        </div>
      </div>
    </div>
  );
}
