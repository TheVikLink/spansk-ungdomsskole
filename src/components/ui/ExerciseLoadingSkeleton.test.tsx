// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import {
  ExerciseLoadingSkeleton,
  getExerciseLoadingVariant,
} from './ExerciseLoadingSkeleton';

describe('ExerciseLoadingSkeleton', () => {
  it('keeps place-value columns as default variant', () => {
    render(<ExerciseLoadingSkeleton />);

    expect(screen.getByText(/^H$/)).toBeInTheDocument();
    expect(screen.getByText(/^T$/)).toBeInTheDocument();
    expect(screen.getByText(/^E$/)).toBeInTheDocument();
  });

  it('renders number-line variant without place-value labels', () => {
    render(<ExerciseLoadingSkeleton variant="number-line" />);

    expect(screen.getByTestId('number-line-loading-skeleton')).toBeInTheDocument();
    expect(screen.queryByText(/^H$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^T$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^E$/)).not.toBeInTheDocument();
    expect(screen.getByText(/^0$/)).toBeInTheDocument();
    expect(screen.getByText(/^100$/)).toBeInTheDocument();
  });
});

describe('getExerciseLoadingVariant', () => {
  it('returns number-line variant only for number-line exercises', () => {
    expect(getExerciseLoadingVariant('number-line')).toBe('number-line');
    expect(getExerciseLoadingVariant('number-tiles')).toBe('place-value');
    expect(getExerciseLoadingVariant('fraction-bar')).toBe('place-value');
  });
});
