'use client';

import { useEffect, useRef, type ReactNode, type RefObject } from 'react';

const DEFAULT_DIALOG_CLASS_NAME = 'fixed inset-0 m-auto p-0 bg-transparent backdrop:bg-black/50';
const DEFAULT_FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface SharedDialogProps {
  children: ReactNode;
  ariaLabelledby: string;
  ariaDescribedby?: string;
  role?: 'dialog' | 'alertdialog';
  className?: string;
  dataTestId?: string;
  onCancel?: () => void;
  preventEscapeClose?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  restoreFocusOnUnmount?: boolean;
  focusableSelector?: string;
}

export function SharedDialog({
  children,
  ariaLabelledby,
  ariaDescribedby,
  role = 'dialog',
  className = DEFAULT_DIALOG_CLASS_NAME,
  dataTestId,
  onCancel,
  preventEscapeClose,
  initialFocusRef,
  restoreFocusOnUnmount = false,
  focusableSelector = DEFAULT_FOCUSABLE_SELECTOR,
}: SharedDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<Element | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    triggerRef.current = document.activeElement;

    if (!dialog.open) {
      dialog.showModal();
    }

    initialFocusRef?.current?.focus();

    return () => {
      if (dialog.open) {
        dialog.close();
      }

      if (restoreFocusOnUnmount && triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus();
      }

      triggerRef.current = null;
    };
  }, [initialFocusRef, restoreFocusOnUnmount]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const shouldPrevent = preventEscapeClose ?? Boolean(onCancel);
    const handleCancel = (event: Event) => {
      if (shouldPrevent) {
        event.preventDefault();
      }

      onCancel?.();
    };

    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onCancel, preventEscapeClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = dialog.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
        return;
      }

      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    dialog.addEventListener('keydown', handleKeyDown);
    return () => dialog.removeEventListener('keydown', handleKeyDown);
  }, [focusableSelector]);

  return (
    <dialog
      ref={dialogRef}
      role={role}
      aria-modal="true"
      aria-labelledby={ariaLabelledby}
      aria-describedby={ariaDescribedby}
      className={className}
      data-testid={dataTestId}
    >
      {children}
    </dialog>
  );
}
