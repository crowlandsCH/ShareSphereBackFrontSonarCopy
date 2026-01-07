import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, afterEach, vi } from 'vitest';

import { HoldingsTable } from '../HoldingsTable';

afterEach(() => {
  vi.clearAllMocks();
});

describe('HoldingsTable (user-visible behaviour)', () => {
  const holdings = [
    {
      id: 1,
      shareId: 11,
      companyName: 'Acme Corp',
      ticker: 'ACME',
      shareType: 'Common',
      quantity: 1500,
      purchasePrice: 10,
      currentPricePerShare: 12.5,
      totalValue: 18750,
    },
    {
      id: 2,
      shareId: 22,
      companyName: 'Zenith Ltd',
      ticker: 'ZEN',
      shareType: 'Common',
      quantity: 20,
      purchasePrice: 50,
      currentPricePerShare: 45,
      totalValue: 900,
    },
  ];

  // Renders table headers and rows for each holding
  it('renders headers and one row per holding', () => {
    render(<HoldingsTable holdings={holdings} />);

    // Headers
    expect(screen.getByText('Company')).toBeTruthy();
    expect(screen.getByText('Quantity')).toBeTruthy();
    expect(screen.getByText('Current Price')).toBeTruthy();
    expect(screen.getByText('Total Value')).toBeTruthy();

    // Rows: header row + data rows
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBe(holdings.length + 1);

    // Verify company names and tickers are shown
    expect(screen.getByText('Acme Corp')).toBeTruthy();
    expect(screen.getByText('ACME')).toBeTruthy();
    expect(screen.getByText('Zenith Ltd')).toBeTruthy();
    expect(screen.getByText('ZEN')).toBeTruthy();
  });

  // Verifies that quantities and currency values are formatted for display
  it('formats quantity and currency values correctly', () => {
    render(<HoldingsTable holdings={holdings} />);

    const currencyFormatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    });

    // Quantity should be locale-formatted (e.g., 1,500)
    expect(screen.getByText('1,500')).toBeTruthy();

    // Current price and total value should be formatted as USD currency
    expect(screen.getByText(currencyFormatter.format(12.5))).toBeTruthy();
    expect(screen.getByText(currencyFormatter.format(18750))).toBeTruthy();

    expect(screen.getByText(currencyFormatter.format(45))).toBeTruthy();
    expect(screen.getByText(currencyFormatter.format(900))).toBeTruthy();
  });

  // Basic interaction: tab through document to ensure nothing crashes (sanity)
  it('allows keyboard navigation without errors', async () => {
    const user = userEvent.setup();
    render(<HoldingsTable holdings={holdings} />);

    // Tab through the document (no focusable elements expected in table body by default)
    await user.tab();
    await user.tab();

    // Sanity: still shows a company name after tabbing
    expect(screen.getByText('Acme Corp')).toBeTruthy();
  });

  it('renders gracefully with empty holdings', () => {
    const { container } = render(<HoldingsTable holdings={[]} />);
    expect(container).toBeTruthy();

    // header should still be present
    expect(screen.getByText('Company')).toBeInTheDocument();
  });
});
