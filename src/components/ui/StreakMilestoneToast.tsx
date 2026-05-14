'use client';

import { useEffect } from 'react';

interface StreakMilestoneToastProps {
  streak: number;
  onDismiss: () => void;
  /** Auto-dismiss delay in ms (default: 2000) */
  dismissDelay?: number;
}

/**
 * Transient pill toast for streak milestones (3, 5, 7 correct in a row).
 *
 * Purely visual — no aria-live to avoid collision with exercise-level
 * feedback announcements. Screen readers already announce correctness.
 */
export function StreakMilestoneToast({
  streak,
  onDismiss,
  dismissDelay = 2000,
}: StreakMilestoneToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, dismissDelay);
    return () => clearTimeout(timer);
  }, [onDismiss, dismissDelay]);

  return (
    <div
      className="fixed top-4 left-1/2 z-50 motion-safe:animate-slide-down rounded-full bg-amber-100 px-4 py-2 shadow-md border border-amber-200"
      data-testid="streak-milestone-toast"
    >
      <span className="text-sm font-semibold text-amber-700">
        {streak} pa rad!
      </span>
    </div>
  );
}
