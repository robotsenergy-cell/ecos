import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EcoCoach } from './EcoCoach';
import { vi } from 'vitest';

global.fetch = vi.fn();

// Mock scrollIntoView/scrollTop which might not be supported in jsdom
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('EcoCoach', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial welcome message', () => {
    render(<EcoCoach />);
    expect(screen.getByText(/Hi! I'm your Gemini-powered Eco-Coach/i)).toBeInTheDocument();
  });

  it('renders quick action chips', () => {
    render(<EcoCoach />);
    expect(screen.getByLabelText('Ask about: Switch to cycling')).toBeInTheDocument();
    expect(screen.getByLabelText('Ask about: Reduce AC usage')).toBeInTheDocument();
    expect(screen.getByLabelText('Ask about: Start composting')).toBeInTheDocument();
    expect(screen.getByLabelText('Ask about: Recycling tips')).toBeInTheDocument();
  });

  it('allows user to send a message and displays response', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ reply: 'This is a mocked response.' })
    });

    render(<EcoCoach />);
    const user = userEvent.setup();
    const input = screen.getByPlaceholderText('Ask for eco tips...');
    
    await user.type(input, 'How to save energy?{enter}');
    
    expect(screen.getByText('How to save energy?')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('This is a mocked response.')).toBeInTheDocument();
    });
  });

  it('disables send button while loading', async () => {
    let resolvePromise: any;
    const promise = new Promise((resolve) => { resolvePromise = resolve; });
    (global.fetch as any).mockImplementation(() => promise);

    render(<EcoCoach />);
    const user = userEvent.setup();
    const input = screen.getByPlaceholderText('Ask for eco tips...');
    const sendButton = screen.getByLabelText('Send message to Eco Coach');
    
    await user.type(input, 'Hello');
    await user.click(sendButton);
    
    expect(sendButton).toBeDisabled();
    
    await act(async () => {
      resolvePromise({ ok: true, json: () => Promise.resolve({ reply: 'Done' }) });
    });
  });

  it('handles api error gracefully', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('API failed'));

    render(<EcoCoach />);
    const user = userEvent.setup();
    const input = screen.getByPlaceholderText('Ask for eco tips...');
    
    await user.type(input, 'Hello{enter}');
    
    await waitFor(() => {
      expect(screen.getByText('Service temporarily unavailable.')).toBeInTheDocument();
    });
  });
  
  it('does not send empty messages', async () => {
    render(<EcoCoach />);
    const user = userEvent.setup();
    const input = screen.getByPlaceholderText('Ask for eco tips...');
    const sendButton = screen.getByLabelText('Send message to Eco Coach');
    
    await user.type(input, '   ');
    expect(sendButton).toBeDisabled();
  });

  it('sends message via quick action chip', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ reply: 'Here are cycling tips.' })
    });

    render(<EcoCoach />);
    const user = userEvent.setup();
    const chip = screen.getByLabelText('Ask about: Switch to cycling');
    
    await user.click(chip);
    
    await waitFor(() => {
      expect(screen.getByText('How can I switch to cycling?')).toBeInTheDocument();
    });
  });

  it('has proper accessibility attributes', () => {
    render(<EcoCoach />);
    expect(screen.getByRole('log')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Quick sustainability actions' })).toBeInTheDocument();
    expect(screen.getByLabelText('Message to Eco Coach')).toBeInTheDocument();
  });
});
