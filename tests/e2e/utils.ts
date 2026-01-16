import { Page } from '@playwright/test';

export async function login(page: Page, email: string, password: string, expectedSelector = 'text=Fleet + Bookings Snapshot') {
  // Navigate and wait for the login form
  await page.goto('/');
  const canUseTestLogin = await page
    .waitForFunction(() => typeof (window as any).__hfTestLogin === 'function', null, { timeout: 5000 })
    .then(() => true)
    .catch(() => false);

  if (canUseTestLogin) {
    const ok = await page.evaluate(
      ({ email: e, password: p }) => {
        const fn = (window as any).__hfTestLogin;
        return typeof fn === 'function' ? fn(e, p) : false;
      },
      { email, password }
    );
    if (!ok) {
      throw new Error(`Test login failed for ${email}`);
    }
  } else {
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    // Click without awaiting a navigation (some flows use client-side state changes), then wait for expected selector
    const form = page.locator('form', { has: page.locator('input[type="email"]') }).first();
    const submit = form.locator('button[type="submit"]');
    if (await submit.count()) {
      await submit.first().click({ noWaitAfter: true });
    } else {
      await page.getByRole('button', { name: /login|sign in/i }).first().click({ noWaitAfter: true });
    }
  }
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
