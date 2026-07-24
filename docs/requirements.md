# Requirements — Salary Management for ACME

_One-pager, written before building. Owner: HR Manager._

## The problem, in one sentence

ACME's HR manager tracks pay for ~10,000 people across several countries in
spreadsheets, and can't reliably answer questions about how the org pays people.
We're replacing the spreadsheet with a web app that keeps the data trustworthy
and makes those questions answerable.

## Who uses this

One HR manager. Trusted, internal, on a laptop. Not the employees, not payroll,
not finance. That single-user assumption is load-bearing: it's why there's no
auth, no roles, and no collaboration/locking in scope.

## Goal

1. Keep an accurate, auditable record of every employee's current salary.
2. Let the manager change a salary and see the full history of why it changed.
3. Answer "how do we pay people?" — across departments, levels, and countries —
   in numbers the manager can trust.

## Scope (what we build)

- **Employees** — a searchable, filterable, server-paginated list over 10k rows
  (by department, country, level; search by name). This is the daily workhorse.
- **Employee detail** — current pay plus the full salary-revision history.
- **Update salary** — records a new revision (amount, effective date, reason);
  never overwrites history.
- **Dashboard** — the handful of numbers the manager checks first: total
  payroll, headcount, average/median pay, recent changes, most expensive team.
- **Insights** — pay by department / level / country, distribution (median +
  percentiles, not just mean), and within-band consistency to surface outliers.
- **Seed** — a deterministic 10k-employee dataset so the app is real on first run.

## The one hard thing: multiple currencies

"Across multiple countries" means salaries are in INR, USD, EUR, GBP, etc.
Summing mixed currencies is a bug that looks like a number. So:

- Each salary is stored in its **local currency + ISO code** — the source of
  truth, never lossy.
- Aggregates are **normalized to USD** using an explicit, seeded exchange-rate
  table, and every aggregate in the UI is labelled as normalized (with the rate
  date). We show honest numbers, and we show our work.

We use one consistent current rate set for all cross-sectional comparisons, so
two equal-paying roles don't look unequal because their raises happened on
different days.

## Non-goals (deliberately out, and why)

- **Authentication / roles / audit-by-user** — single trusted internal user.
  Fake login is theater and adds surface area with zero product value here.
- **Payroll, payslips, tax, benefits** — explicitly outside the job-to-be-done;
  a large, regulated domain that would swamp the actual ask.
- **Live FX rates from an external API** — non-deterministic and flaky in tests
  and demos. A seeded rate table is more honest and fully testable. Real-world
  path (scheduled rate refresh) is noted in `decisions.md`, not built.
- **CSV / Excel import** — tempting, since the data comes _from_ Excel, but it's
  a lot of edge-case surface. It's the obvious next iteration, called out rather
  than half-built.
- **Employee self-service, notifications, org-chart / manager rollups, AI chat**
  — outside a single HR manager's core workflow.
- **Currency changes on relocation** — a person keeps one currency in our model;
  relocation is a rare edge case documented, not modelled.

## Assumptions

- Salaries are annual gross, in whole local-currency units (no sub-unit pay).
- The employee roster is given/seeded; hiring & termination flows are out of
  scope — we manage _pay_, not the employee lifecycle.
- ~10k employees is the working set; the design should stay honest at that size
  (server-side pagination, indexed filters) without pretending to be web-scale.

## Acceptance criteria

- The employee list paginates and filters server-side; sorting by salary is
  correct across currencies (i.e. sorts on the normalized value where that's the
  displayed comparison).
- Updating a salary creates a new revision and updates the employee's current
  salary in the same transaction; the previous value remains in history.
- Dashboard and insights totals equal the sum of per-employee normalized
  salaries — verified by tests on a known small dataset.
- Median and percentile figures are correct for both even and odd counts and for
  single-employee groups (edge cases have tests).
- The app loads with 10k seeded employees on a fresh checkout via one command,
  and the seed is deterministic (same data every run).
- Every screen handles loading, empty, and error states; forms validate at the
  boundary and show field-level messages.
