// @vitest-environment happy-dom
// src/components/ui/RichText.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { RichText } from './RichText';

describe('RichText', () => {
  describe('text rendering', () => {
    it('renders plain text', () => {
      render(<p><RichText>Hello world</RichText></p>);
      expect(screen.getByText('Hello world')).toBeInTheDocument();
    });

    it('renders empty string without error', () => {
      const { container } = render(<p><RichText>{''}</RichText></p>);
      expect(container.querySelector('p')?.textContent).toBe('');
    });
  });

  describe('fraction rendering', () => {
    it('renders a simple fraction', () => {
      render(<p><RichText>{'{{frac:3:4}}'}</RichText></p>);
      const fraction = screen.getByTestId('fraction-display');
      expect(fraction).toBeInTheDocument();
      expect(fraction).toHaveAttribute('role', 'math');
      expect(fraction).toHaveAttribute('aria-label', 'tre firedeler');
    });

    it('renders fraction with correct numerator and denominator', () => {
      render(<p><RichText>{'{{frac:1:2}}'}</RichText></p>);
      const fraction = screen.getByTestId('fraction-display');
      expect(fraction).toHaveTextContent('1');
      expect(fraction).toHaveTextContent('2');
      expect(fraction).toHaveAttribute('aria-label', 'en halv');
    });

    it('renders fraction with text before', () => {
      render(<p><RichText>{'Se {{frac:1:4}} her'}</RichText></p>);
      expect(screen.getByText(/Se/)).toBeInTheDocument();
      expect(screen.getByText(/her/)).toBeInTheDocument();
      expect(screen.getByTestId('fraction-display')).toBeInTheDocument();
    });

    it('renders multiple fractions', () => {
      render(<p><RichText>{'{{frac:1:2}} = {{frac:2:4}}'}</RichText></p>);
      const fractions = screen.getAllByTestId('fraction-display');
      expect(fractions).toHaveLength(2);
    });
  });

  describe('mixed number rendering', () => {
    it('renders a mixed number', () => {
      render(<p><RichText>{'{{mixed:2:1:3}}'}</RichText></p>);
      const fraction = screen.getByTestId('fraction-display');
      expect(fraction).toBeInTheDocument();
      expect(fraction).toHaveTextContent('2');
      expect(fraction).toHaveTextContent('1');
      expect(fraction).toHaveTextContent('3');
      expect(fraction).toHaveAttribute('aria-label', 'to og en tredel');
    });
  });

  describe('malformed tokens', () => {
    it('renders invalid fraction as text', () => {
      render(<p><RichText>{'{{frac:3}}'}</RichText></p>);
      expect(screen.getByText('{{frac:3}}')).toBeInTheDocument();
      expect(screen.queryByTestId('fraction-display')).not.toBeInTheDocument();
    });

    it('renders escaped sequence as literal text', () => {
      render(<p><RichText>{'\\{{frac:1:2}}'}</RichText></p>);
      expect(screen.getByText('{{frac:1:2}}')).toBeInTheDocument();
      expect(screen.queryByTestId('fraction-display')).not.toBeInTheDocument();
    });
  });

  describe('complex patterns', () => {
    it('renders fraction equation', () => {
      render(<p><RichText>{'{{frac:1:2}} + {{frac:1:4}} = {{frac:3:4}}'}</RichText></p>);
      const fractions = screen.getAllByTestId('fraction-display');
      expect(fractions).toHaveLength(3);
      expect(screen.getByText(/\+/)).toBeInTheDocument();
      expect(screen.getByText(/=/)).toBeInTheDocument();
    });

    it('renders mixed numbers and fractions together', () => {
      render(<p><RichText>{'{{mixed:1:1:2}} og {{frac:3:4}}'}</RichText></p>);
      const fractions = screen.getAllByTestId('fraction-display');
      expect(fractions).toHaveLength(2);
      expect(screen.getByText(/og/)).toBeInTheDocument();
    });
  });

  describe('data interpolation', () => {
    it('renders data value when data prop provided', () => {
      render(<p><RichText data={{ number: 527 }}>{'{{data:number}}'}</RichText></p>);
      expect(screen.getByText('527')).toBeInTheDocument();
      expect(screen.queryByTestId('fraction-display')).not.toBeInTheDocument();
    });

    it('renders multiple data values', () => {
      const { container } = render(
        <p><RichText data={{ a: 32, b: 25 }}>{'{{data:a}} og {{data:b}}'}</RichText></p>
      );
      expect(container.querySelector('p')?.textContent).toBe('32 og 25');
    });

    it('renders fallback when data prop not provided', () => {
      render(<p><RichText>{'{{data:number}}'}</RichText></p>);
      expect(screen.getByText('{{data:number}}')).toBeInTheDocument();
    });

    it('renders data mixed with fractions', () => {
      const { container } = render(
        <p><RichText data={{ number: 527 }}>{'Se {{data:number}} og {{frac:1:2}}'}</RichText></p>
      );
      expect(container.querySelector('p')?.textContent).toContain('Se');
      expect(container.querySelector('p')?.textContent).toContain('527');
      expect(screen.getByTestId('fraction-display')).toBeInTheDocument();
    });

    it('renders fraction object in data interpolation as FractionDisplay', () => {
      render(
        <p>
          <RichText data={{ fraction: { numerator: 3, denominator: 4 } }}>
            {'{{data:fraction}}'}
          </RichText>
        </p>
      );

      const fraction = screen.getByTestId('fraction-display');
      expect(fraction).toBeInTheDocument();
      expect(fraction).toHaveAttribute('aria-label', 'tre firedeler');
      expect(screen.queryByText('[object Object]')).not.toBeInTheDocument();
    });

    it('renders mixed fraction object in data interpolation as FractionDisplay', () => {
      render(
        <p>
          <RichText data={{ mixed: { whole: 1, numerator: 1, denominator: 3 } }}>
            {'{{data:mixed}}'}
          </RichText>
        </p>
      );

      const fraction = screen.getByTestId('fraction-display');
      expect(fraction).toBeInTheDocument();
      expect(fraction).toHaveAttribute('aria-label', 'en og en tredel');
      expect(screen.queryByText('[object Object]')).not.toBeInTheDocument();
    });
  });

  describe('fragment output', () => {
    it('renders as inline content (no block-level wrapper)', () => {
      const { container } = render(<p><RichText>{'Test {{frac:1:2}} text'}</RichText></p>);
      // RichText should not add any block-level elements
      // The p should directly contain text and inline elements
      const p = container.querySelector('p');
      expect(p).toBeInTheDocument();
      // Check that fraction-display is inline
      const fraction = container.querySelector('[data-testid="fraction-display"]');
      expect(fraction).toBeInTheDocument();
      expect(fraction?.tagName.toLowerCase()).toBe('span');
    });
  });
});
