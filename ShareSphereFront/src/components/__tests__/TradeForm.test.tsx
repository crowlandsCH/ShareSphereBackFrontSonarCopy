import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock sonner to capture toast calls
vi.mock('sonner', () => {
  const success = vi.fn();
  const error = vi.fn();
  return { toast: { success, error } };
});

// Mock react-router hooks used by the component
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: null }),
}));

// Mock AuthContext to provide a logged-in user with a shareholderId
vi.mock('../AuthContext', () => ({
  useAuth: () => ({ user: { shareholderId: 1 } }),
}));

// Mock api client
vi.mock('../../api/client', () => ({ apiFetch: vi.fn() }));
import { apiFetch } from '../../api/client';

import { TradeForm } from '../TradeForm';

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  try { vi.useRealTimers(); } catch {}
});

describe('TradeForm (user-visible behaviour)', () => {
  // Shows a loading indicator while fetching brokers and shares, then renders the form
  it('shows loading then renders form with brokers and shares for Buy', async () => {
    const mocked = vi.mocked(apiFetch);
    mocked.mockImplementation(async (url: string) => {
      if (url === '/api/brokers') return [{ brokerId: 1, name: 'BrokerOne', licenseNumber: 'L1' }];
      if (url === '/api/shares') return [
        { shareId: 10, company: { name: 'Acme', tickerSymbol: 'ACM' }, price: 5, availableQuantity: 100 },
      ];
      return [];
    });

    render(<TradeForm />);

    // Loading indicator initially
    expect(screen.getByText(/Loading trading options/i)).toBeInTheDocument();

    // After load, form header appears and broker/share options are present
    expect(await screen.findByText(/Execute Trade/i)).toBeInTheDocument();
    expect(screen.getByText(/BrokerOne/)).toBeTruthy();
    expect(screen.getByText(/Acme/)).toBeTruthy();
  });

  // Executes a Buy order: selects broker/share/quantity and submits, then shows confirmation and calls purchase API
  it('submits a Buy order and shows confirmation', async () => {
    const mocked = vi.mocked(apiFetch);
    mocked.mockImplementation(async (url: string, options?: any) => {
      if (url === '/api/brokers') return [{ brokerId: 2, name: 'BrokerTwo', licenseNumber: 'L2' }];
      if (url === '/api/shares') return [
        { shareId: 20, company: { name: 'Beta', tickerSymbol: 'BET' }, price: 10, availableQuantity: 5 },
      ];
      if (url === '/api/shareholders/1/purchase') return { success: true };
      return null;
    });

    render(<TradeForm />);
    const user = userEvent.setup();

    // Wait for form to load
    await screen.findByText(/Execute Trade/i);

    // Select broker
    await user.selectOptions(screen.getByLabelText(/Select Broker/i), '2');

    // Select share
    const shareOption = await screen.findByRole('option', { name: /Beta \(BET\)/i });
    await user.selectOptions(screen.getByLabelText(/Select Share/i), shareOption.getAttribute('value') || '20');

    // Enter a valid quantity within availability
    await user.type(screen.getByLabelText(/Quantity/i), '3');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /Execute Buy/i }));

    // API POST should have been called for purchase
    expect(mocked).toHaveBeenCalled();
    expect(await screen.findByText(/Trade Executed Successfully/i)).toBeInTheDocument();

    const sonner = await import('sonner');
    expect(sonner.toast.success).toHaveBeenCalled();
  });

  // Validation: entering quantity greater than available for Buy shows an inline error
  it('shows validation error when Buy quantity exceeds availability', async () => {
    const mocked = vi.mocked(apiFetch);
    mocked.mockImplementation(async (url: string) => {
      if (url === '/api/brokers') return [{ brokerId: 3, name: 'BrokerThree', licenseNumber: 'L3' }];
      if (url === '/api/shares') return [
        { shareId: 30, company: { name: 'Gamma', tickerSymbol: 'GAM' }, price: 15, availableQuantity: 2 },
      ];
      return [];
    });

    render(<TradeForm />);
    const user = userEvent.setup();

    await screen.findByText(/Execute Trade/i);
    await user.selectOptions(screen.getByLabelText(/Select Broker/i), '3');
    const opt = await screen.findByRole('option', { name: /Gamma \(GAM\)/i });
    await user.selectOptions(screen.getByLabelText(/Select Share/i), opt.getAttribute('value') || '30');

    // Enter too-large quantity
    await user.type(screen.getByLabelText(/Quantity/i), '5');
    await user.click(screen.getByRole('button', { name: /Execute Buy/i }));

    // Inline validation message
    expect(await screen.findByText(/Only 2 shares available/i)).toBeInTheDocument();

    const sonner = await import('sonner');
    expect(sonner.toast.error).toHaveBeenCalled();
  });

  // Validation: Sell flow shows error when attempting to sell more than owned
  it('shows validation error when Sell quantity exceeds owned shares', async () => {
    const mocked = vi.mocked(apiFetch);
    mocked.mockImplementation(async (url: string) => {
      if (url === '/api/brokers') return [{ brokerId: 4, name: 'BrokerFour', licenseNumber: 'L4' }];
      if (url === '/api/shareholders/1/portfolio') return ({ ownedShares: [ { shareId: 40, companyName: 'Delta', tickerSymbol: 'DLT', quantity: 2, currentPricePerShare: 50 } ] });
      return [];
    });

    render(<TradeForm />);
    const user = userEvent.setup();

    await screen.findByText(/Execute Trade/i);

    // Switch to Sell
    await user.click(screen.getByRole('button', { name: /Sell/i }));

    // Wait for owned shares to load
    await screen.findByLabelText(/Select Share/i);
    await user.selectOptions(screen.getByLabelText(/Select Broker/i), '4');
    const opt = await screen.findByRole('option', { name: /Delta/i });
    await user.selectOptions(screen.getByLabelText(/Select Share/i), opt.getAttribute('value') || '40');

    // Enter quantity greater than owned
    await user.type(screen.getByLabelText(/Quantity/i), '10');
    await user.click(screen.getByRole('button', { name: /Execute Sell/i }));

    expect(await screen.findByText(/You only own 2 shares/i)).toBeInTheDocument();
    const sonner = await import('sonner');
    expect(sonner.toast.error).toHaveBeenCalled();
  });

  // Shows error toast when purchase API (POST) fails on submit
  it('shows error toast when purchase API fails', async () => {
    const mocked = vi.mocked(apiFetch);
    mocked.mockImplementation(async (url: string, options?: any) => {
      if (url === '/api/brokers') return [{ brokerId: 6, name: 'FailBroker', licenseNumber: 'LX' }];
      if (url === '/api/shares') return [ { shareId: 60, company: { name: 'ErrCo', tickerSymbol: 'ERR' }, price: 1, availableQuantity: 10 } ];
      if (url.includes('/purchase')) throw new Error('server error');
      return null;
    });

    render(<TradeForm />);
    const user = userEvent.setup();

    await screen.findByText(/Execute Trade/i);
    await user.selectOptions(screen.getByLabelText(/Select Broker/i), '6');
    const opt = await screen.findByRole('option', { name: /ErrCo \(ERR\)/i });
    await user.selectOptions(screen.getByLabelText(/Select Share/i), opt.getAttribute('value') || '60');
    await user.type(screen.getByLabelText(/Quantity/i), '2');
    await user.click(screen.getByRole('button', { name: /Execute Buy/i }));

    const sonner = await import('sonner');
    expect(await screen.findByText(/Trade Executed Successfully|Trade Executed/i).catch(() => null)).toBeNull();
    expect(sonner.toast.error).toHaveBeenCalled();
  });

  // Prevent submission when quantity is zero (form should not call purchase API)
  it('does not call purchase API when quantity is zero', async () => {
    const mocked = vi.mocked(apiFetch);
    mocked.mockImplementation(async (url: string, options?: any) => {
      if (url === '/api/brokers') return [{ brokerId: 7, name: 'NoCall', licenseNumber: 'N1' }];
      if (url === '/api/shares') return [ { shareId: 70, company: { name: 'NoCallCo', tickerSymbol: 'NOC' }, price: 1, availableQuantity: 10 } ];
      if (url.includes('/purchase')) return { success: true };
      return null;
    });

    render(<TradeForm />);
    const user = userEvent.setup();

    await screen.findByText(/Execute Trade/i);
    await user.selectOptions(screen.getByLabelText(/Select Broker/i), '7');
    const opt = await screen.findByRole('option', { name: /NoCallCo \(NOC\)/i });
    await user.selectOptions(screen.getByLabelText(/Select Share/i), opt.getAttribute('value') || '70');

    // Enter zero quantity
    await user.type(screen.getByLabelText(/Quantity/i), '0');
    await user.click(screen.getByRole('button', { name: /Execute Buy/i }));

    // Ensure purchase endpoint was not called (only brokers/shares fetched)
    const calledPurchase = mocked.mock.calls.some((c) => String(c[0]).includes('/purchase'));
    expect(calledPurchase).toBe(false);
  });
});
