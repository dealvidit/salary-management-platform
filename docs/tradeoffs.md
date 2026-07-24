# Trade-offs

The decisions in `decisions.md` each cost something. The ones worth naming
explicitly, with what we gave up and why it was worth it here.

## Denormalized current salary vs. always deriving it

`Employee.currentSalaryMinor` / `currentSalaryUsdMinor` duplicate what the latest
`SalaryRevision` already says.

- **Gained:** the list, sorting, filtering and every aggregate read one indexed
  column instead of computing "latest revision per employee" across 10k rows.
- **Cost:** two writes must stay consistent. We pay this down by writing both in
  one transaction, and the projection is always reconstructable from the history.
- **Verdict:** worth it — reads dominate this app, and the consistency risk is
  contained to a single well-tested service function.

## Snapshotting USD onto the employee vs. converting on read

The stored `currentSalaryUsdMinor` is correct against the current rate set, but
would go stale if a _new_ set of rates were introduced.

- **Gained:** aggregates are a plain `SUM`/`AVG`; no per-row conversion.
- **Cost:** introducing new rates requires recomputing the column for everyone.
- **Verdict:** fine, because rates are seeded and fixed in scope. The recompute
  job is a documented, mechanical extension, not a redesign.

## SQLite vs. a client/server database

- **Gained:** zero infrastructure, real SQL, trivial seeding and testing, a
  single-file database that's perfect for one internal user.
- **Cost:** not built for many concurrent writers, and on ephemeral hosting the
  file resets on redeploy. For one HR manager, concurrency is a non-issue; for
  persistence we mount a volume in the container and document it.
- **Verdict:** the right tool for this problem. Postgres would be the swap if this
  ever became multi-tenant or write-heavy — Prisma makes that a datasource change.

## In-memory insights vs. SQL aggregation

- **Gained:** median/percentiles/histograms as tested pure functions, readable and
  currency-correct.
- **Cost:** we load 10k rows per insights request. At, say, 100k+ employees this
  would want SQL-side aggregation and caching.
- **Verdict:** at 10k it's a few milliseconds; clarity wins. The boundary where it
  flips is called out in `performance.md`.

## Hand-mirrored frontend types vs. a shared contract

- **Gained:** the web app builds independently; no package plumbing.
- **Cost:** a response shape changed on the backend won't fail the frontend build
  automatically — it's caught by the integration tests and manual review instead.
- **Verdict:** acceptable for a surface this small; revisit with codegen if it grows.

## Native `<select>` vs. a custom combobox

- **Gained:** full keyboard and screen-reader accessibility for free, good touch
  behaviour, almost no code.
- **Cost:** less control over styling and no typeahead-over-options.
- **Verdict:** correct for filter dropdowns in an internal tool; not worth a custom
  listbox's accessibility burden.

## No CSV import (yet)

The data comes _from_ Excel, so import is the obvious feature — and deliberately
out of scope. Done properly it needs column mapping, currency inference,
validation, partial-failure reporting and dedupe: a lot of surface area. Half-built,
it would erode trust in the data. It's the first thing I'd build next, not a thing
to fake now.
