// @ts-check
import { test, expect } from '@playwright/test';
test.describe('Login', () => {
  test('has title', async ({ page }) => {
    await page.goto('/');
    expect(page.url()).toContain('app/authorize');
  });
});
