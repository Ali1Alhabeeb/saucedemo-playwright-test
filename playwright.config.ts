// playwright.config.js
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: ['**/*.spec.js'],
  testIgnore: ['**/node_modules/**', '**/.Trash/**'],

  // Pretty console + CI XML + HTML report
  reporter: [
    ['list'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['html', { open: 'never' }],
  ],

  // Make flaky steps easier to debug
  retries: 1,
  use: {
    baseURL: 'https://www.saucedemo.com',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry', // creates a clickable timeline on retry
  },
});
