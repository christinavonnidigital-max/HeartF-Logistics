Summary:
- Fix JSX parse errors in `UiKit.tsx`, `UiKit_new.tsx`, and `BookingDetailsModal.tsx` that were preventing the dev server from starting.
- Adjust modal centering to be right of the sidebar on md+ (use `md:pl-64`) and move `maxWidthClass` to the modal card to avoid overlay-level centering issues.
- Implement body scroll-lock fixes and improve internal modal scrolling (`min-h-0` + internal overflow).
- Make `modal-smoke.spec.ts` more robust by measuring the inner modal card and tidy test debug output.
- Screenshots saved: `tests/screenshots/add-booking.png`, `add-vehicle.png`, `add-invoice.png`.

What I tested locally:
- `npx tsc --noEmit` (passes)
- `npx playwright test tests/e2e/modal-smoke.spec.ts -g "modal placement"` (3/3 tests passed)

Notes for reviewers:
- Focus on the modal layout and `BookingDetailsModal` changes  I trimmed the body for diagnostics during debugging but restored working layout.
- Happy to split or expand E2E checks in a follow-up PR if you prefer.
