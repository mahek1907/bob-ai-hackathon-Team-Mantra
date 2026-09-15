import React, { useState, useMemo } from 'react';
import {
  X,
  Clock,
  RefreshCw,
  FileText,
  ShieldCheck,
  FlaskConical,
  Activity,
  CloudLightning,
  Filter,
  Info,
} from 'lucide-react';
import { EVENT_TYPES, EVENT_LABELS } from '../hooks/useEventHistory';

const EVENT_ICON = {
  [EVENT_TYPES.RISK_REFRESH]:      { Icon: RefreshCw,      color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200' },
  [EVENT_TYPES.WORK_ORDER_GEN]:    { Icon: FileText,        color: 'text-violet-600',  bg: 'bg-violet-50 border-violet-200' },
  [EVENT_TYPES.WORK_ORDER_SIGNED]: { Icon: ShieldCheck,     color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  [EVENT_TYPES.SIMULATION]:        { Icon: FlaskConical,    color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200' },
  [EVENT_TYPES.DGA_CONDITION]:     { Icon: Activity,        color: 'text-red-600',     bg: 'bg-red-50 border-red-200' },
  [EVENT_TYPES.WEATHER_ALERT]:     { Icon: CloudLightning,  color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200' },
};

function formatTs(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

const ALL_ASSET_IDS = ['TX-401', 'TX-102', 'TX-303', 'TX-205'];

export default function EventHistoryModal({ isOpen, onClose, events = [] }) {
  const [assetFilter, setAssetFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const filtered = useMemo(() => {
    if (!isOpen) return [];
    return events.filter(ev => {
      if (assetFilter !== 'ALL' && ev.asset_id !== assetFilter) return false;
      if (typeFilter !== 'ALL' && ev.type !== typeFilter) return false;
      return true;
    });
  }, [isOpen, events, assetFilter, typeFilter]);

  // Group by date for section headers
  const grouped = useMemo(() => {
    const map = new Map();
    for (const ev of filtered) {
      const day = formatDate(ev.timestamp);
      if (!map.has(day)) map.set(day, []);
      map.get(day).push(ev);
    }
    return Array.from(map.entries()); // [[dateStr, [events...]], ...]
  }, [filtered]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden my-8">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-800 text-white shadow-xs">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Operational Maintenance Timeline
              </h3>
              <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                Local session events only — not historical backend records.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-5 py-3 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-600 whitespace-nowrap">Asset:</span>
            <div className="flex flex-wrap gap-1">
              {['ALL', ...ALL_ASSET_IDS].map(id => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAssetFilter(id)}
                  className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold transition-colors cursor-pointer ${
                    assetFilter === id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {id}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-600 whitespace-nowrap">Type:</span>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg bg-white border border-slate-300 text-slate-700 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer shadow-xs"
            >
              <option value="ALL">All Event Types</option>
              {Object.entries(EVENT_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <span className="ml-auto text-[11px] font-mono text-slate-400">
            {filtered.length} event{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Timeline Body */}
        <div className="p-5 max-h-[55vh] overflow-y-auto space-y-5">

          {/* Session-only notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600" />
            <span>
              <strong>Session Event History.</strong> Events below were recorded after the timeline feature was enabled in this browser session. They do not represent pre-existing backend telemetry.
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="py-14 text-center space-y-2">
              <Clock className="w-8 h-8 mx-auto text-slate-300" />
              <div className="text-sm font-medium text-slate-500">No events recorded yet.</div>
              <div className="text-xs text-slate-400">
                Interact with the system (refresh risk, generate a work order, simulate contingency) to start recording events.
              </div>
            </div>
          ) : (
            grouped.map(([dateStr, dayEvents]) => (
              <div key={dateStr}>
                <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                  {dateStr}
                </div>
                <div className="space-y-2">
                  {dayEvents.map(ev => {
                    const cfg = EVENT_ICON[ev.type] || { Icon: Clock, color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200' };
                    const { Icon } = cfg;
                    return (
                      <div
                        key={ev.id}
                        className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-white hover:bg-slate-50 transition-colors"
                      >
                        <div className={`mt-0.5 p-1.5 rounded-md border shrink-0 ${cfg.bg}`}>
                          <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-slate-900">
                              {ev.summary}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 shrink-0">
                              {formatTs(ev.timestamp)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {ev.asset_id && (
                              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600">
                                {ev.asset_id}
                              </span>
                            )}
                            <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border ${cfg.bg} ${cfg.color}`}>
                              {EVENT_LABELS[ev.type] || ev.type}
                            </span>
                          </div>
                          {ev.detail && (
                            <div className="mt-1.5 text-[11px] text-slate-500 font-mono leading-relaxed">
                              {ev.detail}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3 border-t border-slate-200 bg-slate-50">
          <span className="text-[11px] font-mono text-slate-400 mr-auto">
            {events.length} total session event{events.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
