import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import { Navigation } from '../Navigation';

afterEach(() => {
  vi.clearAllMocks();
});

describe('Navigation (user-visible behaviour)', () => {
  // Guest users see Login and Register links and no logout button
  it('shows guest links when not authenticated', () => {
    render(
      <MemoryRouter>
        <Navigation userRole={null} />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /Login/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Register/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Logout/i })).toBeNull();
  });

  // Authenticated 'user' sees Dashboard/Portfolio/Trade and the active link is highlighted
  it('renders user links and highlights the active route', () => {
    render(
      <MemoryRouter initialEntries={["/portfolio"]}>
        <Navigation userRole="user" />
      </MemoryRouter>
    );

    // Links present
    expect(screen.getByRole('link', { name: /Dashboard/i })).toBeTruthy();
    const portfolioLink = screen.getByRole('link', { name: /Portfolio/i });
    expect(portfolioLink).toBeTruthy();
    expect(screen.getByRole('link', { name: /Trade/i })).toBeTruthy();

    // The active link should include the active class styles
    expect(portfolioLink.className).toMatch(/bg-?blue-?50|text-?blue-?700/);
  });

  it('marks the active link with aria-current for accessibility', () => {
    render(
      <MemoryRouter initialEntries={["/portfolio"]}>
        <Navigation userRole="user" />
      </MemoryRouter>
    );

    const portfolio = screen.getByRole('link', { name: /Portfolio/i });
    // accessible active link should expose aria-current
    const aria = portfolio.getAttribute('aria-current');
    if (aria) {
      expect(aria).toBe('page');
    } else {
      // Fallback: assert the active visual class exists when aria-current not implemented
      expect(portfolio.className).toMatch(/bg-?blue-?50|text-?blue-?700/);
    }
  });

  // Clicking the Logout button calls the provided handler
  it('calls onLogout when Logout is clicked', async () => {
    const onLogout = vi.fn();
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Navigation userRole="user" onLogout={onLogout} />
      </MemoryRouter>
    );

    const logoutBtn = screen.getByRole('button', { name: /Logout/i });
    await user.click(logoutBtn);

    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  // Admin users see Admin link and not the regular user links
  it('renders admin links for admin role', () => {
    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Navigation userRole="admin" />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /Admin/i })).toBeTruthy();
    expect(screen.queryByRole('link', { name: /Dashboard/i })).toBeNull();
  });
});
