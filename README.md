# Portico Employee Enrollment — SAC Custom Widget

A single, focused dashboard for Portico's own ~200 employees, built for
HR. Headline completion stats plus a full per-employee table — no
drill-down interaction needed, the population is small enough to just
show everyone directly.

**Why a single widget, not a 3-widget mirror suite:** the general Member
Enrollment suite (`sac-member-enrollment-widget`/`sac-member-operational-
widget`/`sac-member-detail-widget`) is built for a much larger population
and needs three separate widgets — headline tiles, a fuller breakdown, and
an Input-Control-driven drill-down for individual records. Blair pointed
out (2026-10-01) that mirroring all three for a population this small
(Portico's own staff) would be unnecessary overhead. This widget covers
the same ground in one view instead.

## No new Datasphere work

Binds to the **already-existing `AM_MEMBER_ENROLLMENT_DETAIL`** — the
same row-level, PII-bearing model `sac-member-detail-widget` uses — via a
`memberDetail` binding, filtered to `Is_Portico_Employee = 'Yes'`
(opposite of the main suite's exclusion filter). No separate cube or
Analytic Model needed: at ~200 rows, headline stats and sorting are
computed entirely client-side from the row-level data.

## Files

- `widget.json` — manifest: properties (`width`, `height`), a single
  `memberDetail` data binding (12 dimensions / 11 measures, see below).
- `main.js` — defines the `<com-porticobenefits-memberportico>` custom
  element. Renders:
  - **4 headline tiles**: Total Employees, Completed (+%), Started Not
    Completed, Not Started.
  - **One full table**, every matching employee, sorted by status
    priority (least-complete first, same `STATUS_PRIORITY` convention as
    `sac-member-detail-widget`'s needs-attention list) so HR sees who
    needs follow-up first. Columns: Member, Status, Health Plan, HSA,
    Pretax, Roth, Supplemental Life (Member+Spouse+Dependent combined —
    kept collapsed per Blair, not broken out), Vision, Eligible, Covered,
    Defaulted.
  Falls back to built-in mock data (14 illustrative rows) when no data
  binding is bound.
- `icon.svg` — icon shown in the SAC widget panel (copied from the Snap
  widget — same family, same icon).
- `preview.html` — standalone local test harness; drives the widget
  through the real `onCustomWidgetBeforeUpdate`/`onCustomWidgetAfterUpdate`
  lifecycle hooks, same pattern as the rest of this suite.

## Data binding — what it expects

Same shape as `sac-member-detail-widget`'s `memberDetail` binding, plus
two measures that model already has but that widget doesn't currently
use:

**Dimensions (13, exact order):** Member, Wave, Enrollment_Status,
Defaulted, Defaulted_Timing, Membership_Type, Member_Health_Coverage,
Vision_Plan, Set_Up_Date, Completed_Date, Abandoned_Date,
Is_Portico_Employee, **EventDate** (added v1.1.0 — must be LAST; it marks
this cycle vs. prior so each election cell can show last year's value
beneath this year's, changed values highlighted. Counts and the table are
per employee using the current-cycle row, never per row. If EventDate
isn't bound the widget shows a notice and falls back to all rows.)

**Measures (11, exact order):** Total_Attempts, HSA_Election_Amount,
FSA_Health_Election_Amount, FSA_Dependent_Election_Amount,
SuppLife_Member_Amount, SuppLife_Spouse_Amount, SuppLife_Dependent_Amount,
Retirement_Pretax_Amount, Retirement_Roth_Amount, **Eligible_Count,
Health_Covered_Count**.

**Known gap, not a bug in this widget:** `Eligible_Count`/
`Health_Covered_Count` are currently `NULL` placeholders in
`GLD_AE_Member_Enrollment` — gated on BR-29 (the `vDimMember` fan-out
issue from earlier in the Member Enrollment build). The `Eligible`/
`Covered` columns will show blank for every real row until Ahmed's fix
lands and the join is restored in Gold. Wired up now anyway so nothing
needs to change on the widget side once it is.

## Status of this build

- ✅ Designed, mocked up, and style-approved by Blair (2026-10-01).
- ✅ Hosted on GitHub Pages, registered in SAC (v1.1.2), and bound in its
  OWN story (Canvas — "Portico Employee Enrollment", not added to "AE
  Member Selection"). Loads and reads "Live" (2026-10-05).
- ✅ Prior-year elections shown beside this year's (v1.1.0, `EventDate` as
  the 13th/last dimension).
- ✅ Locked story filter `Is_Portico_Employee Contains "Yes"` applied (a
  condition, because the member list can't offer "Yes" until a Portico
  member exists in QA).
- ⏳ **Shows 0 employees today — expected.** QA has zero Portico members
  (all 110 rows are `'No'`); Blair is adding some. Don't treat the empty
  state as a bug.
- ⏳ Share the story with the HR audience ONLY — the model behind it is
  row-level and identifiable, so sharing is what gates access.

## Notes for changing it

- Counts and the table are per EMPLOYEE using the current-cycle row —
  never per row. With two cycles arriving, counting rows would double
  every headline number. An employee present only in the prior cycle is
  not in this year's population and is excluded.
- `CURRENT_EVENT_YEAR` / `PRIOR_EVENT_YEAR` in `main.js` are bumped every
  cycle (same annual maintenance as the cube's `EventDate` literals).
- If `EventDate` isn't bound the widget falls back to all rows and shows
  one notice line; "bound" is judged from the rows SAC SENT, before the
  Portico filter, so an all-non-Portico result is not mistaken for a
  missing binding (fixed in v1.1.2).
- Never put a control or filter on `EventDate`.
- A `main.js` change breaks the live SAC registration until `widget.json`
  is re-uploaded (hash mismatch); bump the version and warn before pushing.
  GitHub Pages can sit "queued" for a long time — check the Actions runs
  and the hosted `widget.json` before re-uploading.
- No caveat / "open items" banners (Blair's standing decision,
  2026-10-05).

## Still to do

1. Confirm against real data once QA has Portico members — the count
   should be ~200, and prior-year values should appear where history exists.
2. Eligible/Covered columns stay blank until BR-29 is fixed in Gold.
