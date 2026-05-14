// @vitest-environment happy-dom
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { createRef, type RefObject } from 'react';
import { SharedDialog } from './SharedDialog';

type FocusableElement = HTMLButtonElement | HTMLAnchorElement;

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function showModal() {
    this.setAttribute('open', '');
    (this as HTMLDialogElement & { open: boolean }).open = true;
  });

  HTMLDialogElement.prototype.close = vi.fn(function close() {
    this.removeAttribute('open');
    (this as HTMLDialogElement & { open: boolean }).open = false;
  });
});

describe('SharedDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  function renderDialog(props?: {
    onCancel?: () => void;
    initialFocusRef?: RefObject<FocusableElement | null>;
    restoreFocusOnUnmount?: boolean;
    role?: 'dialog' | 'alertdialog';
  }) {
    const firstButtonRef = createRef<HTMLButtonElement>();
    const result = render(
      <SharedDialog
        ariaLabelledby="dialog-title"
        onCancel={props?.onCancel}
        initialFocusRef={props?.initialFocusRef ?? firstButtonRef}
        restoreFocusOnUnmount={props?.restoreFocusOnUnmount}
        role={props?.role}
      >
        <h2 id="dialog-title">Dialog title</h2>
        <button ref={firstButtonRef}>First</button>
        <button>Last</button>
      </SharedDialog>
    );

    return { ...result, firstButtonRef };
  }

  it('opens native dialog on mount', () => {
    renderDialog();

    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('dialog')).toHaveAttribute('open');
  });

  it('prevents native cancel close and calls onCancel callback', () => {
    const onCancel = vi.fn();
    renderDialog({ onCancel });

    const dialog = screen.getByRole('dialog');
    const cancelEvent = new Event('cancel', { bubbles: true, cancelable: true });
    fireEvent(dialog, cancelEvent);

    expect(cancelEvent.defaultPrevented).toBe(true);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('traps tab focus within focusable content', () => {
    const { firstButtonRef } = renderDialog();
    const dialog = screen.getByRole('dialog');
    const buttons = screen.getAllByRole('button');
    const firstButton = firstButtonRef.current!;
    const lastButton = buttons[1];

    firstButton.focus();
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(lastButton);

    lastButton.focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement).toBe(firstButton);
  });

  it('restores focus to trigger element when unmounted', () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'open';
    document.body.appendChild(trigger);
    trigger.focus();

    const { unmount } = renderDialog({ restoreFocusOnUnmount: true });
    unmount();

    expect(document.activeElement).toBe(trigger);
  });

  it('supports alertdialog role when requested', () => {
    renderDialog({ role: 'alertdialog' });
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });
});
