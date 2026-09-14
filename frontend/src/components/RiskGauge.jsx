import React, { useEffect, useState } from 'react';

export default function RiskGauge({ score, size = 80, strokeWidth = 8, showLabel = true }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeScore = Math.max(0, Math.min(100, score || 0));

  // Animate the gauge from 0 -> target on mount / whenever the score changes
  const [animatedScore, setAnimatedScore] = useState(0);
  useEffect(() => {
    setAnimatedScore(0);
    const id = requestAnimationFrame(() => {
      const id2 = requestAnimationFrame(() => setAnimatedScore(safeScore));
      return () => cancelAnimationFrame(id2);
    });
    return () => cancelAnimationFrame(id);
  }, [safeScore]);

  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  const getColor = (s) => {
    if (s >= 80) return { stroke: '#dc2626', text: 'text-red-700' };
    if (s >= 60) return { stroke: '#d97706', text: 'text-amber-700' };
    if (s >= 30) return { stroke: '#2563eb', text: 'text-blue-700' };
    return { stroke: '#059669', text: 'text-emerald-700' };
  };

  const theme = getColor(safeScore);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track */}
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
          <span className={`font-mono font-bold tabular-nums ${size > 60 ? 'text-xl' : 'text-sm'} ${theme.text}`}>
            {Math.round(animatedScore)}
          </span>
          {size > 60 && <span className="text-[10px] tracking-wider text-slate-500 uppercase font-bold">Risk</span>}
        </div>
      )}
    </div>
  );
}
