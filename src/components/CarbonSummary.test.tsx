import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CarbonSummary } from './CarbonSummary';
import { vi } from 'vitest';

// Mock the tracking history hook
const mockClearHistory = vi.fn();
let mockSummary = {
  totalEntries: 0,
  transitCount: 0,
  solarCount: 0,
  totalTransitEmissionsKg: 0,
  totalSolarOffsetKg: 0,
  netCarbonKg: 0,
};

vi.mock('../hooks/useTrackingHistory', () => ({
  useTrackingHistory: () => ({
    history: [],
    summary: mockSummary,
    addEntry: vi.fn(),
    clearHistory: mockClearHistory,
  }),
}));

describe('CarbonSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSummary = {
      totalEntries: 0,
      transitCount: 0,
      solarCount: 0,
      totalTransitEmissionsKg: 0,
      totalSolarOffsetKg: 0,
      netCarbonKg: 0,
    };
  });

  it('renders empty state when no entries', () => {
    render(<CarbonSummary />);
    expect(screen.getByText('Start tracking your carbon footprint')).toBeInTheDocument();
  });

  it('renders summary when entries exist', () => {
    mockSummary = {
      totalEntries: 3,
      transitCount: 2,
      solarCount: 1,
      totalTransitEmissionsKg: 2.81,
      totalSolarOffsetKg: 4500,
      netCarbonKg: -4497.19,
    };

    render(<CarbonSummary />);
    expect(screen.getByText('3 calculations tracked')).toBeInTheDocument();
    expect(screen.getByText('2.8')).toBeInTheDocument(); // 2.81 rounded
    expect(screen.getByText('4.5')).toBeInTheDocument(); // 4500/1000
  });

  it('calls clearHistory when clear button is clicked', async () => {
    mockSummary = { ...mockSummary, totalEntries: 1, transitCount: 1, totalTransitEmissionsKg: 1 };

    render(<CarbonSummary />);
    const user = userEvent.setup();
    const clearButton = screen.getByLabelText('Clear tracking history');
    
    await user.click(clearButton);
    expect(mockClearHistory).toHaveBeenCalled();
  });

  it('has proper accessibility attributes', () => {
    render(<CarbonSummary />);
    expect(screen.getByRole('region', { name: 'Carbon tracking summary' })).toBeInTheDocument();
  });
});
