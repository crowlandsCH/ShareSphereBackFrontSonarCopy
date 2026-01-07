import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';

// Mock the api/auth helpers used by AuthContext
const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockGetToken = vi.fn();
const mockRemoveToken = vi.fn();

vi.mock('../../api/auth', () => ({
  login: (...args: any[]) => mockLogin(...args),
  register: (...args: any[]) => mockRegister(...args),
  getToken: () => mockGetToken(),
  removeToken: () => mockRemoveToken(),
}));

// Mock jwt-decode module used by the implementation
vi.mock('jwt-decode', () => ({
  jwtDecode: (token: string) => {
    // Default mock - tests override by spying on this module if needed
    return { sub: '1', unique_name: 'user1', displayName: 'User One', role: ['user'] };
  },
}));

import { AuthProvider, useAuth } from '../AuthContext';

function TestConsumer() {
  const { user, login, register, logout, isAuthenticated, isLoading } = useAuth();

  return (
    <div>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div>
          <div>{isAuthenticated ? `Hello, ${user?.displayName}` : 'Not authenticated'}</div>
          <button onClick={() => login('alice', 'password')} aria-label="login">
            Login
          </button>
          <button onClick={() => register('bob', 'Bob', 'pw', 'bob@example.com')} aria-label="register">
            Register
          </button>
          <button onClick={() => logout()} aria-label="logout">
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('AuthContext (user-visible behaviour)', () => {
  // Shows loading then a not-authenticated message when no token exists
  it('shows not authenticated when there is no stored token', async () => {
    mockGetToken.mockReturnValue(null);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // After effect runs, we expect the "Not authenticated" text
    expect(await screen.findByText('Not authenticated')).toBeTruthy();
  });

  // After a successful login, the consumer shows the user display name
  it('updates UI after login and stores token', async () => {
    // Mock no token on init
    mockGetToken.mockReturnValue(null);

    // Mock login to return a fake token
    mockLogin.mockResolvedValue('fake.token.value');

    // Spy on jwt-decode to return a decoded payload for the fake token
    const jwt = await import('jwt-decode');
    vi.spyOn(jwt, 'jwtDecode').mockImplementation((t: string) => ({
      sub: '42',
      unique_name: 'alice',
      displayName: 'Alice Example',
      role: ['user'],
    }));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    const user = userEvent.setup();
    const loginBtn = screen.getByRole('button', { name: /Login/i });
    await user.click(loginBtn);

    // After login, the consumer should show the display name
    expect(await screen.findByText('Hello, Alice Example')).toBeTruthy();

    // Token and user should be saved to localStorage
    expect(localStorage.getItem('auth_token')).toBe('fake.token.value');
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    expect(storedUser?.displayName).toBe('Alice Example');
  });

  // After logout the UI should go back to not authenticated and token removed
  it('clears user after logout', async () => {
    // Start with a logged-in token restored from getToken
    mockGetToken.mockReturnValue('restored.token');

    // Make jwt-decode return a user for the restored token
    const jwt = await import('jwt-decode');
    vi.spyOn(jwt, 'jwtDecode').mockImplementation(() => ({
      sub: '99',
      unique_name: 'carol',
      displayName: 'Carol',
      role: ['user'],
    }));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // Initially should show the restored user
    expect(await screen.findByText('Hello, Carol')).toBeTruthy();

    const user = userEvent.setup();
    const logoutBtn = screen.getByRole('button', { name: /Logout/i });
    await user.click(logoutBtn);

    // After logout, the UI should show not authenticated
    expect(await screen.findByText('Not authenticated')).toBeTruthy();
    expect(localStorage.getItem('auth_token')).toBeNull();
  });
});
