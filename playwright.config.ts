import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 2,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  globalTeardown: './tests/e2e/global-teardown.ts',
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      command: 'npm run dev',
      env: {
        NEXT_PUBLIC_USE_EMULATORS: 'true',
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-word-chaser',
        NEXT_PUBLIC_FIREBASE_DATABASE_URL: 'http://127.0.0.1:9000?ns=demo-word-chaser',
      },
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      command: 'npm run dev -- --port 3001',
      env: {
        NEXT_PUBLIC_USE_EMULATORS: 'true',
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-word-chaser',
        NEXT_PUBLIC_FIREBASE_DATABASE_URL: 'http://127.0.0.1:9000?ns=demo-word-chaser',
      },
      url: 'http://localhost:3001',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
});


