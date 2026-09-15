/**
 * useEventHistory — Local session event history store.
 *
 * Records operational events in memory during the current browser session.
 * Events are NOT fetched from a backend and are NOT presented as historical
 * telemetry. They represent actions that occurred after the feature was enabled.
 *
 * Event types:
 *   RISK_REFRESH       — Fleet risk data refreshed from API
 *   WORK_ORDER_GEN     — Work order generated for an asset
 *   WORK_ORDER_SIGNED  — Work order countersigned & dispatched
 *   SIMULATION         — Contingency scenario simulated
 *   DGA_CONDITION      — DGA condition flag noted on asset load
 *   WEATHER_ALERT      — Weather stress alert recorded
 */

import { useState, useCallback } from 'react';

export const EVENT_TYPES = {
  RISK_REFRESH: 'RISK_REFRESH',
  WORK_ORDER_GEN: 'WORK_ORDER_GEN',
  WORK_ORDER_SIGNED: 'WORK_ORDER_SIGNED',
  SIMULATION: 'SIMULATION',
  DGA_CONDITION: 'DGA_CONDITION',
  WEATHER_ALERT: 'WEATHER_ALERT',
};

export const EVENT_LABELS = {
  RISK_REFRESH: 'Risk Assessment Refresh',
  WORK_ORDER_GEN: 'Work Order Generated',
  WORK_ORDER_SIGNED: 'Work Order Countersigned',
  SIMULATION: 'Contingency Simulation',
  DGA_CONDITION: 'DGA Condition Change',
  WEATHER_ALERT: 'Weather Stress Alert',
};

let _seq = 1;

function makeEvent(type, assetId, summary, detail = null) {
  return {
    id: _seq++,
    type,
    asset_id: assetId,    // null = fleet-wide
    summary,
    detail,
    timestamp: new Date().toISOString(),
  };
}

export function useEventHistory() {
  const [events, setEvents] = useState([]);

  const recordEvent = useCallback((type, assetId, summary, detail = null) => {
    const ev = makeEvent(type, assetId, summary, detail);
    setEvents(prev => [ev, ...prev]);
    return ev;
  }, []);

  const clearHistory = useCallback(() => {
    setEvents([]);
  }, []);

  return { events, recordEvent, clearHistory };
}
