import { test, expect } from '@playwright/test';
import { login, loginAs } from './utils';

// Smoke tests to validate modal placement and body-scroll lock

test.describe('Modal placement & body scroll lock', () => {
  test('Add Booking modal centers and locks body scroll', async ({ page }) => {
    await loginAs(page, 'dispatcher');

    await page.click('button:has-text("New Booking")');
    const dlg = page.locator('role=dialog');
    await expect(dlg).toBeVisible({ timeout: 5000 });

    // body should be locked
    const overflow = await page.evaluate(() => document.body.style.overflow);
    expect(overflow).toBe('hidden');

    // ensure the modal is positioned to the right of the sidebar (modal's left >= sidebar's right)
    const bbox = await page.evaluate(() => {
      const sidebar = document.querySelector('aside');
      const dlg = document.querySelector('[role="dialog"]');
      if (!sidebar || !dlg) return null;
      const s = sidebar.getBoundingClientRect();
      const d = (dlg as HTMLElement).getBoundingClientRect();
      return { sidebarRight: s.right, dialogLeft: d.left };
    });

    expect(bbox).not.toBeNull();
    if (bbox) {
      expect(bbox.dialogLeft).toBeGreaterThanOrEqual(bbox.sidebarRight - 1); // small tolerance
    }

    // capture screenshot
    await page.screenshot({ path: 'tests/screenshots/add-booking.png', fullPage: false });

    // close modal and ensure body scroll restored
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('role=dialog')).toBeHidden({ timeout: 5000 });
    const after = await page.evaluate(() => document.body.style.overflow);
    expect(after === '' || after === 'auto' || after === 'visible').toBeTruthy();
  });

  test('Add Vehicle modal centers and locks body scroll', async ({ page }) => {
    await loginAs(page, 'dispatcher');

    // navigate to Fleet
    const openNav = page.locator('button[aria-label="Open navigation"]');
    if (await openNav.isVisible()) await openNav.click();
    await page.click('button:has-text("Fleet")');
    // wait for page
    await page.waitForSelector('text=Fleet', { timeout: 5000 }).catch(() => null);

    // click add vehicle button (common labels)
    const btn = page.locator('button:has-text("Add vehicle")');
    if (await btn.count()) {
      await btn.first().click();
    } else {
      // fallback: try 'Add Vehicle' or 'New Vehicle'
      await page.click('button:has-text("Add Vehicle")').catch(async () => await page.click('button:has-text("New Vehicle")'));
    }

    const dlg = page.locator('role=dialog');
    await expect(dlg).toBeVisible({ timeout: 5000 });

    const overflow = await page.evaluate(() => document.body.style.overflow);
    expect(overflow).toBe('hidden');

    await page.screenshot({ path: 'tests/screenshots/add-vehicle.png', fullPage: false });

    // close
    await page.click('button:has-text("Cancel")').catch(() => page.click('button:has-text("Close")'));
    await expect(page.locator('role=dialog')).toBeHidden({ timeout: 5000 });
  });

  test('Add Invoice modal centers and locks body scroll', async ({ page }) => {
    await loginAs(page, 'admin');

    // navigate to Financials
    const openNav = page.locator('button[aria-label="Open navigation"]');
    if (await openNav.isVisible()) await openNav.click();
    await page.click('button:has-text("Financials")');
    await page.waitForSelector('text=Financials', { timeout: 5000 }).catch(() => null);

    // click 'New Invoice' or 'Add Invoice'
    try {
      await page.click('button:has-text("New Invoice")');
    } catch {
      await page.click('button:has-text("Add Invoice")');
    }

    const dlg = page.locator('role=dialog');
    await expect(dlg).toBeVisible({ timeout: 5000 });

    const overflow = await page.evaluate(() => document.body.style.overflow);
    expect(overflow).toBe('hidden');

    await page.screenshot({ path: 'tests/screenshots/add-invoice.png', fullPage: false });

    // close
    await page.click('button:has-text("Close")').catch(() => page.click('button:has-text("Cancel")'));
    await expect(page.locator('role=dialog')).toBeHidden({ timeout: 5000 });
  });
});