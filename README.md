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

**Dimensions (12, exact order):** Member, Wave, Enrollment_Status,
Defaulted, Defaulted_Timing, Membership_Type, Member_Health_Coverage,
Vision_Plan, Set_Up_Date, Completed_Date, Abandoned_Date,
Is_Portico_Employee.

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
- ✅ Verified in `preview.html` against 14 illustrative mock rows — zero
  console errors.
- ⏳ Not yet hosted on GitHub Pages or registered in SAC.
- ⏳ Not yet added to the "AE Member Selection" story.

## Next steps

1. Host on GitHub Pages, register in SAC.
2. Bind `memberDetail` to `AM_MEMBER_ENROLLMENT_DETAIL` — Measures then
   Dimensions, in the exact order listed above (SAC binds by position).
3. Add to the story.
4. Confirm against real data once bound — especially that
   `Is_Portico_Employee = 'Yes'` actually returns the expected ~200 rows.
