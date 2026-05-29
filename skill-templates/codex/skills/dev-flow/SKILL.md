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

### 🔴 Step 0: Check Demand Scale (Must Execute)

Before starting development, estimate the number of files involved:

| File Count | Action |
|------------|--------|
| ≤ 5 files | ✅ Standard mode allowed |
| 6-10 files | ⚠️ Warning: recommend Subagent mode |
| > 10 files | 🚨 Must use Subagent mode |

**If file count > 10**: Prompt user to use `/dev-flow -subagent` instead.

### 🔴 Step 2.5: Mandatory Read Verification (Must Execute)

> **⚠️ Iron Rule**: Before generating any code, you MUST read the actual definitions of all dependency classes.
> **Forbidden**: Guessing method names, types, or import paths based on naming conventions.

#### Step 2.5.1: Read Dependency Class Definitions

| Class Type | Read Method | Verify Content |
|------------|-------------|----------------|
| Entity | `Read {EntityPath}.java` | Field names, types, getter/setter method names |
| DTO | `Read {DTOPath}.java` | Field names, validation annotations |
| Enum | `Read {EnumPath}.java` | Enum value names, enum methods |
| Service | `Read {ServicePath}.java` | Method signatures, parameter types, return types |
| Mapper | `Read {MapperPath}.java` | Method signatures, SQL annotations |
| Feign Client | `Read {FeignPath}.java` | Interface methods, paths, parameters |

**Output Dependency Confirmation Table**:
```markdown
| Class | Read Status | Key Finding | Confirmed |
|-------|-------------|-------------|-----------|
| QmsInspectionBatch | ✅ Read | status field is byte, method is getInspectionBatchStatus() | ✅ |
```

#### Step 2.5.2: Import Path Verification

For each import statement:
1. **Search to confirm location**: `Grep "class Xxx" --glob="**/*.java"`
2. **Read to confirm**: If multiple found, read each to confirm which is correct
3. **Record actual path**

#### Step 2.5.3: Method Signature Verification

For each method call:
1. **Read target class definition**
2. **Extract actual method list**
3. **Match call**: Method name, parameter count, parameter types must all match

#### Step 2.5.4: Type Matching

For each field assignment:
1. **Read field's actual type**
2. **Type conversion check**: If types don't match, explicit conversion is required

### 🔴 Prohibited Actions

| Prohibited Behavior | Consequence | Correct Approach |
|---------------------|-------------|------------------|
| Generate `// TODO: implement` | Incomplete code | Must implement full logic |
| Generate `{/* description */}` placeholder | Incomplete frontend | Must implement full component |
| Generate `data: null` hardcoded return | Non-functional API | Must return real data |
| Generate `return null;` empty implementation | Non-functional method | Must implement full logic |
| Guess method names/types/imports | Compilation errors | Must read actual definitions first |
| Skip Step 2.5 verification | High compilation error risk | Must execute verification |

### 🔴 Step 5: Pre-Compilation Self-Check (Must Execute)

**Mandatory Check Items**:

| Check Item | Check Method | Pass Standard |
|------------|--------------|---------------|
| **Import paths** | Each import confirmed via Grep | ✅ All paths searchable |
| **Method calls** | Each call matches Step 2.5 read results | ✅ Method name, param count, param types all match |
| **Type compatibility** | Each field assignment is type-compatible | ✅ No implicit conversion, or explicit conversion declared |
| **Field references** | Each field reference matches Step 2.5 read results | ✅ Field name and type match |

**Output Pre-Compilation Check Report**:
```markdown
### Pre-Compilation Check Report

| Check Item | Status | Details |
|------------|--------|---------|
| Import paths | ✅ All confirmed | 12 imports, all verified via Grep |
| Method calls | ✅ All matched | 8 calls, all match Step 2.5 results |
| Type compatibility | ⚠️ 1 warning | `status = 1` → actual type is byte, needs explicit conversion |
| Field references | ✅ All matched | 5 field references, all match Entity definition |

**Issues to fix**:
1. `status = 1` → change to `status = (byte) 1`
```

**If any check item fails**:
1. **Must fix before continuing**
2. Do not claim "development complete"
3. Do not proceed to next file

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
