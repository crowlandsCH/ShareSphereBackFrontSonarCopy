import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';

import { CompanyList } from '../CompanyList';

afterEach(() => {
  vi.clearAllMocks();
});

describe('CompanyList (user-visible behaviour)', () => {
  const companies = [
    { id: 1, name: 'Alpha Co', tickerSymbol: 'ALP', sector: 'Tech', description: 'Alpha company' },
    { id: 2, name: 'Beta Inc', tickerSymbol: 'BET', sector: 'Finance', description: 'Beta company' },
  ];

  // Verifies headers and company cells are rendered
  it('renders table headers and company rows', () => {
    render(<CompanyList companies={companies} onSelect={vi.fn()} />);

    // Headers
    expect(screen.getByText('Company')).toBeTruthy();
    expect(screen.getByText('Ticker')).toBeTruthy();
    expect(screen.getByText('Sector')).toBeTruthy();
    

    // Company cells
    expect(screen.getByText('Alpha Co')).toBeTruthy();
    expect(screen.getByText('ALP')).toBeTruthy();
    expect(screen.getByText('Beta Inc')).toBeTruthy();
    expect(screen.getByText('BET')).toBeTruthy();
  });

  // Verifies clicking a company row calls onSelect with that company
  it('calls onSelect when a row is clicked', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(<CompanyList companies={companies} onSelect={onSelect} />);

    const alphaRow = screen.getByRole('button', { name: /View shares for Alpha Co/i });
    await user.click(alphaRow);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(companies[0]);
  });

  // Verifies keyboard activation (Enter and Space) also triggers selection
  it('activates selection with Enter and Space keys', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(<CompanyList companies={companies} onSelect={onSelect} />);

    const betaRow = screen.getByRole('button', { name: /View shares for Beta Inc/i });

    // Focus the row then press Enter
    betaRow.focus();
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(companies[1]);

    // Press Space (should also trigger)
    betaRow.focus();
    await user.keyboard(' ');
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  // Renders gracefully with empty company list and exposes no selection buttons
  it('renders gracefully with empty companies array', () => {
    render(<CompanyList companies={[]} onSelect={vi.fn()} />);
    // there should be no rows/buttons for companies
    expect(screen.queryByRole('button', { name: /View shares for/i })).toBeNull();
  });

  // Long content should still be accessible (no truncation test; ensure name is in accessible name)
  it('renders very long company names accessibly', async () => {
    const longName = 'A'.repeat(500) + ' Corp';
    const companiesLong = [{ id: 9, name: longName, tickerSymbol: 'LONG', sector: 'Test', description: 'desc' }];
    const onSelect = vi.fn();

    render(<CompanyList companies={companiesLong as any} onSelect={onSelect} />);

    const btn = screen.getByRole('button', { name: new RegExp(longName.slice(0, 40)) });
    expect(btn).toBeInTheDocument();
    // activate via keyboard
    btn.focus();
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
