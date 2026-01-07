import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

// Mock the heavy admin subcomponents so tests focus on AdminPanel behavior.
vi.mock('../admin/BrokerManagement', () => ({
  BrokerManagement: () => <div>Broker Management Mock</div>,
}));
vi.mock('../admin/ExchangeManagement', () => ({
  ExchangeManagement: () => <div>Exchange Management Mock</div>,
}));
vi.mock('../admin/CompanyManagement', () => ({
  CompanyManagement: () => <div>Company Management Mock</div>,
}));

import { AdminPanel } from '../AdminPanel';

describe('AdminPanel', () => {
  it('renders header and shows Brokers content by default', async () => {
    render(<AdminPanel />);

    // Visible header and description
    expect(screen.getByRole('heading', { name: /Admin Panel/i })).toBeTruthy();
    expect(screen.getByText(/Manage brokers, exchanges, and companies/i)).toBeTruthy();

    // Default tab content should be brokers
    expect(screen.getByText('Broker Management Mock')).toBeTruthy();
    expect(screen.queryByText('Exchange Management Mock')).toBeNull();
    expect(screen.queryByText('Company Management Mock')).toBeNull();
  });

  it('switches to Exchanges when the Exchanges tab is clicked', async () => {
    const user = userEvent.setup();
    render(<AdminPanel />);

    const exchangesBtn = screen.getByRole('button', { name: /Exchanges/i });
    await user.click(exchangesBtn);

    // use findByText for async UI update semantics
    expect(await screen.findByText('Exchange Management Mock')).toBeTruthy();
    expect(screen.queryByText('Broker Management Mock')).toBeNull();
  });

  it('switches to Companies when the Companies tab is clicked', async () => {
    const user = userEvent.setup();
    render(<AdminPanel />);

    const companiesBtn = screen.getByRole('button', { name: /Companies/i });
    await user.click(companiesBtn);

    expect(await screen.findByText('Company Management Mock')).toBeTruthy();
    expect(screen.queryByText('Broker Management Mock')).toBeNull();
  });
});
