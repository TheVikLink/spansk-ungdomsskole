'use client';

import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import * as Sentry from '@sentry/nextjs';
import { type ReactNode, useCallback } from 'react';

interface CanvasErrorBoundaryProps {
  children: ReactNode;
  /** Component name for error context */
  componentName?: string;
  /** Custom fallback message */
  fallbackMessage?: string;
  /** Callback when reset is triggered */
  onReset?: () => void;
}

function CanvasFallback({
  error,
  resetErrorBoundary,
  componentName,
  fallbackMessage
}: FallbackProps & { componentName?: string; fallbackMessage?: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center p-8 bg-gray-50 border border-gray-200 rounded-lg min-h-[200px]"
      role="alert"
    >
      <svg
        className="w-12 h-12 text-gray-400 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <p className="text-gray-600 text-center mb-4">
        {fallbackMessage || 'Noe gikk galt med visualiseringen'}
      </p>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        Prøv igjen
      </button>
      {process.env.NODE_ENV === 'development' && error instanceof Error && (
        <details className="mt-4 text-left w-full max-w-md">
          <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
            Tekniske detaljer
          </summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded-lg text-xs overflow-auto max-h-32">
            {componentName && <div className="font-bold mb-1">{componentName}</div>}
            {error.message}
            {error.stack && (
              <div className="mt-2 text-gray-400">{error.stack}</div>
            )}
          </pre>
        </details>
      )}
    </div>
  );
}

/**
 * Error boundary specifically for canvas/Konva components.
 *
 * Features:
 * - Reports errors to Sentry with component context
 * - Norwegian fallback UI
 * - Reset button to retry rendering
 * - Development mode shows error details
 *
 * @example
 * <CanvasErrorBoundary componentName="NumberLine">
 *   <NumberLine {...props} />
 * </CanvasErrorBoundary>
 */
export function CanvasErrorBoundary({
  children,
  componentName,
  fallbackMessage,
  onReset
}: CanvasErrorBoundaryProps) {
  const handleError = useCallback((error: unknown, info: { componentStack?: string | null }) => {
    // Report to Sentry with context
    Sentry.captureException(error, {
      tags: {
        component: componentName || 'unknown-canvas',
        errorType: 'canvas-render-error',
      },
      extra: {
        componentStack: info.componentStack,
      },
    });

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[CanvasErrorBoundary] Error in ${componentName}:`, error);
      if (info.componentStack) {
        console.error('Component stack:', info.componentStack);
      }
    }
  }, [componentName]);

  const handleReset = useCallback(() => {
    onReset?.();
  }, [onReset]);

  return (
    <ErrorBoundary
      FallbackComponent={(props) => (
        <CanvasFallback
          {...props}
          componentName={componentName}
          fallbackMessage={fallbackMessage}
        />
      )}
      onError={handleError}
      onReset={handleReset}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Higher-order component version for wrapping entire components.
 *
 * @example
 * const SafeNumberLine = withCanvasErrorBoundary(NumberLine, 'NumberLine');
 */
export function withCanvasErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  const WrappedComponent = (props: P) => (
    <CanvasErrorBoundary componentName={componentName}>
      <Component {...props} />
    </CanvasErrorBoundary>
  );

  WrappedComponent.displayName = `withCanvasErrorBoundary(${componentName})`;
  return WrappedComponent;
}
