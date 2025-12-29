import { test, expect } from '@playwright/test';
import { loginAs } from './utils';

test('no placeholder-circle SVG icons on dashboard', async ({ page }) => {
  await loginAs(page, 'admin');
  // Wait for the UI to render
  await page.waitForSelector('#root');

  // Gather all SVGs and detect those that only contain <circle> children (the placeholder)
  const placeholders = await page.evaluate(() => {
    const svgs = Array.from(document.querySelectorAll('svg'));
    const results: Array<{ outer: string; id?: string; className?: string; html: string; context?: string }> = [];
    svgs.forEach((s) => {
      const hasPath = s.querySelector('path, rect, polyline, polygon, line, ellipse');
      const circles = s.querySelectorAll('circle');
      if (!hasPath && circles.length > 0) {
        // Find nearest textual context by walking up the DOM
        let ctx: HTMLElement | null = s as HTMLElement;
        let contextText = '';
        while (ctx && ctx !== document.body) {
          const txt = (ctx.textContent || '').trim();
          if (txt && txt.length > 1) {
            contextText = txt.slice(0, 80);
            break;
          }
          ctx = ctx.parentElement;
        }
            results.push({
              outer: (s as HTMLElement).outerHTML.slice(0, 400),
              id: s.id,
              className: s.getAttribute('class') || undefined,
              html: s.innerHTML.slice(0,200),
              context: contextText,
              lucideMissing: s.getAttribute('data-lucide-missing') || null,
              lucideNamedAvailable: s.getAttribute('data-lucide-named-available') || null,
            });
      }
    });
    return results;
  });

  if (placeholders.length) {
    // Log what we found for easier debugging
    // eslint-disable-next-line no-console
    console.warn('Found placeholder SVGs:', JSON.stringify(placeholders, null, 2));
  }

  expect(placeholders.length, `Placeholder SVGs found: ${placeholders.length}`).toBe(0);
});
