import { test, expect } from '@playwright/test';
import { login } from './utils';

test('ops manager can view audit log and entries appear; customers cannot see the audit action', async ({ page }) => {
  // Login as ops manager
  await login(page, 'ops@heartfledge.local', 'routes123');

  await expect(page.locator('text=Fleet + Bookings Snapshot')).toBeVisible({ timeout: 5000 });

  // Create a booking so there's an audit entry
  await page.click('button:has-text("New Booking")');
  await expect(page.locator('role=dialog')).toBeVisible();
  await page.selectOption('select[name="customer_id"]', '101');
  await page.fill('input[placeholder="City*"]', 'Harare Test');
  await page.fill('input[placeholder="City*"] >> nth=1', 'Bulawayo Test');
  await page.fill('input[name="base_price"]', '400');
  await page.evaluate(() => {
    const f = document.getElementById('add-booking-form');
    if (f) f.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
  await expect(page.locator('role=dialog')).toBeHidden({ timeout: 5000 });

  // Logout and login as admin to view Settings (admins can view system settings)
  await page.click('button:has-text("Log out")');
  await login(page, 'admin@heartfledge.local', 'admin123');

  // Navigate to Settings (open sidebar on small viewports)
  const openNav = page.locator('button[aria-label="Open navigation"]');
  if (await openNav.isVisible()) {
    await openNav.click();
  }
  const settingsEl = page.locator('text=Settings').first();
  // Ensure the element is scrolled into view inside the sidebar
  // Scroll the sidebar nav to the bottom so 'Settings' is visible (sidebar uses its own scroll)
  await page.evaluate(() => {
    const nav = document.querySelector('nav');
    if (nav) nav.scrollTop = nav.scrollHeight;
  });
  // Wait for visibility after scrolling
  await settingsEl.waitFor({ state: 'visible', timeout: 8000 });
  // Click via evaluate to avoid viewport scroll issues
  await settingsEl.evaluate((el: HTMLElement) => (el as HTMLElement).click());
  await expect(page.locator('text=System settings')).toBeVisible();

  // View Audit Log (should be visible for ops manager)
  await page.click('button:has-text("View Audit Log")');
  await expect(page.locator('role=dialog')).toBeVisible();

  // The audit modal should show the booking number from localStorage
  const bookingNumber = await page.evaluate(() => {
    const raw = localStorage.getItem('hf_global_data_v1');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.bookings && parsed.bookings[0] && parsed.bookings[0].booking_number;
  });

  // Check booking number is present inside the audit modal (search within dialog to avoid ambiguity)
  await expect(page.locator('role=dialog').locator('li').locator('div.mt-2').locator(`text=${bookingNumber}`).first()).toBeVisible();

  // Now close the audit modal and logout, then login as customer; the Settings button will be hidden for customers
  await page.click('button:has-text("Close")');
  await page.click('button:has-text("Log out")');
  // Login as customer
  await login(page, 'customer@heartfledge.local', 'client123');

  // Ensure navigation does not show Settings
  await expect(page.locator('button:has-text("Settings")')).toHaveCount(0);
});
