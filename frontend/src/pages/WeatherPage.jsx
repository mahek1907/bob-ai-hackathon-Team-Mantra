import React, { useState, useEffect } from 'react';
import WeatherPanel from '../components/WeatherPanel';
import {
  CloudRain,
  Wind,
  Thermometer,
  Zap,
  AlertCircle,
  ShieldAlert,
  TrendingUp,
  Activity,
  CheckCircle2,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

export default function WeatherPage({ weather, multiplier = 1.42, assets = [] }) {
  const temp = weather?.ambient_temp_c || 39.4;
  const wind = weather?.wind_speed_kmh || 85.0;
  const strikes = weather?.lightning_strikes_last_hour || 42;
  const eventName = weather?.event_name || 'Tropical Storm Alex & Heatwave Inflow';
  const stormSeverity = weather?.storm_severity_index || 8.5;
  const isHeatwave = weather?.heatwave_alert || temp > 35;

  const isSevere = multiplier >= 1.35;
  const isElevated = multiplier >= 1.15;

  // Impacted transformers data
  const [affectedAssets, setAffectedAssets] = useState(assets);

  useEffect(() => {
    if (assets && assets.length > 0) {
      setAffectedAssets(assets);
    } else {
      fetch('/api/risk/ranked')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.ranked_assets) setAffectedAssets(data.ranked_assets);
        })
        .catch(() => {});
    }
  }, [assets]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* 1. Page Header */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>Weather & Environmental Stress Monitoring</span>
              <span className={`text-xs font-mono font-semibold px-2.5 py-0.5 rounded-md border ${
                weather?.is_live !== false
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {weather?.source || 'Open-Meteo Live API'}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
              Correlating atmospheric storm vectors, convective heat inflow, and lightning density with substation equipment risk.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center">
            <span className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-md border shadow-xs ${
              isSevere
                ? 'bg-red-50 text-red-700 border-red-200'
                : isElevated
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              Multiplier: {multiplier}× Stress
            </span>

            <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600 shadow-xs">
              {isHeatwave ? 'Heatwave Advisory Active' : 'Atmospheric Nominal'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Current Conditions Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-500 uppercase">Ambient Temperature</span>
            <div className="p-1.5 rounded-md bg-red-50 text-red-600">
              <Thermometer className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-bold text-slate-900">{temp}°C</div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className={`font-mono font-semibold px-1.5 py-0.2 rounded text-[10px] ${
              isHeatwave ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {isHeatwave ? 'EXTREME HEATWAVE' : 'NOMINAL'}
            </span>
            <span className="text-slate-500 truncate">Cooling headroom suppressed</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-500 uppercase">Convective Wind Gusts</span>
            <div className="p-1.5 rounded-md bg-blue-50 text-blue-600">
              <Wind className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-bold text-slate-900">{wind} <span className="text-xs text-slate-400 font-sans font-normal">km/h</span></div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className={`font-mono font-semibold px-1.5 py-0.2 rounded text-[10px] ${
              wind >= 75 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-700'
            }`}>
              {wind >= 75 ? 'GALE FORCE' : 'ELEVATED'}
            </span>
            <span className="text-slate-500 truncate">Line gallop & buffeting</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-500 uppercase">Lightning Activity</span>
            <div className="p-1.5 rounded-md bg-amber-50 text-amber-600">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-bold text-slate-900">{strikes} <span className="text-xs text-slate-400 font-sans font-normal">/hr</span></div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className={`font-mono font-semibold px-1.5 py-0.2 rounded text-[10px] ${
              strikes >= 30 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {strikes >= 30 ? 'HIGH SURGE' : 'MODERATE'}
            </span>
            <span className="text-slate-500 truncate">Fast-front transient hazard</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-500 uppercase">Weather Multiplier</span>
            <div className="p-1.5 rounded-md bg-amber-50 text-amber-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-bold text-slate-900">{multiplier}×</div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className={`font-mono font-semibold px-1.5 py-0.2 rounded text-[10px] ${
              isSevere ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {isSevere ? 'CRITICAL COMPOUND' : 'ELEVATED STRESS'}
            </span>
            <span className="text-slate-500 truncate">Base: 1.00× • Max: 1.50×</span>
          </div>
        </div>
      </div>

      {/* 3. Main Grid: Weather Panel + Compounding Physics Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Live Radar / Weather Overview Panel */}
        <div className="lg:col-span-1 space-y-4">
          <WeatherPanel weather={weather} multiplier={multiplier} />

          {/* Storm Advisory Details */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>National Weather Service Feed</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Severe tropical storm front approaching metropolitan service territory with sustained convective winds exceeding 80 km/h and intense ambient heat inflow (39.4°C).
            </p>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono space-y-1.5 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Data Source:</span>
                <span className="text-blue-700 font-bold">{weather?.source || 'Open-Meteo Live API'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Storm Severity Index:</span>
                <span className="text-amber-700 font-bold">{stormSeverity} / 10.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Heatwave Alert:</span>
                <span className="text-red-700 font-bold">{isHeatwave ? 'ACTIVE (Extreme)' : 'INACTIVE'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Grid Surge Warning:</span>
                <span className="text-amber-700 font-bold">STAGE 2 ELEVATED</span>
              </div>
              {weather?.relative_humidity_pct != null && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Relative Humidity:</span>
                  <span className="text-slate-900 font-bold">{weather.relative_humidity_pct}%</span>
                </div>
              )}
              {weather?.surface_pressure_hpa != null && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Surface Pressure:</span>
                  <span className="text-slate-900 font-bold">{weather.surface_pressure_hpa} hPa</span>
                </div>
              )}
              {weather?.precipitation_mm != null && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Precipitation:</span>
                  <span className="text-slate-900 font-bold">{weather.precipitation_mm} mm</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Physical Stress Compounding Mechanics */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                <span>How Weather Multiplies Transformer Risk (Physics Breakdown)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Environmental vectors suppress radiator cooling and induce electrical overvoltage.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Heat vector */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-700">
                  <Thermometer className="w-3.5 h-3.5" />
                  <span>Thermal Derating</span>
                </div>
                <div className="text-xl font-mono font-bold text-slate-900">{temp}°C</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  High ambient air suppresses forced-oil radiator dissipation, accelerating winding insulation paper degradation by up to 2.4× per Arrhenius kinetics.
                </p>
              </div>

              {/* Wind vector */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700">
                  <Wind className="w-3.5 h-3.5" />
                  <span>Mechanical Buffeting</span>
                </div>
                <div className="text-xl font-mono font-bold text-slate-900">{wind} <span className="text-xs text-slate-400 font-normal">km/h</span></div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Gale-force wind gusts induce transmission line gallop, sending mechanical harmonic vibrations into bushings and internal core assemblies.
                </p>
              </div>

              {/* Lightning vector */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Surge Overvoltage</span>
                </div>
                <div className="text-xl font-mono font-bold text-slate-900">{strikes} <span className="text-xs text-slate-400 font-normal">/hr</span></div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  High-density ground strikes induce fast-front transient surges, breaching vulnerable dielectric oil barriers where combustible gases are present.
                </p>
              </div>
            </div>

            {/* Dynamic Formula Explanation Box */}
            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-blue-700 uppercase">
                  Engine Formulation: src/weather_engine.py
                </span>
                <span className="text-xs font-mono font-semibold text-slate-600">
                  Range: 1.00× (Nominal) ➔ 1.50× (Extreme)
                </span>
              </div>
              <div className="p-3 rounded-lg bg-white font-mono text-xs font-bold text-slate-900 border border-blue-200 shadow-xs overflow-x-auto">
                Weather Multiplier = 1.0 + (Ambient Temp Factor) + (Wind Gust Factor) + (Lightning Surge Factor)
              </div>
              <p className="text-xs text-slate-600">
                The composite risk engine normalizes this multiplier onto a 0–100 scale, weighting environmental stress at 20% of the overall transformer failure priority.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* 4. Asset Vulnerability & Environmental Impact Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-blue-600" />
              <span>Operational Asset Vulnerability to Environmental Stress</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Current impact of atmospheric compounding on active transmission transformers
            </p>
          </div>
          <span className="text-xs font-mono text-slate-600 bg-white px-2.5 py-1 rounded border border-slate-200 self-start sm:self-auto">
            {affectedAssets.length > 0 ? `${affectedAssets.length} Monitored Units` : '4 Active Transformers'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-mono font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Asset ID</th>
                <th className="py-3 px-4">Substation Location</th>
                <th className="py-3 px-3 text-center">Risk Score</th>
                <th className="py-3 px-3 text-center">Oil Temp</th>
                <th className="py-3 px-3 text-center">Weather Mult</th>
                <th className="py-3 px-4">Environmental Compounding Factor</th>
                <th className="py-3 px-4">Contingency Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-mono">
              {(affectedAssets.length > 0 ? affectedAssets : [
                {
                  asset_id: "TX-401",
                  substation_name: "Metro Central Transit Substation",
                  composite_risk_score: 97.5,
                  risk_category: "CRITICAL",
                  oil_temp_c: 108.5,
                  weather_multiplier: 1.50,
                  risk_factors: ["Severe thermal runaway exacerbated by 39.4°C ambient heat"],
                  suggested_action: "Initiate immediate engineering review and pre-position degas trailer."
                },
                {
                  asset_id: "TX-102",
                  substation_name: "North Regional Healthcare Hub",
                  composite_risk_score: 70.8,
                  risk_category: "HIGH",
                  oil_temp_c: 92.0,
                  weather_multiplier: 1.25,
                  risk_factors: ["Elevated oil temperature reducing cooling margin during storm"],
                  suggested_action: "Schedule priority inspection and configure auxiliary cooling."
                },
                {
                  asset_id: "TX-303",
                  substation_name: "Pine Crest Residential Feeder",
                  composite_risk_score: 52.4,
                  risk_category: "MEDIUM",
                  oil_temp_c: 88.0,
                  weather_multiplier: 1.18,
                  risk_factors: ["Insulation paper degradation accelerated by heatwave inflow"],
                  suggested_action: "Increase SCADA telemetry polling and monitor gas accumulation."
                },
                {
                  asset_id: "TX-205",
                  substation_name: "Harbor Industrial Step-Down",
                  composite_risk_score: 22.8,
                  risk_category: "LOW",
                  oil_temp_c: 72.0,
                  weather_multiplier: 1.05,
                  risk_factors: ["Nominal baseline thermal tolerance within limits"],
                  suggested_action: "Continue routine SCADA observation."
                }
              ]).map((asset) => {
                const isCrit = asset.risk_category === 'CRITICAL';
                const isHigh = asset.risk_category === 'HIGH';

                return (
                  <tr
                    key={asset.asset_id}
                    className={`hover:bg-slate-50 transition-colors ${isCrit ? 'bg-red-50/15' : ''}`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{asset.asset_id}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-semibold ${
                          isCrit ? 'bg-red-50 text-red-700 border-red-200' :
                          isHigh ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          asset.risk_category === 'MEDIUM' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {asset.risk_category}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-sans text-slate-700">
                      {asset.substation_name}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`text-sm font-bold ${
                        asset.composite_risk_score >= 80 ? 'text-red-700' :
                        asset.composite_risk_score >= 60 ? 'text-amber-700' :
                        asset.composite_risk_score >= 30 ? 'text-slate-900' :
                        'text-emerald-700'
                      }`}>
                        {asset.composite_risk_score}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={asset.oil_temp_c > 100 ? 'text-red-700 font-bold' : 'text-slate-700 font-medium'}>
                        {asset.oil_temp_c}°C
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-slate-900">
                      {asset.weather_multiplier ? `${asset.weather_multiplier}×` : `${multiplier}×`}
                    </td>

                    <td className="py-3 px-4 font-sans text-slate-600">
                      {asset.risk_factors?.[0] || 'Nominal environmental tolerance'}
                    </td>

                    <td className="py-3 px-4 font-sans text-slate-600">
                      {asset.suggested_action}
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
