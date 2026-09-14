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
      color: 'bg-red-500/10 text-red-400 border-red-500/30'
    },
    {
      id: 2,
      type: 'weather',
      title: 'Storm Alex Stress Inflow',
      desc: 'Wind gusts clocked at 85 km/h with 42 lightning strikes/hr in sector.',
      time: '8m ago',
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    },
    {
      id: 3,
      type: 'copilot',
      title: 'IBM Granite Dispatch Drafted',
      desc: 'Pre-positioning crew directive ready for operator countersign.',
      time: '14m ago',
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/30'
    },
  ];

  return (
    <header className="h-16 border-b border-slate-700/60 glass-panel sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      
      {/* Left: Mobile Toggle & Breadcrumb */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-100 hover:bg-dark-700 lg:hidden cursor-pointer"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <span className="font-mono text-slate-500 uppercase tracking-wider font-semibold hidden sm:inline">
            Console
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden sm:inline" />
          <span className="font-semibold text-slate-100 tracking-tight truncate max-w-[200px] sm:max-w-none">
            {getPageTitle()}
          </span>
        </div>
      </div>

      {/* Center: Live Architecture Badges */}
      <div className="hidden xl:flex items-center gap-2.5 text-xs font-mono">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-dark-900 border border-slate-700/60 text-slate-200">
          <Cpu className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-semibold">IBM Granite 3.0</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-dark-900 border border-slate-700/60 text-slate-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold">IEEE C57.104</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        
        {/* Live Clock & SCADA tag */}
        <div className="text-right font-mono text-xs hidden md:block border-r border-slate-700/60 pr-3">
          <div className="text-slate-100 font-bold">{time}</div>
          <div className="text-[10px] text-slate-500">60.02 Hz • SCADA</div>
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-100 hover:bg-dark-700 transition-colors cursor-pointer"
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
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-dark-800 rounded-xl border border-slate-700/60 glass-panel-hover animate-fade-in-up shadow-xl z-50 p-4 space-y-3 animate-scale-in origin-top-right">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-100 uppercase tracking-wider">Grid Incident Alerts</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 font-bold">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setUnreadCount(0)}
                    className="text-xs text-blue-400 hover:text-blue-400 cursor-pointer"
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
                    <p className="text-slate-300 leading-normal">{n.desc}</p>
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
            className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-lg border border-slate-700/60 hover:bg-dark-900 transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center">
              {currentUser?.avatar || 'EV'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-slate-100 leading-tight">
                {currentUser?.name || 'Elena Vance'}
              </div>
              <div className="text-[10px] text-slate-500">
                {currentUser?.role?.split(' ')[0] || 'Dispatcher'}
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-500 hidden sm:block" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-dark-800 rounded-xl border border-slate-700/60 glass-panel-hover animate-fade-in-up shadow-xl z-50 p-3 space-y-2 text-xs animate-scale-in origin-top-right">
              <div className="border-b border-slate-800/60 pb-2">
                <div className="font-bold text-slate-100">{currentUser?.name || 'Elena Vance'}</div>
                <div className="text-slate-500 font-mono text-[11px] truncate">{currentUser?.email}</div>
                <div className="mt-1 text-[10px] font-mono px-2 py-0.5 rounded bg-dark-700 text-slate-200 inline-block">
                  {currentUser?.org || 'Metro Power Authority'}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  if (onOpenSettings) onOpenSettings();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-200 hover:bg-dark-900 hover:text-blue-400 text-left cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>Control Center Settings</span>
              </button>

              <div className="border-t border-slate-800/60 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    if (onLogout) onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 text-left font-semibold cursor-pointer"
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
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 active:from-blue-700 disabled:opacity-50 rounded-lg shadow-glow-blue transition-all cursor-pointer shrink-0 ${isRefreshing ? 'animate-glow-pulse-blue' : 'hover:scale-105'}`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isRefreshing ? 'Evaluating...' : 'Re-Evaluate Fleet'}</span>
        </button>
      </div>

    </header>
  );
}
