# Decisions

Short records of choices that weren't obvious, so a future reader (or reviewer)
can see the reasoning without archaeology. Newest concerns first.

## Money is stored as integer minor units, in the local currency

Floating-point money is a classic source of rounding bugs, and a "salary" is
meaningless without its currency. So every amount is an integer in the
currency's minor unit (cents, paise, yen), and the currency lives on the
employee. Conversion and rounding happen in exactly one place (`domain/money`)
and are unit-tested. Consequence: the frontend converts to/from major units for
display using `Intl`, never a hard-coded "×100".

## Salaries are normalized to USD via a seeded rate table, at one rate set

"Across multiple countries" means cross-currency comparison, which is only
meaningful in a common currency. We normalize to USD using a `FxRate` table that
ships with the seed. Two sub-decisions:

- **Seeded, not live.** A live FX API would make tests and demos non-deterministic
  and add a network dependency. The seed is honest and fully testable. The
  production path (a scheduled rate refresh + recompute) is noted, not built.
- **One current rate set for all comparisons.** We normalize every current salary
  with the latest rates, so two equal-paying roles don't look different because
  their raises landed on different days.

## Salary is an append-only history; current salary is a maintained projection

An HR tool exists to manage change over time, so `SalaryRevision` is append-only
(a correction is a new row, never an update). For read performance the current
amount — local and USD — is denormalized onto `Employee` and written in the
**same transaction** as the revision, so the projection can't drift from its
source. This is the one deliberate denormalization; see `docs/tradeoffs.md`.

## No repository layer — Prisma is used directly in services

A repository wrapping Prisma one-to-one would remove no duplication and add a
layer to maintain. Business logic that's worth isolating (currency math,
statistics, revision rules) already lives in pure `domain/` functions with no
database import. If a query becomes reused or gnarly, it gets a named service
function — that's the abstraction that earns its place.

## No authentication

The persona is a single trusted HR manager on an internal tool. Adding login,
sessions, and roles would be security theater with no product value here, and
would distract from the actual problem. Called out as an explicit non-goal in
`requirements.md`. The natural extension (SSO + an audit-by-user column) is a
known next step.

## API lives under `/api`; the server also serves the SPA in production

Keeping endpoints under `/api` frees the root for the built frontend, so the
whole app runs from one origin — no CORS in production and one thing to deploy.
In dev, Vite proxies `/api` to the API. Consequence: integration tests hit
`/api/...`, and the API optionally serves `WEB_DIST_PATH` when set.

## `apps/api/.env` is committed on purpose

It holds only local, non-secret defaults (a SQLite path and ports). Committing it
means `git clone && npm run setup` works with zero manual file-copying, which is
the reviewer experience we want. Real secrets would never live here; the
`.gitignore` still excludes every other `.env`.

## Offset pagination, not cursor

The employee list is a page-numbered table the manager scans and jumps around in;
offset/limit maps directly to that and to "page 4 of 400". Cursor pagination is
the right call for infinite scroll or very deep/hot tables — noted in
`docs/performance.md` as the scale-up path, not needed at 10k rows.

## Insights aggregate in application code, not SQL

SQLite has no median/percentile, and pulling 10k normalized salaries to compute
distributions in a tested pure function is simpler and clearer than window-function
SQL. It's fast at this size. The trade-off (and where it would stop scaling) is in
`docs/performance.md`.

## Frontend API types are hand-written, not shared from the backend

The API surface is small and stable. A shared types package would add build
wiring and coupling for little gain, so the frontend mirrors the response shapes
in `lib/types.ts`. If the surface grew or drifted often, generating a client from
the backend schema would be the move.

## Tooling: tsx for dev, tsup for the API build, native ESM

`tsx` runs TypeScript directly in dev; `tsup` (esbuild) bundles the API for
production without the `.js`-extension friction of `tsc` + NodeNext. Dependencies
stay external so Prisma's engine isn't bundled. Vitest runs both workspaces.
