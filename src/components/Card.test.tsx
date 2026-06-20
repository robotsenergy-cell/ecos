import { render, screen } from '@testing-library/react';
import { Card } from './Card';
import { Leaf } from 'lucide-react';

describe('Card', () => {
  it('renders title, icon, and children correctly', () => {
    render(<Card title="Test Card" icon={Leaf} delay={0}><div>Child Content</div></Card>);
    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<Card title="Test Card" icon={Leaf} subtitle="Sub T" delay={0}><div>Content</div></Card>);
    expect(screen.getByText('Sub T')).toBeInTheDocument();
  });

  it('has aria-labelledby linking section to title', () => {
    render(<Card title="Test Card" icon={Leaf} delay={0}><div>Content</div></Card>);
    const section = screen.getByRole('region', { name: 'Test Card' });
    expect(section).toBeInTheDocument();
    
    const titleEl = screen.getByText('Test Card');
    expect(titleEl.id).toBeTruthy();
    expect(section.getAttribute('aria-labelledby')).toBe(titleEl.id);
  });

  it('marks icon container as aria-hidden', () => {
    const { container } = render(<Card title="Test Card" icon={Leaf} delay={0}><div>Content</div></Card>);
    const iconContainer = container.querySelector('[aria-hidden="true"]');
    expect(iconContainer).toBeInTheDocument();
  });
});
