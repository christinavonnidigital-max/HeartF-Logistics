import { test } from '@playwright/test';
import { loginAs } from './utils';

test('debug settings page content', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.click('button:has-text("Settings")');
  await page.waitForSelector('text=System settings');

  const content = await page.content();
  console.log('--- PAGE HTML START ---');
  console.log(content.slice(0, 20000));
  console.log('--- PAGE HTML END ---');

  // Save a screenshot for visual debugging
  await page.screenshot({ path: 'debug-settings.png', fullPage: true });
  console.log('screenshot saved: debug-settings.png');
});