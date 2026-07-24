# Implementation roadmap

How the work is sequenced and what each step commits. The commit history is a
graded artifact here, so each step is one logical change with a message an
engineer would actually write. Test-first where the logic is non-trivial.

## 0 — Planning (this step)

Requirements, architecture, roadmap. No code.

- `docs(requirements): define scope, non-goals and acceptance criteria`
- `docs(architecture): propose data model and service layering`

## 1 — Repo + tooling

Workspaces, TypeScript, ESLint + Prettier, Vitest, EditorConfig, `.gitignore`.
One `npm install` at root; scripts wired so a reviewer can run everything.

- `chore: set up npm workspaces and shared tooling`
- `chore(api): bootstrap Fastify + Prisma + TypeScript`
- `chore(web): bootstrap Vite + React + Tailwind + shadcn/ui`

## 2 — Schema + deterministic seed

Prisma schema for the three tables + indexes. Seed 10k employees, their opening
salary revisions, and the FX rate set — deterministic via a seeded PRNG so every
run is identical.

- `feat(db): model employees, salary revisions and fx rates`
- `feat(seed): generate deterministic 10k-employee dataset`

## 3 — Business logic, test-first

Pure functions, no DB. Written test-first because this is where correctness
lives: currency normalization, distribution stats (median/percentiles/min/max),
revision validation.

- `test(money): specify currency normalization rules`
- `feat(money): normalize salaries to a common currency`
- `test(insights): specify distribution stats and edge cases`
- `feat(insights): compute distribution statistics`

## 4 — Backend endpoints, one module at a time

Each module: Zod schemas, service, route, integration test. Review after each.

- `feat(employees): list with server pagination, filter and search`
- `feat(employees): fetch employee detail with salary history`
- `test(salary): specify salary-update revision workflow`
- `feat(salary): update salary via append-only revision`
- `feat(insights): payroll summary and breakdown endpoints`
- `feat(meta): expose filter option lists`

## 5 — Frontend, one page at a time

Each page committed when it has loading, empty, error, validation, a11y and
responsive behaviour — not before.

- `feat(web): app shell, routing and API client`
- `feat(web): employees table with server-side pagination and filters`
- `feat(web): employee detail with salary history`
- `feat(web): update-salary form with validation`
- `feat(web): dashboard of key payroll numbers`
- `feat(web): insights — pay by team, level, country and distribution`

## 6 — Integration + polish

End-to-end pass, refactor what the build taught us, tighten states and a11y.

- `refactor: simplify <whatever the code review surfaces>`
- `test: cover the integration gaps found during review`

## 7 — Deployment + docs

Dockerfile / compose, README (run in one command), demo notes, and the
remaining artifacts: `tradeoffs.md`, `performance.md`, `decisions.md`,
`ai-prompts.md`.

- `docs: capture tradeoffs, performance notes and decisions`
- `chore: containerize for a one-command run`
- `docs: write the README and demo walkthrough`

## Working rules

- Test-first for logic; tests fast, deterministic, behaviour-focused.
- Staff-level self-review before every commit (naming, complexity, dead code,
  duplication, a11y). If it smells AI-generated or over-engineered, fix it first.
- Small commits. If a commit needs "and" to describe it, split it.
