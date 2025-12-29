import { test, expect } from '@playwright/test';
import { login } from './utils';

test('create booking adds audit entry', async ({ page }) => {
  // Login as ops manager
  await login(page, 'ops@heartfledge.local', 'routes123');

  // Ensure dashboard loaded
  await expect(page.locator('text=Fleet + Bookings Snapshot')).toBeVisible({ timeout: 5000 });

  // Open New Booking quick action
  await page.click('button:has-text("New Booking")');

  // Wait for modal to appear
  await expect(page.locator('role=dialog')).toBeVisible();

  // Fill customer select
  await page.selectOption('select[name="customer_id"]', '101');

  // Fill pickup/delivery
  await page.fill('input[placeholder="City*"]', 'Harare Test');
  // second city input (delivery) - pick second matching
  await page.fill('input[placeholder="City*"] >> nth=1', 'Bulawayo Test');

  // Fill base price
  await page.fill('input[name="base_price"]', '500');

  // Submit the form
  const submitBtn = page.locator('button:has-text("Create booking")');
  await submitBtn.scrollIntoViewIfNeeded();
  // Submit via dispatchEvent to ensure React onSubmit handler runs (avoids viewport click issues)
  await page.evaluate(() => {
    const f = document.getElementById('add-booking-form');
    if (f) f.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });

  // Wait for the modal to close
  await expect(page.locator('role=dialog')).toBeHidden({ timeout: 5000 });

  // Check localStorage for audit entry
  const data = await page.evaluate(() => localStorage.getItem('hf_global_data_v1'));
  expect(data).not.toBeNull();
  const parsed = JSON.parse(data || '{}');
  expect(parsed.auditLog && parsed.auditLog.length).toBeGreaterThan(0);
  const entry = parsed.auditLog[0];
  expect(entry.action).toBe('booking.status.change');
  expect(entry.entity && entry.entity.type).toBe('booking');
  expect(entry.meta && entry.meta.booking_number).toBeDefined();
});
