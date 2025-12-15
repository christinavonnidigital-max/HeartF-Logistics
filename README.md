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