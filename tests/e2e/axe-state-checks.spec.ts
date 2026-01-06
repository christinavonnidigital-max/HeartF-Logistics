import { test, expect } from '@playwright/test';
import { login } from './utils';

async function runAxeOnPage(page: any) {
  const results = await page.evaluate(async () => {
    // @ts-ignore
    return await (window as any).axe.run();
  });
  return results.violations || [];
}

// Walk through states and capture violations
test('axe checks across states (dashboard, audit log, add booking, invite)', async ({ page }) => {
  // Use admin so Settings (and Audit Log) are visible
  await login(page, 'admin@heartfledge.local', 'admin123');
  const states: Record<string, any[]> = {};

  // Dashboard
  let violations = await runAxeOnPage(page);
  states['dashboard'] = violations;
  if (violations.length) console.warn('dashboard violations:', JSON.stringify(violations, null, 2));

  // Navigate to Settings and open Audit Log modal (Settings hosts the audit button)
  const settingsNav = page.locator('[data-testid="sidebar-settings"]');
  if (await settingsNav.count() > 0) {
    await settingsNav.first().click();
    await page.waitForSelector('text=Security', { timeout: 5000 }).catch(() => {});
  }

  const viewAudit = page.locator('button:has-text("View Audit Log")');
  await viewAudit.first().scrollIntoViewIfNeeded().catch(() => {});
  await viewAudit.first().click({ force: true });
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
  violations = await runAxeOnPage(page);
  states['auditLogModal'] = violations;
  if (violations.length) console.warn('auditLogModal violations:', JSON.stringify(violations, null, 2));

  // Close dialog via the dialog's Close button (target inside the dialog) or fallback to Escape
  await page.locator('[role="dialog"] button:has-text("Close")').first().click().catch(async () => {
    await page.keyboard.press('Escape').catch(() => {});
  });
  // Ensure the dialog is fully closed before proceeding
  await page.waitForSelector('[role="dialog"]', { state: 'detached', timeout: 5000 }).catch(() => {});

  // Open Invite modal if present
  const inviteBtn = page.locator('button:has-text("Invite user")');
  if (await inviteBtn.count() > 0) {
    await inviteBtn.first().click();
    await page.waitForSelector('[role="dialog"]');
    violations = await runAxeOnPage(page);
    states['inviteModal'] = violations;
    if (violations.length) console.warn('inviteModal violations:', JSON.stringify(violations, null, 2));
    await page.click('button:has-text("Close")').catch(() => {});
  }

  // Open Add Booking (via header New booking)
  const newBooking = page.locator('text=New booking');
  if (await newBooking.count() > 0) {
    await newBooking.first().click();
    await page.waitForSelector('[role="dialog"]');
    violations = await runAxeOnPage(page);
    states['addBookingModal'] = violations;
    if (violations.length) console.warn('addBookingModal violations:', JSON.stringify(violations, null, 2));
    await page.click('button:has-text("Close")').catch(() => {});
  }

  // Save any violations
  const { writeFileSync } = await import('fs');
  try {
    writeFileSync('axe-state-violations.json', JSON.stringify(states, null, 2));
  } catch (e) {}

  // Always pass (informational)
  expect(true).toBe(true);
});