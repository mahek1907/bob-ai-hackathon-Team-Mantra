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

export default function KPICards({ summary }) {
  const cards = [
    {
      title: 'Monitored Assets',
      value: summary?.total_assets || 4,
      unit: 'Units',
      desc: 'Active 345kV & 138kV Substation Fleet',
      icon: Activity,
      iconColor: 'text-blue-400',
      iconBg: 'bg-dark-900',
      trend: '100% Online',
      trendColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
    {
      title: 'High & Critical Hazards',
      value: (summary?.critical_count || 0) + (summary?.high_count || 0),
      unit: 'Urgent',
      desc: `${summary?.critical_count || 1} Critical / ${summary?.high_count || 1} High Urgency`,
      icon: ShieldAlert,
      iconColor: 'text-red-400',
      iconBg: 'bg-red-500/10',
      trend: 'Urgent Action',
      trendColor: 'text-red-400 bg-red-500/10 border-red-500/30',
      isHazard: true,
    },
    {
      title: 'Weather Multiplier',
      value: `${summary?.weather_multiplier || 1.42}×`,
      unit: 'Stress',
      desc: `${summary?.weather_event || 'Tropical Storm Alex'} (85 km/h gusts)`,
      icon: CloudLightning,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10',
      trend: 'Storm Surge',
      trendColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    },
    {
      title: 'Downstream Population',
      value: (summary?.customers_at_risk || 130000).toLocaleString(),
      unit: 'Citizens',
      desc: `Dependent on at-risk nodes (Total: ${(summary?.total_customers_served || 190000).toLocaleString()})`,
      icon: Users,
      iconColor: 'text-slate-300',
      iconBg: 'bg-dark-900',
      trend: '68% of Grid',
      trendColor: 'text-slate-200 bg-dark-700 border-slate-700/60',
    },
    {
      title: 'Fleet Health Score',
      value: '82.4',
      unit: '/ 100',
      desc: 'IEEE C57.104 composite reliability index',
      icon: HeartPulse,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10',
      trend: '+2.1% baseline',
      trendColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="rounded-xl border border-slate-700/60 bg-dark-800 p-4 shadow-panel glass-panel-hover transition-colors flex flex-col justify-between stagger-item"
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            {/* Top row */}
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider truncate">
                  {card.title}
                </span>
                <div className={`p-1.5 rounded-md ${card.iconBg} ${card.iconColor} shrink-0 ${card.isHazard ? 'animate-glow-pulse' : ''}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              {/* Value */}
              <div className="mt-2 flex items-baseline gap-1.5">
                <CountUpValue
                  value={card.value}
                  className={`text-2xl font-mono font-bold tracking-tight ${card.isHazard ? 'text-red-400 text-glow-red' : 'text-slate-100'}`}
                />
                {card.unit && (
                  <span className="text-xs font-mono font-medium text-slate-500">
                    {card.unit}
                  </span>
                )}
              </div>
            </div>

            {/* Bottom info */}
            <div className="mt-3 pt-2.5 border-t border-slate-800/60 space-y-1">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${card.trendColor}`}>
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
