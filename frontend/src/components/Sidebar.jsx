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
  X
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

  const mainNavItems = [
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
      badgeColor: 'bg-red-50 text-red-700 border-red-200',
    },
    {
      id: 'weather',
      label: 'Meteorological Stress',
      icon: CloudLightning,
      badge: 'Storm Alert',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
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
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    },
  ];

  const secondaryNavItems = [
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

  const renderNavGroup = (items, groupTitle = null) => (
    <div className="space-y-1">
      {!isCollapsed && groupTitle && (
        <div className="px-3 pt-3 pb-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 select-none">
          {groupTitle}
        </div>
      )}
      {items.map((item, idx) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        const isHovered = hoveredTab === item.id;

        return (
          <div
            key={item.id}
            className="relative stagger-item"
            style={{ animationDelay: `${idx * 40}ms` }}
          >
            <button
              type="button"
              onClick={() => handleTabClick(item.id)}
              onMouseEnter={() => setHoveredTab(item.id)}
              onMouseLeave={() => setHoveredTab(null)}
              className={`w-full transition-all duration-150 cursor-pointer rounded-lg border ${
                isCollapsed
                  ? 'flex items-center justify-center h-10 px-2'
                  : 'grid grid-cols-[1.25rem_1fr_auto] items-center gap-2.5 px-3 py-2 text-xs sm:text-sm'
              } ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold border-blue-200/80 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border-transparent font-medium'
              }`}
            >
              {/* Column 1: Icon */}
              <span className="flex items-center justify-center w-5 h-5 shrink-0">
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              </span>

              {/* Column 2: Label */}
              {!isCollapsed && (
                <span className="truncate text-left leading-normal">
                  {item.label}
                </span>
              )}

              {/* Column 3: Badge */}
              {!isCollapsed && (
                item.badge ? (
                  <span className={`h-5 min-w-[64px] px-2 inline-flex items-center justify-center text-[10px] font-mono font-semibold rounded border text-center whitespace-nowrap shrink-0 ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                ) : (
                  <span className="w-0 shrink-0" />
                )
              )}
            </button>

            {/* Collapsed Tooltip */}
            {isCollapsed && isHovered && (
              <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap bg-slate-900 text-white text-xs rounded-md shadow-md px-3 py-1.5 pointer-events-none flex items-center gap-2">
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-600 text-white font-semibold">
                    {item.badge}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
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
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200">
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
          <div className="p-3 space-y-2">
            {renderNavGroup(mainNavItems, 'Operations Fleet')}
            {renderNavGroup(secondaryNavItems, 'System & Standards')}
          </div>
        </div>

        {/* Bottom SCADA Status */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 space-y-2">
          <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs shadow-2xs">
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
              {!isCollapsed && <span className="text-slate-500 font-mono text-[11px] font-medium">SCADA Telemetry</span>}
              <div className="flex items-center gap-1.5" title="SCADA Online">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                {!isCollapsed && (
                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-mono font-semibold text-[10px]">
                    ONLINE
                  </span>
                )}
              </div>
            </div>
          </div>

          {!isCollapsed && (
            <div className="text-[10px] font-mono text-slate-400 px-1 flex items-center justify-between">
              <span>Team Mantra</span>
              <span>IEEE C57.104</span>
            </div>
          )}
        </div>

      </aside>
    </>
  );
}
