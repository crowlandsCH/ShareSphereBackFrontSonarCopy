import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';

import { ExchangeCard } from '../ExchangeCard';

afterEach(() => {
  vi.clearAllMocks();
});

describe('ExchangeCard (user-visible behaviour)', () => {
  const exchange = {
    exchangeId: 5,
    name: 'Global Exchange',
    currency: 'USD',
    country: 'USA',
    description: 'A major global stock exchange',
  };

  // Renders the exchange details (name, currency, country, description)
  it('shows exchange name, currency, country and description', () => {
    render(<ExchangeCard exchange={exchange} onSelect={vi.fn()} />);

    expect(screen.getByText('Global Exchange')).toBeTruthy();
    expect(screen.getByText('USD')).toBeTruthy();
    expect(screen.getByText('USA')).toBeTruthy();
    expect(screen.getByText('A major global stock exchange')).toBeTruthy();
  });

  // Calls onSelect when the card (button) is clicked
  it('calls onSelect when clicked', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(<ExchangeCard exchange={exchange} onSelect={onSelect} />);

    const btn = screen.getByRole('button', { name: /View companies on Global Exchange/i });
    await user.click(btn);

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  // Activates the card with keyboard (Enter key)
  it('activates on Enter key press when focused', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(<ExchangeCard exchange={exchange} onSelect={onSelect} />);

    const btn = screen.getByRole('button', { name: /View companies on Global Exchange/i });
    btn.focus();
    await user.keyboard('{Enter}');

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('renders very long names and descriptions accessibly', () => {
    const longExchange = {
      exchangeId: 9,
      name: 'X'.repeat(800),
      currency: 'EUR',
      country: 'EU',
      description: 'D'.repeat(2000),
    } as any;

    render(<ExchangeCard exchange={longExchange} onSelect={vi.fn()} />);

    // The long name should be present in the accessible name of the button
    const btn = screen.getByRole('button', { name: new RegExp(longExchange.name.slice(0, 40)) });
    expect(btn).toBeInTheDocument();
  });
});
