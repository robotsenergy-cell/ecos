import { renderHook, act } from '@testing-library/react';
import { useTrackingHistory } from './useTrackingHistory';
import { vi, beforeEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useTrackingHistory', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('starts with empty history', () => {
    const { result } = renderHook(() => useTrackingHistory());
    expect(result.current.history).toEqual([]);
    expect(result.current.summary.totalEntries).toBe(0);
  });

  it('adds a transit entry', () => {
    const { result } = renderHook(() => useTrackingHistory());
    
    act(() => {
      result.current.addEntry('transit', { distanceKm: 10, mode: 'car', emissionsKg: 1.92 });
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].type).toBe('transit');
    expect(result.current.history[0].data.emissionsKg).toBe(1.92);
    expect(result.current.summary.transitCount).toBe(1);
  });

  it('adds a solar entry', () => {
    const { result } = renderHook(() => useTrackingHistory());
    
    act(() => {
      result.current.addEntry('solar', { roofAreaSqM: 50, capacityKw: 7.5, annualCo2OffsetKg: 4500 });
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].type).toBe('solar');
    expect(result.current.summary.solarCount).toBe(1);
    expect(result.current.summary.totalSolarOffsetKg).toBe(4500);
  });

  it('calculates summary correctly with multiple entries', () => {
    const { result } = renderHook(() => useTrackingHistory());
    
    act(() => {
      result.current.addEntry('transit', { emissionsKg: 1.92 });
      result.current.addEntry('transit', { emissionsKg: 0.89 });
      result.current.addEntry('solar', { annualCo2OffsetKg: 4500 });
    });

    expect(result.current.summary.totalEntries).toBe(3);
    expect(result.current.summary.transitCount).toBe(2);
    expect(result.current.summary.solarCount).toBe(1);
    expect(result.current.summary.totalTransitEmissionsKg).toBeCloseTo(2.81);
    expect(result.current.summary.totalSolarOffsetKg).toBe(4500);
  });

  it('clears history', () => {
    const { result } = renderHook(() => useTrackingHistory());
    
    act(() => {
      result.current.addEntry('transit', { emissionsKg: 1.92 });
      result.current.addEntry('solar', { annualCo2OffsetKg: 4500 });
    });
    
    expect(result.current.history).toHaveLength(2);
    
    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.history).toHaveLength(0);
    expect(result.current.summary.totalEntries).toBe(0);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('ecos-tracking-history');
  });

  it('persists to localStorage', () => {
    const { result } = renderHook(() => useTrackingHistory());
    
    act(() => {
      result.current.addEntry('transit', { emissionsKg: 1.92 });
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'ecos-tracking-history',
      expect.stringContaining('"transit"')
    );
  });

  it('generates unique IDs for entries', () => {
    const { result } = renderHook(() => useTrackingHistory());
    
    act(() => {
      result.current.addEntry('transit', { emissionsKg: 1 });
      result.current.addEntry('transit', { emissionsKg: 2 });
    });

    expect(result.current.history[0].id).not.toBe(result.current.history[1].id);
  });

  it('handles corrupt localStorage gracefully', () => {
    localStorageMock.getItem.mockReturnValueOnce('not valid json{{{');
    const { result } = renderHook(() => useTrackingHistory());
    expect(result.current.history).toEqual([]);
  });

  it('calculates net carbon correctly via getter', () => {
    const { result } = renderHook(() => useTrackingHistory());
    
    act(() => {
      result.current.addEntry('transit', { emissionsKg: 5 });
      result.current.addEntry('solar', { annualCo2OffsetKg: 3000 });
    });

    // netCarbonKg = totalTransitEmissionsKg - totalSolarOffsetKg = 5 - 3000
    expect(result.current.summary.netCarbonKg).toBe(5 - 3000);
  });

  it('handles localStorage setItem failure gracefully', () => {
    localStorageMock.setItem.mockImplementationOnce(() => {
      throw new Error('QuotaExceededError');
    });
    
    const { result } = renderHook(() => useTrackingHistory());
    
    // Should not throw
    act(() => {
      result.current.addEntry('transit', { emissionsKg: 1 });
    });
    
    expect(result.current.history).toHaveLength(1);
  });
});
