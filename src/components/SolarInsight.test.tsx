import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SolarInsight } from './SolarInsight';
import { vi } from 'vitest';

global.fetch = vi.fn();

describe('SolarInsight', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<SolarInsight />);
    expect(screen.getByText('Clean Energy')).toBeInTheDocument();
  });

  it('fetches solar offset data on click', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ capacityKw: 7.5, estimatedAnnualEnergyKwh: 11250, annualCo2OffsetKg: 4500 })
    });

    render(<SolarInsight />);
    const user = userEvent.setup();
    const input = screen.getByRole('spinbutton');
    const button = screen.getByText('Project Solar Offset');

    await user.clear(input);
    await user.type(input, '50');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('7.5')).toBeInTheDocument();
      expect(screen.getByText('4.5')).toBeInTheDocument(); // 4500 / 1000 = 4.5
    });
  });

  it('handles api error gracefully and shows error message', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (global.fetch as any).mockRejectedValueOnce(new Error('API failed'));

    render(<SolarInsight />);
    const user = userEvent.setup();
    const button = screen.getByText('Project Solar Offset');

    await user.click(button);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to calculate solar offset');
    });
    consoleSpy.mockRestore();
  });
  
  it('disables button when no area is provided', async () => {
    render(<SolarInsight />);
    const user = userEvent.setup();
    const input = screen.getByRole('spinbutton');
    const button = screen.getByText('Project Solar Offset');
    
    await user.clear(input);
    expect(button).toBeDisabled();
  });

  it('has proper accessibility attributes', () => {
    render(<SolarInsight />);
    expect(screen.getByLabelText('Available roof area in square meters')).toBeInTheDocument();
    expect(screen.getByLabelText('Project solar offset')).toBeInTheDocument();
  });

  it('submits via form enter key', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ capacityKw: 15, estimatedAnnualEnergyKwh: 22500, annualCo2OffsetKg: 9000 })
    });

    render(<SolarInsight />);
    const user = userEvent.setup();
    const input = screen.getByRole('spinbutton');

    await user.clear(input);
    await user.type(input, '100{enter}');

    await waitFor(() => {
      expect(screen.getByText('15')).toBeInTheDocument();
    });
  });
});
