// src/components/ui/StreakProgress/StreakProgress.tsx
'use client';

import { FireIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { getStreakDisplay } from './streak-utils';

export interface StreakProgressProps {
  current: number;
  goal?: number;
}

export function StreakProgress({
  current,
  goal = 5,
}: StreakProgressProps) {
  const { filledCount, isGoalReached } = getStreakDisplay(current, goal);

  return (
    <div
      className={`flex flex-col items-center gap-3 p-4 rounded-xl ${
        isGoalReached
          ? 'bg-amber-100 border-2 border-amber-500'
          : 'bg-gray-50 border border-gray-200'
      }`}
    >
      {/* Goal text */}
      <div
        className={`text-base font-semibold ${
          isGoalReached ? 'text-amber-800' : 'text-gray-700'
        }`}
      >
        {isGoalReached ? `${goal} på rad!` : `Klarer du ${goal} på rad?`}
      </div>

      {/* Streak indicators */}
      <div className="flex gap-2">
        {Array.from({ length: goal }, (_, i) => {
          const isFilled = i < filledCount;
          return (
            <div
              key={i}
              data-testid="streak-indicator"
              {...(isFilled && { 'data-filled': 'true' })}
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-[background-color,border-color] duration-300 ${
                isFilled
                  ? 'bg-amber-100 border-amber-500'
                  : 'bg-gray-200 border-gray-300'
              }`}
            >
              {isFilled ? (
                <FireIcon className="h-4 w-4 text-amber-500" aria-hidden="true" />
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Celebration */}
      {isGoalReached && (
        <div
          data-testid="streak-celebration"
          className="animate-bounce"
        >
          <SparklesIcon className="h-7 w-7 text-amber-500" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
