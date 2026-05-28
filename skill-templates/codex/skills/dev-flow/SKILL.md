---
name: dev-flow
description: Use when the user asks to run dev-flow, a staged development workflow, project research, requirement analysis, design, implementation, testing, bug fixing, memory updates, or coordinated subagent development.
---

# dev-flow

dev-flow is a structured development workflow for Codex. Use it when the user asks for `dev-flow`, asks for a staged coding process, or wants project research before implementation.

## Modes

- Full flow: Research -> Analyze -> Design -> Develop -> Test/Fix.
- Research: inspect the project and update `.dev-flow/memory/`.
- Analyze: turn a request into clear scope, constraints, affected files, and open questions.
- Design: produce a concrete implementation plan before editing code.
- Develop: implement a confirmed design or a small direct request.
- Test/Fix: run focused verification, fix failures, and record useful learnings.
- Hotfix: quickly diagnose and fix a supplied error; skip stage confirmations unless risk is high.

## Core Rules

1. Before writing code, read existing project memory and the relevant source files.
2. Preserve the project's existing architecture, naming, style, dependencies, and test conventions.
3. Do not generate TODO placeholders, empty shells, or fake tests.
4. In full-flow mode, pause after Research, Analyze, and Design so the user can confirm before implementation.
5. Write stage artifacts to `.dev-flow/sessions/` and durable project knowledge to `.dev-flow/memory/`.
6. Protect user work: do not overwrite unrelated changes, generated memory, or existing project decisions without a reason.

## Project Detection

Detect the project type from root files:

| Signal | Project type |
| --- | --- |
| `pom.xml` or `build.gradle` | Java backend / Spring Boot |
| `package.json` plus `src` with `.tsx`, `.jsx`, or `.vue` | Frontend |
| `package.json` plus `.ts` or `.js` without JSX/Vue | Node.js backend |
| `pyproject.toml` or `requirements.txt` | Python |
| `go.mod` | Go |
| `Cargo.toml` | Rust |

Priority: Java, frontend, Node.js, Python, Go, Rust.

For Java projects, detect microservices by a parent `pom.xml` with `packaging=pom` and `modules`; otherwise treat a directory with `src/main/java` as a single service.

## Research

Use Research when memory is missing, outdated, or requested directly.

1. Check `.dev-flow/memory/`.
2. If key files are missing or empty, run full Research.
3. If memory has a `<!-- last-updated: YYYY-MM-DD HH:mm -->` marker:
   - within 24 hours: ask whether to skip Research,
   - within 7 days: do an incremental update,
   - older than 7 days: ask whether to rescan.
4. Compare key config files such as `pom.xml`, `build.gradle`, and `package.json` against memory freshness.
5. Count source files and choose:
   - fewer than 50: single-agent Research,
   - 50 to 200: grouped Research with 2-3 subagents,
   - more than 200: full parallel Research.

For large Research tasks, spawn Codex subagents when available:

- `dependency-scanner`: scan internal dependencies and shared modules.
- `service-scanner`: scan current service source, models, APIs, and layers.
- `structure-analyzer`: analyze structure, service registry, and dependency graph.
- `config-analyzer`: analyze configuration, conventions, patterns, decisions, and mistakes.

Research should write useful content, not empty templates, into:

- `project-overview.md`
- `service-registry.md`
- `dependency-graph.md`
- `common-modules.md`
- `conventions.md`
- `config.md`
- `models.md`
- `apis.md`
- `utils.md`
- `decisions.md`
- `mistakes.md`
- `patterns.md`
- `preferences.md` when user preferences are known

Finish Research with a concise summary table and wait for confirmation.

## Analyze

Analyze a request by:

1. Classifying it as new feature, enhancement, bug fix, refactor, performance, or test work.
2. Reading relevant memory and existing source.
3. Listing functional points, constraints, affected modules, expected file changes, risks, and open questions.
4. Writing the result to `.dev-flow/sessions/`.

Pause for confirmation before Design unless the user asked for a small direct change.

## Design

Design should include:

- data model changes,
- API or interface changes,
- service/business flow,
- frontend component or state changes when relevant,
- test strategy,
- migration or compatibility notes,
- files expected to change.

Pause for confirmation before Develop.

## Develop

Implement in dependency order. For Java, prefer Enum/Entity/DTO/Mapper/Service/Controller/Config order unless the project shows another pattern. For frontend projects, follow the local component, state, routing, and API organization.

When a task is independent and large, use `develop-expert` subagents in parallel only after boundaries are clear and shared-file conflicts are avoided.

After editing:

- run the smallest useful verification first,
- broaden tests when shared behavior changed,
- update `.dev-flow/memory/patterns.md`, `mistakes.md`, or `preferences.md` only when a durable lesson was learned.

## Test And Fix

Generate or run tests that cover normal, error, and boundary cases. If tests fail:

1. Read the failure output.
2. Locate the root cause.
3. Apply a focused fix.
4. Re-run relevant tests.
5. Record repeated mistakes in `.dev-flow/memory/mistakes.md`.

## Subagent Guidance

Codex custom agents live in `.codex/agents/*.toml`. Spawn them only when useful:

- `orchestrator`: task decomposition and result consolidation.
- `research-expert`: project scanning and memory building.
- `analyze-expert`: requirement analysis and impact assessment.
- `design-expert`: design documents and implementation plans.
- `develop-expert`: implementation of isolated tasks.
- `verify-expert`: review, tests, and quality checks.
- scanner agents: narrow read-heavy Research work.

Subagents inherit the active sandbox and approval policy. Keep their instructions narrow and ask them to write structured results under `.dev-flow/sessions/`.
