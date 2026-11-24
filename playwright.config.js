import { defineConfig } from '@playwright/test';

// Keep nested worktrees and their Playwright installations out of test discovery.
export default defineConfig({ testDir: './tests' });
