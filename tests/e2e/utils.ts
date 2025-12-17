import { Page } from '@playwright/test';

export async function login(page: Page, email: string, password: string, expectedSelector = 'text=Fleet + Bookings Snapshot') {
  // Navigate and wait for the login form
  await page.goto('/');
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  // Click without awaiting a navigation (some flows use client-side state changes), then wait for expected selector
  await page.click('button:has-text("Sign in")', { noWaitAfter: true });
  await page.waitForSelector(expectedSelector, { timeout: 15000 });
}

export async function loginAs(page: Page, role: 'ops' | 'dispatcher' | 'customer' | 'admin' = 'ops') {
  const creds: Record<string, { email: string; pwd: string; selector?: string }> = {
    ops: { email: 'ops@heartfledge.local', pwd: 'routes123' },
    dispatcher: { email: 'dispatcher@heartfledge.local', pwd: 'fleet123' },
    customer: { email: 'customer@heartfledge.local', pwd: 'client123', selector: 'text=Crm Dashboard' },
    admin: { email: 'admin@heartfledge.local', pwd: 'admin123' },
  };

  const { email, pwd, selector } = creds[role] || creds.ops;
  await login(page, email, pwd, selector);
}
