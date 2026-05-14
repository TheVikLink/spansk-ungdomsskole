import type { HTMLAttributes } from 'react';

export type CardVariant = 'default' | 'elevated' | 'interactive';

type CardElement = 'div' | 'section' | 'article' | 'aside';

interface CardClassNameOptions {
  variant?: CardVariant;
  className?: string;
}

const BASE_CLASSES = 'rounded-xl border';

const VARIANT_CLASSES: Record<CardVariant, string> = {
  default: 'border-gray-200 bg-white',
  elevated: 'border-gray-200 bg-white shadow-sm',
  interactive:
    'border-gray-200 bg-white shadow-lg transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-xl cursor-pointer',
};

function joinClasses(...values: Array<string | undefined | null | false>) {
  return values.filter(Boolean).join(' ');
}

export function cardClassName({
  variant = 'elevated',
  className,
}: CardClassNameOptions = {}) {
  return joinClasses(BASE_CLASSES, VARIANT_CLASSES[variant], className);
}

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: CardElement;
  variant?: CardVariant;
}

export function Card({
  as = 'div',
  variant = 'elevated',
  className,
  ...props
}: CardProps) {
  const Component = as;

  return (
    <Component
      className={cardClassName({ variant, className })}
      {...props}
    />
  );
}
