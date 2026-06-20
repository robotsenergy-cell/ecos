import { render, screen } from '@testing-library/react';
import App from './App';
import { vi } from 'vitest';

// Mock the child components to simplify App test and isolate it
vi.mock('./components/TransitFootprint', () => ({
  TransitFootprint: () => <div data-testid="transit-footprint" />
}));
vi.mock('./components/SolarInsight', () => ({
  SolarInsight: () => <div data-testid="solar-insight" />
}));
vi.mock('./components/AirQuality', () => ({
  AirQuality: () => <div data-testid="air-quality" />
}));
vi.mock('./components/EcoCoach', () => ({
  EcoCoach: () => <div data-testid="eco-coach" />
}));
vi.mock('./components/CarbonSummary', () => ({
  CarbonSummary: () => <div data-testid="carbon-summary" />
}));

describe('App', () => {
  it('renders header, main components, and carbon summary', () => {
    render(<App />);
    expect(screen.getByText('E-C-O-S')).toBeInTheDocument();
    expect(screen.getByTestId('carbon-summary')).toBeInTheDocument();
    expect(screen.getByTestId('transit-footprint')).toBeInTheDocument();
    expect(screen.getByTestId('solar-insight')).toBeInTheDocument();
    expect(screen.getByTestId('air-quality')).toBeInTheDocument();
    expect(screen.getByTestId('eco-coach')).toBeInTheDocument();
  });

  it('has skip-nav link for accessibility', () => {
    render(<App />);
    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('has main content landmark with proper id', () => {
    render(<App />);
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main-content');
  });
});
