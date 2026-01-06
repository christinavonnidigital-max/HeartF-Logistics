import { test, expect } from '@playwright/test';
import { loginAs } from './utils';

test('debug audit log modal', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  page.on('console', (msg) => console.log('PAGE CONSOLE:', msg.text()));
  page.on('pageerror', (err) => console.log('PAGE ERROR:', err));
  page.on('response', async (r) => {
    if (r.status() >= 400) {
      console.log('BAD RESPONSE:', r.status(), r.url(), await r.text().catch(() => '<no body>'));
    }
  });

  await loginAs(page, 'admin');

  // open settings from sidebar
  const settingsBtn = page.locator('button:has-text("Settings")');
  if (await settingsBtn.isVisible()) await settingsBtn.click();
  await page.waitForSelector('text=System settings', { timeout: 5000 });

  // click View Audit Log
  const viewBtn = page.locator('button:has-text("View Audit Log")');
  if (await viewBtn.isVisible()) {
    await viewBtn.click();
    await page.waitForSelector('text=Audit Log', { timeout: 5000 });

    // capture screenshot
    await page.screenshot({ path: 'tests/screenshots/debug-audit.png', fullPage: false });

    const dlg = await page.locator('role=dialog');
    console.log('DIALOG COUNT:', await dlg.count());
    const body = await dlg.innerHTML().catch(() => 'no dialog html');
    console.log('DIALOG HTML SLICE:', body.slice(0, 1000));
  } else {
    console.log('View Audit Log button not visible - permission issue or UI changed');
  }

  expect(true).toBeTruthy();
});