import { test, expect } from '@playwright/test';
import { login } from './utils';

test('clear audit log via Audit Log modal', async ({ page }) => {
  // Login as ops manager
  await login(page, 'ops@heartfledge.local', 'routes123');

  await expect(page.locator('text=Fleet + Bookings Snapshot')).toBeVisible({ timeout: 5000 });

  // Create a booking to generate an audit entry
  await page.click('button:has-text("New Booking")');
  await expect(page.locator('role=dialog')).toBeVisible();
  await page.selectOption('select[name="customer_id"]', '101');
  await page.fill('input[placeholder="City*"]', 'Harare Test');
  await page.fill('input[placeholder="City*"] >> nth=1', 'Bulawayo Test');
  await page.fill('input[name="base_price"]', '200');
  await page.evaluate(() => { const f = document.getElementById('add-booking-form'); if (f) f.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
  await expect(page.locator('role=dialog')).toBeHidden({ timeout: 5000 });

  // Open Settings -> Audit Log
  const openNav = page.locator('button[aria-label="Open navigation"]');
  if (await openNav.isVisible()) await openNav.click();
  const settingsEl = page.locator('text=Settings').first();
  await settingsEl.waitFor({ state: 'visible', timeout: 5000 });
  await page.evaluate(() => { const nav = document.querySelector('nav'); if (nav) nav.scrollTop = nav.scrollHeight; });
  await settingsEl.evaluate((el: HTMLElement) => (el as HTMLElement).click());

  await page.click('button:has-text("View Audit Log")');
  await expect(page.locator('role=dialog')).toBeVisible();

  // There should be at least one audit entry
  const data = await page.evaluate(() => localStorage.getItem('hf_global_data_v1'));
  const parsed = JSON.parse(data || '{}');
  expect(parsed.auditLog && parsed.auditLog.length).toBeGreaterThan(0);

  // Click Clear Log and confirm the list is empty
  await page.click('button:has-text("Clear Log")');
  await page.waitForTimeout(100);
  const data2 = await page.evaluate(() => localStorage.getItem('hf_global_data_v1'));
  const parsed2 = JSON.parse(data2 || '{}');
  expect(parsed2.auditLog && parsed2.auditLog.length).toBe(0);
});
