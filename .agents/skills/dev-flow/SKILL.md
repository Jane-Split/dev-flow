---
name: dev-flow
description: Use when the user asks to run dev-flow, a staged development workflow, project research, requirement analysis, design, implementation, testing, bug fixing, memory updates, or coordinated subagent development.
---

# dev-flow

dev-flow is a structured development workflow for Codex. Use it when the user asks for `dev-flow`, asks for a staged coding process, or wants project research before implementation.

## Platform Support

dev-flow fully supports the following platforms with identical capabilities:

| Platform | Config Dir | Agent Format | Status |
|----------|-----------|--------------|--------|
| Codex | `.codex/` | `.toml` | **Full** |
| Claude Code | `.claude/` | `.md` + frontmatter | Full |
| Cursor | `.cursor/` | `.md` + frontmatter | Full |
| CodeBuddy | `.codebuddy/` | `.md` | Full |
| Qoder | `.qoder/` | `.md` | Full |
| Trae | `.trae/` | `.md` | Full |
| WorkBuddy | `.workbuddy/` | `.md` | Full |

All platforms share the same memory (`.dev-flow/memory/`), sessions (`.dev-flow/sessions/`), contracts (`.dev-flow/contracts/`), and scripts (`.scripts/`).

## Modes

- Full flow: Research -> Clarify -> Analyze -> Design -> Task Split -> Develop -> Test/Fix -> Delivery.
- Research: inspect the project and update `.dev-flow/memory/`.
- Clarify: iterative Q&A to resolve requirement ambiguities.
- Analyze: turn a request into clear scope, constraints, affected files, and open questions.
- Design: produce a concrete implementation plan before editing code.
- Task Split: decompose design into parallel-executable subtasks.
- Develop: implement a confirmed design or a small direct request.
- Test/Fix: run focused verification, fix failures, and record useful learnings.
- Delivery: generate delivery report and summary.
- Hotfix: quickly diagnose and fix a supplied error; skip stage confirmations unless risk is high.

## Core Rules

1. Before writing code, read existing project memory and the relevant source files.
2. Preserve the project''s existing architecture, naming, style, dependencies, and test conventions.
3. Do not generate TODO placeholders, empty shells, or fake tests.
4. In full-flow mode, pause after Research, Analyze, and Design so the user can confirm before implementation.
5. Write stage artifacts to `.dev-flow/sessions/` and durable project knowledge to `.dev-flow/memory/`.
6. Protect user work: do not overwrite unrelated changes, generated memory, or existing project decisions without a reason.

## Codex Platform: Directory Structure

```
.codex/
├── config.toml              # Project configuration
├── agents/                  # Agent definitions (14 .toml files)
├── commands/                # Command definitions
│   └── dev-flow.md          # Full flow orchestration command
├── references/              # Reference documentation (11 files)
│   ├── protocol.md          # Zero-edit iron law, gate checks
│   ├── memory-system.md     # Memory system architecture
│   ├── learning-system.md   # Learning system
│   ├── runtime-protocol.md  # Runtime protocol
│   ├── degradation-matrix.md # Fault degradation matrix
│   ├── design-contract-go.md
│   ├── design-contract-python.md
│   ├── design-contract-typescript.md
│   ├── error-pattern-db.md
│   ├── model-context-config.md
│   └── on-demand-loader.md
└── stages/                  # Stage definitions (11 files)
    ├── research.md
    ├── clarify.md
    ├── analyze.md
    ├── design.md
    ├── task-split.md
    ├── develop.md
    ├── test.md
    ├── fix.md
    ├── hotfix.md
    ├── delivery.md
    └── code-reference.md
```

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

### Layered Scanning Strategy (Prevent Context Overflow)

For large projects, use three-layer scanning to avoid context overflow:

1. **Quick Scan**: Count files per module, identify key entry points, estimate complexity
2. **Smart Sampling**: Read 10-20 core files (main entities, key services) instead of all files
3. **On-Demand Loading**: Only read additional files when specific information is needed during Design/Develop

### Context Monitoring

Monitor context usage during long sessions:
- < 70%: Safe, continue normally
- 70-85%: Warning, reduce file reads, save checkpoint
- 85-95%: Critical, save checkpoint and clean context
- > 95%: Overflow risk, must save and resume with `/dev-flow --resume`

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

See `.codex/stages/research.md` for detailed stage instructions.

## Clarify

Clarify resolves requirement ambiguities before Analyze:

1. Parse requirement from external documents (files, URLs, templates) or direct description.
2. Cross-reference with project memory and existing code.
3. Identify ambiguities: business logic gaps, missing information, contradictions.
4. Iterative Q&A: ask focused questions, get user answers, re-analyze.
5. Auto-converge: detect when no new questions arise.
6. Output: `clarification-result.yaml` and `clarification-report.md`.

See `.codex/stages/clarify.md` for detailed stage instructions.

## Analyze

Analyze a request by:

1. Classifying it as new feature, enhancement, bug fix, refactor, performance, or test work.
2. Reading relevant memory and existing source.
3. Listing functional points, constraints, affected modules, expected file changes, risks, and open questions.
4. Writing the result to `.dev-flow/sessions/`.

Pause for confirmation before Design unless the user asked for a small direct change.

See `.codex/stages/analyze.md` for detailed stage instructions.

## Design

Design should include:

- data models, DTOs, APIs, services, frontend components, state, and tests.
- migration concerns, backward compatibility, concurrency, and security.
- expected file changes and a detailed implementation plan.
- a design artifact written to `.dev-flow/sessions/`.

Pause for confirmation before Task Split or Develop.

See `.codex/stages/design.md` for detailed stage instructions.

## Task Split

Task Split decomposes the design into independently executable subtasks:

1. Analyze design contract to identify task boundaries.
2. Classify subtasks: Entity, DTO, Mapper, Service, Controller (backend) or Type, API, Hook, Component, Page, Router, Store (frontend).
3. Build dependency DAG with data, interface, and event dependencies.
4. Generate per-subtask design documents.
5. Output: `task-dag.yaml`, `subtask-{id}-design.yaml`, `interface-registry.yaml`.

See `.codex/stages/task-split.md` for detailed stage instructions.

## Develop

Implement code based on confirmed design and conventions:

### Step 0: File Count Detection

Check requirement scale to prevent context overflow:
- <= 5 files: standard mode
- 6-10 files: suggest `/dev-flow -subagent` mode
- > 10 files: enforce `/dev-flow -subagent` mode

### Step 0.5: Code Generation Plan

When estimated output > 20KB per file, use skeleton + fill mode:
- Phase 0: Run `segment-code.cjs --plan` to generate code-generation-plan.yaml
- Phase 1: Generate skeleton (imports + class + fields + method signatures)
- Phase 2: Fill each method body incrementally
- Phase 3: Verify completeness (no TODOs, no empty methods)

### Step 2.5: Dependency Verification (Must Execute)

Before writing code, read all dependency class definitions:
- Entity/DTO/Enum: verify field names, types
- Service: verify method signatures
- Mapper: verify SQL annotations
- Feign Client: verify interface methods and paths

### Prohibited Actions

| Prohibited Behavior | Consequence | Correct Approach |
|---------------------|-------------|------------------|
| Generate `// TODO: implement` | Incomplete code | Must implement full logic |
| Generate placeholder components | Incomplete frontend | Must implement full component |
| Generate `return null;` | Non-functional method | Must implement full logic |
| Guess method names/types/imports | Compilation errors | Must read actual definitions first |
| Skip Step 2.5 verification | High compilation error risk | Must execute verification |

When a task is independent and large, use `develop-expert` subagents in parallel only after boundaries are clear and shared-file conflicts are avoided.

After editing:
- run the smallest useful verification first,
- broaden tests when shared behavior changed,
- update `.dev-flow/memory/patterns.md`, `mistakes.md`, or `preferences.md` only when a durable lesson was learned.

See `.codex/stages/develop.md` for detailed stage instructions.

## Test And Fix

Generate or run tests that cover normal, error, and boundary cases. If tests fail:

1. Read the failure output.
2. Locate the root cause.
3. Apply a focused fix.
4. Re-run relevant tests.
5. Record repeated mistakes in `.dev-flow/memory/mistakes.md`.

Test phases: Unit -> Smoke -> E2E (API+DB) -> E2E (UI) -> Integration.

See `.codex/stages/test.md` and `.codex/stages/fix.md` for detailed stage instructions.

## Delivery

Generate delivery report after all tests pass:
- Summarize completed work
- List all changed files
- Document test results and coverage
- Record learnings and patterns

See `.codex/stages/delivery.md` for detailed stage instructions.

## Hotfix

Emergency fix mode:
- Skip stage confirmations
- Diagnose error from supplied info
- Apply minimal fix
- Verify locally
- If risk is high, fall back to full flow

See `.codex/stages/hotfix.md` for detailed stage instructions.

## Subagent Guidance (Codex)

### All 14 Codex Agent Types

Codex agent definitions live in `.codex/agents/*.toml`. The following 14 agent types are supported natively by Codex and map to all capabilities in the Claude/Cursor platform:

| Agent | Use Case | Reasoning Effort |
|-------|----------|-----------------|
| `orchestrator` | Task decomposition, dependency management, result consolidation, task-split | high |
| `research-expert` | Project scanning, memory building, technology detection | high |
| `analyze-expert` | Requirement analysis, impact assessment, clarification | high |
| `design-expert` | Design documents, data models, API contracts, implementation plans | high |
| `develop-expert` | Code implementation (backend + frontend via stage context) | high |
| `verify-expert` | Code review, contract validation, quality checks, error learning | high |
| `smoke-test` | Smoke testing, core functionality verification, health checks | high |
| `integration-test` | Cross-service integration testing, Feign/Controller validation | high |
| `delivery` | Delivery report generation, summary, learning capture | high |
| `dependency-scanner` | Internal dependency scanning, shared module discovery | medium |
| `service-scanner` | Service source scanning, models, APIs, layers | medium |
| `structure-analyzer` | Project structure analysis, service registry, dependency graph | medium |
| `config-analyzer` | Configuration, conventions, patterns, decisions analysis | medium |
| `task-protocol` | Task assignment format definitions, result schemas | medium |

### Agent Capability Mapping (Claude/Cursor -> Codex)

All 28 Claude/Cursor agents map to Codex''s 14 agent types with zero capability loss:

| Claude/Cursor Agent | Codex Equivalent | Notes |
|---------------------|-----------------|-------|
| `backend-develop-expert` | `develop-expert` + backend stage | Stage context differentiates front/back-end |
| `frontend-develop-expert` | `develop-expert` + frontend stage | Stage context differentiates front/back-end |
| `clarify-expert` | `analyze-expert` + clarify stage | Clarification via Analyze stage instructions |
| `task-split-expert` | `orchestrator` + `task-protocol` | Task split via orchestrator delegation |
| `context-manager` | Built into AGENTS.md | Context management strategy inlined |
| `bytecode-analyzer` | `analyze-expert` | Merged into analysis capability |
| `contract-validator` | `verify-expert` | Merged into verification |
| `db-verifier` | `verify-expert` + `smoke-test` | DB verification via testing |
| `design-contract-validator` | `verify-expert` | Merged into verification |
| `e2e-ui-tester` | `smoke-test` + Browser plugin | UI testing via browser automation |
| `error-pattern-learner` | `verify-expert` + `delivery` | Learning distributed across stages |
| `on-demand-loader` | Built into AGENTS.md | On-demand loading strategy inlined |
| `runtime-state-manager` | `.dev-flow/runtime/` + checkpoints | State via filesystem |
| `service-orchestrator` | `orchestrator` | Merged into orchestrator |
| `step-enforcer` | `verify-expert` + stage confirmation | Enforcement via verification + confirm |

### When to Use Subagents

| Scenario | Use Subagent | Reason |
|----------|-------------|--------|
| Simple CRUD (<5 files) | No | Single agent sufficient |
| Medium (5-10 files) | Optional | Based on context usage |
| Complex (>10 files) | Yes | Must, prevent context overflow |
| Multi-service | Yes | Must, parallel development |
| Large scan (>200 files) | Yes | Must, layered scanning |

### Subagent Context Isolation

```
Each subagent has independent context:

1. Main agent passes only necessary input files
2. Subagent returns summary after completion
3. Detailed results written to files, not returned to main agent
4. Main agent keeps only: task status + result file paths
```

Subagents inherit the active sandbox and approval policy. Keep their instructions narrow and ask them to write structured results under `.dev-flow/sessions/`.

## Context Management

See AGENTS.md for detailed context management strategies including:
- Segmented execution
- On-demand loading
- Externalized results
- Checkpoint mechanism
- Recovery procedures
- Error handling

## Scripts

Helper scripts in `.scripts/`:
- `build.cjs` - Build project for target platform
- `dispatch.cjs` - Dispatch tasks to subagents
- `prepare-context.cjs` - Prepare context brief for subagent
- `segment-code.cjs` - Segment large code generation into phases
- `audit.cjs` - Audit file modifications
- `validate-contract.cjs` - Validate design contracts
- `validate-result.cjs` - Validate development results
- `validate-runtime.cjs` - Validate runtime state
- `install.js` - Install dev-flow into target project
- `pre-publish.js` - Pre-publish checks
- `version-check.js` - Version compatibility check
