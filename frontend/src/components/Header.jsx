import React, { useState, useEffect, useRef } from 'react';
import {
  Zap,
  Activity,
  RefreshCw,
  Cpu,
  ShieldCheck,
  ChevronRight,
  Bell,
  User,
  LogOut,
  SlidersHorizontal,
  Menu,
  CheckCheck,
  ChevronDown
} from 'lucide-react';

export default function Header({
  activeTab,
  onRefresh,
  isRefreshing,
  healthStatus,
  weatherSummary,
  onToggleMobileSidebar,
  currentUser,
  onLogout,
  onOpenSettings
}) {
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getPageTitle = () => {
    switch (activeTab) {
      case 'overview': return 'Executive Operations Overview';
      case 'fleet': return 'Fleet & DGA Diagnostics';
      case 'weather': return 'Meteorological Stress Analysis';
      case 'criticality': return 'Grid & Societal Criticality';
      case 'work_orders': return 'IBM Granite Emergency Dispatch';
      case 'standards': return 'IEEE Standards & Architecture';
      case 'settings': return 'Control Center Settings';
      default: return 'Operations Console';
    }
  };

  const notifications = [
    {
      id: 1,
      type: 'critical',
      title: 'Critical High-Energy Arcing (TX-401)',
      desc: 'C2H2 reached 85 ppm in Metro Central. Immediate dispatch advised.',
      time: '2m ago',
      color: 'bg-red-50 text-red-800 border-red-200'
    },
    {
      id: 2,
      type: 'weather',
      title: 'Storm Alex Stress Inflow',
      desc: 'Wind gusts clocked at 85 km/h with 42 lightning strikes/hr in sector.',
      time: '8m ago',
      color: 'bg-amber-50 text-amber-800 border-amber-200'
    },
    {
      id: 3,
      type: 'copilot',
      title: 'IBM Granite Dispatch Drafted',
      desc: 'Pre-positioning crew directive ready for operator countersign.',
      time: '14m ago',
      color: 'bg-blue-50 text-blue-800 border-blue-200'
    },
  ];

  return (
    <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between shadow-xs">

      {/* Left: Mobile Toggle & Breadcrumb */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden cursor-pointer"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <span className="font-mono text-slate-400 uppercase tracking-wider font-semibold hidden sm:inline text-xs">
            Console
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden sm:inline" />
          <span className="font-semibold text-slate-900 tracking-tight truncate max-w-[200px] sm:max-w-none text-sm sm:text-base">
            {getPageTitle()}
          </span>
        </div>
      </div>

      {/* Center: Live Architecture Badges */}
      <div className="hidden xl:flex items-center gap-2 text-xs font-mono">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-700">
          <Cpu className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-semibold">IBM Granite 3.0</span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${healthStatus?.watsonx_connected ? 'bg-emerald-500' : 'bg-slate-400'}`}
            title={healthStatus?.watsonx_connected ? 'watsonx.ai Active' : 'Offline Template Engine'}
          />
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-700">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-semibold">IEEE C57.104</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">

        {/* Clock & SCADA tag */}
        <div className="text-right font-mono text-xs hidden md:block border-r border-slate-200 pr-3">
          <div className="text-slate-800 font-semibold">{time}</div>
          <div className="text-[10px] text-slate-400">60.02 Hz • SCADA Feed</div>
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title="System Alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="animate-live-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl border border-slate-200 shadow-lg z-50 p-4 space-y-3 animate-scale-in origin-top-right">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900 uppercase tracking-wider">Grid Incident Alerts</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-50 text-red-700 font-semibold border border-red-200">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setUnreadCount(0)}
                    className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer font-medium"
                  >
                    Mark read
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className={`p-2.5 rounded-lg border text-xs ${n.color}`}>
                    <div className="flex items-center justify-between font-bold mb-0.5">
                      <span className="truncate">{n.title}</span>
                      <span className="text-[10px] font-mono font-normal opacity-75">{n.time}</span>
                    </div>
                    <p className="text-slate-600 leading-normal">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center">
              {currentUser?.avatar || 'EV'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-slate-900 leading-tight">
                {currentUser?.name || 'Elena Vance'}
              </div>
              <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                {currentUser?.role || 'Dispatcher'}
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl border border-slate-200 shadow-lg z-50 p-3 space-y-2 text-xs animate-scale-in origin-top-right">
              <div className="border-b border-slate-100 pb-2">
                <div className="font-semibold text-slate-900">{currentUser?.name || 'Elena Vance'}</div>
                <div className="text-slate-500 font-mono text-[11px] truncate">{currentUser?.email}</div>
                <div className="text-blue-600 text-[11px] font-medium mt-0.5">{currentUser?.role || 'Senior Reliability Dispatcher'}</div>
                <div className="mt-1 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 inline-block">
                  {currentUser?.org || currentUser?.organization || 'Metro Power Authority'}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  if (onOpenSettings) onOpenSettings();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 hover:text-blue-600 text-left cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <span>Control Center Settings</span>
              </button>

              <div className="border-t border-slate-100 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    if (onLogout) onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-red-600 hover:bg-red-50 text-left font-semibold cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Re-Evaluate Fleet Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 rounded-lg shadow-xs transition-colors cursor-pointer shrink-0 ${isRefreshing ? 'opacity-80' : ''}`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isRefreshing ? 'Evaluating...' : 'Re-Evaluate Fleet'}</span>
        </button>
      </div>

    </header>
  );
}
