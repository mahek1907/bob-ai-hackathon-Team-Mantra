import React from 'react';

export default function RiskGauge({ score, size = 80, strokeWidth = 8, showLabel = true }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeScore = Math.max(0, Math.min(100, score || 0));
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  const getColor = (s) => {
    if (s >= 80) return { stroke: '#dc2626', text: 'text-red-600', bg: 'bg-red-50' };
    if (s >= 60) return { stroke: '#ea580c', text: 'text-amber-600', bg: 'bg-amber-50' };
    if (s >= 30) return { stroke: '#ca8a04', text: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { stroke: '#16a34a', text: 'text-emerald-600', bg: 'bg-emerald-50' };
  };

  const theme = getColor(safeScore);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Animated Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {showLabel && (
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className={`font-mono font-extrabold ${size > 60 ? 'text-xl' : 'text-sm'} ${theme.text}`}>
            {safeScore.toFixed(0)}
          </span>
          {size > 60 && <span className="text-[10px] tracking-wider text-slate-500 uppercase font-bold">Risk</span>}
        </div>
      )}
    </div>
  );
}
