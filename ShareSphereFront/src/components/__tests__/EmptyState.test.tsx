import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';

import { EmptyState } from '../EmptyState';

afterEach(() => {
  vi.clearAllMocks();
});

describe('EmptyState (user-visible behaviour)', () => {
  // Renders title, description and icon when no action is provided
  it('shows title, description and icon without an action button', () => {
    const MockIcon = (props: any) => (
      <svg role="img" aria-label="Mock Icon" {...props} />
    );

    render(
      <EmptyState
        icon={MockIcon as any}
        title="No items"
        description="There are no items to show."
      />
    );

    // Title and description are visible
    expect(screen.getByText('No items')).toBeTruthy();
    expect(screen.getByText('There are no items to show.')).toBeTruthy();

    // Icon is rendered and accessible
    expect(screen.getByRole('img', { name: /mock icon/i })).toBeTruthy();

    // No action button should be present
    expect(screen.queryByRole('button')).toBeNull();
  });

  // Renders an action button and calls handler when clicked
  it('renders action button and calls onClick when clicked', async () => {
    const MockIcon = (props: any) => (
      <svg role="img" aria-label="Mock Icon" {...props} />
    );

    const onClick = vi.fn();
    render(
      <EmptyState
        icon={MockIcon as any}
        title="Empty"
        description="Nothing here"
        action={{ label: 'Create', onClick }}
      />
    );

    const user = userEvent.setup();
    const btn = screen.getByRole('button', { name: /Create/i });
    await user.click(btn);

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
