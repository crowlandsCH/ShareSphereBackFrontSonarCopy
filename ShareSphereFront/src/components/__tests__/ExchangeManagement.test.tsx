import React from 'react';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, type Mock } from 'vitest';

// Mock api client and toast to control network responses and suppress toasts
vi.mock('../../api/client', () => ({ apiFetch: vi.fn() }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { ExchangeManagement } from '../../components/admin/ExchangeManagement';
import { apiFetch } from '../../api/client';

const mockApiFetch = apiFetch as unknown as Mock;

beforeEach(() => {
  vi.resetAllMocks();
});

const getVisibleExchangeNames = () => {
  const rows = screen.getAllByRole('row');
  const bodyRows = rows.slice(1);
  return bodyRows.map(r => within(r).queryAllByRole('cell')[0].textContent?.trim() ?? '').filter(Boolean);
};

// Renders header and rows after fetching exchanges
test('renders header and exchange rows after fetching', async () => {
  const apiEx = { exchangeId: 1, name: 'NYSE', country: 'United States', currency: 'USD' };

  mockApiFetch.mockImplementation((path: string) => {
    if (path === '/api/stockexchanges') return Promise.resolve([apiEx]);
    return Promise.resolve({});
  });

  render(<ExchangeManagement />);

  // wait for header and row to appear
  expect(await screen.findByText('Exchange Management')).toBeInTheDocument();
  expect(await screen.findByText('NYSE')).toBeInTheDocument();
  expect(screen.getByText('United States')).toBeInTheDocument();
  expect(screen.getByText('USD')).toBeInTheDocument();
});

// Opens the Add Exchange form when clicking the button
test('opens Add Exchange form when clicking Add Exchange', async () => {
  mockApiFetch.mockResolvedValueOnce([]);

  render(<ExchangeManagement />);

  await waitFor(() => expect(mockApiFetch).toHaveBeenCalled());

  await userEvent.click(screen.getByRole('button', { name: /Add Exchange/i }));

  expect(screen.getByText(/Add New Exchange/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Exchange Name/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Country/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Currency Code/i)).toBeInTheDocument();
});

// Validates required fields and currency length
test('validates required fields on submit', async () => {
  mockApiFetch.mockResolvedValueOnce([]);

  render(<ExchangeManagement />);
  await waitFor(() => expect(mockApiFetch).toHaveBeenCalled());

  await userEvent.click(screen.getByRole('button', { name: /Add Exchange/i }));
  await userEvent.click(screen.getByRole('button', { name: /Create Exchange/i }));

  expect(await screen.findByText(/Exchange name is required/i)).toBeInTheDocument();
  expect(screen.getByText(/Country is required/i)).toBeInTheDocument();
  expect(screen.getByText(/Currency is required/i)).toBeInTheDocument();

  // enter invalid currency length
  await userEvent.type(screen.getByLabelText(/Currency Code/i), 'US');
  await userEvent.click(screen.getByRole('button', { name: /Create Exchange/i }));
  expect(await screen.findByText(/Currency code must be 3 characters/i)).toBeInTheDocument();
});

// Creates an exchange and shows it in the table
test('creates a new exchange and shows it in the table', async () => {
  const newEx = { exchangeId: 10, name: 'LSE', country: 'United Kingdom', currency: 'GBP' };

  // Sequence: GET initial (empty), POST returns created exchange
  mockApiFetch
    .mockResolvedValueOnce([]) // initial GET
    .mockResolvedValueOnce(newEx); // POST returns created

  render(<ExchangeManagement />);

  await waitFor(() => expect(mockApiFetch).toHaveBeenCalled());

  await userEvent.click(screen.getByRole('button', { name: /Add Exchange/i }));
  await userEvent.type(screen.getByLabelText(/Exchange Name/i), 'LSE');
  await userEvent.type(screen.getByLabelText(/Country/i), 'United Kingdom');
  await userEvent.type(screen.getByLabelText(/Currency Code/i), 'GBP');

  await userEvent.click(screen.getByRole('button', { name: /Create Exchange/i }));

  expect(await screen.findByText('LSE')).toBeInTheDocument();
  expect(screen.getByText('United Kingdom')).toBeInTheDocument();
  expect(screen.getByText('GBP')).toBeInTheDocument();
});

// Edits an exchange and updates the row text
test('edits an existing exchange and updates the table', async () => {
  const existing = { exchangeId: 5, name: 'OldEx', country: 'X', currency: 'XXX' };

  mockApiFetch.mockImplementation((path: string, options?: any) => {
    if (!options || !options.method) return Promise.resolve([existing]);
    if (options.method === 'PUT') return Promise.resolve({});
    return Promise.resolve({});
  });

  render(<ExchangeManagement />);

  await screen.findByText('OldEx');

  // click edit
  const editBtn = screen.getByRole('button', { name: /Edit OldEx/i });
  await userEvent.click(editBtn);

  // change name and submit
  await userEvent.clear(screen.getByLabelText(/Exchange Name/i));
  await userEvent.type(screen.getByLabelText(/Exchange Name/i), 'OldExUpdated');
  await userEvent.click(screen.getByRole('button', { name: /Update Exchange/i }));

  expect(await screen.findByText('OldExUpdated')).toBeInTheDocument();
});

// Shows delete confirmation and removes the exchange on confirm
test('shows delete confirmation and removes exchange on confirm', async () => {
  const existing = { exchangeId: 6, name: 'DelEx', country: 'C', currency: 'DOL' };

  mockApiFetch
    .mockResolvedValueOnce([existing]) // initial GET
    .mockResolvedValueOnce({}); // DELETE

  render(<ExchangeManagement />);

  await screen.findByText('DelEx');

  const delBtn = screen.getByRole('button', { name: /Delete DelEx/i });
  await userEvent.click(delBtn);

  expect(screen.getByText(/Delete Exchange/i)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /Delete$/i }));

  await waitFor(() => expect(screen.queryByText('DelEx')).toBeNull());
});

// Sorting by Name toggles order
test('sorts exchanges when clicking the Name header', async () => {
  const exchanges = [
    { exchangeId: 1, name: 'BetaEx', country: 'A', currency: 'AAA' },
    { exchangeId: 2, name: 'AlphaEx', country: 'B', currency: 'BBB' },
  ];

  mockApiFetch.mockResolvedValueOnce(exchanges);

  render(<ExchangeManagement />);

  await screen.findByText('BetaEx');

  expect(getVisibleExchangeNames()).toEqual(['BetaEx', 'AlphaEx']);

  await userEvent.click(screen.getByText('Name'));
  expect(getVisibleExchangeNames()).toEqual(['AlphaEx', 'BetaEx']);

  await userEvent.click(screen.getByText('Name'));
  expect(getVisibleExchangeNames()).toEqual(['BetaEx', 'AlphaEx']);
});
