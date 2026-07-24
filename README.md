# ACME Salary Management

An internal tool for one HR manager to manage salaries for ~10,000 employees
across several countries — replacing a pile of spreadsheets — and to actually
answer _"how do we pay people?"_

The interesting part isn't CRUD; it's that people are paid in different
currencies, so every meaningful question (average pay, most expensive team, band
consistency) requires normalizing to a common currency honestly. That, plus
treating salary as an auditable history rather than a single number, is what this
project is really about.

## Quick start

Requires Node 20+.

```bash
npm run setup   # install deps, run migrations, seed 10,000 employees
npm run dev     # start the API (:3000) and the web app (:5173)
```

Then open **http://localhost:5173**.

Run the whole thing as one production build instead:

```bash
npm start       # build both apps, migrate, and serve on http://localhost:3000
```

Or with Docker (one origin, persistent SQLite volume):

```bash
docker compose up --build   # http://localhost:3000
```

## What's inside

Five screens, no more — each does one job well:

- **Dashboard** — the numbers the manager checks first: total payroll, headcount,
  median and average pay, recent changes, the most expensive team.
- **Employees** — a server-paginated, filterable, searchable table over 10k rows,
  sortable by name or (normalized) salary.
- **Employee detail** — current pay plus the full salary-revision history, with
  the change at each step.
- **Update salary** — records a new revision (amount, effective date, reason);
  never overwrites history.
- **Insights** — pay distribution (median + percentiles), pay by department,
  level and country, and a pay-band view that surfaces inconsistent pay.

## Two decisions worth knowing up front

- **Multi-currency, normalized to USD.** Salaries are stored in their local
  currency as integer minor units (the source of truth), and aggregates are
  normalized to USD via a seeded exchange-rate table. Every normalized figure in
  the UI is labelled with the rate date. See [`docs/decisions.md`](docs/decisions.md).
- **Salary is an append-only history.** Each change is a `SalaryRevision`; the
  employee's current salary is a projection of the latest one, kept consistent in
  the same transaction. Audit trail included, by design.

## Architecture

A small npm-workspace monorepo, two deployables, one origin in production.

```
apps/
  api/   Fastify + Prisma + SQLite — REST under /api, plus business logic + tests
  web/   Vite + React + TypeScript + Tailwind — the five screens
docs/    requirements, architecture, decisions, trade-offs, performance, AI notes
```

Backend layering is deliberately flat: `route → validate (Zod) → service →
Prisma`. Pure business logic (currency math, statistics, salary rules) lives in
`api/src/domain` and `*/rules` with no database import, so it's unit-tested
without a DB. There's no repository layer or base classes — see
[`docs/architecture.md`](docs/architecture.md) for why.

## Testing

```bash
npm test        # both workspaces
```

The tests prioritise behaviour over implementation:

- **Pure domain logic** (most of them, no DB): currency normalization, medians and
  percentiles with their edge cases, salary effective-date rules.
- **API integration** (real SQLite, fresh per file): pagination/filter/sort,
  the transactional salary update, insights aggregates on a known dataset.
- **Frontend** (targeted): the salary form's validation and money conversion.

They're fast (~2–3 s total) and deterministic — the seed is fixed, and tests
build their own throwaway databases. Test-first is visible in the commit history
(`test(...)` before `feat(...)`), which is how the core logic was actually built.

## Project layout

```
apps/api
  prisma/         schema, migrations, deterministic seed + reference data
  src/
    domain/       money & statistics — pure, tested
    modules/      employees · salary · insights · meta (schema, service, routes)
    lib/          error handling
    config.ts     env validated at startup with Zod
    server.ts     app assembly (routes under /api, optional SPA serving)
  test/           integration tests + harness
apps/web
  src/
    pages/        one file per screen
    components/   layout, shared states, and ui/ primitives
    lib/          api client, types, query hooks, formatting
```

## Common scripts

| Command           | What it does                                     |
| ----------------- | ------------------------------------------------ |
| `npm run setup`   | install, migrate, seed 10k employees             |
| `npm run dev`     | API + web in watch mode                          |
| `npm test`        | run all tests                                    |
| `npm run lint`    | ESLint across the repo                           |
| `npm run format`  | Prettier write                                   |
| `npm start`       | production build + migrate + serve on one origin |
| `npm run db:seed` | re-run the deterministic seed                    |

## Deliberately out of scope

Named so the boundaries are a choice, not an oversight: authentication/roles,
payroll & tax, live FX rates, CSV/Excel import, employee self-service,
notifications, and an org-chart hierarchy. The reasoning for each is in
[`docs/requirements.md`](docs/requirements.md).

## Documentation

- [`requirements.md`](docs/requirements.md) — scope, non-goals, acceptance criteria
- [`architecture.md`](docs/architecture.md) — system shape, data model, testing
- [`decisions.md`](docs/decisions.md) — the non-obvious choices and why
- [`tradeoffs.md`](docs/tradeoffs.md) — what those choices cost
- [`performance.md`](docs/performance.md) — behaviour at 10k, and where it would scale
- [`ai-prompts.md`](docs/ai-prompts.md) — how AI was used, honestly
- [`roadmap.md`](docs/roadmap.md) — how the build was sequenced
