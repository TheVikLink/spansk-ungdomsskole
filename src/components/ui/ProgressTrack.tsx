import type { ProgressHTMLAttributes } from 'react';

export type ProgressTone = 'emerald' | 'amber' | 'red' | 'blue' | 'gray' | 'indigo' | 'violet';
export type ProgressTrackTone = 'gray' | 'white';
export type ProgressSize = 'sm' | 'md';

export interface ProgressTrackProps extends Omit<ProgressHTMLAttributes<HTMLProgressElement>, 'value' | 'max' | 'className'> {
  value: number;
  max?: number;
  tone?: ProgressTone;
  trackTone?: ProgressTrackTone;
  size?: ProgressSize;
  className?: string;
}

const BASE_CLASSES = [
  'block w-full overflow-hidden rounded-full border-0 appearance-none',
  '[&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-value]:rounded-full [&::-moz-progress-bar]:rounded-full',
  '[&::-webkit-progress-value]:transition-all [&::-webkit-progress-value]:duration-300 [&::-moz-progress-bar]:transition-all [&::-moz-progress-bar]:duration-300',
].join(' ');

const SIZE_CLASSES: Record<ProgressSize, string> = {
  sm: 'h-2',
  md: 'h-3',
};

const TRACK_CLASSES: Record<ProgressTrackTone, string> = {
  gray: 'bg-gray-200 [&::-webkit-progress-bar]:bg-gray-200',
  white: 'bg-white/50 [&::-webkit-progress-bar]:bg-white/50',
};

const TONE_CLASSES: Record<ProgressTone, string> = {
  emerald: '[&::-webkit-progress-value]:bg-emerald-500 [&::-moz-progress-bar]:bg-emerald-500',
  amber: '[&::-webkit-progress-value]:bg-amber-500 [&::-moz-progress-bar]:bg-amber-500',
  red: '[&::-webkit-progress-value]:bg-red-500 [&::-moz-progress-bar]:bg-red-500',
  blue: '[&::-webkit-progress-value]:bg-blue-500 [&::-moz-progress-bar]:bg-blue-500',
  gray: '[&::-webkit-progress-value]:bg-gray-500 [&::-moz-progress-bar]:bg-gray-500',
  indigo: '[&::-webkit-progress-value]:bg-indigo-500 [&::-moz-progress-bar]:bg-indigo-500',
  violet: '[&::-webkit-progress-value]:bg-violet-500 [&::-moz-progress-bar]:bg-violet-500',
};

function joinClasses(...values: Array<string | undefined | null | false>) {
  return values.filter(Boolean).join(' ');
}

function clampValue(value: number, max: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(Math.max(value, 0), max);
}

export function progressTrackClassName({
  tone = 'emerald',
  trackTone = 'gray',
  size = 'sm',
  className,
}: Pick<ProgressTrackProps, 'tone' | 'trackTone' | 'size' | 'className'> = {}) {
  return joinClasses(
    BASE_CLASSES,
    SIZE_CLASSES[size],
    TRACK_CLASSES[trackTone],
    TONE_CLASSES[tone],
    className
  );
}

export function ProgressTrack({
  value,
  max = 100,
  tone = 'emerald',
  trackTone = 'gray',
  size = 'sm',
  className,
  ...props
}: ProgressTrackProps) {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
  const clampedValue = clampValue(value, safeMax);

  return (
    <progress
      value={clampedValue}
      max={safeMax}
      className={progressTrackClassName({ tone, trackTone, size, className })}
      {...props}
    />
  );
}
