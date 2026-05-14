// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ProgressTrack } from './ProgressTrack';

describe('ProgressTrack', () => {
  it('clamps progress values to the max bound', () => {
    render(
      <ProgressTrack
        aria-label="Mestring"
        value={140}
        max={100}
      />
    );

    const progress = screen.getByLabelText('Mestring');
    expect(progress).toHaveAttribute('value', '100');
    expect(progress).toHaveAttribute('max', '100');
  });

  it('clamps negative values to zero', () => {
    render(
      <ProgressTrack
        aria-label="Mestring"
        value={-15}
        max={100}
      />
    );

    expect(screen.getByLabelText('Mestring')).toHaveAttribute('value', '0');
  });

  it('supports tone and track variants without inline style', () => {
    render(
      <ProgressTrack
        aria-label="Mestring"
        value={40}
        tone="blue"
        trackTone="white"
      />
    );

    const progress = screen.getByLabelText('Mestring');
    expect(progress.className).toContain('[&::-webkit-progress-value]:bg-blue-500');
    expect(progress.className).toContain('[&::-webkit-progress-bar]:bg-white/50');
    expect(progress).not.toHaveAttribute('style');
  });

  it('supports indigo and violet tones for non-status semantic channels', () => {
    render(
      <>
        <ProgressTrack aria-label="Indigo" value={40} tone="indigo" />
        <ProgressTrack aria-label="Violet" value={40} tone="violet" />
      </>
    );

    expect(screen.getByLabelText('Indigo').className).toContain('[&::-webkit-progress-value]:bg-indigo-500');
    expect(screen.getByLabelText('Violet').className).toContain('[&::-webkit-progress-value]:bg-violet-500');
  });
});
