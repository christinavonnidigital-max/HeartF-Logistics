import { test, expect } from '@playwright/test';
import { loginAs } from './utils';

test('admin can open settings and invite a user', async ({ page }) => {
  await loginAs(page, 'admin');

  // Open settings from sidebar
  await page.click('button:has-text("Settings")');
  await page.waitForSelector('text=System settings');

  // The invite button should be visible and open the invite modal
  await page.click('button:has-text("Invite User")');
  await page.waitForSelector('text=Invite Team Member');

  // Fill invite modal and submit to ensure addUser flow works for admins
  await page.fill('input[name="first_name"]', 'Test');
  await page.fill('input[name="last_name"]', 'Admin');
  await page.fill('input[name="email"]', 'test.admin@heartfledge.local');
  await page.click('button:has-text("Send Invitation")');

  // The modal should close and the new user should appear in the user list
  await page.waitForSelector('text=Test Admin');
  const found = await page.locator('text=Test Admin').count();
  expect(found).toBeGreaterThan(0);
});
