// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { Card, cardClassName } from './Card';

describe('Card', () => {
  it('renders an elevated card by default', () => {
    render(<Card>Body</Card>);

    const card = screen.getByText('Body');
    expect(card).toHaveClass('rounded-xl');
    expect(card).toHaveClass('bg-white');
    expect(card).toHaveClass('shadow-sm');
  });

  it('supports interactive variant', () => {
    render(<Card variant="interactive">Interactive</Card>);

    const card = screen.getByText('Interactive');
    expect(card).toHaveClass('cursor-pointer');
    expect(card).toHaveClass('hover:-translate-y-0.5');
    expect(card).toHaveClass('transition-[transform,box-shadow]');
  });

  it('supports semantic element override', () => {
    render(
      <Card as="article" variant="default">
        Article
      </Card>
    );

    const article = screen.getByText('Article');
    expect(article.tagName.toLowerCase()).toBe('article');
  });

  it('builds classNames with helper', () => {
    const className = cardClassName({ variant: 'default', className: 'custom-card' });

    expect(className).toContain('custom-card');
    expect(className).toContain('border-gray-200');
    expect(className).not.toContain('shadow-sm');
  });
});
