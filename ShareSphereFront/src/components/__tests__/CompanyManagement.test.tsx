import React from 'react';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

// Mock api client and toast
vi.mock('../../api/client', () => ({ apiFetch: vi.fn() }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { CompanyManagement } from '../../components/admin/CompanyManagement';
import { apiFetch } from '../../api/client';

const mockApiFetch = apiFetch as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetAllMocks();
});

// Helper to read first column company names in render order
const getVisibleCompanyNames = () => {
  const rows = screen.getAllByRole('row');
  const bodyRows = rows.slice(1);
  return bodyRows.map(r => within(r).queryAllByRole('cell')[0].textContent?.trim() ?? '').filter(Boolean);
};

// Basic render: shows table and loads companies from API
test('renders header and company rows after fetching', async () => {
  const apiCompany = {
    companyId: 1,
    name: 'TestCo',
    tickerSymbol: 'TST',
    sector: 'Tech',
    exchangeId: 10,
    stockExchange: { exchangeId: 10, name: 'NYSE', country: 'US', currency: 'USD' },
    shares: [{ shareId: 5, companyId: 1, price: 12.5, availableQuantity: 100, company: null }],
  };

  mockApiFetch.mockImplementation((path: string) => {
    if (path === '/api/stockexchanges') return Promise.resolve([{ exchangeId: 10, name: 'NYSE', country: 'US', currency: 'USD' }]);
    if (path === '/api/companies') return Promise.resolve([apiCompany]);
    return Promise.resolve({});
  });

  render(<CompanyManagement />);

  // wait for component to finish loading and show header and company
  expect(await screen.findByText('Company Management')).toBeInTheDocument();
  expect(await screen.findByText('TestCo')).toBeInTheDocument();
  expect(screen.getByText('TST')).toBeInTheDocument();
  expect(screen.getByText('Tech')).toBeInTheDocument();
  expect(screen.getByText('NYSE')).toBeInTheDocument();
  // price formatted with $ and two decimals
  expect(screen.getByText('$12.50')).toBeInTheDocument();
});

// Opening the Add Company form shows inputs
test('opens Add Company form when clicking Add Company', async () => {
  mockApiFetch.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

  render(<CompanyManagement />);

  // wait for initial load to finish
  await waitFor(() => expect(mockApiFetch).toHaveBeenCalled());

  await userEvent.click(screen.getByRole('button', { name: /Add Company/i }));

  expect(screen.getByText(/Add New Company/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Company Name/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Ticker Symbol/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Stock Exchange/i)).toBeInTheDocument();
});

// Form validation: submitting empty form shows errors
test('validates required fields on submit', async () => {
  mockApiFetch.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

  render(<CompanyManagement />);
  await waitFor(() => expect(mockApiFetch).toHaveBeenCalled());

  await userEvent.click(screen.getByRole('button', { name: /Add Company/i }));
  await userEvent.click(screen.getByRole('button', { name: /Create Company/i }));

  expect(await screen.findByText(/Company name is required/i)).toBeInTheDocument();
  expect(screen.getByText(/Ticker symbol is required/i)).toBeInTheDocument();
  expect(screen.getByText(/Please select an exchange/i)).toBeInTheDocument();
});

// Create flow: posting company and shares then refetch shows new row
test('creates a company and shows it in the table', async () => {
  const apiCompany = {
    companyId: 2,
    name: 'NewCo',
    tickerSymbol: 'NEW',
    sector: 'Finance',
    exchangeId: 20,
    stockExchange: { exchangeId: 20, name: 'LSE', country: 'UK', currency: 'GBP' },
    shares: [{ shareId: 9, companyId: 2, price: 5.0, availableQuantity: 50, company: null }],
  };

  // Sequence: GET /api/stockexchanges, GET /api/companies (initial empty), POST /api/companies (returns new), POST /api/shares, GET /api/companies (with new)
  mockApiFetch
    .mockResolvedValueOnce([{ exchangeId: 20, name: 'LSE', country: 'UK', currency: 'GBP' }]) // GET /api/stockexchanges
    .mockResolvedValueOnce([]) // GET /api/companies initial
    .mockResolvedValueOnce(apiCompany) // POST /api/companies returns created company
    .mockResolvedValueOnce({}) // POST /api/shares
    .mockResolvedValueOnce([apiCompany]); // GET /api/companies after create

  render(<CompanyManagement />);

  // wait initial load
  await waitFor(() => expect(mockApiFetch).toHaveBeenCalled());

  await userEvent.click(screen.getByRole('button', { name: /Add Company/i }));

  await userEvent.type(screen.getByLabelText(/Company Name/i), 'NewCo');
  await userEvent.type(screen.getByLabelText(/Ticker Symbol/i), 'NEW');
  await userEvent.type(screen.getByLabelText(/Sector/i), 'Finance');
  await userEvent.selectOptions(screen.getByLabelText(/Stock Exchange/i), '20');
  await userEvent.type(screen.getByLabelText(/Share Price/i), '5.00');
  await userEvent.type(screen.getByLabelText(/Available Quantity/i), '50');

  await userEvent.click(screen.getByRole('button', { name: /Create Company/i }));

  // after submission, new company should be visible
  expect(await screen.findByText('NewCo')).toBeInTheDocument();
  expect(screen.getByText('NEW')).toBeInTheDocument();
  expect(screen.getByText('LSE')).toBeInTheDocument();
});

// Delete flow: opening confirmation and deleting removes company
test('shows delete confirmation and removes company on confirm', async () => {
  const apiCompany = {
    companyId: 3,
    name: 'DeleteCo',
    tickerSymbol: 'DEL',
    sector: 'Services',
    exchangeId: 30,
    stockExchange: { exchangeId: 30, name: 'TSX', country: 'CA', currency: 'CAD' },
    shares: [{ shareId: 15, companyId: 3, price: 20.0, availableQuantity: 10, company: null }],
  };

  // Sequence: exchanges, initial companies, delete response, companies after delete
  mockApiFetch
    .mockResolvedValueOnce([{ exchangeId: 30, name: 'TSX', country: 'CA', currency: 'CAD' }]) // GET /api/stockexchanges
    .mockResolvedValueOnce([apiCompany]) // GET /api/companies (initial)
    .mockResolvedValueOnce({}) // DELETE /api/companies/:id
    .mockResolvedValueOnce([]); // GET /api/companies (after delete)

  render(<CompanyManagement />);

  await screen.findByText('DeleteCo');

  const delBtn = screen.getByRole('button', { name: /Delete DeleteCo/i });
  await userEvent.click(delBtn);

  // confirmation dialog visible
  expect(screen.getByText(/Delete Company/i)).toBeInTheDocument();
  // confirm
  await userEvent.click(screen.getByRole('button', { name: /Delete$/i }));

  await waitFor(() => expect(screen.queryByText('DeleteCo')).toBeNull());
});

// Sorting: clicking Company Name header toggles sort
test('sorts companies when clicking the Company Name header', async () => {
  const companiesApi = [
    {
      companyId: 1,
      name: 'BetaCo',
      tickerSymbol: 'BET',
      sector: 'X',
      exchangeId: 10,
      stockExchange: { exchangeId: 10, name: 'Ex', country: 'US', currency: 'USD' },
      shares: [{ shareId: 1, companyId: 1, price: 1, availableQuantity: 1, company: null }],
    },
    {
      companyId: 2,
      name: 'AlphaCo',
      tickerSymbol: 'ALP',
      sector: 'Y',
      exchangeId: 10,
      stockExchange: { exchangeId: 10, name: 'Ex', country: 'US', currency: 'USD' },
      shares: [{ shareId: 2, companyId: 2, price: 2, availableQuantity: 2, company: null }],
    },
  ];

  mockApiFetch.mockImplementation((path: string) => {
    if (path === '/api/stockexchanges') return Promise.resolve([{ exchangeId: 10, name: 'Ex', country: 'US', currency: 'USD' }]);
    if (path === '/api/companies') return Promise.resolve(companiesApi);
    return Promise.resolve({});
  });

  render(<CompanyManagement />);

  await screen.findByText('BetaCo');

  // initial order BetaCo, AlphaCo
  expect(getVisibleCompanyNames()).toEqual(['BetaCo', 'AlphaCo']);

  // click to sort asc -> AlphaCo, BetaCo
  await userEvent.click(screen.getByText('Company Name'));
  expect(getVisibleCompanyNames()).toEqual(['AlphaCo', 'BetaCo']);

  // click to sort desc -> BetaCo, AlphaCo
  await userEvent.click(screen.getByText('Company Name'));
  expect(getVisibleCompanyNames()).toEqual(['BetaCo', 'AlphaCo']);
});
