---
name: story-implement
description: TDD implement phase - turn a designed story handoff package (specs/<STORY-ID>/) into running tests once the app feature is delivered - promote the draft into test/features/, implement the deltas layer by layer, run whole-module regression. Use when the user says a story/feature is developed and ready for test implementation, or references an existing specs/ handoff package.
---

# Story Implement (TDD Phase 2 — app delivered, compile gate on)

Read `CLAUDE.md` first. This is the implement half of the story lifecycle; input is
the handoff package produced by `/story-design`. If no package exists for this story,
either run `/story-design` first (if the feature is still unbuilt) or fall back to
designing and implementing in one pass — same phases, no handoff gap.

The TDD spine applies from promotion onward:

> Promote the draft into `test/features/` → `npx bddgen` undefined-step errors are
> the worklist → implement down the layers → green → whole-module regression.

## Phase 0 — Pick up the package

- Read `specs/<STORY-ID>/` (feature draft, data-skeleton.yaml, handoff.md).
- Confirm the app is reachable (the design-phase assumption "not built yet" has
  expired; if the app still isn't reachable, stop and say so).
- If handoff.md says "requires /new-module scaffold", run `/new-module` Phases 0/2/3
  for the scaffold pieces first (prefix, YAML file, fixtures domain).

## Phase 1 — Promote (the compile boundary)

- Merge draft scenarios into `test/features/<module>.feature` (existing module file
  unless the story opened a genuinely new feature area). Strip `# [NEW STEP]`
  comment markers; keep the story reference in the description block.
- Merge `data-skeleton.yaml` entries into the module's `test-data/` YAML — verify
  caseIds are still free (design and implementation may be weeks apart; renumber the
  NEW entries only, never existing ones).
- Run `npx bddgen` — the undefined-step list is the worklist. Cross-check it against
  handoff.md's new-step inventory; surprises mean the app diverged from the story.

## Phase 2 — Implement the deltas

Layer discipline per CLAUDE.md (steps → flows → pages; locators only in pages/).
Per scenario, delegating to the `playwright-test-generator` agent is the default for
non-trivial work; implement inline when the delta is a line or two.

**testid reconciliation**: handoff.md carries the testid requests sent to frontend.
Verify each against the live DOM (browser tools / generator logs). Mismatches are a
deliverable, not a silent fix: list request vs. reality and report — this list goes
back to frontend, and is also how the testid-naming feedback loop stays alive.

## Phase 3 — Verify

```bash
npx bddgen && npx tsc --noEmit && npx eslint . && npx playwright test --list
npx playwright test --project=chromium -g "<MODULE>-"   # whole module, not just new cases
```

Whole-module run is mandatory — story work touches shared steps and pages; existing
cases are the regression net. Report reachability and results honestly.

## Phase 4 — Close out

- Flip `handoff.md` status: `Status: implemented (<date>, <caseIds>)`. Keep the
  package in specs/ as the design record; do not delete it.
- Report the final AC → caseId table and the testid mismatch list (if any).

## Definition of done

- [ ] Draft promoted; specs/ package status flipped; no `[NEW STEP]` markers remain
- [ ] Every AC's verdict realized (case green, extension green, or documented not-E2E)
- [ ] testid requests reconciled against the live DOM; mismatches reported
- [ ] Layer boundaries intact (locators only in pages/, thin steps, locator-free flows)
- [ ] Whole-module run green (or reachability honestly reported)
- [ ] Everything in English; nothing committed until the user says "push"
