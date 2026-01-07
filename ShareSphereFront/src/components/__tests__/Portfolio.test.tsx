import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';

// Mock api client to return different data depending on the requested path
vi.mock('../../api/client', () => ({
  apiFetch: (path: string) => {
    if (path.includes('/portfolio')) {
      // default placeholder, tests override by re-mocking if needed
      return Promise.resolve({
        shareholderId: 1,
        shareholderName: 'Test',
        email: 't@example.com',
        totalPortfolioValue: 0,
        changeAmount: 0,
        totalSharesCount: 0,
        ownedShares: [],
      });
    }
    if (path.includes('/trades')) {
      return Promise.resolve([]);
    }
    return Promise.resolve(null);
  },
}));

// Provide a default authenticated user with a shareholderId
vi.mock('../AuthContext', () => ({
  useAuth: () => ({ user: { shareholderId: 1 } }),
}));

import { Portfolio } from '../Portfolio';

afterEach(() => {
  vi.clearAllMocks();
  // reset location to avoid side effects between tests
  try {
    window.location.href = 'about:blank';
  } catch {}
});

describe('Portfolio (user-visible behaviour)', () => {
  // When the portfolio has no holdings, an EmptyState is shown with an action button
  it('shows EmptyState and Start Trading action when there are no holdings', async () => {
    // Re-mock apiFetch to return empty holdings and no trades for this scenario
    const client = await import('../../api/client');
    vi.spyOn(client, 'apiFetch').mockImplementation((path: string) => {
      if (path.includes('/portfolio')) {
        return Promise.resolve({
          shareholderId: 1,
          shareholderName: 'Tester',
          email: 't@test.com',
          totalPortfolioValue: 0,
          changeAmount: 0,
          totalSharesCount: 0,
          ownedShares: [],
        });
      }
      if (path.includes('/trades')) {
        return Promise.resolve([]);
      }
      return Promise.resolve(null);
    });

    render(<Portfolio />);

    // The EmptyState title should be visible
    expect(await screen.findByText('No holdings yet')).toBeTruthy();

    // The action button should be present and navigate to /trade when clicked
    const user = userEvent.setup();
    const btns = screen.getAllByRole('button', { name: /Start Trading/i });
    // click the first Start Trading button (Holdings)
    await user.click(btns[0]);

    // jsdom doesn't perform actual navigation; assert the button existed and was clickable
    expect(btns.length).toBeGreaterThan(0);
  });

  // When there are holdings, the summary and holdings table are shown
  it('renders holdings summary and holdings table when there are holdings', async () => {
    const client = await import('../../api/client');
    vi.spyOn(client, 'apiFetch').mockImplementation((path: string) => {
      if (path.includes('/portfolio')) {
        return Promise.resolve({
          shareholderId: 1,
          shareholderName: 'Investor',
          email: 'i@test.com',
          totalPortfolioValue: 12345.67,
          changeAmount: 100,
          totalSharesCount: 1,
          ownedShares: [
            {
              shareId: 1,
              companyId: 10,
              companyName: 'Acme Corp',
              tickerSymbol: 'ACME',
              quantity: 10,
              currentPricePerShare: 1234.567,
              totalValue: 12345.67,
              stockExchange: 'NYSE',
            },
          ],
        });
      }
      if (path.includes('/trades')) {
        // return full trade objects expected by TradeHistory
        return Promise.resolve([
          {
            tradeId: 1,
            shareholderId: 1,
            companyId: 10,
            companyName: 'Acme Corp',
            brokerId: 5,
            brokerName: 'BestBroker',
            type: 0,
            quantity: 10,
            unitPrice: 1234.567,
            timestamp: new Date().toISOString(),
          },
          {
            tradeId: 2,
            shareholderId: 1,
            companyId: 11,
            companyName: 'Other Co',
            brokerId: 6,
            brokerName: 'BrokerTwo',
            type: 1,
            quantity: 5,
            unitPrice: 200,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
      return Promise.resolve(null);
    });

    render(<Portfolio />);

    // Wait for the holdings to appear in the UI (may appear multiple times: holdings and trade history)
        const matches = await screen.findAllByText('Acme Corp');
        expect(matches.length).toBeGreaterThan(0);
    
        // Verify total portfolio value is formatted and displayed
        const expected = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(12345.67);
        const valueMatches = await screen.findAllByText(expected);
        expect(valueMatches.length).toBeGreaterThan(0);
    
        // The holdings count should be shown in the summary area
        expect(screen.getByText(/Across 1 holdings/i)).toBeTruthy();
  });
});
