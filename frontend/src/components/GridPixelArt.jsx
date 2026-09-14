import React from 'react';

export default function GridPixelArt({ className = '' }) {
  const gridStars = [
    [20, 25], [60, 18], [110, 42], [180, 20], [240, 15],
    [310, 30], [380, 18], [440, 35], [465, 12], [90, 75],
    [140, 65], [350, 60], [420, 70], [280, 45]
  ];

  const fencePickets = Array.from({ length: 48 }, (_, i) => i * 10);

  return (
    <div className={`relative rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-2xl ${className}`}>
      {/* Top SCADA CRT Console Bezel / Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-3.5 py-2 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
          </div>
          <span className="text-[11px] font-mono font-bold tracking-wider text-slate-300 ml-1">
            SCADA-RTU // SUBSTATION 345kV
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="text-slate-400 hidden sm:inline">BUS: 345kV / 138kV</span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE FEED
          </span>
        </div>
      </div>

      {/* SVG Pixel-Art Canvas */}
      <div className="relative w-full bg-[#080d1a] overflow-hidden">
        {/* CRT Scanline effect overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-10 opacity-15"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4) 1px, transparent 1px, transparent 2px)',
            backgroundSize: '100% 2px'
          }}
        />

        <svg
          viewBox="0 0 480 270"
          className="w-full h-auto block select-none"
          style={{ shapeRendering: 'crispEdges' }}
        >
          <defs>
            {/* Ambient lighting gradient */}
            <radialGradient id="stormGlow" cx="15%" cy="20%" r="40%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#080d1a" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="lightningGlow" cx="30%" cy="35%" r="30%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#080d1a" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="oilTankGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="50%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            <linearGradient id="crtScreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f2b26" />
              <stop offset="100%" stopColor="#071916" />
            </linearGradient>
          </defs>

          {/* Background Sky & Ambient Storm Glow */}
          <rect width="480" height="270" fill="#070b16" />
          <rect width="480" height="270" fill="url(#stormGlow)" />
          <rect width="480" height="270" fill="url(#lightningGlow)" />

          {/* Distant Grid Stars / Pixel Nodes */}
          {gridStars.map(([x, y], i) => (
            <rect key={i} x={x} y={y} width="2" height="2" fill="#38bdf8" opacity="0.4" />
          ))}

          {/* ============================================================ */}
          {/* 1. METEOROLOGICAL STORM CELL & STEPPED LIGHTNING             */}
          {/* ============================================================ */}
          {/* Storm Cloud Layer 1 (Dark Grey/Slate) */}
          <g fill="#1e293b">
            <rect x="15" y="18" width="130" height="32" />
            <rect x="25" y="10" width="95" height="12" />
            <rect x="45" y="4" width="60" height="10" />
            <rect x="8" y="26" width="150" height="26" />
            <rect x="2" y="36" width="165" height="20" />
          </g>
          {/* Storm Cloud Layer 2 (Highlights & Density) */}
          <g fill="#334155">
            <rect x="28" y="14" width="85" height="8" />
            <rect x="50" y="8" width="50" height="6" />
            <rect x="16" y="28" width="132" height="12" />
            <rect x="10" y="38" width="145" height="8" />
          </g>
          {/* Storm Cloud Cloudlet Edge (Pixel Rim Light) */}
          <g fill="#64748b">
            <rect x="48" y="6" width="40" height="2" />
            <rect x="28" y="12" width="20" height="2" />
            <rect x="88" y="12" width="24" height="2" />
            <rect x="14" y="24" width="14" height="2" />
            <rect x="148" y="24" width="10" height="2" />
          </g>

          {/* Pixel Rain Streaks */}
          <g fill="#0284c7" opacity="0.5">
            <rect x="16" y="65" width="2" height="8" />
            <rect x="24" y="80" width="2" height="10" />
            <rect x="36" y="60" width="2" height="9" />
            <rect x="48" y="78" width="2" height="8" />
            <rect x="64" y="68" width="2" height="12" />
            <rect x="78" y="85" width="2" height="9" />
            <rect x="92" y="72" width="2" height="10" />
            <rect x="108" y="88" width="2" height="8" />
            <rect x="120" y="64" width="2" height="11" />
            <rect x="136" y="76" width="2" height="9" />
            <rect x="150" y="62" width="2" height="10" />
          </g>

          {/* Stepped Leader Pixel Lightning Bolt */}
          <g fill="#fbbf24">
            <rect x="74" y="46" width="4" height="12" />
            <rect x="70" y="58" width="6" height="4" />
            <rect x="66" y="62" width="4" height="10" />
            <rect x="62" y="72" width="8" height="4" />
            <rect x="58" y="76" width="4" height="14" />
            <rect x="54" y="90" width="6" height="4" />
            <rect x="50" y="94" width="4" height="12" />
            <rect x="46" y="106" width="8" height="4" />
            <rect x="42" y="110" width="4" height="14" />
            <rect x="44" y="124" width="4" height="10" />
            {/* Fork to side */}
            <rect x="76" y="68" width="8" height="3" />
            <rect x="84" y="71" width="3" height="8" />
            <rect x="87" y="79" width="6" height="3" />
          </g>
          {/* Lightning Core (White-Hot) */}
          <g fill="#ffffff">
            <rect x="75" y="48" width="2" height="10" />
            <rect x="67" y="64" width="2" height="8" />
            <rect x="59" y="78" width="2" height="12" />
            <rect x="51" y="96" width="2" height="10" />
            <rect x="43" y="112" width="2" height="12" />
          </g>

          {/* ============================================================ */}
          {/* 2. TRANSMISSION LATTICE TOWER (LEFT ELEVATION)               */}
          {/* ============================================================ */}
          <g fill="#94a3b8">
            <rect x="170" y="30" width="4" height="16" />
            <rect x="166" y="46" width="12" height="4" />
            {/* Top Crossarm */}
            <rect x="148" y="54" width="48" height="4" />
            {/* Middle Crossarm */}
            <rect x="142" y="76" width="60" height="4" />
            {/* Bottom Crossarm */}
            <rect x="138" y="100" width="68" height="5" />
            {/* Main Tower Legs (Tapered) */}
            <rect x="165" y="50" width="4" height="52" />
            <rect x="175" y="50" width="4" height="52" />
            <rect x="160" y="102" width="5" height="60" />
            <rect x="179" y="102" width="5" height="60" />
            <rect x="154" y="162" width="6" height="40" />
            <rect x="184" y="162" width="6" height="40" />
            {/* Cross Bracing Bars */}
            <rect x="164" y="62" width="16" height="2" />
            <rect x="163" y="88" width="18" height="2" />
            <rect x="160" y="118" width="24" height="3" />
            <rect x="158" y="140" width="28" height="3" />
            <rect x="154" y="175" width="36" height="3" />
            <rect x="150" y="200" width="44" height="4" />
          </g>

          {/* Insulator Strings (Porcelain discs - Cyan/White) */}
          <g fill="#38bdf8">
            <rect x="150" y="58" width="4" height="8" />
            <rect x="190" y="58" width="4" height="8" />
            <rect x="144" y="80" width="4" height="10" />
            <rect x="196" y="80" width="4" height="10" />
            <rect x="140" y="105" width="4" height="10" />
            <rect x="200" y="105" width="4" height="10" />
          </g>

          {/* 345kV Catenary Transmission Lines Sagging to Substation */}
          <g stroke="#38bdf8" strokeWidth="1.5" fill="none" opacity="0.75">
            <path d="M 152 66 Q 210 90 278 120" />
            <path d="M 192 66 Q 235 92 292 120" />
            <path d="M 146 90 Q 220 115 306 120" />
          </g>

          {/* Glowing Power Packets on Conductor Lines */}
          <rect x="212" y="84" width="3" height="3" fill="#67e8f9" />
          <rect x="245" y="99" width="3" height="3" fill="#67e8f9" />
          <rect x="270" y="114" width="3" height="3" fill="#67e8f9" />

          {/* ============================================================ */}
          {/* 3. SUBSTATION POWER TRANSFORMER (TX-401 AUTOTRANSFORMER)     */}
          {/* ============================================================ */}
          {/* Substation Concrete Pad */}
          <rect x="240" y="194" width="225" height="10" fill="#475569" />
          <rect x="235" y="204" width="235" height="6" fill="#334155" />

          {/* Main Transformer Steel Tank */}
          <rect x="264" y="130" width="136" height="66" fill="url(#oilTankGrad)" stroke="#1e293b" strokeWidth="2" />

          {/* Radiator Cooling Fins - Left Bank */}
          <g fill="#334155">
            <rect x="244" y="136" width="18" height="56" />
            <rect x="246" y="138" width="2" height="52" fill="#1e293b" />
            <rect x="250" y="138" width="2" height="52" fill="#1e293b" />
            <rect x="254" y="138" width="2" height="52" fill="#1e293b" />
            <rect x="258" y="138" width="2" height="52" fill="#1e293b" />
            <rect x="242" y="140" width="22" height="4" fill="#64748b" />
            <rect x="242" y="184" width="22" height="4" fill="#64748b" />
          </g>

          {/* Radiator Cooling Fins - Right Bank */}
          <g fill="#334155">
            <rect x="402" y="136" width="18" height="56" />
            <rect x="404" y="138" width="2" height="52" fill="#1e293b" />
            <rect x="408" y="138" width="2" height="52" fill="#1e293b" />
            <rect x="412" y="138" width="2" height="52" fill="#1e293b" />
            <rect x="416" y="138" width="2" height="52" fill="#1e293b" />
            <rect x="400" y="140" width="22" height="4" fill="#64748b" />
            <rect x="400" y="184" width="22" height="4" fill="#64748b" />
          </g>

          {/* Tank Panel Reinforcement Ribs */}
          <g fill="#1e293b">
            <rect x="295" y="132" width="4" height="62" />
            <rect x="330" y="132" width="4" height="62" />
            <rect x="365" y="132" width="4" height="62" />
          </g>

          {/* Conservator Oil Tank (Top Cylinder) */}
          <g>
            <rect x="328" y="106" width="64" height="16" rx="2" fill="#64748b" stroke="#334155" strokeWidth="1.5" />
            <rect x="342" y="122" width="6" height="8" fill="#475569" />
            <rect x="376" y="122" width="6" height="8" fill="#475569" />
            <rect x="358" y="120" width="5" height="12" fill="#94a3b8" />
            <rect x="356" y="123" width="9" height="5" fill="#f59e0b" />
            <rect x="340" y="112" width="40" height="4" fill="#0284c7" />
          </g>

          {/* High-Voltage 345kV Bushings (Three Phase A, B, C) */}
          <g>
            <rect x="276" y="120" width="6" height="10" fill="#64748b" />
            <rect x="274" y="106" width="10" height="14" fill="#e2e8f0" />
            <rect x="272" y="108" width="14" height="2" fill="#94a3b8" />
            <rect x="272" y="113" width="14" height="2" fill="#94a3b8" />
            <rect x="272" y="118" width="14" height="2" fill="#94a3b8" />
            <rect x="277" y="100" width="4" height="6" fill="#ef4444" />
          </g>

          <g>
            <rect x="296" y="120" width="6" height="10" fill="#64748b" />
            <rect x="294" y="106" width="10" height="14" fill="#e2e8f0" />
            <rect x="292" y="108" width="14" height="2" fill="#94a3b8" />
            <rect x="292" y="113" width="14" height="2" fill="#94a3b8" />
            <rect x="292" y="118" width="14" height="2" fill="#94a3b8" />
            <rect x="297" y="100" width="4" height="6" fill="#eab308" />
          </g>

          <g>
            <rect x="316" y="120" width="6" height="10" fill="#64748b" />
            <rect x="314" y="106" width="10" height="14" fill="#e2e8f0" />
            <rect x="312" y="108" width="14" height="2" fill="#94a3b8" />
            <rect x="312" y="113" width="14" height="2" fill="#94a3b8" />
            <rect x="312" y="118" width="14" height="2" fill="#94a3b8" />
            <rect x="317" y="100" width="4" height="6" fill="#3b82f6" />
          </g>

          {/* High-Voltage Arcing Hazard Warning Sign */}
          <rect x="306" y="150" width="18" height="14" fill="#fef08a" stroke="#854d0e" strokeWidth="1" />
          <path d="M 315 152 L 311 161 L 319 161 Z" fill="#b45309" />
          <rect x="314" y="155" width="2" height="3" fill="#000000" />
          <rect x="314" y="159" width="2" height="1" fill="#000000" />

          {/* Transformer Local Control Cabinet */}
          <rect x="336" y="146" width="24" height="32" fill="#1e293b" stroke="#475569" strokeWidth="1" />
          <rect x="338" y="149" width="20" height="10" fill="#0f172a" />
          <rect x="340" y="152" width="6" height="4" fill="#ef4444" />
          <rect x="348" y="152" width="8" height="4" fill="#10b981" />
          <rect x="356" y="162" width="2" height="4" fill="#94a3b8" />

          {/* Substation Perimeter Security Fence */}
          <g stroke="#475569" strokeWidth="1" opacity="0.4">
            <line x1="2" y1="200" x2="478" y2="200" />
            <line x1="2" y1="192" x2="478" y2="192" />
            <line x1="2" y1="184" x2="478" y2="184" />
            {fencePickets.map((x, i) => (
              <line key={i} x1={x} y1="184" x2={x} y2="208" />
            ))}
          </g>

          {/* ============================================================ */}
          {/* 4. SCADA RTU / DGA HUD OVERLAY TERMINAL                      */}
          {/* ============================================================ */}
          <rect x="0" y="210" width="480" height="60" fill="#090d18" />
          <line x1="0" y1="210" x2="480" y2="210" stroke="#1e293b" strokeWidth="2" />

          {/* CRT Oscilloscope Screen Box (Left) */}
          <rect x="12" y="216" width="145" height="46" rx="3" fill="url(#crtScreen)" stroke="#134e4a" strokeWidth="1.5" />
          <g stroke="#115e59" strokeWidth="0.5" opacity="0.5">
            <line x1="12" y1="239" x2="157" y2="239" />
            <line x1="84" y1="216" x2="84" y2="262" />
            <line x1="48" y1="216" x2="48" y2="262" />
            <line x1="120" y1="216" x2="120" y2="262" />
          </g>
          {/* Real-time AC Sine Waveform (60Hz Telemetry) */}
          <path
            d="M 14 239 Q 22 222, 30 239 T 46 239 T 62 239 T 78 239 T 94 239 T 110 239 T 126 239 T 142 239 T 155 239"
            fill="none"
            stroke="#34d399"
            strokeWidth="1.5"
          />
          <text x="16" y="226" fill="#6ee7b7" fontSize="7" fontFamily="monospace" fontWeight="bold">
            GRID FREQ: 60.02 Hz
          </text>
          <text x="16" y="256" fill="#2dd4bf" fontSize="6" fontFamily="monospace">
            VOLT HARMONICS: NORMAL
          </text>

          {/* DGA Dissolved Gas Concentration Bars (Center) */}
          <g>
            <text x="170" y="225" fill="#94a3b8" fontSize="7" fontFamily="monospace" fontWeight="bold">
              IEEE C57.104 DGA (PPM):
            </text>

            {/* H2 */}
            <text x="170" y="237" fill="#cbd5e1" fontSize="6" fontFamily="monospace">H2</text>
            <rect x="190" y="231" width="40" height="6" fill="#1e293b" rx="1" />
            <rect x="190" y="231" width="22" height="6" fill="#38bdf8" rx="1" />
            <text x="234" y="236" fill="#38bdf8" fontSize="6" fontFamily="monospace">85</text>

            {/* CH4 */}
            <text x="170" y="247" fill="#cbd5e1" fontSize="6" fontFamily="monospace">CH4</text>
            <rect x="190" y="241" width="40" height="6" fill="#1e293b" rx="1" />
            <rect x="190" y="241" width="28" height="6" fill="#fbbf24" rx="1" />
            <text x="234" y="246" fill="#fbbf24" fontSize="6" fontFamily="monospace">145</text>

            {/* C2H2 - CRITICAL */}
            <text x="170" y="257" fill="#ef4444" fontSize="6" fontFamily="monospace" fontWeight="bold">C2H2</text>
            <rect x="190" y="251" width="40" height="6" fill="#1e293b" rx="1" />
            <rect x="190" y="251" width="36" height="6" fill="#ef4444" rx="1" />
            <text x="234" y="256" fill="#ef4444" fontSize="6" fontFamily="monospace" fontWeight="bold">38*</text>

            {/* C2H4 */}
            <text x="254" y="237" fill="#cbd5e1" fontSize="6" fontFamily="monospace">C2H4</text>
            <rect x="276" y="231" width="40" height="6" fill="#1e293b" rx="1" />
            <rect x="276" y="231" width="26" height="6" fill="#38bdf8" rx="1" />
            <text x="320" y="236" fill="#38bdf8" fontSize="6" fontFamily="monospace">92</text>

            {/* C2H6 */}
            <text x="254" y="247" fill="#cbd5e1" fontSize="6" fontFamily="monospace">C2H6</text>
            <rect x="276" y="241" width="40" height="6" fill="#1e293b" rx="1" />
            <rect x="276" y="241" width="18" height="6" fill="#38bdf8" rx="1" />
            <text x="320" y="246" fill="#38bdf8" fontSize="6" fontFamily="monospace">44</text>

            {/* CO */}
            <text x="254" y="257" fill="#cbd5e1" fontSize="6" fontFamily="monospace">CO</text>
            <rect x="276" y="251" width="40" height="6" fill="#1e293b" rx="1" />
            <rect x="276" y="251" width="32" height="6" fill="#fbbf24" rx="1" />
            <text x="320" y="256" fill="#fbbf24" fontSize="6" fontFamily="monospace">410</text>
          </g>

          {/* SCADA Status Matrix / Warning Annunciator (Right) */}
          <g>
            <rect x="352" y="217" width="118" height="44" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1" />

            <circle cx="362" cy="226" r="3.5" fill="#ef4444" />
            <text x="371" y="228" fill="#fca5a5" fontSize="6.5" fontFamily="monospace" fontWeight="bold">
              TX-401: HIGH-ENERGY ARC
            </text>

            <circle cx="362" cy="238" r="3.5" fill="#f59e0b" />
            <text x="371" y="240" fill="#fde68a" fontSize="6.5" fontFamily="monospace">
              WEATHER: SEVERE CELL
            </text>

            <circle cx="362" cy="250" r="3.5" fill="#3b82f6" />
            <text x="371" y="252" fill="#93c5fd" fontSize="6.5" fontFamily="monospace">
              GRANITE 3.2: ONLINE
            </text>
          </g>
        </svg>
      </div>

      {/* Retro-Engineering Technical Capability Banner */}
      <div className="bg-slate-900/95 border-t border-slate-800 px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400 select-none">
        <div className="flex items-center gap-2">
          <span className="text-red-400 font-semibold">FAULT DETECTED:</span>
          <span className="text-slate-200">DUVAL TRIANGLE 1 [D1/D2]</span>
        </div>
        <div className="flex items-center gap-3">
          <span>TX RISK: <span className="text-red-400 font-bold">97.5 (CRITICAL)</span></span>
          <span className="text-slate-600">|</span>
          <span>COMPOSITE: <span className="text-slate-200 font-semibold">60/20/20</span></span>
        </div>
      </div>
    </div>
  );
}
