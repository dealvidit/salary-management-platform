# Architecture

Written after `requirements.md`, before code. This is the proposal we build
against; if reality pushes back, the doc changes with the code.

## Shape of the system

A small monorepo, two deployables:

```
apps/
  api/   Fastify + Prisma + SQLite   — data + business logic + REST
  web/   Vite + React + TS + Tailwind — the HR manager's screens
docs/    the artifacts you're reading
```

Two packages, not a framework. npm workspaces at the root so `npm install` and
`npm run dev` do the obvious thing. No Nx/Turbo — 10k rows and five screens
don't need a build graph.

### Why this stack

- **Fastify** over Express: first-class schema validation, good TS types, fast.
  We're not chasing raw throughput; we want typed request/response boundaries.
- **Prisma + SQLite**: SQLite is in the assignment's own examples and is the
  right call for a single-user internal tool — zero infra, real SQL, trivially
  seedable and testable. Prisma gives us typed queries and painless migrations.
  The cost (SQLite isn't for high-concurrency multi-writer prod) doesn't apply
  to one HR manager. See `tradeoffs.md` for the deployment consequence.
- **Zod** at every boundary (HTTP in, config, seed inputs). One validation
  library, shared mental model, and the same schemas can type the frontend.
- **React + Vite + Tailwind + shadcn/ui**: boring, fast, accessible primitives.
  **TanStack Query** for server state (pagination, caching, loading/error
  states come for free). **React Hook Form + Zod** for the one real form.

## Layering (backend)

Thin route → validate → service → Prisma. No repository layer, no base classes.

```
route handler   parse + validate (Zod), call service, shape response
   │
service         business logic: normalization, revision rules, aggregation
   │
Prisma          data access, directly — our queries are straightforward
```

We deliberately skip a repository abstraction: it would wrap Prisma calls
one-to-one and remove no duplication. If a query gets reused or gnarly, it moves
into a named service function — that's the abstraction that earns its place.
Business logic that's pure (currency math, median/percentiles, revision
validation) lives in plain functions with no Prisma import, so it's unit-tested
without a database.

## Data model

Three tables. The design turns on two decisions from `requirements.md`:
money is multi-currency, and salary is a history, not a value.

### `Employee`

Identity + the slicing dimensions for insights, plus a **maintained projection**
of current pay.

| column                     | why                                            |
| -------------------------- | ---------------------------------------------- |
| `id`                       | PK, int autoincrement — readable internal URLs |
| `employeeNumber`           | human-facing code (EMP00042), unique, stable   |
| `firstName`, `lastName`    | display + search                               |
| `email`                    | unique, display                                |
| `country`                  | ISO-3166 alpha-2; a slicing dimension          |
| `currency`                 | ISO-4217; fixed per employee in our scope      |
| `department`, `level`      | the two main insight dimensions                |
| `jobTitle`                 | display                                        |
| `hireDate`                 | tenure context                                 |
| `currentSalaryMinor`       | **projection**: current pay in local minor units — display |
| `currentSalaryUsdMinor`    | **projection**: current pay normalized to USD — sort/filter/aggregate |
| `currentSalaryEffectiveOn` | date the current amount took effect            |
| `createdAt`, `updatedAt`   | housekeeping                                    |

The two `currentSalary*` columns are a projection of "the latest revision,"
written in the same transaction as the revision. Why denormalize:

- The list and every aggregate need current pay for 10k rows; a per-row "latest
  revision" subquery is avoidable work.
- We need to sort, filter and sum **across currencies**, which is only
  meaningful on the normalized value — so we store `currentSalaryUsdMinor`
  (computed once via the current FX set) and make it the comparison key. The
  local amount stays for showing pay in the employee's own currency.

The append-only revisions remain the source of truth; both projections are
derived and reconstructable. Kept consistent transactionally in the
salary-update service. Caveat: `currentSalaryUsdMinor` is a snapshot against the
current rate set — if a _new_ FX set were introduced (out of scope), these would
be recomputed in a batch. That recompute path is documented, not built.

### `SalaryRevision`

Append-only. The audit trail and the source of truth for pay.

| column           | why                                                    |
| ---------------- | ------------------------------------------------------ |
| `id`             | PK                                                     |
| `employeeId`     | FK → Employee                                          |
| `amountMinor`    | salary in **local minor units** (integer, never float)|
| `effectiveOn`    | when this pay takes effect                             |
| `reason`         | why it changed (promotion, market adj, correction…)   |
| `createdAt`      | when it was recorded                                   |

No `UPDATE`, no `DELETE` — a correction is a new revision. Currency isn't
repeated here; it lives on the (immutable-in-scope) employee.

### `FxRate`

One row per currency: how many USD minor units one local unit is worth, as of a
date. Seeded, versioned by `effectiveOn`. Insights use the latest set.

| column        | why                                              |
| ------------- | ------------------------------------------------ |
| `currency`    | ISO-4217                                         |
| `usdPerUnit`  | conversion factor (stored with enough precision) |
| `effectiveOn` | rate date — shown next to every normalized figure|

### Money: integers, not floats

All amounts are integer **minor units** (paise, cents). Floating-point money is
a classic correctness bug; integers make sums exact. Normalization is
`round(localMinor × usdPerUnit)` done once, in one place, and unit-tested.

### Indexes (intent, not cargo-cult)

- `Employee`: unique on `email`, `employeeNumber`; indexes on `department`,
  `country`, `level` (filter facets) and `currentSalaryUsdMinor` (sort-by-pay,
  which is normalized so it's comparable across currencies).
- `SalaryRevision`: index on `(employeeId, effectiveOn desc)` — history fetch and
  "latest" lookup.
- `FxRate`: unique on `(currency, effectiveOn)`.

At 10k rows SQLite is fast without any of these; they're here because they encode
intent and are what we'd ship at real scale. Called out honestly in
`performance.md`.

## API surface

REST, small and boring.

| method + path                          | purpose                                  |
| -------------------------------------- | ---------------------------------------- |
| `GET /employees`                       | paginated list; filter dept/country/level, search, sort |
| `GET /employees/:id`                   | detail + salary-revision history         |
| `POST /employees/:id/salary-revisions` | update salary (append revision)          |
| `GET /insights/summary`                | dashboard numbers                        |
| `GET /insights/pay`                    | breakdowns by dept/level/country + distribution |
| `GET /meta`                            | filter option lists (depts, countries, levels) |

Pagination is offset/limit — correct and obvious for a page-numbered HR list.
Responses carry `total` so the UI can render page counts. Cursor pagination is
noted as the scale-up path in `performance.md`, not built.

## Testing strategy

The JD says "start by writing tests," and pay math is exactly where that pays
off. Priorities:

1. **Pure business logic (most tests, no DB):** currency normalization; median,
   percentiles, min/max/avg with the nasty cases (empty group, single member,
   even vs odd count); revision validation (amount > 0, effective date rules).
2. **Service + DB integration (a few, high-value):** salary update creates a
   revision _and_ updates the projection atomically; list pagination/filter
   returns the right slice; insights totals equal the hand-summed expectation on
   a small fixed dataset.
3. **Frontend (targeted, not exhaustive):** the salary form's validation, and
   that a page shows loading/empty/error. We don't chase coverage on JSX.

Tests run against a fresh in-memory / temp SQLite, migrated per run — fast and
deterministic, no shared state. Vitest across both packages.

## Frontend structure

Pages: Dashboard, Employees, Employee Detail, Update Salary, Insights. Each ships
loading, empty, and error states and works on a narrow screen. Server state via
TanStack Query; the only form (update salary) via RHF + Zod, sharing the API's
schema. Money is formatted with `Intl.NumberFormat` in the employee's currency,
and normalized figures are always labelled as USD-as-of-date.

## What could go wrong (and the answer)

- **Aggregating current pay for 10k rows on every insights call** → cheap because
  current pay is denormalized onto `Employee`; the aggregate is one indexed scan.
- **SQLite on ephemeral hosting resets data** → real; addressed in `tradeoffs.md`
  (configurable DB path, seed-on-boot for the demo, persistent volume if easy).
- **FX drift distorting comparisons** → we normalize all current salaries with
  one current rate set, so comparisons are internally consistent by construction.
