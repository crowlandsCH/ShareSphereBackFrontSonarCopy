import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { TradeHistory } from '../TradeHistory';

// Helper to create a userEvent instance per test for consistent timing
const setupUser = () => userEvent.setup();

// Date fixture: returns ISO string for today +/- days
const makeDate = (daysOffset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString();
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  // restore any mocked location
  try {
    // @ts-ignore
    if ((globalThis as any).__originalLocation) {
      // @ts-ignore
      window.location = (globalThis as any).__originalLocation;
      // @ts-ignore
      delete (globalThis as any).__originalLocation;
    }
  } catch {}
});

describe('TradeHistory (user-visible behavior)', () => {
  // When there are no trades, an empty state is shown with a "Start Trading" action
  it("renders empty state and 'Start Trading' action when trades array is empty", async () => {
    // Spy on location.assign safely via defineProperty and restore in afterEach
    // store original location for restore
    // @ts-ignore
    (globalThis as any).__originalLocation = window.location;
    const assignMock = vi.fn();
    // create a location object that calls assignMock when href is set
    const loc: any = { ...((globalThis as any).__originalLocation as Location) };
    Object.defineProperty(loc, 'href', {
      configurable: true,
      get: () => '',
      set: (v: string) => assignMock(v),
    });
    Object.defineProperty(window, 'location', { configurable: true, value: loc });

    render(<TradeHistory trades={[]} />);

    expect(screen.getByText(/No trade history/i)).toBeInTheDocument();
    const startBtn = screen.getByRole('button', { name: /Start Trading/i });
    expect(startBtn).toBeInTheDocument();

    const user = setupUser();
    await user.click(startBtn);

    // clicking should call location.assign with /trade
    expect(assignMock).toHaveBeenCalledWith('/trade');
  });

  // Filtering by Buy/Sell should show only matching rows
  it('filters trades by Buy and Sell using the filter buttons', async () => {
    const now = makeDate(0);
    const trades = [
      { tradeId: 1, shareholderId: 1, companyId: 1, companyName: 'Acme Corp', brokerId: 1, brokerName: 'Broker A', type: 0, quantity: 10, unitPrice: 5, timestamp: now }, // Buy
      { tradeId: 2, shareholderId: 1, companyId: 2, companyName: 'Beta Ltd', brokerId: 2, brokerName: 'Broker B', type: 1, quantity: 3, unitPrice: 12.5, timestamp: now }, // Sell
    ];

    render(<TradeHistory trades={trades} />);

    // Both rows visible initially
    expect(await screen.findByText(/Acme Corp/)).toBeInTheDocument();
    expect(screen.getByText(/Beta Ltd/)).toBeInTheDocument();

    // Click Buy filter
    const user = setupUser();
    const buyBtn = screen.getByRole('button', { name: /Buy/i });
    await user.click(buyBtn);
    expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();
    expect(screen.queryByText(/Beta Ltd/)).toBeNull();

    // Click Sell filter
    const sellBtn = screen.getByRole('button', { name: /Sell/i });
    await user.click(sellBtn);
    expect(screen.getByText(/Beta Ltd/)).toBeInTheDocument();
    expect(screen.queryByText(/Acme Corp/)).toBeNull();

    // Back to All
    const allBtn = screen.getByRole('button', { name: /^All$/i });
    await user.click(allBtn);
    expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();
    expect(screen.getByText(/Beta Ltd/)).toBeInTheDocument();
  });

  // Date range filter hides trades outside the selected range
  it('filters trades by date range (Week)', async () => {
    const todayISO = makeDate(0);
    const tenDaysAgo = makeDate(-10);

    const trades = [
      { tradeId: 3, shareholderId: 1, companyId: 3, companyName: 'Today Co', brokerId: 1, brokerName: 'Broker A', type: 0, quantity: 1, unitPrice: 100, timestamp: todayISO },
      { tradeId: 4, shareholderId: 1, companyId: 4, companyName: 'Old Co', brokerId: 2, brokerName: 'Broker B', type: 1, quantity: 2, unitPrice: 50, timestamp: tenDaysAgo },
    ];

    render(<TradeHistory trades={trades} />);

    // Ensure both present initially
    expect(await screen.findByText(/Today Co/)).toBeInTheDocument();
    expect(screen.getByText(/Old Co/)).toBeInTheDocument();

    // Select Past Week from the date range select
    const user = setupUser();
    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'Week');

    // Now Old Co (10 days ago) should be filtered out
    expect(screen.getByText(/Today Co/)).toBeInTheDocument();
    expect(screen.queryByText(/Old Co/)).toBeNull();
  });

  // Pagination shows up when there are more than itemsPerPage and navigates pages
  it('paginates trades and navigates between pages', async () => {
    const trades = Array.from({ length: 7 }).map((_, i) => ({
      tradeId: 100 + i,
      shareholderId: 1,
      companyId: i,
      companyName: `Firm ${i + 1}`,
      brokerId: 1,
      brokerName: 'Broker P',
      type: i % 2 === 0 ? 0 : 1,
      quantity: 1 + i,
      unitPrice: 10 + i,
      timestamp: makeDate(0),
    }));

    render(<TradeHistory trades={trades} />);

    // First page should show 5 items
    expect(await screen.findByText(/Firm 1/)).toBeInTheDocument();
    expect(screen.getByText(/Firm 5/)).toBeInTheDocument();
    expect(screen.queryByText(/Firm 6/)).toBeNull();

    // Click Next to go to second page
    const user = setupUser();
    const nextBtn = screen.getByRole('button', { name: /Next/i });
    await user.click(nextBtn);

    expect(await screen.findByText(/Firm 6/)).toBeInTheDocument();
    expect(screen.getByText(/Firm 7/)).toBeInTheDocument();
    // Ensure Firm 1 is no longer visible on page 2
    expect(screen.queryByText(/Firm 1/)).toBeNull();
  });
});
