import React, { useEffect, useState, useRef } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  CloudLightning, 
  Users, 
  HeartPulse, 
  TrendingUp, 
  TrendingDown 
} from 'lucide-react';

// Lightweight count-up for numeric KPI values (falls back to plain text for non-numeric values)
function CountUpValue({ value, className }) {
  const numeric = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  const isNumeric = !isNaN(numeric) && isFinite(numeric);
  const prefix = isNumeric ? String(value).match(/^[^0-9.-]*/)?.[0] || '' : '';
  const suffix = isNumeric ? String(value).match(/[^0-9.,]*$/)?.[0] || '' : '';
  const [display, setDisplay] = useState(isNumeric ? 0 : value);
  const frameRef = useRef();

  useEffect(() => {
    if (!isNumeric) {
      setDisplay(value);
      return;
    }
    const duration = 900;
    const start = performance.now();
    const from = 0;
    const animate = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (numeric - from) * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numeric, isNumeric]);

  if (!isNumeric) return <span className={className}>{value}</span>;

  const isInt = Number.isInteger(numeric);
  const formatted = isInt
    ? Math.round(display).toLocaleString()
    : display.toFixed(1);

  return <span className={`${className} tabular-nums`}>{prefix}{formatted}{suffix}</span>;
}

export default function KPICards({ summary, assets }) {
  // Derive Fleet Health Score dynamically:
  // LIVE API VALUE: derived from live summary / assets telemetry
  // OFFLINE FALLBACK: 82.4 preserved when API data is absent
  const DEMO_FALLBACK_FLEET_HEALTH = 82.4;
  let fleetHealthValue = DEMO_FALLBACK_FLEET_HEALTH;
  let isLive = false;

  const assetList = Array.isArray(assets)
    ? assets
    : (Array.isArray(summary?.ranked_assets) ? summary.ranked_assets : (Array.isArray(summary?.assets) ? summary.assets : null));

  if (summary && typeof summary === 'object') {
    if (summary.fleet_health_score != null && !isNaN(Number(summary.fleet_health_score))) {
      fleetHealthValue = Number(summary.fleet_health_score).toFixed(1);
      isLive = true;
    } else if (summary.health_score != null && !isNaN(Number(summary.health_score))) {
      fleetHealthValue = Number(summary.health_score).toFixed(1);
      isLive = true;
    } else if (summary.avg_health_score != null && !isNaN(Number(summary.avg_health_score))) {
      fleetHealthValue = Number(summary.avg_health_score).toFixed(1);
      isLive = true;
    } else if (assetList && assetList.length > 0) {
      const validScores = assetList
        .map(a => a?.physical_health_score ?? a?.dga_health_index)
        .filter(s => s != null && !isNaN(Number(s)));
      if (validScores.length > 0) {
        const avgDegradation = validScores.reduce((acc, s) => acc + Number(s), 0) / validScores.length;
        fleetHealthValue = Math.max(0, Math.min(100, 100 - avgDegradation)).toFixed(1);
        isLive = true;
      }
    } else if (summary.avg_risk_score != null && !isNaN(Number(summary.avg_risk_score))) {
      fleetHealthValue = Math.max(0, Math.min(100, 100 - Number(summary.avg_risk_score))).toFixed(1);
      isLive = true;
    }
  } else if (assetList && assetList.length > 0) {
    const validScores = assetList
      .map(a => a?.physical_health_score ?? a?.dga_health_index)
      .filter(s => s != null && !isNaN(Number(s)));
    if (validScores.length > 0) {
      const avgDegradation = validScores.reduce((acc, s) => acc + Number(s), 0) / validScores.length;
      fleetHealthValue = Math.max(0, Math.min(100, 100 - avgDegradation)).toFixed(1);
      isLive = true;
    }
  }

  const cards = [
    {
      title: 'Monitored Assets',
      value: summary?.total_assets || 4,
      unit: 'Units',
      desc: 'Active 345kV & 138kV Substation Fleet',
      icon: Activity,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
      trend: '100% Online',
      trendColor: 'text-emerald-700 bg-emerald-50 border-emerald-200 font-semibold',
    },
    {
      title: 'High & Critical Hazards',
      value: (summary?.critical_count || 0) + (summary?.high_count || 0),
      unit: 'Urgent',
      desc: `${summary?.critical_count || 1} Critical / ${summary?.high_count || 1} High Urgency`,
      icon: ShieldAlert,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-50',
      trend: 'Urgent Action',
      trendColor: 'text-red-700 bg-red-50 border-red-200 font-semibold',
      isHazard: true,
    },
    {
      title: 'Weather Multiplier',
      value: `${summary?.weather_multiplier || 1.42}×`,
      unit: 'Stress',
      desc: `${summary?.weather_event || 'Tropical Storm Alex'} (85 km/h gusts)`,
      icon: CloudLightning,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
      trend: 'Storm Surge',
      trendColor: 'text-amber-700 bg-amber-50 border-amber-200 font-semibold',
    },
    {
      title: 'Downstream Population',
      value: (summary?.customers_at_risk || 130000).toLocaleString(),
      unit: 'Citizens',
      desc: `Dependent on at-risk nodes (Total: ${(summary?.total_customers_served || 190000).toLocaleString()})`,
      icon: Users,
      iconColor: 'text-slate-600',
      iconBg: 'bg-slate-100',
      trend: '68% of Grid',
      trendColor: 'text-slate-700 bg-slate-100 border-slate-200 font-semibold',
    },
    {
      title: 'Fleet Health Score',
      value: fleetHealthValue,
      unit: '/ 100',
      desc: 'IEEE C57.104 composite reliability index',
      icon: HeartPulse,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      trend: isLive ? 'Live Telemetry' : 'Demo Fallback',
      trendColor: 'text-emerald-700 bg-emerald-50 border-emerald-200 font-semibold',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between"
          >
            {/* Top row */}
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono font-semibold text-slate-500 uppercase tracking-wider truncate">
                  {card.title}
                </span>
                <div className={`p-1.5 rounded-md ${card.iconBg} ${card.iconColor} shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              {/* Value */}
              <div className="mt-2 flex items-baseline gap-1.5">
                <CountUpValue
                  value={card.value}
                  className={`text-2xl font-mono font-bold tracking-tight ${card.isHazard ? 'text-red-600' : 'text-slate-900'}`}
                />
                {card.unit && (
                  <span className="text-xs font-mono font-medium text-slate-400">
                    {card.unit}
                  </span>
                )}
              </div>
            </div>

            {/* Bottom info */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${card.trendColor}`}>
                  {card.trend}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium line-clamp-1" title={card.desc}>
                {card.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
