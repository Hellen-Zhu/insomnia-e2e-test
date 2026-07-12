---
name: new-module
description: Scaffold E2E coverage for a new business module in this framework - design test cases (Gherkin), test data (YAML), and implementation (fixtures/pages/flows/api/steps) in the enforced order with a verification gate after each phase. Use when the user wants tests for a new application module, domain, or feature area.
---

# New Module Scaffold

Read `CLAUDE.md` first (directory boundaries, locator rules, iron rules). This skill
adds the ORDER and the templates; it never overrides those rules.

Scope check: this skill is the greenfield scaffold. For story-driven work use the TDD
lifecycle instead — `/story-design` (pre-dev, uncompiled drafts in specs/) then
`/story-implement` (post-dev). Those skills hand off here only when a story opens a
brand-new module, and only at implement time (design needs no scaffold).

The framework has a built-in TDD loop — use it as the spine of the whole process:

> Write the `.feature` first. Run `npx bddgen`. Every "undefined step" error is a
> work item. Implement down the layers until bddgen compiles, then make it pass.

## Phase 0 — Scope (ask the user what you cannot infer)

- Module name → caseId prefix `<MODULE>-<seq>` (e.g. payments → `PAYMENT-001`).
  Check `test-data/**/*.yaml` for prefix collisions before settling.
- Which pages/routes are involved; are there locator JSON dumps (name + lookupDetails)
  from the frontend to model from? (The user habitually supplies these — ask.)
- Is there a seeding API for preconditions? (Preconditions go through API, not UI.)
- Which fixture domain is the parent — almost always `tradePortalTest` (logged-in app
  area). Domains never extend each other sideways; shared needs go to the common ancestor.

## Phase 1 — Test case design (no code yet)

1. Run `npx bddgen export` — the registered-step menu. Reuse before invent.
2. Draft scenarios per `docs/gherkin-style.md` (six rules). New phrases must follow the
   vocabulary discipline: closed phrases for business states, mechanism qualifiers from
   the closed set, third-person named roles.
3. Case matrix: one scenario per business behavior; Scenario Outline ONLY when the
   varying axis is business-visible. Do not pad the matrix for symmetry — each case
   must earn its runtime. Preconditions via `via api` steps.
4. Assign caseIds sequentially from `<MODULE>-001`; the caseId goes in the scenario
   title (`PAYMENT-001 - <description>`), never in step text or tags.
5. Write `test/features/<module>.feature`. Run `npx bddgen` → the undefined-step list
   is now your implementation worklist. Show the user the feature + worklist before
   implementing (this is the review point where wording is cheap to change).

## Phase 2 — Test data

- Create `test-data/<module>/`, one YAML per data shape (different shape = different
  file). Canonical example: `test-data/trades/create-trade-cases.yaml`.
- Top-level keys are namespaces: `cases` (caseId → params, globally unique) and
  `<kind>_preset` (business alias → params, for preconditions). Presets and cases for
  one shape stay in the SAME file — never split them.
- Use YAML anchors/merge for variants (`<<: *base`); keep fixed enums (like productType)
  out of YAML — they bind in code (`data/*.ts`).
- Nothing to register: the global index (`data/case-data.ts`) auto-discovers all YAML
  under `test-data/`. Gate: unknown top-level keys throw — run any `getCase` path or
  rely on the real run in Phase 4 to catch typos.

## Phase 3 — Implementation, down the layers

Work strictly top-down; stop at the first layer that satisfies each undefined step.

1. **Fixtures domain file** `fixtures/<module>.fixtures.ts` — copy the shape of
   `fixtures/trade.fixtures.ts`: extend the parent test, `declare module` merge for new
   `ScenarioData` keys, register page/flow/api fixtures, export
   `const { Given, When, Then } = createBdd(test)` at the end.
2. **Pages** `pages/<page>/` (one folder per page) — locator rules from CLAUDE.md
   (readonly fields / factories / TID table / ES2022 constructor caveat). Design-system
   widgets go to `pages/components/` only if they contain zero business words.
   Model from locator JSON dumps when provided; never invent testids — verify against
   the live app or the dumps.
3. **Flows** `flows/<module>.flow.ts` — only if a step spans pages. Zero locators.
4. **API client** `api/<module>.api.ts` — extend `ApiClient` (2xx asserted); seeding
   steps register cleanup via `ctx.addCleanup(...)`.
5. **Steps** `test/steps/<module>.steps.ts` — thin glue importing Given/When/Then from
   the domain fixtures; one Gherkin line ↔ one call; data via
   `getCase<T>(caseIdFromTitle(...))` fixture or `getPreset`, never inline.

No config wiring is needed at any point: `playwright.config.ts` globs already cover
`test/features/**`, `test/steps/**`, `fixtures/**`.

## Phase 4 — Verification gates

After Phase 3 (and after every non-trivial edit):

```bash
npx bddgen && npx tsc --noEmit && npx eslint . && npx playwright test --list
```

Then a real run — `--list` does not execute lazy code (YAML index, fixtures):

```bash
npx playwright test --project=chromium -g "<MODULE>-"
```

If the app is unreachable, say so explicitly; never report static verification as a
real run.

## Definition of done

- [ ] Feature compiles with zero undefined steps; new vocabulary follows the six rules
- [ ] Every scenario title carries a unique caseId; YAML entry exists for each
- [ ] No locators outside `pages/`; no logic in steps; flows locator-free
- [ ] Preconditions seeded via API with cleanup registered
- [ ] Verification chain green + real run attempted and reported honestly
- [ ] Everything in English
- [ ] Nothing committed — wait for the user's explicit "push"
