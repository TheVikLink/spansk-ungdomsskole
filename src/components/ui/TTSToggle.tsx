// src/components/ui/TTSToggle.tsx
'use client';

import { useTTS } from '@/contexts/TTSContext';

interface TTSToggleProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Toggle button for enabling/disabling text-to-speech.
 * Only renders if TTS is available in the browser.
 */
export function TTSToggle({ className = '' }: TTSToggleProps) {
  const { isEnabled, isAvailable, needsUserGesture, toggle, initWithGesture, isSpeaking } = useTTS();

  // Don't render if TTS isn't available
  if (!isAvailable) return null;

  // Handle click - initialize with gesture if needed (iOS Safari)
  const handleClick = () => {
    if (needsUserGesture) {
      initWithGesture();
    }
    toggle();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isEnabled}
      aria-label={isEnabled ? 'Slå av opplesing' : 'Slå på opplesing'}
      className={`
        inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium
        transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
        ${
          isEnabled
            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }
        ${className}
      `}
    >
      {/* Speaker icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`h-5 w-5 ${isSpeaking ? 'animate-pulse' : ''}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        {isEnabled ? (
          // Speaker with waves
          <>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
            />
          </>
        ) : (
          // Speaker with X (muted)
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
          />
        )}
      </svg>
      <span className="hidden sm:inline">{isEnabled ? 'Opplesing på' : 'Opplesing av'}</span>
    </button>
  );
}
