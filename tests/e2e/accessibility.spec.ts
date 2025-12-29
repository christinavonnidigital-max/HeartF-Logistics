import { test, expect } from '@playwright/test';
import { login } from './utils';

test('basic accessibility check with axe-core', async ({ page }) => {
  // Login as dispatcher to see primary UI
  await login(page, 'dispatcher@heartfledge.local', 'fleet123');

  // Ensure page is loaded
  await expect(page.locator('text=Fleet + Bookings Snapshot')).toBeVisible({ timeout: 5000 });

  // Inject axe-core and run
  // Dynamically import axe-core and inject its source into the page
  // Inject axe-core from the local package to avoid external network dependencies in CI
  const { createRequire } = await import('module');
  const require = createRequire(import.meta.url);
  const path = require.resolve('axe-core/axe.min.js');
  const { readFileSync } = await import('fs');
  const src = readFileSync(path, 'utf8');
  await page.addScriptTag({ content: src });
  const results = await page.evaluate(async () => {
    // @ts-ignore
    return await (window as any).axe.run();
  });

  // Configurable failure threshold: read AXE_FAIL_SEVERITY env var
  // Accepts: 'minor' | 'moderate' | 'serious' | 'critical' or numeric 1-4 (1=minor, 4=critical)
  const rawThreshold = process.env.AXE_FAIL_SEVERITY || 'critical';
  const order = ['minor', 'moderate', 'serious', 'critical'];
  let thresholdIndex = order.indexOf(String(rawThreshold).toLowerCase());
  if (thresholdIndex === -1) {
    // maybe it's a number 1-4
    const n = parseInt(String(rawThreshold), 10);
    if (!Number.isNaN(n) && n >= 1 && n <= 4) thresholdIndex = n - 1;
  }
  if (thresholdIndex === -1) {
    // fallback to critical
    thresholdIndex = order.indexOf('critical');
  }

  // Log all violations for debugging and attach to window for later inspection
  if (results.violations.length) {
    // eslint-disable-next-line no-console
    console.warn('Axe reported violations (detailed):', JSON.stringify(results.violations, null, 2));
    await page.evaluate((payload) => {
      try {
        // @ts-ignore
        window.__AXE_VIOLATIONS__ = payload;
      } catch (e) {
        // ignore
      }
    }, results.violations);
  }

  // Determine which violations meet or exceed the threshold
  const toFail = results.violations.filter((v: any) => {
    const idx = order.indexOf(String(v.impact).toLowerCase());
    return idx >= thresholdIndex;
  });

  // Helpful summary logging
  const counts: Record<string, number> = {};
  results.violations.forEach((v: any) => {
    counts[v.impact] = (counts[v.impact] || 0) + 1;
  });
  // eslint-disable-next-line no-console
  console.info('Axe violations summary:', counts, `Fail threshold: ${order[thresholdIndex]}`);

  // Write a machine-readable file for CI artifacts if any violations exist
  if (results.violations.length) {
    const { writeFileSync } = await import('fs');
    try {
      writeFileSync('axe-violations.json', JSON.stringify(results.violations, null, 2));
    } catch (e) {
      // ignore write errors
    }
  }

  expect(toFail.length).toBe(0);
});
