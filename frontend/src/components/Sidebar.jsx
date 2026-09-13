import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Zap, 
  CloudLightning, 
  Network, 
  ClipboardCheck, 
  ShieldCheck, 
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
  Radio,
  Activity
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  onSelectTab, 
  counts = {}, 
  isConnected = true,
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile
}) {
  const [hoveredTab, setHoveredTab] = useState(null);

  const navItems = [
    {
      id: 'overview',
      label: 'Executive Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'fleet',
      label: 'Fleet & DGA Diagnostics',
      icon: Zap,
      badge: counts.CRITICAL ? `${counts.CRITICAL} Critical` : null,
      badgeColor: 'bg-red-50 text-red-700 border border-red-200 font-bold',
    },
    {
      id: 'weather',
      label: 'Meteorological Stress',
      icon: CloudLightning,
      badge: '1.42×',
      badgeColor: 'bg-amber-50 text-amber-800 border border-amber-200 font-bold',
    },
    {
      id: 'criticality',
      label: 'Grid & Societal Criticality',
      icon: Network,
      badge: null,
    },
    {
      id: 'work_orders',
      label: 'IBM Granite Dispatch',
      icon: ClipboardCheck,
      badge: 'AI Copilot',
      badgeColor: 'bg-blue-50 text-blue-700 border border-blue-200 font-bold',
    },
    {
      id: 'standards',
      label: 'IEEE Standards & Architecture',
      icon: ShieldCheck,
      badge: null,
    },
    {
      id: 'settings',
      label: 'Control Center Settings',
      icon: SlidersHorizontal,
      badge: null,
    },
  ];

  const handleTabClick = (id) => {
    onSelectTab(id);
    if (isMobileOpen && onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar */}
      <aside className={`
        fixed lg:static top-0 bottom-0 left-0 z-50
        bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 select-none
        transition-all duration-200 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}>
        
        {/* Top Brand Header */}
        <div>
          <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                <Zap className="w-4 h-4" />
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm tracking-tight text-slate-900">GridSentinel</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      AI
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono tracking-wide font-medium">
                    OPERATIONS CONSOLE
                  </p>
                </div>
              )}
            </div>

            {/* Collapse toggle */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={onCloseMobile}
                className="flex lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Nav List */}
          <div className="p-3">
            {!isCollapsed && (
              <div className="px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Operations Fleet
              </div>
            )}

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const isHovered = hoveredTab === item.id;

                return (
                  <div key={item.id} className="relative">
                    <button
                      type="button"
                      onClick={() => handleTabClick(item.id)}
                      onMouseEnter={() => setHoveredTab(item.id)}
                      onMouseLeave={() => setHoveredTab(null)}
                      className={`w-full flex items-center ${
                        isCollapsed ? 'justify-center px-2' : 'justify-between px-3'
                      } py-2.5 rounded-lg text-xs sm:text-sm transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-semibold border-l-3 border-blue-600'
                          : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </div>

                      {!isCollapsed && item.badge && (
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>

                    {/* Collapsed Tooltip */}
                    {isCollapsed && isHovered && (
                      <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap bg-slate-900 text-white text-xs rounded-md shadow-lg px-3 py-1.5 pointer-events-none animate-in fade-in flex items-center gap-2">
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-600 text-white font-bold">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom SCADA Status */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 space-y-2">
          <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs">
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
              {!isCollapsed && <span className="text-slate-500 font-mono text-[11px]">SCADA Feed</span>}
              <div className="flex items-center gap-1.5" title="SCADA Online">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                {!isCollapsed && <span className="text-emerald-700 font-mono font-semibold text-[11px]">ONLINE</span>}
              </div>
            </div>
          </div>

          {!isCollapsed && (
            <div className="text-[10px] font-mono text-slate-400 px-1">
              Team Mantra • Charusat University
            </div>
          )}
        </div>

      </aside>
    </>
  );
}
