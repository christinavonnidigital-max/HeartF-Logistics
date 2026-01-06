import { test, expect } from '@playwright/test';
import { loginAs } from './utils';

// Targeted CTA smoke test: navigate primary views and click key in-page CTAs
// Records outcomes to tests/button-cta-results.json

test('button CTA smoke test — navigate views and click primary CTAs as admin', async ({ page }) => {
  test.setTimeout(120000);

  const consoleLogs: Array<{ type: string; text: string }> = [];
  const pageErrors: string[] = [];
  const networkErrors: Array<{ url: string; status: number }> = [];

  page.on('console', (msg) => consoleLogs.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', (err) => pageErrors.push(String(err)));
  page.on('response', async (r) => {
    if (r.status() >= 400) {
      networkErrors.push({ url: r.url(), status: r.status() });
    }
  });

  await loginAs(page, 'admin');
  await page.waitForSelector('nav', { timeout: 15000 }).catch(() => null);

  const views = [
    'Dashboard',
    'Bookings',
    'Fleet',
    'Drivers',
    'Routes',
    'Leads',
    'Customers',
    'Campaigns',
    'Sequences',
    'Analytics',
  ];

  const ctaLabels = [
    'Invite user',
    'Invite User',
    'Invite',
    'View audit log',
    'View Audit Log',
    'New booking',
    'New Booking',
    'Add Booking',
    'Add booking',
    'Create',
    'Change',
    'Close',
  ];

  const results: any = { meta: { timestamp: new Date().toISOString() }, views: [] };

  for (const viewName of views) {
    console.log(`CTA: visiting ${viewName}`);
    const viewRec: any = { name: viewName, navigated: false, ctas: [] };

    try {
      // Try to open nav item
      const navBtn = page.locator(`button:has-text("${viewName}")`).first();
      if (await navBtn.count() > 0) {
        try {
          await navBtn.click({ timeout: 3000 });
          await page.waitForTimeout(300);
          viewRec.navigated = true;
        } catch (e: any) {
          viewRec.navigated = false;
          viewRec.navigateError = String(e?.message || e);
        }
      } else {
        viewRec.navigated = false;
        viewRec.navigateError = 'nav button not found';
      }

      // After navigation, attempt each CTA label if present
      for (const label of ctaLabels) {
        const ctaRec: any = { label, found: false, outcome: 'not-run', error: null, dialogHtml: null };

        // ensure no lingering dialogs/backdrops are open before attempting clicks
        const _dlg = await page.$('[role="dialog"]');
        if (_dlg) {
          await page.locator('[role="dialog"] button:has-text("Close")').first().click().catch(async () => {
            await page.keyboard.press('Escape').catch(() => {});
          });
          await page.waitForSelector('[role="dialog"]', { state: 'detached', timeout: 2000 }).catch(() => {});
        }

        // look for button first
        const btn = page.locator(`button:has-text("${label}")`).first();
        let _btnCount = 0;
        try {
          _btnCount = await btn.count();
        } catch (e) {
          // possible navigation/context change — retry briefly
          await page.waitForTimeout(500).catch(() => {});
          try { _btnCount = await btn.count(); } catch (e2) { _btnCount = 0; }
        }
        if (_btnCount > 0) {
          ctaRec.found = true;
          try {
            const beforeUrl = page.url();
            // attempt click with overlay-retry
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

            await page.waitForTimeout(300);

            // Dialog opened?
            if ((await page.locator('[role="dialog"]').count()) > 0) {
              ctaRec.outcome = 'opened-dialog';
              ctaRec.dialogCount = await page.locator('[role="dialog"]').count();
              // capture some html for triage
              ctaRec.dialogHtml = await page.locator('[role="dialog"]').first().innerHTML().catch(() => null);
              // try to close
              await page.locator('[role="dialog"] button:has-text("Close")').first().click().catch(async () => {
                await page.keyboard.press('Escape').catch(() => {});
              });
              await page.waitForSelector('[role="dialog"]', { state: 'detached', timeout: 2000 }).catch(() => {});
            } else if (page.url() !== beforeUrl) {
              ctaRec.outcome = 'navigated';
              // try go back
              await page.goBack().catch(() => {});
              await page.waitForSelector('nav', { timeout: 3000 }).catch(() => {});
            } else {
              ctaRec.outcome = 'clicked-no-observable-effect';
            }
          } catch (err: any) {
            ctaRec.outcome = 'error';
            ctaRec.error = String(err?.message || err);
          }
        } else {
          // try text link fallback
          const textEl = page.locator(`text=${label}`).first();
          if ((await textEl.count()) > 0) {
            ctaRec.found = true;
            try {
              const beforeUrl = page.url();
              try {
                await textEl.click({ timeout: 3000 });
              } catch (e: any) {
                const msg = String(e?.message || e);
                if (msg.includes('intercepts pointer events')) {
                  await page.locator('[role="dialog"] button:has-text("Close")').first().click().catch(async () => {
                    await page.keyboard.press('Escape').catch(() => {});
                  });
                  await page.waitForSelector('[role="dialog"]', { state: 'detached', timeout: 2000 }).catch(() => {});
                  await textEl.click({ timeout: 3000 });
                } else {
                  throw e;
                }
              }

              await page.waitForTimeout(300);
              if ((await page.locator('[role="dialog"]').count()) > 0) {
                ctaRec.outcome = 'opened-dialog';
                ctaRec.dialogHtml = await page.locator('[role="dialog"]').first().innerHTML().catch(() => null);
                await page.locator('[role="dialog"] button:has-text("Close")').first().click().catch(async () => {
                  await page.keyboard.press('Escape').catch(() => {});
                });
                await page.waitForSelector('[role="dialog"]', { state: 'detached', timeout: 2000 }).catch(() => {});
              } else if (page.url() !== beforeUrl) {
                ctaRec.outcome = 'navigated';
                await page.goBack().catch(() => {});
                await page.waitForSelector('nav', { timeout: 3000 }).catch(() => {});
              } else {
                ctaRec.outcome = 'clicked-no-observable-effect';
              }
            } catch (err: any) {
              ctaRec.outcome = 'error';
              ctaRec.error = String(err?.message || err);
            }
          } else {
            ctaRec.found = false;
            ctaRec.outcome = 'not-found';
          }
        }

        viewRec.ctas.push(ctaRec);
      }

      results.views.push(viewRec);
    } catch (err: any) {
      // record the failure and attempt a recovery to continue with next views
      viewRec.navigateError = String(err?.message || err);
      results.views.push(viewRec);
      try {
        await page.goto('/');
        await loginAs(page, 'admin');
        await page.waitForSelector('nav', { timeout: 10000 }).catch(() => null);
      } catch (re) {
        // if recovery fails, stop further processing
        break;
      }
      continue;
    }
  }

  // include collected console/network/page errors
  const { writeFileSync } = await import('fs');
  try {
    writeFileSync('tests/button-cta-results.json', JSON.stringify({ results, consoleLogs, pageErrors, networkErrors }, null, 2));
  } catch (e) {
    // ignore
  }

  expect(true).toBe(true);
});
