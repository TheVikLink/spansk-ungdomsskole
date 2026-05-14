// src/components/ui/MilestoneToast.tsx
'use client';

import { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useReducedMotion } from '@/lib/design-system/animations/useReducedMotion';
import type { AchievementEvent } from '@/lib/core/journey';

interface MilestoneToastProps {
  event: AchievementEvent;
  onClose: () => void;
  /** Auto-dismiss delay in ms (default: 4000) */
  dismissDelay?: number;
}

/**
 * Generate display content from achievement event.
 */
function getEventContent(event: AchievementEvent): {
  icon: React.ReactNode;
  title: string;
  subtitle: string | null;
} {
  switch (event.type) {
    case 'topic-mastered':
      return {
        icon: (
          <svg
            className="w-6 h-6 text-emerald-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
        title: `${event.topicName} mestret!`,
        subtitle: event.nextTopicName
          ? `Neste: ${event.nextTopicName}`
          : null,
      };

    case 'badge-earned':
      return {
        icon: (
          <svg
            className="w-6 h-6 text-amber-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
            />
          </svg>
        ),
        title: `Nytt merke: ${event.badgeName}`,
        subtitle: null,
      };

    case 'level-complete':
      return {
        icon: (
          <svg
            className="w-6 h-6 text-purple-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            />
          </svg>
        ),
        title: `${event.levelName} fullført!`,
        subtitle: 'Gratulerer!',
      };
  }
}

/**
 * Toast notification for milestone achievements.
 *
 * Displays achievement events with auto-dismiss.
 * Respects reduced motion preferences.
 */
export function MilestoneToast({
  event,
  onClose,
  dismissDelay = 4000,
}: MilestoneToastProps) {
  const prefersReducedMotion = useReducedMotion();
  const content = getEventContent(event);

  // Auto-dismiss after delay
  useEffect(() => {
    const timer = setTimeout(onClose, dismissDelay);
    return () => clearTimeout(timer);
  }, [onClose, dismissDelay]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`
        fixed top-4 left-1/2 -translate-x-1/2 z-50
        bg-white rounded-lg shadow-lg border border-gray-200
        p-4 min-w-[280px] max-w-[400px]
        ${prefersReducedMotion ? 'opacity-100' : 'animate-slide-down'}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">{content.icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{content.title}</p>
          {content.subtitle && (
            <p className="text-sm text-gray-500 mt-0.5">{content.subtitle}</p>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Lukk"
          className="flex-shrink-0 flex items-center justify-center w-11 h-11 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 motion-safe:transition-colors"
        >
          <XMarkIcon className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
