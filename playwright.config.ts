import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['html'], ['list']],

  expect: { timeout: 15_000 },

  use: {
    baseURL: process.env.SF_BASE_URL ?? 'https://orgfarm-4823e5f7b8-dev-ed.develop.my.salesforce.com',
    trace: 'on',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
    bypassCSP: true,
  },

  projects: [
    {
      name: 'setup',
      testMatch: '**/auth.setup.ts',
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/salesforce.json',
      },
      dependencies: ['setup'],
      testMatch: '**/specs/**/*.spec.ts',
    },
  ],
});
