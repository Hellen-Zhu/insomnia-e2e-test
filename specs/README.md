# Specs — design zone (uncompiled by design)

This directory is deliberately OUTSIDE the bddgen/tsc globs; nothing here compiles.

- `<STORY-ID>/` — story handoff packages produced by `/story-design` (bdd-designer
  agent): draft `.feature` (with `# [NEW STEP]` markers), `data-skeleton.yaml`,
  and `handoff.md` (AC coverage table, testid requests for frontend, open
  questions, status line). `/story-implement` promotes the draft into
  `test/features/` once the app feature is delivered, then flips the status line.
  Packages stay here afterwards as the design record.
- Loose `.md` plans — brownfield exploration output from the playwright-test-planner
  agent.
