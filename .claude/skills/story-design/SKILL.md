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
`data-skeleton.yaml`, and `handoff.md` (table, new-step inventory, **testid requests**
for frontend, open questions, status line).

For a small story (1–2 scenarios, no new vocabulary) drafting inline is fine — the
agent exists to keep big drafts out of the main conversation, not as a ritual.

## Phase 3 — Review with the user

Present the draft feature and the testid-request list. Two things need human eyes:

- Wording: does each scenario read as the business would say it?
- testid requests: these go to the frontend team as part of the story's dev work —
  confirm they are complete and follow the naming grammar.

Iterate until accepted. Design is DONE at acceptance — do not start implementing,
do not run the verification chain (nothing compiles yet, by design).

## Definition of done

- [ ] `specs/<STORY-ID>/` contains feature draft + data skeleton + handoff.md
- [ ] Every AC has a confirmed verdict in the coverage table
- [ ] Every step is either verbatim-registered or `# [NEW STEP]`-marked
- [ ] testid requests cover every new UI touchpoint, in naming grammar
- [ ] `Status: designed (<date>)` in handoff.md
- [ ] Nothing written outside specs/; nothing committed until the user says "push"
