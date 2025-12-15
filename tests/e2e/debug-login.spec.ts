import { test } from '@playwright/test';

test('debug login page content', async ({ page }) => {
  page.on('console', (msg) => console.log('PAGE CONSOLE:', msg.text()));
  page.on('pageerror', (err) => console.log('PAGE ERROR:', err));
  page.on('response', async (r) => {
    if (r.status() >= 400) {
      console.log('BAD RESPONSE:', r.status(), r.url(), await r.text().catch(() => '<no body>'));
    }
  });
  await page.goto('/');
  // print a slice of the HTML for debugging
  const body = await page.locator('body').innerHTML();
  console.log('BODY HTML (first 2000 chars):\n', body.slice(0, 2000));
  const overlayHTML = await page.locator('vite-error-overlay').evaluate((el) => (el as HTMLElement).outerHTML).catch(() => 'no overlay');
  console.log('VITE OVERLAY HTML:\n', overlayHTML.slice(0, 4000));

  // Try dynamically importing the AddRouteModal module to surface any runtime import errors
  const importResult = await page.evaluate(async () => {
    try {
      const m = await import('/components/AddRouteModal.tsx');
      return { keys: Object.keys(m) };
    } catch (err: any) {
      return { error: String(err && err.message ? err.message : err) };
    }
  });
  console.log('DYNAMIC IMPORT RESULT:', importResult);

  const iconsImport = await page.evaluate(async () => {
    try {
      const a = await import('/components/icons/index.tsx');
      const b = await import('/components/icons/lucide.tsx');
      return { indexKeys: Object.keys(a), lucideKeys: Object.keys(b) };
    } catch (err: any) {
      return { error: String(err && err.message ? err.message : err) };
    }
  });
  console.log('ICONS IMPORT RESULT:', iconsImport);
  // Capture any dev-mode axe violations exposed on window by the app
  const devViolations = await page.evaluate(() => (window as any).__axeViolations__ || null);
  if (devViolations) {
    console.log('DEV AXE VIOLATIONS:', JSON.stringify(devViolations.map((v: any) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help })), null, 2));
    const { writeFileSync } = await import('fs');
    try {
      writeFileSync('dev-axe-violations.json', JSON.stringify(devViolations, null, 2));
    } catch (e) {
      // ignore write errors in CI
    }
  } else {
    console.log('DEV AXE VIOLATIONS: none');
  }
});
