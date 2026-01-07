import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock sonner toast to avoid side effects. Create mocks inside the factory so they are scoped correctly.
vi.mock('sonner', () => {
  const success = vi.fn();
  const error = vi.fn();
  return { toast: { success, error } };
});

// We'll mock react-router-dom's useNavigate and Link
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children }: any) => <span>{children}</span>,
}));

// Prepare a mock login function to be injected via useAuth
const mockLogin = vi.fn();
vi.mock('../AuthContext', () => ({
  useAuth: () => ({ login: mockLogin, user: null }),
}));

import { Login } from '../Login';

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

afterEach(() => {
  try {
    vi.useRealTimers();
  } catch {}
});

describe('Login (user-visible behaviour)', () => {
  // Shows username/password inputs and a Login button
  it('renders username, password fields and Login button', () => {
    render(<Login />);

    expect(screen.getByPlaceholderText('Username')).toBeTruthy();
    expect(screen.getByPlaceholderText('Password')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Login/i })).toBeTruthy();
  });

  // On successful login for an admin user, navigates to /admin
  it('navigates to /admin after successful admin login', async () => {
    // make mockLogin resolve and set localStorage user as admin
    mockLogin.mockImplementation(async (username: string, password: string) => {
      localStorage.setItem('user', JSON.stringify({ isAdmin: true, displayName: 'Admin' }));
      return Promise.resolve('token');
    });

    render(<Login />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('Username'), 'admin');
    await user.type(screen.getByPlaceholderText('Password'), 'pw');
    await user.click(screen.getByRole('button', { name: /Login/i }));

    // Wait for the component to perform navigation after login
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin'));

    // import the mocked module to assert the toast call
    const sonner = await import('sonner');
    expect(sonner.toast.success).toHaveBeenCalled();
  });

  // If login fails, shows an error toast and button returns to normal
  it('shows error toast on failed login', async () => {
    mockLogin.mockRejectedValue(new Error('Bad credentials'));

    render(<Login />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('Username'), 'someone');
    await user.type(screen.getByPlaceholderText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: /Login/i }));

    // Wait a tick for the promise rejection to be handled
    expect(await screen.findByRole('button', { name: /Login/i })).toBeTruthy();
    const sonner = await import('sonner');
    expect(sonner.toast.error).toHaveBeenCalled();
  });
});
