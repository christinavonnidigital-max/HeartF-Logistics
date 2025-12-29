import { test } from '@playwright/test';
import { loginAs } from './utils';

test('debug invite/audit buttons', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.click('button:has-text("Settings")');
  await page.waitForSelector('text=System settings');

  const inviteCount = await page.locator('button:has-text("Invite User")').count();
  console.log('Invite button count:', inviteCount);
  if (inviteCount > 0) {
    const inviteVisible = await page.locator('button:has-text("Invite User")').isVisible();
    console.log('Invite visible:', inviteVisible);
    const box = await page.locator('button:has-text("Invite User")').boundingBox();
    console.log('Invite bounding box:', box);
  }

  const auditCount = await page.locator('button:has-text("View Audit Log")').count();
  console.log('View Audit Log count:', auditCount);
  if (auditCount > 0) {
    const auditVisible = await page.locator('button:has-text("View Audit Log")').isVisible();
    console.log('View Audit Log visible:', auditVisible);
    const box2 = await page.locator('button:has-text("View Audit Log")').boundingBox();
    console.log('View Audit Log bounding box:', box2);
  }

});