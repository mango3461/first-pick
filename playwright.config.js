import { defineConfig } from '@playwright/test';
const channel = process.env.PLAYWRIGHT_BROWSER === 'chromium' ? undefined : process.platform === 'win32' ? 'msedge' : undefined;
export default defineConfig({
  testDir: './tests/e2e', fullyParallel: true, forbidOnly: Boolean(process.env.CI), workers: 2,
  timeout: 30000, expect: { timeout: 6000 }, retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:4173', browserName: 'chromium', channel, locale: 'ko-KR', timezoneId: 'Asia/Seoul', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: { command: 'npm run preview -- --port 4173 --strictPort', url: 'http://127.0.0.1:4173', reuseExistingServer: false, timeout: 20000 },
});
