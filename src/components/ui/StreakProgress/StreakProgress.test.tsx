// src/components/ui/StreakProgress/StreakProgress.test.tsx
import { describe, it, expect } from 'vitest';
import { getStreakDisplay, type StreakDisplayData } from './streak-utils';

describe('StreakProgress utils', () => {
  describe('getStreakDisplay', () => {
    it('returns correct filled count for current=0', () => {
      const result = getStreakDisplay(0, 5);
      expect(result.filledCount).toBe(0);
      expect(result.goal).toBe(5);
    });

    it('returns correct filled count for current=3', () => {
      const result = getStreakDisplay(3, 5);
      expect(result.filledCount).toBe(3);
    });

    it('caps filled count at goal when current exceeds goal', () => {
      const result = getStreakDisplay(7, 5);
      expect(result.filledCount).toBe(5);
    });

    it('handles goal=1', () => {
      const result = getStreakDisplay(1, 1);
      expect(result.filledCount).toBe(1);
      expect(result.goal).toBe(1);
    });

    it('defaults goal to 5', () => {
      const result = getStreakDisplay(2);
      expect(result.goal).toBe(5);
      expect(result.filledCount).toBe(2);
    });

    it('returns isGoalReached=true when current >= goal', () => {
      const result = getStreakDisplay(5, 5);
      expect(result.isGoalReached).toBe(true);
    });

    it('returns isGoalReached=false when current < goal', () => {
      const result = getStreakDisplay(4, 5);
      expect(result.isGoalReached).toBe(false);
    });

    it('returns progress percentage', () => {
      const result = getStreakDisplay(2, 4);
      expect(result.progressPercent).toBe(50);
    });

    it('caps progress percentage at 100', () => {
      const result = getStreakDisplay(10, 5);
      expect(result.progressPercent).toBe(100);
    });
  });
});
