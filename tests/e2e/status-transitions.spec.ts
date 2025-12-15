import { test, expect } from '@playwright/test';
import { login } from './utils';

test('status transitions are tracked and produce audit events', async ({ page }) => {
  // Login as dispatcher
  await login(page, 'dispatcher@heartfledge.local', 'fleet123');

  await expect(page.locator('text=Fleet + Bookings Snapshot')).toBeVisible({ timeout: 5000 });

  // Create a new booking
  await page.click('button:has-text("New Booking")');
  await expect(page.locator('role=dialog')).toBeVisible();
  await page.selectOption('select[name="customer_id"]', '101');
  await page.fill('input[placeholder="City*"]', 'Harare Test');
  await page.fill('input[placeholder="City*"] >> nth=1', 'Bulawayo Test');
  await page.fill('input[name="base_price"]', '100');

  // submit the booking form programmatically
  await page.evaluate(() => {
    const f = document.getElementById('add-booking-form');
    if (f) f.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });

  await expect(page.locator('role=dialog')).toBeHidden({ timeout: 5000 });

  // Read the booking number we just created from localStorage
  const bookingNumber = await page.evaluate(() => {
    const raw = localStorage.getItem('hf_global_data_v1');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.bookings && parsed.bookings[0] && parsed.bookings[0].booking_number;
  });

  expect(bookingNumber).toBeTruthy();

  // Navigate to the Bookings page then open the booking details
  const openNav = page.locator('button[aria-label="Open navigation"]');
  if (await openNav.isVisible()) {
    await openNav.click();
  }
  await page.click('button:has-text("Bookings")');
  await expect(page.locator('text=Bookings Board')).toBeVisible();

  // Click the booking card to open details (use container selector)
  // Open booking details via test event to avoid brittle UI interactions
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

  // The Booking details modal does not use role=dialog; check for the 'Status timeline' heading instead
  await expect(page.locator('text=Status timeline')).toBeVisible({ timeout: 5000 });

  // Move to Confirmed
  const confirmBtn = page.locator('button:has-text("Move to Confirmed")');
  await expect(confirmBtn).toBeEnabled();
  await confirmBtn.click();

  // Expect audit entry for the transition pending -> confirmed
  await page.waitForTimeout(200);
  const data = await page.evaluate(() => localStorage.getItem('hf_global_data_v1'));
  const parsed = JSON.parse(data || '{}');
  const audit = parsed.auditLog && parsed.auditLog[0];
  expect(audit).toBeTruthy();
  expect(audit.meta && audit.meta.from).toBe('pending');
  expect(audit.meta && audit.meta.to).toBe('confirmed');

  // Move to Dispatched (from confirmed)
  const dispatchBtn = page.locator('button:has-text("Move to Dispatched")');
  await expect(dispatchBtn).toBeEnabled();
  await dispatchBtn.click();

  // Expect audit entry for the transition confirmed -> dispatched
  await page.waitForTimeout(200);
  const data2 = await page.evaluate(() => localStorage.getItem('hf_global_data_v1'));
  const parsed2 = JSON.parse(data2 || '{}');
  const audit2 = parsed2.auditLog && parsed2.auditLog[0];
  expect(audit2).toBeTruthy();
  expect(audit2.meta && audit2.meta.from).toBe('confirmed');
  expect(audit2.meta && audit2.meta.to).toBe('dispatched');

  // Move to In Transit (if available) and then Delivered
  const transitBtn = page.locator('button:has-text("Move to In Transit")');
  if (await transitBtn.count()) {
    await expect(transitBtn).toBeEnabled();
    await transitBtn.click();

    await page.waitForTimeout(200);
    const data3 = await page.evaluate(() => localStorage.getItem('hf_global_data_v1'));
    const parsed3 = JSON.parse(data3 || '{}');
    const audit3 = parsed3.auditLog && parsed3.auditLog[0];
    expect(audit3).toBeTruthy();
    expect(audit3.meta && audit3.meta.from).toBe('dispatched' || 'confirmed');
    expect(audit3.meta && audit3.meta.to).toBe('in_transit');

    const deliveredBtn = page.locator('button:has-text("Move to Delivered")');
    if (await deliveredBtn.count()) {
      await expect(deliveredBtn).toBeEnabled();
      await deliveredBtn.click();

      await page.waitForTimeout(200);
      const data4 = await page.evaluate(() => localStorage.getItem('hf_global_data_v1'));
      const parsed4 = JSON.parse(data4 || '{}');
      const audit4 = parsed4.auditLog && parsed4.auditLog[0];
      expect(audit4).toBeTruthy();
      expect(audit4.meta && audit4.meta.to).toBe('delivered');
    }
  }
});
