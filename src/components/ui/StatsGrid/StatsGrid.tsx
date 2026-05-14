'use client';

import { memo, type ComponentType, type SVGProps } from 'react';
import { CountUp } from '@/lib/design-system/components/CountUp';

export interface Stat {
  name: string;
  value: string | number;
  unit?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  accent?: string;
}

interface StatsGridProps {
  stats: Stat[];
  /** Number of columns on large screens. Defaults to number of stats (max 4) */
  columns?: 2 | 3 | 4;
}

const ACCENT_COLORS: Record<string, string> = {
  emerald: 'bg-emerald-500',
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  purple: 'bg-purple-500',
};

/**
 * A responsive stats grid following Tailwind UI patterns.
 * Displays key metrics in a clean, scannable format.
 *
 * Responsive behavior:
 * - Mobile: 1 column
 * - Tablet: 2 columns
 * - Desktop: columns prop (defaults to stat count, max 4)
 */
export const StatsGrid = memo(function StatsGrid({ stats, columns }: StatsGridProps) {
  const cols = columns ?? Math.min(stats.length, 4) as 2 | 3 | 4;

  const gridColsClass = {
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
  }[cols];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div
        className={`grid grid-cols-1 gap-px bg-gray-900/5 sm:grid-cols-2 ${gridColsClass}`}
      >
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white px-4 py-6 sm:px-6 lg:px-8 relative hover:shadow-md transition-shadow"
          >
            {stat.accent && (
              <div className={`absolute top-0 inset-x-0 h-1 ${ACCENT_COLORS[stat.accent] ?? 'bg-gray-300'}`} />
            )}
            <div className="flex items-center gap-2">
              {stat.icon && (
                <stat.icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              )}
              <p className="text-sm/6 font-medium text-gray-500">{stat.name}</p>
            </div>
            <p className="mt-2 flex items-baseline gap-x-2">
              <span className="text-4xl font-semibold tracking-tight text-gray-900 tabular-nums">
                {typeof stat.value === 'number' ? (
                  <CountUp value={stat.value} />
                ) : (
                  stat.value
                )}
              </span>
              {stat.unit ? <span className="text-sm text-gray-500">{stat.unit}</span> : null}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
});
