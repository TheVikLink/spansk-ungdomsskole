// src/components/ui/MilestoneToast.test.tsx
// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MilestoneToast } from './MilestoneToast';
import type { AchievementEvent } from '@/lib/core/journey';

// Mock useReducedMotion hook
vi.mock('@/lib/design-system/animations/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

describe('MilestoneToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('event type rendering', () => {
    it('renders topic-mastered event correctly', () => {
      const event: AchievementEvent = {
        type: 'topic-mastered',
        topicId: 'place-value',
        topicName: 'Posisjonssystemet',
        nextTopicId: 'exchanging',
        nextTopicName: 'Veksling',
      };

      render(<MilestoneToast event={event} onClose={vi.fn()} />);

      expect(screen.getByText(/Posisjonssystemet/)).toBeInTheDocument();
      expect(screen.getByText(/mestret/i)).toBeInTheDocument();
    });

    it('shows next topic hint when available', () => {
      const event: AchievementEvent = {
        type: 'topic-mastered',
        topicId: 'place-value',
        topicName: 'Posisjonssystemet',
        nextTopicId: 'exchanging',
        nextTopicName: 'Veksling',
      };

      render(<MilestoneToast event={event} onClose={vi.fn()} />);

      expect(screen.getByText(/Neste/)).toBeInTheDocument();
      expect(screen.getByText(/Veksling/)).toBeInTheDocument();
    });

    it('renders badge-earned event correctly', () => {
      const event: AchievementEvent = {
        type: 'badge-earned',
        badgeId: 'first-topic',
        badgeName: 'Første emne',
      };

      render(<MilestoneToast event={event} onClose={vi.fn()} />);

      expect(screen.getByText(/Første emne/)).toBeInTheDocument();
    });

    it('renders level-complete event correctly', () => {
      const event: AchievementEvent = {
        type: 'level-complete',
        levelId: 1,
        levelName: 'Tallmesteren',
      };

      render(<MilestoneToast event={event} onClose={vi.fn()} />);

      expect(screen.getByText(/Tallmesteren/)).toBeInTheDocument();
      expect(screen.getByText(/fullført/i)).toBeInTheDocument();
    });
  });

  describe('auto-dismiss behavior', () => {
    it('calls onClose after 4 seconds', () => {
      const onClose = vi.fn();
      const event: AchievementEvent = {
        type: 'topic-mastered',
        topicId: 'place-value',
        topicName: 'Posisjonssystemet',
        nextTopicId: null,
        nextTopicName: null,
      };

      render(<MilestoneToast event={event} onClose={onClose} />);

      expect(onClose).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(4000);
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('manual dismiss', () => {
    it('can be closed by clicking dismiss button', () => {
      const onClose = vi.fn();
      const event: AchievementEvent = {
        type: 'topic-mastered',
        topicId: 'place-value',
        topicName: 'Posisjonssystemet',
        nextTopicId: null,
        nextTopicName: null,
      };

      render(<MilestoneToast event={event} onClose={onClose} />);

      const closeButton = screen.getByRole('button', { name: /lukk/i });
      closeButton.click();

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('has role="status" for screen readers', () => {
      const event: AchievementEvent = {
        type: 'topic-mastered',
        topicId: 'place-value',
        topicName: 'Posisjonssystemet',
        nextTopicId: null,
        nextTopicName: null,
      };

      render(<MilestoneToast event={event} onClose={vi.fn()} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has aria-live="polite" for announcements', () => {
      const event: AchievementEvent = {
        type: 'topic-mastered',
        topicId: 'place-value',
        topicName: 'Posisjonssystemet',
        nextTopicId: null,
        nextTopicName: null,
      };

      render(<MilestoneToast event={event} onClose={vi.fn()} />);

      const toast = screen.getByRole('status');
      expect(toast).toHaveAttribute('aria-live', 'polite');
    });
  });
});
