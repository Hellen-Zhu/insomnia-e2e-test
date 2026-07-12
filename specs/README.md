# Specs — design zone (uncompiled by design)

This directory is deliberately OUTSIDE the bddgen/tsc globs; nothing here compiles.

- `<STORY-ID>/` — story handoff packages produced by `/story-design` (bdd-designer
  agent): draft `.feature` (with `# [NEW STEP]` markers), `data-skeleton.yaml`
  (business parameters the story names), and `handoff.md` (AC coverage table,
  scenario→AC traceability, new-step inventory, story-extracted details, open
  questions, status line). Packages contain business language only — no UI
  journeys, widget names, or testids; that judgment belongs to the implement
  phase. `/story-implement` promotes the draft into `test/features/` once the
  app feature is delivered, then flips the status line. Packages stay here
  afterwards as the design record.
- Loose `.md` plans — brownfield exploration output from the playwright-test-planner
  agent.
