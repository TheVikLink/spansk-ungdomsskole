// src/components/ui/StreakProgress/streak-utils.ts

export interface StreakDisplayData {
  current: number;
  goal: number;
  filledCount: number;
  isGoalReached: boolean;
  progressPercent: number;
}

const DEFAULT_GOAL = 5;

export function getStreakDisplay(current: number, goal: number = DEFAULT_GOAL): StreakDisplayData {
  const filledCount = Math.min(current, goal);
  const isGoalReached = current >= goal;
  const progressPercent = Math.min(Math.round((current / goal) * 100), 100);

  return {
    current,
    goal,
    filledCount,
    isGoalReached,
    progressPercent,
  };
}
