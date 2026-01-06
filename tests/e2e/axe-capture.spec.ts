import { test, expect } from '@playwright/test';
import { login } from './utils';

// This test polls window.__axeViolations__ (set by App.tsx dev axe.run)
// and writes any found violations to axe-dev-violations.json and logs them.

test('capture dev axe run violations from App (if any)', async ({ page }) => {
  await login(page, 'dispatcher@heartfledge.local', 'fleet123');

  // Wait a bit for App's dev axe.run to execute
  let attempts = 0;
  let violations: any = null;
  while (attempts < 10) {
    violations = await page.evaluate(() => {
      // @ts-ignore
      return (window as any).__axeViolations__ || null;
    });
    if (violations && violations.length) break;
    await page.waitForTimeout(300);
    attempts++;
  }

  if (violations && violations.length) {
    // eslint-disable-next-line no-console
    console.warn('Captured dev axe violations:', JSON.stringify(violations, null, 2));
    const { writeFileSync } = await import('fs');
    try {
      writeFileSync('axe-dev-violations.json', JSON.stringify(violations, null, 2));
    } catch (e) {
      // ignore
    }
  } else {
    // eslint-disable-next-line no-console
    console.info('No dev axe violations found on App run');
  }

  // This test is only informational; always pass
  expect(true).toBe(true);
});