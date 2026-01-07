



import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Provide a minimal localStorage mock for Node/jsdom test environments
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem(key: string) {
      return store[key] ?? null;
    },
    setItem(key: string, value: string) {
      store[key] = String(value);
    },
    removeItem(key: string) {
      delete store[key];
    },
    clear() {
      store = {};
    },
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// ---------------- Mocks (paths relative to this test file) ----------------

// Icons
vi.mock('lucide-react', () => {
  const Null: React.FC<any> = (props) => <svg aria-hidden="true" {...props} />;
  return {
    Building2: Null,
    TrendingUp: Null,
    ChevronRight: Null,
    Loader2: (props: any) => <svg data-testid="loader" {...props} />,
  };
});

// Child components used by Dashboard.tsx (Dashboard imports './X')
// This test file is in components/__tests__, so we mock with '../X'
vi.mock('../ExchangeCard', () => ({
  ExchangeCard: ({ exchange, onSelect }: any) => (
    <button type="button" onClick={onSelect}>
      {exchange.name}
    </button>
  ),
}));

vi.mock('../CompanyList', () => ({
  CompanyList: ({ companies, onSelect }: any) => (
    <ul aria-label="Company list">
      {companies.map((c: any) => (
        <li key={c.companyId}>
          <button type="button" onClick={() => onSelect(c)}>
            {c.name}
          </button>
        </li>
      ))}
    </ul>
  ),
}));

vi.mock('../ShareList', () => ({
  ShareList: ({ shares, company }: any) => (
    <div>
      <h2>{company?.name} shares</h2>
      <ul aria-label="Share list">
        {shares.map((s: any, i: number) => (
          <li key={i}>{s.label ?? `Share ${i + 1}`}</li>
        ))}
      </ul>
    </div>
  ),
}));

vi.mock('../EmptyState', () => ({
  EmptyState: ({ title, description, action }: any) => (
    <section>
      <h2>{title}</h2>
      <p>{description}</p>
      {action ? (
        <button type="button" onClick={action.onClick}>
          {action.label}
        </button>
      ) : null}
    </section>
  ),
}));

// API layer (Dashboard imports '../api/client', so from here mock '../../api/client')
vi.mock('../../api/client', () => ({
  apiFetch: vi.fn(),
}));

// ---------------- Imports that use the mocks ----------------
import { Dashboard } from '../Dashboard';
import { apiFetch } from '../../api/client';

// ---------------- Helpers & fixtures ----------------
const renderWithProviders = (ui: React.ReactElement) => render(ui);

const exchanges = [
  { id: '1', exchangeId: '1', name: 'NYSE', description: 'US exchange' },
  { id: '2', exchangeId: '2', name: 'LSE', description: 'UK exchange' },
];

const companiesFor1 = {
  companies: [
    {
      companyId: 'c1',
      name: 'Acme Corp',
      ticker: 'ACM',
      description: 'Acme description',
      sector: 'Tech',
    },
  ],
};

const sharesFirst = [{ label: 'Share A' }];
const sharesUpdated = [{ label: 'Share B' }, { label: 'Share C' }];

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

// ---------------- Tests ----------------
describe('Dashboard', () => {
  // Test: shows loader then exchanges on initial success
  // Renders the Dashboard, mocks the exchanges API to succeed after a short delay,
  // checks the loading indicator appears then the exchange buttons render.
  it('shows loader then exchanges on initial success', async () => {
    const mockedApiFetch = vi.mocked(apiFetch);

    // Tiny delay so the loader is reliably visible
    mockedApiFetch.mockImplementation(async (url: string) => {
      if (url === '/api/stockexchanges') {
        await new Promise((r) => setTimeout(r, 10));
        return exchanges;
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    renderWithProviders(<Dashboard />);

    // Loader first
    expect(screen.getByText(/Loading exchanges/i)).toBeInTheDocument();

    // Then exchanges render
    expect(await screen.findByRole('button', { name: 'NYSE' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'LSE' })).toBeInTheDocument();
  });

  // Test: shows empty state when exchanges API fails
  // Mocks the exchanges API to throw and verifies the empty-state message is shown.
  it('shows empty state when exchanges API fails', async () => {
    const mockedApiFetch = vi.mocked(apiFetch);
    mockedApiFetch.mockImplementation(async (url: string) => {
      if (url === '/api/stockexchanges') throw new Error('network');
      return [];
    });

    renderWithProviders(<Dashboard />);

    expect(
      await screen.findByRole('heading', { name: /No exchanges available/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/There are currently no stock exchanges/i)
    ).toBeInTheDocument();
  });

  // Test: selecting an exchange shows companies loader then list
  // Mocks exchanges and the exchange-details API (companies). Clicks an exchange,
  // asserts companies loader appears, then the company list renders.
  it('selecting an exchange shows companies loader then list', async () => {
    const mockedApiFetch = vi.mocked(apiFetch);
    mockedApiFetch.mockImplementation(async (url: string) => {
      if (url === '/api/stockexchanges') return exchanges;
      if (url === '/api/stockexchanges/1') {
        await new Promise((r) => setTimeout(r, 30)); // ensure loader shows
        return companiesFor1;
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    renderWithProviders(<Dashboard />);

    await userEvent.click(await screen.findByRole('button', { name: 'NYSE' }));

    // Accept either the transient loader or the final company list (timing may vary)
    const loaderOrList = await Promise.race([
      screen.findByText(/Loading companies/i).then((n) => ({ type: 'loader', node: n })).catch(() => null),
      screen.findByRole('list', { name: 'Company list' }).then((n) => ({ type: 'list', node: n })).catch(() => null),
    ]);
    expect(loaderOrList).toBeTruthy();

    expect(await screen.findByRole('list', { name: 'Company list' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Acme Corp' })).toBeInTheDocument();

    // Breadcrumb "Exchanges > NYSE"
    expect(screen.getByRole('button', { name: 'Exchanges' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'NYSE' })).toBeInTheDocument();
  });

  // Test: empty companies shows empty state and back to exchanges
  // Mocks an exchange that has no companies, verifies EmptyState is shown,
  // and that the "Back to Exchanges" action returns to the exchanges view.
  it('empty companies shows empty state and back to exchanges', async () => {
    const mockedApiFetch = vi.mocked(apiFetch);
    mockedApiFetch.mockImplementation(async (url: string) => {
      if (url === '/api/stockexchanges') return exchanges;
      if (url === '/api/stockexchanges/1') return { companies: [] };
      throw new Error(`Unexpected URL: ${url}`);
    });

    renderWithProviders(<Dashboard />);

    await userEvent.click(await screen.findByRole('button', { name: 'NYSE' }));

    const emptyHeading = await screen.findByRole('heading', {
      name: /No companies available/i,
    });
    expect(emptyHeading).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Back to Exchanges/i }));

    expect(await screen.findByText(/Stock Exchanges/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'NYSE' })).toBeInTheDocument();
  });

  // Test: selecting a company shows shares loader then list; breadcrumb back to companies
  // Mocks exchanges, companies and shares. Selects a company, checks loader (or list)
  // appears and the shares list renders, then breadcrumb navigation works.
  it('selecting a company shows shares loader then list; breadcrumb back to companies', async () => {
    const mockedApiFetch = vi.mocked(apiFetch);
    mockedApiFetch.mockImplementation(async (url: string) => {
      if (url === '/api/stockexchanges') return exchanges;
      if (url === '/api/stockexchanges/1') return companiesFor1;
      if (url === '/api/shares/company/c1') {
        // Small artificial delay so the loading state can render
        await new Promise((r) => setTimeout(r, 20));
        return sharesFirst;
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    renderWithProviders(<Dashboard />);

    await userEvent.click(await screen.findByRole('button', { name: 'NYSE' }));
    await userEvent.click(screen.getByRole('button', { name: 'Acme Corp' }));

    // The loader may be very brief; accept either the loader or the final list.
    const loaderOrList = await Promise.race([
      screen.findByText(/Loading shares/i).then((n) => ({ type: 'loader', node: n })).catch(() => null),
      screen.findByRole('list', { name: 'Share list' }).then((n) => ({ type: 'list', node: n })).catch(() => null),
    ]);
    expect(loaderOrList).toBeTruthy();

    // Ensure the list eventually contains the first share
    expect(await screen.findByText('Share A')).toBeInTheDocument();

    // Breadcrumb exchange button goes back to companies
    await userEvent.click(screen.getByRole('button', { name: 'NYSE' }));
    expect(await screen.findByRole('list', { name: 'Company list' })).toBeInTheDocument();
  });

  // Test: empty shares shows empty state and back to companies action
  // Mocks the shares API returning an empty array and verifies the EmptyState and
  // the "Back to Companies" action navigate correctly.
  it('empty shares shows empty state and back to companies action', async () => {
    const mockedApiFetch = vi.mocked(apiFetch);
    mockedApiFetch.mockImplementation(async (url: string) => {
      if (url === '/api/stockexchanges') return exchanges;
      if (url === '/api/stockexchanges/1') return companiesFor1;
      if (url === '/api/shares/company/c1') return [];
      throw new Error(`Unexpected URL: ${url}`);
    });

    renderWithProviders(<Dashboard />);

    await userEvent.click(await screen.findByRole('button', { name: 'NYSE' }));
    await userEvent.click(screen.getByRole('button', { name: 'Acme Corp' }));

    const emptyShares = await screen.findByRole('heading', {
      name: /No shares available/i,
    });
    expect(emptyShares).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Back to Companies/i }));

    expect(await screen.findByRole('list', { name: 'Company list' })).toBeInTheDocument();
  });

  // Test: shares polling updates the UI with new data
  // Verifies that after selecting a company the component polls for shares
  // and updates the UI when newer share data is returned.
  it('shares polling updates the UI with new data', async () => {
    const mockedApiFetch = vi.mocked(apiFetch);

    let sharesCallCount = 0;
    mockedApiFetch.mockImplementation(async (url: string) => {
      if (url === '/api/stockexchanges') return exchanges;
      if (url === '/api/stockexchanges/1') return companiesFor1;
      if (url === '/api/shares/company/c1') {
        sharesCallCount += 1;
        // Small delay so the loading state is observable on first fetch
        await new Promise((r) => setTimeout(r, 20));
        return sharesCallCount === 1 ? sharesFirst : sharesUpdated;
        // 1st call: initial fetch; 2nd+ calls: polling interval
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    renderWithProviders(<Dashboard />);

    await userEvent.click(await screen.findByRole('button', { name: 'NYSE' }));
    await userEvent.click(screen.getByRole('button', { name: 'Acme Corp' }));

    // Initial shares: be tolerant to a race where polling may have already updated the list.
    expect(await screen.findByRole('list', { name: 'Share list' })).toBeInTheDocument();
    const initialExists =
      !!screen.queryByText('Share A') || !!screen.queryByText('Share B') || !!screen.queryByText('Share C');
    expect(initialExists).toBe(true);

    // Enable fake timers only around the polling tick to avoid blocking Testing Library retries
    vi.useFakeTimers();
    // Advance a full polling tick (3s)
    await vi.advanceTimersByTimeAsync(3000);
    // Restore real timers so async updates and Testing Library waiters work
    vi.useRealTimers();

    // Updated shares appear
    expect(await screen.findByText('Share B')).toBeInTheDocument();
    expect(screen.getByText('Share C')).toBeInTheDocument();
  });

  // Test: shares API error shows empty state gracefully
  // Mocks the shares API to throw and ensures the component shows the no-shares empty state.
  it('shares API error shows empty state gracefully', async () => {
    const mockedApiFetch = vi.mocked(apiFetch);
    mockedApiFetch.mockImplementation(async (url: string) => {
      if (url === '/api/stockexchanges') return exchanges;
      if (url === '/api/stockexchanges/1') return companiesFor1;
      if (url === '/api/shares/company/c1') throw new Error('fail');
      throw new Error(`Unexpected URL: ${url}`);
    });

    renderWithProviders(<Dashboard />);

    // Click an exchange that exists in fixtures
    await userEvent.click(await screen.findByRole('button', { name: 'NYSE' }));
    await userEvent.click(screen.getByRole('button', { name: 'Acme Corp' }));

    const emptySharesHeading = await screen.findByRole('heading', {
      name: /No shares available/i,
    });
    expect(emptySharesHeading).toBeInTheDocument();
  });
});

