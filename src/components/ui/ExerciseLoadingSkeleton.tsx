// src/components/ui/ExerciseLoadingSkeleton.tsx
'use client';

import { Skeleton } from '@/lib/design-system';

interface ExerciseLoadingSkeletonProps {
  label?: string;
  variant?: ExerciseLoadingSkeletonVariant;
}

export type ExerciseLoadingSkeletonVariant = 'place-value' | 'number-line';

export function getExerciseLoadingVariant(type: string): ExerciseLoadingSkeletonVariant {
  return type === 'number-line' ? 'number-line' : 'place-value';
}

export function ExerciseLoadingSkeleton({
  label = 'Laster oppgave...',
  variant = 'place-value',
}: ExerciseLoadingSkeletonProps) {
  const content =
    variant === 'number-line' ? (
      <div
        data-testid="number-line-loading-skeleton"
        className="w-full rounded-xl border border-slate-200 bg-white/80 p-6"
      >
        <div className="mb-4">
          <Skeleton variant="text" width="48%" height={18} label={label} />
        </div>
        <div className="relative flex w-full items-center justify-between px-2 py-5">
          <div className="absolute inset-x-2 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-slate-300" />
          {[0, 25, 50, 75, 100].map((tick) => (
            <div key={tick} className="relative z-10 flex flex-col items-center gap-2">
              <div className="h-6 w-px bg-slate-400" />
              <span className="text-xs font-medium text-slate-500">{tick}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-center">
          <Skeleton variant="circular" width={24} height={24} label={`${label} markør`} />
        </div>
      </div>
    ) : (
      <div className="w-full max-w-[760px] rounded-xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
        <div className="flex flex-col items-center gap-5">
          <Skeleton variant="text" width="62%" height={22} label={label} />
          <div className="flex w-full items-start justify-center gap-6">
            {['H', 'T', 'E'].map((labelText, index) => (
              <div
                key={labelText}
                className="flex w-[140px] flex-col items-center gap-3 rounded-lg border border-slate-200 bg-white/80 p-4"
              >
                <div className="text-xs font-semibold text-slate-400">{labelText}</div>
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton
                    variant="rectangular"
                    width={44}
                    height={44}
                    label={`${label} kolonne ${index + 1}`}
                  />
                  <Skeleton variant="rectangular" width={44} height={44} />
                  <Skeleton variant="rectangular" width={44} height={44} />
                  <Skeleton variant="rectangular" width={44} height={44} />
                </div>
              </div>
            ))}
          </div>
          <Skeleton variant="text" width="38%" height={16} />
        </div>
      </div>
    );

  return (
    <div
      data-testid="exercise-loading"
      className="w-full h-full flex items-center justify-center p-4"
      aria-label={label}
    >
      {content}
    </div>
  );
}
