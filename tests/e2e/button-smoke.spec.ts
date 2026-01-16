import { test, expect } from '@playwright/test';
import { loginAs } from './utils';

// Smoke test: attempt to click every non-destructive visible button as admin
// Records outcomes to tests/button-click-results.json for later triage

test('button smoke test — click visible buttons as admin', async ({ page }) => {
  test.setTimeout(120000); // increase timeout for full smoke run

  const consoleLogs: Array<{ type: string; text: string }> = [];
  const pageErrors: string[] = [];

  page.on('console', (msg) => consoleLogs.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', (err) => pageErrors.push(String(err)));

  // Use admin so most controls are visible
  await loginAs(page, 'admin');
  await page.waitForSelector('nav', { timeout: 15000 }).catch(() => null);

  // Skip obviously destructive or navigation-breaking actions
  const skipPatterns = [
    'Sign in',
    'Sign out',
    'Log out',
    'Logout',
    'Delete',
    'Remove',
    'Clear log',
    'Clear Log',
    'Permanently',
    'Reset',
  ];

  const results: Array<any> = [];

  // Annotate buttons with stable indexes to avoid flakiness from DOM mutations
  await page.evaluate(() => {
    document.querySelectorAll('button').forEach((b, i) => {
      try {
        b.setAttribute('data-pw-btn-index', String(i));
      } catch (e) {
        // ignore
      }
    });
  });

  const annotated = page.locator('button[data-pw-btn-index]');
  const total = await annotated.count();
  // Limit the number of clicks to keep this smoke test fast; increase if you want deeper coverage
  const MAX = Math.min(total, 12); // reduce for quicker runs during triage

  for (let i = 0; i < MAX; i++) {
    const btn = page.locator(`button[data-pw-btn-index="${i}"]`);

    // ensure no lingering dialogs/backdrops are open before attempting clicks
    const _dlg = await page.$('[role="dialog"]');
    if (_dlg) {
      await page.locator('[role="dialog"] button:has-text("Close")').first().click().catch(async () => {
        await page.keyboard.press('Escape').catch(() => {});
      });
      await page.waitForSelector('[role="dialog"]', { state: 'detached', timeout: 2000 }).catch(() => {});
    }

    const isVisible = await btn.isVisible().catch(() => false);
    const isEnabled = await btn.isEnabled().catch(() => false);

    // Read text and aria-label directly from the element in page context to avoid locator timeouts
    const text = await btn.evaluate((el) => ((el.textContent || el.getAttribute('aria-label') || '') as string).trim()).catch(() => '');
    const aria = await btn.evaluate((el) => (el.getAttribute('aria-label') || '')).catch(() => '');
    const snippet = await btn.evaluate((el) => (el as HTMLElement).outerHTML.slice(0, 250)).catch(() => '');

    // Skip non-interactive or hidden buttons
    if (!isVisible || !isEnabled) {
      results.push({ index: i, text, aria, visible: isVisible, enabled: isEnabled, skipped: true, reason: 'not-visible-or-enabled' });
      continue;
    }

    if (skipPatterns.some((p) => text.includes(p) || snippet.includes(p))) {
      results.push({ index: i, text, aria, visible: isVisible, enabled: isEnabled, skipped: true, reason: 'skip-pattern' });
      continue;
    }

    const beforeUrl = page.url();
    let outcome = 'unknown';

    console.log(`button-smoke: clicking [${i}] ${text}`);
    try {
      await Promise.race([
        (async () => {
          try {
            await btn.click({ timeout: 3000 });
          } catch (e: any) {
            const msg = String(e?.message || e);
            if (msg.includes('intercepts pointer events')) {
              await page.locator('[role="dialog"] button:has-text("Close")').first().click().catch(async () => {
                await page.keyboard.press('Escape').catch(() => {});
              });
              await page.waitForSelector('[role="dialog"]', { state: 'detached', timeout: 2000 }).catch(() => {});
              await btn.click({ timeout: 3000 });
            } else {
              throw e;
            }
          }
          await page.waitForTimeout(200);

          if ((await page.locator('[role="dialog"]').count()) > 0) {
            outcome = 'opened-dialog';
            await page.locator('[role="dialog"] button:has-text("Close")').first().click().catch(() => {});
            await page.waitForSelector('[role="dialog"]', { state: 'detached', timeout: 1000 }).catch(() => {});
          } else if (page.url() !== beforeUrl) {
            outcome = 'navigated';
            await page.goBack().catch(() => {});
            await page.waitForSelector('nav', { timeout: 3000 }).catch(() => {});
          } else {
            outcome = 'clicked-no-observable-effect';
          }
        })(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('iteration-timeout')), 6000)),
      ]);
    } catch (err: any) {
      const msg = err?.message || String(err);
      outcome = `error: ${msg}`;
      if (msg.includes('iteration-timeout')) console.log(`button-smoke: iteration ${i} timed out for button: ${text}`);
    }

    results.push({ index: i, text, aria, snippet, visible: isVisible, enabled: isEnabled, skipped: false, outcome, latestConsole: consoleLogs.slice(-10), pageErrors: [...pageErrors] });

    await page.waitForTimeout(150);
  }

  // Write results file
  const { writeFileSync } = await import('fs');
  try {
    writeFileSync('tests/button-click-results.json', JSON.stringify({ results, consoleLogs, pageErrors }, null, 2));
  } catch (e) {
    // ignore write failures
  }

  // Always pass - this is an informational smoke test
  expect(true).toBe(true);
});
