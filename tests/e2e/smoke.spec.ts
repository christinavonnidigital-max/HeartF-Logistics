import { test, expect } from '@playwright/test';
import { loginAs } from './utils';

test('Dashboard smoke: layout, modal scrolling, sidebar, icons', async ({ page }) => {
  // Ensure we are authenticated
  await loginAs(page, 'dispatcher');

  // Page loads and header present
  await expect(page.locator('text=Dashboard Overview')).toBeVisible({ timeout: 5000 });

  // KPIs: check at least one KPI label (match the first occurrence to avoid strict-mode conflicts)
  await expect(page.locator('text=Active jobs', { exact: false }).first()).toBeVisible();

  // Open the New Booking modal and check dialog visibility using role-based selector (robust + case-insensitive)
  // If the dashboard quick-action isn't available, navigate to the Bookings page and open it there
  const openNav = page.locator('button[aria-label="Open navigation"]');
  if (await openNav.isVisible()) await openNav.click();
  await page.getByRole('button', { name: /Bookings/i }).first().click();
  await page.waitForSelector('text=Bookings Board', { timeout: 5000 }).catch(() => null);

  await page.getByRole('button', { name: /New booking|New Booking|Request Booking/i }).first().click();
  const dialog = page.locator('role=dialog');
  await dialog.waitFor({ state: 'visible', timeout: 5000 });
  await expect(dialog.getByRole('heading', { name: /Create booking|Request a booking/i })).toBeVisible({ timeout: 5000 });

  // Modal body should be scrollable and present
  await expect(dialog.locator('.overflow-y-auto')).toBeVisible();

  // Footer should be present and pinned (has border top)
  await expect(dialog.locator('.border-t')).toBeVisible();

  // Close modal
  await page.click('button[aria-label="Close"]');
  await expect(dialog).toHaveCount(0);

  // Sidebar: nav should have min-h-0 and overflow-y-auto
  await expect(page.locator('nav.min-h-0')).toBeVisible();
  await expect(page.locator('nav.overflow-y-auto')).toBeVisible();

  // Icons: ensure sidebar contains SVG elements with stroke attribute
  const firstSvg = page.locator('aside svg').first();
  await expect(firstSvg).toHaveAttribute('stroke', 'currentColor');

  // Ensure there is at least one SVG in the sidebar (icon presence)
  const svgCount = await page.locator('aside svg').count();
  expect(svgCount).toBeGreaterThan(0);
});
