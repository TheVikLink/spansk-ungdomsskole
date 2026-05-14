// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { Button, buttonClassName } from './Button';

describe('Button', () => {
  it('renders primary medium button classes by default', () => {
    render(<Button>Start</Button>);

    const button = screen.getByRole('button', { name: 'Start' });
    expect(button).toHaveClass('inline-flex');
    expect(button).toHaveClass('bg-emerald-600');
    expect(button).toHaveClass('px-4');
    expect(button).toHaveClass('text-sm');
  });

  it('supports size/variant/fullWidth overrides', () => {
    render(
      <Button variant="secondary" size="lg" fullWidth>
        Large
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Large' });
    expect(button).toHaveClass('w-full');
    expect(button).toHaveClass('text-lg');
    expect(button).toHaveClass('bg-white');
    expect(button).toHaveClass('border-gray-300');
  });

  it('builds classNames for link-based CTAs via helper', () => {
    const className = buttonClassName({ size: 'sm', className: 'custom-cta' });

    expect(className).toContain('custom-cta');
    expect(className).toContain('bg-emerald-600');
    expect(className).toContain('px-4');
  });
});
