
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1FR7MK0hWaKyC1XlXoI1bNg9hyXOZV0dT

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

https://github.com/christinavonnidigital-max/HeartF-Logistics

Note: The project previously included an Azure Functions API scaffold; that scaffold has been removed.

## Continuous Integration

This repo includes a GitHub Actions workflow that runs on pull requests and pushes to `main`.

- TypeScript type checks: `npx tsc --noEmit`
- Playwright E2E tests: `npm run test:e2e` (the workflow starts the dev server and runs the tests)

### Running with more memory (16 GB)

If you encounter memory limits during builds or test runs, you can increase Node's heap to 16 GB without changing the repository (recommended).

- PowerShell (set for the current session):

```powershell
$env:NODE_OPTIONS="--max-old-space-size=16384"
npm run build
# or
npm run test:e2e
```

- One-shot Windows command (runs a single command with increased memory):

```powershell
cmd /c "set NODE_OPTIONS=--max-old-space-size=16384&& npm run build"
```

- CI (GitHub Actions) example — call `node` directly with the memory flag (no repo changes required):

```yaml
- name: Build with more memory
   run: node --max-old-space-size=16384 ./node_modules/vite/bin/vite.js build

- name: Playwright tests with more memory
   run: node --max-old-space-size=16384 ./node_modules/@playwright/test/lib/cli.js test
```

These approaches avoid adding extra dev dependencies like `cross-env` while giving a reproducible way to run memory-heavy operations locally or in CI.

## End-to-end tests (Playwright)

- To run tests locally, ensure the dev server is running (`npm run dev`) and then run:

```bash
npm run test:e2e
```

## Accessibility checks (development)

To catch accessibility regressions during development, the app runs a lightweight `axe-core` check on startup in development mode and logs violations to the console. This is enabled automatically when running the dev server (`npm run dev`).

Notes:
- The dev accessibility check is intended for early detection and is not a substitute for dedicated accessibility audits.
 
Automated accessibility smoke test:
- A lightweight `axe-core` check is also included as a Playwright test (`tests/e2e/accessibility.spec.ts`).
- The test fails CI only on *critical* violations and logs all violations (including color-contrast / serious) to help triage.

### Recent test and icon migration notes

- Icons have been standardized to use a canonical barrel at `components/icons` with a lucide-backed implementation in `components/icons/lucide.tsx`. Legacy bespoke illustrations are kept in `components/icons/Icons.tsx` and re-exported from `components/icons/index.tsx`.
- Playwright E2E now launches a fresh dev server per run (see `playwright.config.ts` - `webServer.reuseExistingServer: false`) to reduce intermittent HMR/serve cache issues observed during development.
- The app exposes dev-mode axe results to `window.__axeViolations__` and the E2E accessibility test writes `axe-violations.json` when violations are detected to aid CI triage.
- I fixed a serious color-contrast issue on the login hero copy and ensured the app has a `main` landmark in `Layout.tsx` to address common axe findings. Additional accessibility follow-ups can be implemented in a follow-up PR.
 - The app exposes dev-mode axe results to `window.__axeViolations__` and the E2E accessibility test writes `axe-violations.json` when violations are detected to aid CI triage. A debug helper test (`tests/e2e/debug-login.spec.ts`) writes `dev-axe-violations.json` for quick local triage and there's a new focused Playwright test for the login page at `tests/e2e/login-accessibility.spec.ts`.
 - Recent fixes in this branch include:
    - Added a semantic `<main>` landmark (with `aria-label="Login"`) around the login content and a `role="region" aria-label="Marketing features"` on the left-side hero to resolve AXE "landmark-one-main" and "region" findings.
    - Improved contrast for the small demo account password badges and the demo note so they meet WCAG contrast requirements.
    - If you want to re-run the accessibility checks locally and generate artifacts, run:
       - `AXE_FAIL_SEVERITY=minor npm run test:e2e tests/e2e/debug-login.spec.ts` (writes `dev-axe-violations.json`)
       - `AXE_FAIL_SEVERITY=serious npm run test:e2e tests/e2e/login-accessibility.spec.ts` (writes `axe-violations-login.json`)

