import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock sonner toast with factory-scoped mocks
vi.mock('sonner', () => {
  const success = vi.fn();
  const error = vi.fn();
  return { toast: { success, error } };
});

// Mock react-router navigation and Link
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children }: any) => <span>{children}</span>,
}));

// Mock useAuth register function
const mockRegister = vi.fn();
vi.mock('../AuthContext', () => ({
  useAuth: () => ({ register: mockRegister }),
}));

import { Register } from '../Register';

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

afterEach(() => {
  try { vi.useRealTimers(); } catch {}
});

describe('Register (user-visible behaviour)', () => {
  // Renders the registration form fields and submit button
  it('renders form fields and Create Account button', () => {
    render(<Register />);

    expect(screen.getByLabelText('Username')).toBeTruthy();
    expect(screen.getByLabelText('Display Name')).toBeTruthy();
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByLabelText('Password')).toBeTruthy();
    expect(screen.getByLabelText('Confirm Password')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeTruthy();
  });

  // Shows validation error when username is too short
  it('shows error toast when username is too short', async () => {
    render(<Register />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Username'), 'ab');
    await user.type(screen.getByLabelText('Display Name'), 'Display');
    await user.type(screen.getByLabelText('Email'), 'a@b.com');
    await user.type(screen.getByLabelText('Password'), '123456');
    await user.type(screen.getByLabelText('Confirm Password'), '123456');

    await user.click(screen.getByRole('button', { name: /Create Account/i }));

    const sonner = await import('sonner');
    expect(sonner.toast.error).toHaveBeenCalledWith('Username must be at least 3 characters');
  });

  // Shows validation error when passwords do not match
  it('shows error toast when passwords do not match', async () => {
    render(<Register />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Username'), 'alice');
    await user.type(screen.getByLabelText('Display Name'), 'Alice');
    await user.type(screen.getByLabelText('Email'), 'a@b.com');
    await user.type(screen.getByLabelText('Password'), '123456');
    await user.type(screen.getByLabelText('Confirm Password'), '654321');

    await user.click(screen.getByRole('button', { name: /Create Account/i }));

    const sonner = await import('sonner');
    expect(sonner.toast.error).toHaveBeenCalledWith('Passwords do not match');
  });

  // Successful registration calls register and navigates to home with a success toast
  it('calls register and navigates on successful registration', async () => {
    mockRegister.mockResolvedValueOnce('token');

    render(<Register />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Username'), 'alice');
    await user.type(screen.getByLabelText('Display Name'), 'Alice');
    await user.type(screen.getByLabelText('Email'), 'a@b.com');
    await user.type(screen.getByLabelText('Password'), '123456');
    await user.type(screen.getByLabelText('Confirm Password'), '123456');

    await user.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => expect(mockRegister).toHaveBeenCalledWith('alice', 'Alice', '123456', 'a@b.com'));

    const sonner = await import('sonner');
    expect(sonner.toast.success).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('submits registration even with non-validated email (browser validation not enforced in jsdom)', async () => {
    mockRegister.mockClear();

    render(<Register />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Username'), 'bob');
    await user.type(screen.getByLabelText('Display Name'), 'Bob');
    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Password'), '123456');
    await user.type(screen.getByLabelText('Confirm Password'), '123456');

    await user.click(screen.getByRole('button', { name: /Create Account/i }));

    // In jsdom, native browser email validation isn't enforced; ensure no client-side validation error was shown
    await screen.findByRole('button', { name: /Create Account/i });
    const sonner = await import('sonner');
    expect(sonner.toast.error).not.toHaveBeenCalled();
  });
});
