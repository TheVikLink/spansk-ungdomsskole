// src/components/ui/RichText.tsx
// Pure component - NO hooks, server-safe (except FractionDisplay is 'use client')
// Returns fragment, not block-level element

import { parseRichText } from '@/lib/core/utils/rich-text-parser';
import { FractionDisplay } from '@/components/math/shared/FractionDisplay';

export interface RichTextProps {
  /** The text content with optional rich text markup */
  children: string;
  /** Data values for {{data:key}} interpolation */
  data?: Record<string, unknown>;
}

interface FractionDataValue {
  numerator: number;
  denominator: number;
  whole?: number;
}

function asFractionDataValue(value: unknown): FractionDataValue | null {
  if (typeof value !== 'object' || value === null) return null;

  const record = value as Record<string, unknown>;
  const numerator = record.numerator;
  const denominator = record.denominator;
  const whole = record.whole;

  if (typeof numerator !== 'number' || !Number.isFinite(numerator)) return null;
  if (typeof denominator !== 'number' || !Number.isFinite(denominator) || denominator === 0) return null;
  if (whole !== undefined && (typeof whole !== 'number' || !Number.isFinite(whole))) return null;

  return {
    numerator,
    denominator,
    ...(whole !== undefined ? { whole } : {}),
  };
}

/**
 * Renders text with embedded fraction notation.
 *
 * Supported markup:
 * - `{{frac:N:D}}` - Renders as stacked fraction (e.g., {{frac:3:4}} → 3/4)
 * - `{{mixed:W:N:D}}` - Renders as mixed number (e.g., {{mixed:2:1:3}} → 2 1/3)
 *
 * Invalid tokens are rendered as plain text.
 *
 * @example
 * <RichText>{"Se {{frac:1:2}} her"}</RichText>
 * // Renders: "Se [1/2 stacked] her"
 *
 * @example
 * <RichText>{"{{frac:1:2}} = {{frac:2:4}}"}</RichText>
 * // Renders: "[1/2 stacked] = [2/4 stacked]"
 */
export function RichText({ children, data }: RichTextProps) {
  const tokens = parseRichText(children);

  return (
    <>
      {tokens.map((token, i) => {
        if (token.type === 'text') {
          return token.content;
        }

        if (token.type === 'fraction') {
          return <FractionDisplay key={i} n={token.n} d={token.d} />;
        }

        if (token.type === 'mixed') {
          return (
            <FractionDisplay
              key={i}
              whole={token.whole}
              n={token.n}
              d={token.d}
            />
          );
        }

        if (token.type === 'data') {
          const value = data?.[token.key];
          if (value != null) {
            const fractionValue = asFractionDataValue(value);
            if (fractionValue) {
              return (
                <FractionDisplay
                  key={i}
                  whole={fractionValue.whole}
                  n={fractionValue.numerator}
                  d={fractionValue.denominator}
                />
              );
            }
            return String(value);
          }
          if (process.env.NODE_ENV !== 'production' && data !== undefined) {
            console.warn(`RichText: missing data key "${token.key}"`);
          }
          return `{{data:${token.key}}}`;
        }

        // Exhaustive check (should never happen)
        return null;
      })}
    </>
  );
}
