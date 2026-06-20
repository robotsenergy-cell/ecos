import { useState, useCallback, useEffect } from 'react';

export interface TrackingEntry {
  id: string;
  type: 'transit' | 'solar';
  timestamp: number;
  data: {
    // Transit fields
    distanceKm?: number;
    mode?: string;
    emissionsKg?: number;
    equivalentTrees?: number;
    // Solar fields
    roofAreaSqM?: number;
    capacityKw?: number;
    annualCo2OffsetKg?: number;
  };
}

export interface TrackingSummary {
  totalEntries: number;
  totalTransitEmissionsKg: number;
  totalSolarOffsetKg: number;
  netCarbonKg: number;
  transitCount: number;
  solarCount: number;
}

const STORAGE_KEY = 'ecos-tracking-history';

function loadHistory(): TrackingEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: TrackingEntry[]) {
  try {
    // Keep last 100 entries to prevent unbounded growth
    const trimmed = entries.slice(-100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Silently fail if localStorage is full
  }
}

export function useTrackingHistory() {
  const [history, setHistory] = useState<TrackingEntry[]>(() => loadHistory());

  // Sync to localStorage whenever history changes
  useEffect(() => {
    saveHistory(history);
  }, [history]);

  const addEntry = useCallback((type: TrackingEntry['type'], data: TrackingEntry['data']) => {
    const entry: TrackingEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type,
      timestamp: Date.now(),
      data,
    };
    setHistory(prev => [...prev, entry]);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const summary: TrackingSummary = {
    totalEntries: history.length,
    transitCount: history.filter(e => e.type === 'transit').length,
    solarCount: history.filter(e => e.type === 'solar').length,
    totalTransitEmissionsKg: history
      .filter(e => e.type === 'transit')
      .reduce((sum, e) => sum + (e.data.emissionsKg || 0), 0),
    totalSolarOffsetKg: history
      .filter(e => e.type === 'solar')
      .reduce((sum, e) => sum + (e.data.annualCo2OffsetKg || 0), 0),
    get netCarbonKg() {
      return this.totalTransitEmissionsKg - this.totalSolarOffsetKg;
    },
  };

  return { history, summary, addEntry, clearHistory };
}
