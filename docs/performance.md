# Performance notes

The working set is ~10,000 employees and ~19,000 salary revisions. That's small,
and the honest headline is: **nothing here is slow, and the design says so on
purpose rather than by accident.** What follows is where the time goes and where
it would stop scaling.

## Where the design already pays attention

- **List reads are indexed and paginated.** The employee list never fetches more
  than a page (≤100 rows). Filters hit indexed columns (`department`, `country`,
  `level`), and sort-by-pay uses an index on `currentSalaryUsdMinor` — the
  _normalized_ value, so ordering is both fast and correct across currencies.
- **Current salary is denormalized.** The list and every aggregate avoid a
  "latest revision per employee" subquery by reading the maintained projection on
  `Employee`. This is the single most important perf decision; see `tradeoffs.md`.
- **Salary history is indexed by `(employeeId, effectiveOn)`**, so both the
  detail view and the "latest revision" lookup are index scans.
- **The seed uses batched `createMany`.** ~29k rows insert in ~1 second because
  they go in chunks of 1,000, not one round-trip each.
- **The frontend code-splits by route.** The chart-heavy Insights page (recharts)
  loads its ~380 kB chunk only when visited; the initial bundle stays ~80 kB
  gzipped.

## Insights: one query, in-memory math

Each insights request pulls a lightweight projection (five columns) for all
employees and computes medians, percentiles, group breakdowns and a histogram in
application code. At 10k rows this is a few milliseconds and a few MB — not worth
the complexity of doing it in SQL, which SQLite can't do cleanly for medians
anyway.

**Where this flips:** somewhere around 10⁵–10⁶ employees, loading every row per
request becomes the bottleneck. The fix, in order of reach-for: (1) cache the
aggregates (they change only on a salary update), (2) push group sums/counts into
SQL and keep only percentile math in app code, (3) precompute a nightly summary
table. None are needed now, and adding them now would be speculative complexity.

## Pagination

Offset/limit is correct for a page-numbered UI and fine at this size — SQLite
walks the index and skips. Deep offsets (page 10,000) are the classic weakness;
if the roster grew orders of magnitude and users paged deep, keyset/cursor
pagination on `(sortKey, id)` is the swap. Not a real access pattern for one HR
manager scanning 400 pages, so not built.

## Salary update

A write is: one `findUnique`, one rate lookup, then a transaction of one insert
plus one update — all point operations on indexed keys. Constant-time regardless
of headcount.

## Measured, roughly

- Seed of 10k employees + ~19k revisions: **~1 s**.
- API integration test files (real SQLite, schema pushed per file): **~1 s each**.
- Full test suite (both workspaces): **~2–3 s** wall clock.
- Production API cold start (migrations skipped): **sub-second**.
