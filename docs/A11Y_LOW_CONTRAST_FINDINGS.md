# Accessibility: Low contrast small text findings

Summary
-------
This document lists locations where small, light-colored text (e.g., `text-slate-400`) or small uppercase labels were used on light/white surfaces and which were updated to improve contrast.

Guideline
---------
- For small text (<= 12px / `text-xs` / `text-[11px]` / `text-[10px]`) use darker tokens that meet WCAG 2.1 AA contrast ratio (4.5:1).
- In this repo, recommended replacements used in this change set:
  - `text-[10px]`, `text-[11px]`, `text-xs` (small): `text-slate-700` (higher contrast)
  - `text-xs` informational lines: `text-slate-600` (where slightly larger / less strict)
  - Decorative icons: `text-slate-500` (improves visibility without changing design tone)

Files updated in this change set (high priority fixes)
----------------------------------------------------
- `components/LoginPage.tsx` — demo password badges and demo note (already fixed earlier in this branch)
- `components/CampaignsPage.tsx` — small uppercase stat labels changed to `text-slate-700`; created line to `text-slate-600`
- `components/CampaignAnalyticsPage.tsx` — bounce-rate small span changed to `text-slate-700`
- `components/LeadFinderModal.tsx` — `Last run` note to `text-slate-700`; `Fit Confidence` to `text-slate-700`
- `components/FinancialsDashboard.tsx` — small stat labels to `text-slate-700`
- `components/FleetDashboard.tsx` — `Vehicles` small label to `text-slate-700`
- `components/LeadList.tsx` — delete icon color `text-slate-500`
- `components/BookingsPage.tsx` — small booking labels to `text-slate-700`, and search icon to `text-slate-500`
- `components/CustomersPage.tsx` — multiple small labels and icons darkened (to `text-slate-700` / `text-slate-500`)
- `components/DriversPage.tsx` — search icon to `text-slate-500`
- `components/ImportLeadsModal.tsx` & `components/InviteUserModal.tsx` — icons to `text-slate-500`

Notes & next steps
------------------
- I ran the full Playwright test suite after these changes; all tests passed and axe produced no dev-mode violations locally.
- Remaining low-priority spots:
  - Placeholder text (`placeholder:text-slate-400`) is intentionally soft; this is generally acceptable, but we can enforce stronger placeholder colors if desired.
  - Icons and decorative elements were darkened where they are visible; further visual review is recommended if you want exact design parity.

If you'd like, I can:
- Continue to scan the rest of the repo and propose a broader set of changes.
- Open a follow-up PR with a small accessibility checklist and automated check (e.g., a targeted Playwright test) that runs against all primary pages.

Thank you — these changes improve the app's contrast for small text elements and resolve the prominent AXE findings we captured earlier.
