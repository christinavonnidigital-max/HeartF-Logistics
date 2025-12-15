import { test, expect } from '@playwright/test';

test('login page accessibility check with axe-core', async ({ page }) => {
  await page.goto('/');

  // Inject axe-core from the local package
  const { createRequire } = await import('module');
  const require = createRequire(import.meta.url);
  const path = require.resolve('axe-core/axe.min.js');
  const { readFileSync } = await import('fs');
  const src = readFileSync(path, 'utf8');
  await page.addScriptTag({ content: src });
  const results = await page.evaluate(async () => {
    // @ts-ignore
    // Axe can sometimes be invoked concurrently in CI when tests run in parallel.
    // Retry a few times if we get an "Axe is already running" error.
    const maxTries = 3;
    for (let i = 0; i < maxTries; i++) {
      try {
        // @ts-ignore
        return await (window as any).axe.run();
      } catch (err: any) {
        const msg = String(err && err.message ? err.message : err);
        if (/Axe is already running/.test(msg) && i < maxTries - 1) {
          // small backoff
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 300));
          continue;
        }
        throw err;
      }
    }
    throw new Error('Unable to run axe after retries');
  });

  // Determine threshold
  const rawThreshold = process.env.AXE_FAIL_SEVERITY || 'serious';
  const order = ['minor', 'moderate', 'serious', 'critical'];
  let thresholdIndex = order.indexOf(String(rawThreshold).toLowerCase());
  if (thresholdIndex === -1) {
    const n = parseInt(String(rawThreshold), 10);
    if (!Number.isNaN(n) && n >= 1 && n <= 4) thresholdIndex = n - 1;
  }
  if (thresholdIndex === -1) thresholdIndex = order.indexOf('serious');

  // Log and attach
  if (results.violations.length) {
    // eslint-disable-next-line no-console
    console.warn('Login page Axe violations (detailed):', JSON.stringify(results.violations, null, 2));
    try {
      const { writeFileSync } = await import('fs');
      writeFileSync('axe-violations-login.json', JSON.stringify(results.violations, null, 2));
    } catch (e) {
      // ignore
    }
  }

  const toFail = results.violations.filter((v: any) => order.indexOf(String(v.impact).toLowerCase()) >= thresholdIndex);

  expect(toFail.length).toBe(0);
});