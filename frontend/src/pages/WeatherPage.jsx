import React from 'react';
import WeatherPanel from '../components/WeatherPanel';
import { 
  CloudRain, 
  Wind, 
  Thermometer, 
  Zap, 
  AlertCircle, 
  ShieldAlert, 
  TrendingUp,
  Cpu,
  Layers
} from 'lucide-react';

export default function WeatherPage({ weather, multiplier = 1.42 }) {
  const temp = weather?.ambient_temp_c || 39.4;
  const wind = weather?.wind_speed_kmh || 85.0;
  const strikes = weather?.lightning_strikes_last_hour || 42;
  const eventName = weather?.event_name || 'Tropical Storm Alex & Heatwave Inflow';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Meteorological Compounding Stress Engine
          </h1>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 border border-amber-300">
            Multiplier: {multiplier}×
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          Dynamic environmental risk compounding correlating live weather vectors with equipment thermal stress
        </p>
      </div>

      {/* Main Grid: Weather Panel + Compounding Physics Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Live Radar / Weather Overview Panel */}
        <div className="lg:col-span-1 space-y-4">
          <WeatherPanel weather={weather} multiplier={multiplier} />

          {/* Storm Advisory Details */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>National Weather Service Feed</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Severe tropical storm front approaching metropolitan service territory with sustained convective winds exceeding 80 km/h and intense ambient heat inflow (39.4°C).
            </p>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-1 text-slate-600">
              <div>Storm Severity Index: <span className="text-amber-700 font-bold">8.5 / 10.0</span></div>
              <div>Heatwave Alert: <span className="text-red-600 font-bold">ACTIVE (Extreme)</span></div>
              <div>Grid Surge Warning: <span className="text-amber-700 font-bold">STAGE 2 ELEVATED</span></div>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Physical Stress Compounding Mechanics */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              <span>How Weather Multiplies Transformer Risk (Physics Breakdown)</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Heat vector */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-red-600">
                  <Thermometer className="w-4 h-4" />
                  <span>Thermal Derating</span>
                </div>
                <div className="text-2xl font-mono font-bold text-slate-900">{temp}°C</div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  High ambient air suppresses forced-oil radiator dissipation, accelerating winding insulation paper degradation by up to 2.4× per Arrhenius kinetics.
                </p>
              </div>

              {/* Wind vector */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-600">
                  <Wind className="w-4 h-4" />
                  <span>Mechanical Buffeting</span>
                </div>
                <div className="text-2xl font-mono font-bold text-slate-900">{wind} <span className="text-xs text-slate-500 font-normal">km/h</span></div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Gale-force wind gusts induce transmission line gallop, sending mechanical harmonic vibrations into bushings and internal core assemblies.
                </p>
              </div>

              {/* Lightning vector */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-yellow-600">
                  <Zap className="w-4 h-4" />
                  <span>Surge Overvoltage</span>
                </div>
                <div className="text-2xl font-mono font-bold text-slate-900">{strikes} <span className="text-xs text-slate-500 font-normal">/hr</span></div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  High-density ground strikes induce fast-front transient surges, breaching vulnerable dielectric oil barriers where acetylene is present.
                </p>
              </div>
            </div>

            {/* Dynamic Formula Explanation Box */}
            <div className="p-5 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-blue-900 uppercase">
                  Engine Formulation: src/weather_engine.py
                </span>
                <span className="text-xs font-mono font-semibold text-slate-600">
                  Range: 1.00× (Nominal) ➔ 1.50× (Extreme)
                </span>
              </div>
              <div className="p-3.5 rounded-lg bg-white font-mono text-xs font-bold text-slate-800 border border-blue-200 shadow-xs overflow-x-auto">
                Weather Multiplier = 1.0 + (Ambient Temp Factor) + (Wind Gust Factor) + (Lightning Surge Factor)
              </div>
              <p className="text-xs text-slate-600 font-medium">
                The composite risk engine normalizes this multiplier onto a 0–100 scale, weighting it at 20% of the overall transformer failure priority.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
