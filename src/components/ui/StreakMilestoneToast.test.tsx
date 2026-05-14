// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { StreakMilestoneToast } from './StreakMilestoneToast';

describe('StreakMilestoneToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders streak count', () => {
    render(<StreakMilestoneToast streak={3} onDismiss={vi.fn()} />);
    expect(screen.getByText(/3 pa rad!/)).toBeInTheDocument();
  });

  it('renders different streak values', () => {
    const { rerender } = render(
      <StreakMilestoneToast streak={5} onDismiss={vi.fn()} />
    );
    expect(screen.getByText(/5 pa rad!/)).toBeInTheDocument();

    rerender(<StreakMilestoneToast streak={7} onDismiss={vi.fn()} />);
    expect(screen.getByText(/7 pa rad!/)).toBeInTheDocument();
  });

  it('auto-dismisses after default delay (2s)', () => {
    const onDismiss = vi.fn();
    render(<StreakMilestoneToast streak={3} onDismiss={onDismiss} />);

    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('auto-dismisses after custom delay', () => {
    const onDismiss = vi.fn();
    render(
      <StreakMilestoneToast streak={5} onDismiss={onDismiss} dismissDelay={1000} />
    );

    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('has no aria-live attribute (purely visual)', () => {
    render(<StreakMilestoneToast streak={3} onDismiss={vi.fn()} />);
    const toast = screen.getByTestId('streak-milestone-toast');
    expect(toast).not.toHaveAttribute('aria-live');
    expect(toast).not.toHaveAttribute('role');
  });
});
