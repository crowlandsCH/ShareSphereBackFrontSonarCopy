import React from 'react';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

// Mock the api client and toast to control network responses and suppress toasts
vi.mock('../../api/client', () => ({ apiFetch: vi.fn() }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { BrokerManagement } from '../admin/BrokerManagement';
import { apiFetch } from '../../api/client';

const mockApiFetch = apiFetch as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetAllMocks();
});

// Simple helper to get visible broker names in table order (skips header row)
const getVisibleBrokerNames = () => {
  const rows = screen.getAllByRole('row');
  // remove header row
  const bodyRows = rows.slice(1);
  return bodyRows
    .map((r) => {
      const cells = within(r).queryAllByRole('cell');
      return cells.length ? cells[0].textContent?.trim() ?? '' : '';
    })
    .filter(Boolean);
};

// Test: empty state and opening the Add Broker form
test('shows empty state and opens Add Broker form', async () => {
  mockApiFetch.mockResolvedValueOnce([]); // GET /api/brokers

  render(<BrokerManagement />);

  // Wait for the empty-state message to appear
  await screen.findByText(/No brokers found/i);

  // Click Add Broker and assert the form opens
  const addButton = screen.getByRole('button', { name: /Add Broker/i });
  await userEvent.click(addButton);

  expect(screen.getByText(/Add New Broker/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Broker Name/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/License Number/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Contact Email/i)).toBeInTheDocument();
});

// Test: form validation shows errors for empty submission
test('validates form fields and shows errors when submitting empty form', async () => {
  mockApiFetch.mockResolvedValueOnce([]); // GET /api/brokers

  render(<BrokerManagement />);

  await screen.findByText(/No brokers found/i);

  await userEvent.click(screen.getByRole('button', { name: /Add Broker/i }));

  // Submit empty form
  await userEvent.click(screen.getByRole('button', { name: /Create Broker/i }));

  // Validation errors should show up
  expect(await screen.findByText(/Broker name is required/i)).toBeInTheDocument();
  expect(screen.getByText(/License Number is required/i)).toBeInTheDocument();
  expect(screen.getByText(/Contact email is required/i)).toBeInTheDocument();
});

// Test: creating a broker calls POST and renders new broker in the table
test('creates a new broker and shows it in the table', async () => {
  const initial: any[] = [];
  const newBroker = { brokerId: 101, name: 'New Broker', licenseNumber: 'LIC-101', email: 'new@broker.com' };

  mockApiFetch.mockImplementation((path: string, options?: any) => {
    if (!options || !options.method) {
      // GET
      return Promise.resolve(initial);
    }
    if (options.method === 'POST') {
      return Promise.resolve(newBroker);
    }
    return Promise.resolve({});
  });

  render(<BrokerManagement />);

  await screen.findByText(/No brokers found/i);

  await userEvent.click(screen.getByRole('button', { name: /Add Broker/i }));

  await userEvent.type(screen.getByLabelText(/Broker Name/i), newBroker.name);
  await userEvent.type(screen.getByLabelText(/License Number/i), newBroker.licenseNumber);
  await userEvent.type(screen.getByLabelText(/Contact Email/i), newBroker.email);

  await userEvent.click(screen.getByRole('button', { name: /Create Broker/i }));

  // New broker should appear in the table
  expect(await screen.findByText(newBroker.name)).toBeInTheDocument();
  expect(screen.getByText(newBroker.licenseNumber)).toBeInTheDocument();
  expect(screen.getByText(newBroker.email)).toBeInTheDocument();
});

// Test: editing a broker updates the table
test('edits an existing broker and updates the table', async () => {
  const existing = { brokerId: 1, name: 'Alpha Broker', licenseNumber: 'LIC-A', email: 'alpha@b.com' };
  mockApiFetch.mockImplementation((path: string, options?: any) => {
    if (!options || !options.method) {
      // GET
      return Promise.resolve([existing]);
    }
    if (options.method === 'PUT') {
      return Promise.resolve({});
    }
    return Promise.resolve({});
  });

  render(<BrokerManagement />);

  await screen.findByText(existing.name);

  // Click edit button for the broker
  const editBtn = screen.getByRole('button', { name: new RegExp(`Edit ${existing.name}`) });
  await userEvent.click(editBtn);

  // Form should be populated
  expect(screen.getByDisplayValue(existing.name)).toBeInTheDocument();

  // Change name and submit
  const newName = 'Alpha Broker Updated';
  await userEvent.clear(screen.getByLabelText(/Broker Name/i));
  await userEvent.type(screen.getByLabelText(/Broker Name/i), newName);
  await userEvent.click(screen.getByRole('button', { name: /Update Broker/i }));

  // Updated name should be visible
  expect(await screen.findByText(newName)).toBeInTheDocument();
});

// Test: deleting a broker removes it from the table (via confirmation)
test('shows delete confirmation and removes broker on confirm', async () => {
  const existing = { brokerId: 2, name: 'DeleteMe', licenseNumber: 'LIC-D', email: 'del@b.com' };

  mockApiFetch.mockImplementation((path: string, options?: any) => {
    if (!options || !options.method) {
      // GET
      return Promise.resolve([existing]);
    }
    if (options.method === 'DELETE') {
      return Promise.resolve({});
    }
    return Promise.resolve({});
  });

  render(<BrokerManagement />);

  await screen.findByText(existing.name);

  // Click Delete button
  const delBtn = screen.getByRole('button', { name: new RegExp(`Delete ${existing.name}`) });
  await userEvent.click(delBtn);

  // Confirmation dialog should appear
  expect(screen.getByText(/Delete Broker/i)).toBeInTheDocument();
  // Ensure the confirmation dialog paragraph contains the broker name
  expect(
    screen.getByText((content, element) => element?.tagName === 'P' && /DeleteMe/.test(content))
  ).toBeInTheDocument();

  // Confirm deletion
  await userEvent.click(screen.getByRole('button', { name: /Delete$/i }));

  // The broker row should be removed
  await waitFor(() => expect(screen.queryByText(existing.name)).toBeNull());
});

// Test: clicking column header sorts brokers by name
test('sorts brokers when clicking the Name header', async () => {
  const brokers = [
    { brokerId: 1, name: 'Beta', licenseNumber: 'L1', email: 'b@x.com' },
    { brokerId: 2, name: 'Alpha', licenseNumber: 'L2', email: 'a@x.com' },
  ];

  mockApiFetch.mockResolvedValueOnce(brokers);

  render(<BrokerManagement />);

  await screen.findByText('Beta');

  // initial order: Beta, Alpha
  let names = getVisibleBrokerNames();
  expect(names).toEqual(['Beta', 'Alpha']);

  // Click Name header to sort ascending -> Alpha, Beta
  await userEvent.click(screen.getByText('Name'));
  names = getVisibleBrokerNames();
  expect(names).toEqual(['Alpha', 'Beta']);

  // Click Name header again to sort descending -> Beta, Alpha
  await userEvent.click(screen.getByText('Name'));
  names = getVisibleBrokerNames();
  expect(names).toEqual(['Beta', 'Alpha']);
});
