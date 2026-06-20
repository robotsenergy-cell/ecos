import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransitFootprint } from './TransitFootprint';
import { vi } from 'vitest';

global.fetch = vi.fn();

describe('TransitFootprint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<TransitFootprint />);
    expect(screen.getByText('Emissions Tracking')).toBeInTheDocument();
  });

  it('calculates impact on click', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ emissionsKg: 2.88, equivalentTrees: 0.14 })
    });

    render(<TransitFootprint />);
    const user = userEvent.setup();
    const button = screen.getByText('Calculate Impact');

    await user.click(button);

    await waitFor(() => {
      expect(document.body.textContent).toContain('2.88');
    });
  });

  it('allows user to change mode via radiogroup', async () => {
    render(<TransitFootprint />);
    const user = userEvent.setup();
    const busButton = screen.getByRole('radio', { name: 'Bus' });
    
    await user.click(busButton);
    expect(busButton).toHaveAttribute('aria-checked', 'true');
  });

  it('handles api error gracefully and shows error message', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (global.fetch as any).mockRejectedValueOnce(new Error('Network Issue'));

    render(<TransitFootprint />);
    const user = userEvent.setup();
    const button = screen.getByText('Calculate Impact');

    await user.click(button);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to calculate emissions');
    });
    consoleSpy.mockRestore();
  });

  it('disables calculation when distance is empty', async () => {
    render(<TransitFootprint />);
    const user = userEvent.setup();
    const input = screen.getByRole('spinbutton');
    const button = screen.getByText('Calculate Impact');

    await user.clear(input);
    expect(button).toBeDisabled();
  });

  it('has proper accessibility attributes', () => {
    render(<TransitFootprint />);
    expect(screen.getByRole('radiogroup', { name: 'Select transit mode' })).toBeInTheDocument();
    expect(screen.getByLabelText('Transit distance in kilometers')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Car' })).toHaveAttribute('aria-checked', 'true');
  });

  it('submits via form enter key', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ emissionsKg: 1.92, equivalentTrees: 0.09 })
    });

    render(<TransitFootprint />);
    const user = userEvent.setup();
    const input = screen.getByRole('spinbutton');

    await user.clear(input);
    await user.type(input, '10{enter}');

    await waitFor(() => {
      expect(document.body.textContent).toContain('1.92');
    });
  });
});
