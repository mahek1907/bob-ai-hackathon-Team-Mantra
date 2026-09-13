import React from 'react';
import { 
  ShieldAlert, 
  Activity, 
  CloudLightning, 
  Users, 
  HeartPulse, 
  TrendingUp, 
  TrendingDown 
} from 'lucide-react';

export default function KPICards({ summary }) {
  const cards = [
    {
      title: 'Monitored Assets',
      value: summary?.total_assets || 4,
      unit: 'Units',
      desc: 'Active 345kV & 138kV Substation Fleet',
      icon: Activity,
      iconColor: 'text-blue-600',
      iconBg: 'bg-slate-50',
      trend: '100% Online',
      trendColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
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
      trendColor: 'text-red-700 bg-red-50 border-red-200',
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
      trendColor: 'text-amber-800 bg-amber-50 border-amber-200',
    },
    {
      title: 'Downstream Population',
      value: (summary?.customers_at_risk || 130000).toLocaleString(),
      unit: 'Citizens',
      desc: `Dependent on at-risk nodes (Total: ${(summary?.total_customers_served || 190000).toLocaleString()})`,
      icon: Users,
      iconColor: 'text-slate-600',
      iconBg: 'bg-slate-50',
      trend: '68% of Grid',
      trendColor: 'text-slate-700 bg-slate-100 border-slate-200',
    },
    {
      title: 'Fleet Health Score',
      value: '82.4',
      unit: '/ 100',
      desc: 'IEEE C57.104 composite reliability index',
      icon: HeartPulse,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      trend: '+2.1% baseline',
      trendColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
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
                <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider truncate">
                  {card.title}
                </span>
                <div className={`p-1.5 rounded-md ${card.iconBg} ${card.iconColor} shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              {/* Value */}
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className={`text-2xl font-mono font-bold tracking-tight ${card.isHazard ? 'text-red-600' : 'text-slate-900'}`}>
                  {card.value}
                </span>
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
