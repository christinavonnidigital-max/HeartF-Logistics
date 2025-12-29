import { test, expect } from '@playwright/test';
import { login } from './utils';

test('customer role cannot change booking status (buttons disabled)', async ({ page }) => {
  // Login as customer
  await login(page, 'customer@heartfledge.local', 'client123');

  await expect(page.locator('text=Fleet + Bookings Snapshot')).toBeVisible({ timeout: 5000 });

  // Create a booking (customers pre-fill their own customer id)
  await page.click('button:has-text("Request Booking")');
  await expect(page.locator('role=dialog')).toBeVisible();
  await page.fill('input[placeholder="City*"]', 'Harare Test');
  await page.fill('input[placeholder="City*"] >> nth=1', 'Bulawayo Test');
  await page.fill('input[name="base_price"]', '250');

  await page.evaluate(() => {
    const f = document.getElementById('add-booking-form');
    if (f) f.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });

  await expect(page.locator('role=dialog')).toBeHidden({ timeout: 5000 });

  // Read the booking number
  const bookingNumber = await page.evaluate(() => {
    const raw = localStorage.getItem('hf_global_data_v1');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.bookings && parsed.bookings[0] && parsed.bookings[0].booking_number;
  });

  expect(bookingNumber).toBeTruthy();

  // Navigate to Bookings page and open details
  const openNav = page.locator('button[aria-label="Open navigation"]');
  if (await openNav.isVisible()) {
    await openNav.click();
  }
  await page.click('button:has-text("Bookings")');
  await expect(page.locator('text=Bookings Board')).toBeVisible();

  // Click the booking card to open details
  // Open booking details via a test event to avoid flaky UI clicks
  const bookingId = await page.evaluate((num) => {
    const raw = localStorage.getItem('hf_global_data_v1');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const b = (parsed.bookings || []).find((x: any) => x.booking_number === num);
    return b ? b.id : null;
  }, bookingNumber);
  expect(bookingId).toBeTruthy();
  await page.evaluate((id) => {
    window.dispatchEvent(new CustomEvent('hf:open-booking', { detail: { bookingId: id } }));
  }, bookingId);
  // allow React to process the custom event and mount the modal
  await page.waitForTimeout(200);

  // Check for the booking details modal by heading text
  await expect(page.locator('text=Status timeline')).toBeVisible({ timeout: 5000 });

  const confirmBtn = page.locator('button:has-text("Move to Confirmed")');
  await expect(confirmBtn).toBeDisabled();
});
