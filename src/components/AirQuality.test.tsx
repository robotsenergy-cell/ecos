import { render, screen, waitFor } from '@testing-library/react';
import { AirQuality } from './AirQuality';
import { vi } from 'vitest';

global.fetch = vi.fn();

describe('AirQuality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (global.fetch as any).mockImplementation(() => new Promise(() => {})); // never resolves
    render(<AirQuality />);
    expect(screen.getByText('Ozone & Air')).toBeInTheDocument();
    expect(screen.getByText('Loading air quality data...')).toBeInTheDocument();
  });

  it('fetches and displays air quality data', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ aqi: 42, status: 'Good', pm25: 10.5, pm10: 16.8 })
    });
    
    render(<AirQuality />);
    
    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument();
    });
    
    expect(screen.getByText('AQI')).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument();
  });
  
  it('handles moderate and poor status colors', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ aqi: 60, status: 'Moderate', pm25: 15, pm10: 20 })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ aqi: 120, status: 'Poor', pm25: 35, pm10: 50 })
      });
    
    const { unmount } = render(<AirQuality />);
    await waitFor(() => expect(screen.getByText('Moderate')).toBeInTheDocument());
    unmount();
    
    render(<AirQuality />);
    await waitFor(() => expect(screen.getByText('Poor')).toBeInTheDocument());
  });
  
  it('handles fetch error gracefully and shows error state', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));
    render(<AirQuality />);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Unable to fetch air quality data');
    });
    consoleSpy.mockRestore();
  });

  it('has proper accessibility attributes', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ aqi: 42, status: 'Good', pm25: 10.5, pm10: 16.8 })
    });
    
    render(<AirQuality />);
    
    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    // aria-live region exists
    const liveRegion = screen.getByText('42').closest('[aria-live]');
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  });
});
