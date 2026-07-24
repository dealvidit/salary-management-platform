# How AI was used

The brief asks for intentional AI use, so here's an honest account of how it was
used to build this, what it was good at, and where human judgment had to steer or
correct it.

## The workflow, not one big prompt

I didn't ask an AI to "build a salary app." I ran it the way I'd run the work
myself, in phases, reviewing at each boundary:

1. **Understand first.** Read the brief and the JD, then wrote `requirements.md`
   and `architecture.md` _before any code_. The two decisions that shape
   everything — multi-currency normalization and append-only salary history —
   came out of this step, not the implementation.
2. **Test-first on the logic that matters.** Currency normalization, distribution
   statistics, and the salary-update rules were written test-first. You can see
   the red→green pairs in the commit history (`test(money)` then `feat(money)`,
   etc.). This is where correctness lives, so it's where the tests are densest.
3. **One module / one page at a time**, each reviewed and committed on its own.
4. **Docs last**, capturing decisions while they were fresh.

## Where AI genuinely helped

- **Boilerplate and scaffolding** — Fastify/Prisma/Vite wiring, the shadcn-style
  UI primitives, Tailwind tokens, React Query hooks. Mechanical, well-trodden, fast.
- **Test enumeration** — once a rule was stated, drafting the edge cases (even/odd
  median, single-element groups, JPY's zero decimals, future/backdated effective
  dates) was quick and thorough.
- **Consistency** — keeping naming, error handling and the module shape uniform
  across employees / salary / insights.

## Where human judgment had to lead or correct

These are the moments that mattered, and they're the point of the exercise:

- **The domain model.** Deciding to normalize to USD via a _seeded_ rate table
  (not a live API), to use _one_ current rate set so FX timing doesn't distort
  comparisons, and to make salary append-only with a transactionally-maintained
  projection — these are product/engineering calls, not autocomplete.
- **Floating-point money.** The first-cut normalization divided to major units
  before rounding, which put float error right on the rounding boundary. Caught it
  in the test (`$12.345`), and reworked the math to multiply the integer minor
  amount first and round once. That's a real correctness fix a test surfaced.
- **A config gap.** The dev server didn't load `.env` (only Prisma's CLI did), so
  `npm run dev` would have failed on `DATABASE_URL`. Found it while smoke-testing
  the real server, not by reading the happy path — fixed with explicit `dotenv`.
- **Resisting over-engineering.** Actively _not_ adding a repository layer, base
  classes, a shared types package, auth, or CSV import — each was considered and
  rejected with a reason, because more architecture would have lowered quality here.
- **The `/api` refactor.** Restructuring routes under a prefix so one origin serves
  both the SPA and API was a deployment-shaped decision made after seeing how the
  container would actually run.

## The rule I held to

Every AI-produced line was read and owned before it was committed. If something
felt generated — a needless abstraction, a vague name, a comment restating the
code — it got rewritten or deleted. The goal was a repository I'd be comfortable
defending line by line in review, which is exactly how it was built.
