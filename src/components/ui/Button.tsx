import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonClassNameOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

const BASE_CLASSES =
  'inline-flex min-h-[44px] items-center justify-center rounded-lg border-2 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'border-transparent bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 focus-visible:ring-emerald-500 disabled:border-gray-400 disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none',
  secondary:
    'border-gray-300 bg-white text-gray-900 shadow-sm hover:bg-gray-50 focus-visible:ring-gray-700 disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none',
  ghost:
    'border-transparent bg-transparent text-emerald-700 hover:bg-emerald-50 focus-visible:ring-emerald-500 disabled:text-gray-400',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-8 py-3 text-lg',
};

function joinClasses(...values: Array<string | undefined | null | false>) {
  return values.filter(Boolean).join(' ');
}

export function buttonClassName({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
}: ButtonClassNameOptions = {}) {
  return joinClasses(
    BASE_CLASSES,
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    fullWidth ? 'w-full' : undefined,
    className
  );
}

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth = false, className, ...props }, ref) => (
    <button
      ref={ref}
      className={buttonClassName({ variant, size, fullWidth, className })}
      {...props}
    />
  )
);

Button.displayName = 'Button';
