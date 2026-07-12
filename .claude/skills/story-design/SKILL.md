---
name: story-design
description: TDD design phase - turn a user story into a draft BDD handoff package (uncompiled Gherkin + data skeleton + testid requests) BEFORE the app feature is built. Use when the user provides a user story or acceptance criteria for functionality that is not implemented yet, or says "design test cases for this story".
---

# Story Design (TDD Phase 1 — no app, no compile)

Read `CLAUDE.md` first. This is the design half of the story lifecycle:

> `/story-design` (pre-dev, output = acceptance contract) → dev builds FE/BE →
> `/story-implement` (post-dev, contract becomes running tests)

Design output lives in `specs/<STORY-ID>/` and is deliberately OUTSIDE the bddgen
globs — nothing here compiles, and that is correct. Do not add specs/ to any config.

## Phase 0 — Gather

- Story text + numbered acceptance criteria (ask if missing; never invent).
- Story ID (ADO/Jira) → folder name `specs/<STORY-ID>/`.
- Target module: match caseId prefixes in `test-data/` and `test/features/`.
  Brand-new module → note "requires /new-module scaffold" in the handoff; the
  scaffold itself waits until implement time (there is no app to model yet).

## Phase 1 — AC coverage table (the user gate)

Build the table (AC → already covered / extend existing / new caseId / not-E2E with
reason) exactly as specified in the bdd-designer agent definition, and get the
user's confirmation BEFORE drafting. Wording is cheapest to change here.

## Phase 2 — Draft (delegate)

Dispatch the `bdd-designer` agent with the story + confirmed table. It produces the
handoff package: draft `.feature` (registered steps verbatim, `# [NEW STEP]` markers),
`data-skeleton.yaml` (business parameters the story names), and `handoff.md` (table,
scenario→AC traceability, new-step inventory, story-extracted business details, open
questions, status line). The agent works from the story and the registered vocabulary
only — no implementation code, no UI speculation; how a step will be performed is
decided at implement time against the delivered UI.

For a small story (1–2 scenarios, no new vocabulary) drafting inline is fine — the
agent exists to keep big drafts out of the main conversation, not as a ritual.

## Phase 3 — Review with the user

Present the draft feature and the handoff notes. Two things need human eyes:

- Wording: does each scenario read as the business would say it? (Read-aloud test:
  would the PO say this sentence in a sprint review?)
- Traceability: is every scenario line grounded in a story sentence or a confirmed
  decision? Anything the reviewer cannot trace back is invention — cut it or turn
  it into an open question.

Iterate until accepted. Design is DONE at acceptance — do not start implementing,
do not run the verification chain (nothing compiles yet, by design).

## Definition of done

- [ ] `specs/<STORY-ID>/` contains feature draft + data skeleton + handoff.md
- [ ] Every AC has a confirmed verdict in the coverage table
- [ ] Every step is either verbatim-registered or `# [NEW STEP]`-marked
- [ ] handoff.md is pure extraction — no UI journeys, widget names, testids, or
      layer predictions anywhere in the package
- [ ] `Status: designed (<date>)` in handoff.md
- [ ] Nothing written outside specs/; nothing committed until the user says "push"
