import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';

// Mock react-router's useNavigate to assert navigation calls
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

import { ShareList } from '../ShareList';

afterEach(() => vi.clearAllMocks());

describe('ShareList (user-visible behaviour)', () => {
  const company = { id: 10, name: 'Acme Corp', ticker: 'ACME' };
  const shares = [
    { id: 1, companyId: 10, shareType: 'Common', availableQuantity: 1500, price: 12.5, lastUpdated: new Date().toISOString() },
    { id: 2, companyId: 10, shareType: 'Preferred', availableQuantity: 200, price: 45, lastUpdated: new Date().toISOString() },
  ];

  // Verifies headers and share rows render with formatted values
  it('renders table headers and formatted share rows', () => {
    render(<ShareList shares={shares} company={company} />);

    // Headers
    expect(screen.getByText('Share Type')).toBeTruthy();
    expect(screen.getByText('Price per Share')).toBeTruthy();
    expect(screen.getByText('Available Quantity')).toBeTruthy();

    // Row content and formatting
    expect(screen.getByText('Common')).toBeTruthy();
    expect(screen.getByText('Preferred')).toBeTruthy();

    const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
    expect(screen.getByText(usd.format(12.5))).toBeTruthy();
    expect(screen.getByText(usd.format(45))).toBeTruthy();

    // Quantities formatted with 'shares' suffix
    expect(screen.getByText('1,500 shares')).toBeTruthy();
    expect(screen.getByText('200 shares')).toBeTruthy();
  });

  // Verifies clicking Trade calls navigate with the correct path and state
  it('navigates to trade page with share and company state when Trade is clicked', async () => {
    render(<ShareList shares={shares} company={company} />);
    const user = userEvent.setup();

    const tradeButtons = screen.getAllByRole('button', { name: /Trade/i });
    await user.click(tradeButtons[0]);

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/trade', { state: { share: shares[0], company } });
  });

  // Graceful render when shares is empty
  it('renders gracefully with empty shares without errors', () => {
    const { container } = render(<ShareList shares={[]} company={company} />);
    expect(container).toBeTruthy();

    // no Trade buttons should be present for empty data
    expect(screen.queryByRole('button', { name: /Trade/i })).toBeNull();
  });
});
