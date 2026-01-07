import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';

import { ConfirmDialog } from '../ConfirmDialog';

afterEach(() => {
  vi.clearAllMocks();
});

describe('ConfirmDialog (user-visible behaviour)', () => {
  // Renders title, message and both buttons with provided labels
  it('renders title, message and action buttons', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        title="Delete Item"
        message="Are you sure you want to delete this item?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText('Delete Item')).toBeTruthy();
    expect(screen.getByText('Are you sure you want to delete this item?')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Delete/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeTruthy();
  });

  // Clicking the confirm and cancel buttons calls the appropriate handlers
  it('calls onConfirm and onCancel when buttons are clicked', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const user = userEvent.setup();

    render(
      <ConfirmDialog
        title="Confirm"
        message="Proceed?"
        confirmLabel="Yes"
        cancelLabel="No"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    const confirmBtn = screen.getByRole('button', { name: /Yes/i });
    const cancelBtn = screen.getByRole('button', { name: /No/i });

    await user.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);

    await user.click(cancelBtn);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  // Danger variant shows the danger styles (red confirm button) and an icon
  it('renders danger variant with red confirm button and icon', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    const { container } = render(
      <ConfirmDialog
        title="Delete forever"
        message="This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={onConfirm}
        onCancel={onCancel}
        variant="danger"
      />
    );

    const confirmBtn = screen.getByRole('button', { name: /Delete/i });

    // The confirm button should include the danger background class
    expect(confirmBtn.className).toContain('bg-red-600');

    // The alert icon is rendered as an svg element in the dialog
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  // Pressing Escape currently does not trigger onCancel (no Escape handling in component)
  it('does not call onCancel when Escape is pressed (no Escape handling)', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const user = userEvent.setup();

    render(
      <ConfirmDialog
        title="Close Test"
        message="Close with escape"
        confirmLabel="Yes"
        cancelLabel="No"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    // dialog should exist; send Escape key
    const dialog = screen.queryByRole('dialog') || screen.getByText(/Close Test/).closest('div');
    if (dialog) dialog.focus?.();
    await user.keyboard('{Escape}');

    // Component does not register Escape handlers, so onCancel should not be called
    expect(onCancel).toHaveBeenCalledTimes(0);
  });
});
