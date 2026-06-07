# dev-flow

![node](https://img.shields.io/node/v/dev-flow.svg)
![version](https://img.shields.io/badge/version-v3.4.0-blue)

> **Current Version: v3.4.0** | [Changelog](./CHANGELOG.md) | [User Guide](./USER_GUIDE.md)

An AI-powered development workflow orchestration skill for AI coding tools like Cursor, Trae, Qoder, Claude Code, and OpenAI Codex.

With the `/dev-flow` command, AI follows a structured **8-stage workflow**: **Research → Analyze → Design → Task Split → Develop → Test → Fix (on-demand) → Delivery**, pausing after each stage for confirmation to ensure output quality.

## Why dev-flow?

AI coding tools (Cursor/Trae/Qoder/Claude Code/Codex) are powerful, but when handling complex requirements they tend to:

- Skip important steps (like understanding project structure before writing code)
- Generate code inconsistent with project style
- Miss edge cases and error handling
- Lack systematic test verification
- Not remember user preferences and deep project knowledge
- Have insufficient context for large projects, skipping key scanning steps

dev-flow solves these problems through **structured workflow orchestration + project memory + long-term memory + learning capabilities + multi-subagent parallelism + main Agent zero-edit architecture**, making AI coding tools **better the more you use them**.

## Features

### Core Architecture

- **4-Layer On-Demand Loading Architecture** — Router (~10KB) + References (8 files) + 8 stage instructions + 20 Agents
- **8-Stage Workflow** — Research → Analyze → Design → Task Split → Develop → Test → Fix (on-demand) → Delivery
- **Two Operation Modes** — Standard Mode (serial subagents) / Enterprise Mode (parallel subagents), with dynamic re-evaluation and auto-upgrade
- **Two-Layer Gate Checks** — Gate-A (prerequisite completeness: confirmation files + deliverables + content validation) / Gate-B (executor audit: execution_trail + zero_edit_violation)
- **Cross-Platform Scheduling Strategy** — Trae native parallelism / Cursor/Claude/Qoder sequential simulation / Codex limited parallelism

### Workflow Capabilities

- **Intelligent Task Splitting** — Design output global contract, Task Split generates subtask-level design + DAG dependency graph + file conflict detection
- **Interface Contract Mechanism** — Cross-subtask interface definitions, contract freeze prevents arbitrary modifications
- **Design→Code Logic Backtracking Verification** — Step 4.3 enforces verification that every logic step has code implementation, 100% coverage
- **Contract Consistency Validation** — contract-validator R1-R5 rules (R5 logic step coverage = critical blocking)
- **Compilation Verification Loop** — Mandatory compilation verification after development, automatic fix loop (max 3 rounds)

### Memory & Learning

- **Project Memory** — Long-term memory (6 files, cross-session accumulation) + Session memory (6 files, rebuilt each Research)
- **Learning Capability** — Automatically learns from user feedback, code modifications, and test bugs
- **Multi-Language Design Contract** — Supports Java / TypeScript / Python / Go interface contracts
- **Unified Cross-Platform Protection** — step-enforcer/contract-validator and other protection agents shared across all platforms
- **Session Isolation (v3.4.0)** — Requirement-nickname based directory isolation, supports multiple consecutive requirements without file overwrite

### Code Quality

- **Main Agent Zero-Edit Constitution v2.0** — Main Agent is only an interaction hub and pure scheduler, never directly edits any files. File whitelist + @generated-by traceability + per-stage file modification audit
- **Business Code First Constitution** — P0 business code must complete before P1 test code
- **Structured Code Segmented Generation** — `segment-code.cjs`, "skeleton + method-by-method filling" four-stage protocol
- **Auto Output Validation** — `validate-result.cjs`, TODO/FIXME, empty method bodies, log-only, return null, Design Contract signature consistency
- **Context Auto-Injection** — `prepare-context.cjs`, automatically collects context before subagent dispatch, generates task-brief
- **Stage History Compression** — After each stage confirmation, automatically compresses conversation history into structured summary (`stage-summary.yaml`), freeing main Agent context space
- **LANGUAGE-ONLY Language Filtering** — build.cjs supports `--lang java` parameter, filters multi-language specifications by project type during build, reducing subagent context load

## Installation

```bash
# 1. Install to project
npm install dev-flow --save-dev

# 2. Execute installation (generates skill files and memory directories)
npx dev-flow install
```

After installation, the following files are automatically generated in your project:

| Tool | Generated Files | Trigger Method |
|------|-----------------|-----------------|
| Trae | `.trae/skills/dev-flow/SKILL.md` + `stages/*.md` + `agents/*.md` + `references/*.md` | Type `/dev-flow` in input box |
| Cursor | `.cursor/commands/dev-flow.md` + `stages/*.md` + `agents/*.md` + `references/*.md` | Type `/dev-flow` in input box |
| Qoder | `.qoder/commands/dev-flow.md` + `stages/*.md` + `agents/*.md` + `references/*.md` | Type `/dev-flow` in input box |
| Claude Code | `.claude/commands/dev-flow.md` + `stages/*.md` + `agents/*.md` + `references/*.md` | Type `/dev-flow` in input box |
| OpenAI Codex | `AGENTS.md` + `.agents/skills/dev-flow/SKILL.md` + `.codex/agents/*.toml` + `.codex/references/*.md` | Type `codex` in terminal then use natural language or `$dev-flow` |

You can also install for specific tools only:

```bash
npx dev-flow trae     # Install for Trae only
npx dev-flow cursor   # Install for Cursor only
npx dev-flow qoder    # Install for Qoder only
npx dev-flow claude   # Install for Claude Code only
npx dev-flow codex    # Install for OpenAI Codex only
```

## Quick Start

```bash
# 1. Enter your project
cd your-project

# 2. Install dev-flow
npm install dev-flow --save-dev
npx dev-flow install

# 3. In Cursor / Trae / Qoder / Claude Code, type:
/dev-flow Implement user login function with form validation and remember password
```

AI will execute step by step, pausing after each stage for your confirmation.

## Usage

### Full Workflow Mode

```
/dev-flow <requirement description>
```

Executes: Research → Analyze → Design → Task Split → Develop → Test → Fix (on-demand) → Delivery

### Single Stage Mode

| Command | Description | Use Case |
|---------|-------------|----------|
| `/dev-flow -research` | Research stage only | First time using dev-flow, or project structure has major changes |
| `/dev-flow -analyze <requirement>` | Analyze stage only | Need to understand requirement scope first |
| `/dev-flow -design <requirement>` | Design stage only | Need to review design before development |
| `/dev-flow -split <requirement>` | Task Split stage only (Scheme C) | Need to split design into parallelizable subtasks |
| `/dev-flow -develop <requirement>` | Develop directly (skip design and split) | Small requirements, no detailed design needed |
| `/dev-flow -test` | Unified test (unit+smoke+E2E+integration) | Already have code, need complete test verification |
| `/dev-flow -fix` | Analyze and fix bugs | Test failures, need fixes |
| `/dev-flow -hotfix <error message>` | Emergency hotfix for production errors | Production error, need quick fix |
| `/dev-flow -subagent <requirement>` | Enterprise parallel subagent mode | Complex tasks, involving multi-service/multi-module |

### Session Isolation (v3.4.0)

```
/dev-flow <requirement description>  # First requirement
/dev-flow <another requirement>     # Second requirement - files auto-isolated
```

Each requirement's deliverables and contracts are stored in separate `{requirement-nickname}` directories, preventing file overwrite and enabling full traceability.

### Memory Management

| Command | Description |
|---------|-------------|
| `/dev-flow -cleanup` | Clean session memory (`session/` directory), keep long-term memory |
| `/dev-flow -cleanup --all` | Reset all memory files (use with caution) |

### Breakpoint Resume

| Command | Description |
|---------|-------------|
| `/dev-flow --resume` | Continue from last interruption |

## Workflow

```
Research → Analyze → Design → Task Split → Develop → Test → Fix (on-demand) → Delivery
  Research   →  Analyze   →   Design   →  Task Split  →  Develop  →  Test  →   Fix    →  Delivery

Hotfix (Independent mode, available anytime)
```

| Stage | What AI Does | Output |
|-------|----------------|--------|
| **Research** | pre-scanner global indexing + 11 file-level subagents in 4 batches, Smart Sampling service-level independence, critical class强制全量读取, completeness A/B/C/D rating | `.dev-flow/memory/` 13 files + `memory/_index/file-index.yaml` + stage deliverable |
| **Analyze** | Parse requirements, associate existing code, identify ambiguities, consistency validation | Requirement analysis document + stage deliverable |
| **Design** | Data model, API interfaces, component tree, business process, structured decision table | `design-result.md` + `design-contract.yaml` (with multi-language interface contract) |
| **Task Split** | Split into subtasks, conflict detection, DAG construction, dual-dimension selection, subtask-level design | `task-breakdown.yaml` + `subtask-{id}-design.yaml` + `interface-registry.yaml` |
| **Develop** | develop-expert subagent develops by subtask, context auto-injection, segmented generation, business code first, mandatory compilation, logic backtracking verification | Code files + stage deliverable |
| **Test** | Unified test: unit test → smoke test → E2E test → integration test | Unified test report |
| **Fix** | Analyze failure causes, fix code, regression test (max 3 loops) | `fix-report.md` + fixed code (triggered on-demand) |
| **Delivery** | Summarize full workflow results, generate delivery checklist | Delivery report |

## Architecture

### 4-Layer On-Demand Loading Architecture

```
Layer 1: Router (SKILL.md, ~410 lines, always loaded)
  ├── Command parsing + global rules
  ├── Stage routing table + main Agent scheduling flow
  ├── Memory system + learning capability quick reference
  └── Stage confirmation mechanism (with history compression rules)

Layer 2: References (8 on-demand loaded reference documents)
  ├── protocol.md (zero-edit constitution + failure protocol + deliverable + gate + history compression)
  ├── memory-system.md / learning-system.md / error-pattern-db.md / model-context-config.md
  └── design-contract-typescript.md / design-contract-python.md / design-contract-go.md

Layer 3: Stage instruction files (loaded when entering stage, 10 files)
  ├── research.md / analyze.md / design.md / task-split.md
  ├── develop.md (only scheduling protocol, execution specs reference develop-expert.md)
  ├── test.md (unified test: unit+smoke+E2E+integration)
  └── fix.md / hotfix.md / delivery.md / code-reference.md

Layer 4: Agent files (loaded when creating subagent, 20 files)
  ├── develop-expert.md (supports LANGUAGE-ONLY language filtering)
  ├── analyze-expert / design-expert / task-split-expert
  ├── contract-validator / verify-expert / step-enforcer
  └── ...total 20 (including 5 legacy Research agents)
```

### Subagent Execution Architecture (Unified Model)

```
User ←→ Main Agent (pure scheduling hub, zero-edit)
              │
              ├── [Research: pre-scanner + 11 file-level subagents, 4 batches]
              │     Phase 0: pre-scanner × 1          → file-index.yaml
              │     Phase 1: Batch 1 (base layer, 3 parallel) → project-overview / service-registry / architecture
              │              Batch 2 (data layer, 3 parallel) → common-modules / models / config
              │              Batch 3 (behavior layer, 3 parallel) → apis / utils / conventions
              │              Batch 4 (cross-cutting layer, 2 parallel) → dependency-graph / decisions
              ├── analyze-expert     → Requirement analysis
              ├── design-expert      → Detailed design
              ├── task-split-expert  → Task split + DAG
              ├── develop-expert     → Code development (can parallel multiple)
              ├── test-expert        → Unified test
              ├── fix-expert         → Bug fixes
              ├── delivery-expert    → Delivery report
              └── contract-validator → Contract validation + logic coverage verification (R5)
```

### Cross-Platform Scheduling Strategy

| Platform | Subagent Support | Parallel Capability | Research Scheduling | References |
|----------|-------------------|---------------------|---------------------|-------------|
| **Trae** | `/agent-name` slash command | Native parallelism | 12 parallel | ✅ |
| **Cursor** | Task tool | Multi-Task parallel | 12 parallel | ✅ |
| **Claude Code** | Sub agent | Native parallelism | 12 parallel | ✅ |
| **Qoder** | Sequential | Single session sequential | 4 batches | ✅ |
| **Codex** | `AGENTS.md` agents | Limited parallelism | 2 batch merge | ✅ |

## Project Structure

```
dev-flow/
├── skill-templates/          # Skill file templates
│   ├── _core/                # Core template source (common base for all platforms)
│   │   ├── SKILL.md          # Router (~410 lines, always loaded)
│   │   ├── stages/           # 10 stage instruction files (on-demand loaded)
│   │   │   ├── research.md / analyze.md / design.md / task-split.md
│   │   │   ├── develop.md (main Agent scheduling protocol)
│   │   │   ├── test.md (unified test: unit+smoke+E2E+integration)
│   │   │   └── fix.md / hotfix.md / delivery.md / code-reference.md
│   │   ├── agents/           # 20 Agent definitions (including 5 legacy Research agents)
│   │   │   ├── develop-expert.md (with LANGUAGE-ONLY multi-language specs)
│   │   │   └── ...
│   │   └── references/       # 8 on-demand reference documents
│   │       ├── protocol.md (zero-edit constitution + failure protocol + history compression + gate + deliverable)
│   │       ├── memory-system.md / learning-system.md
│   │       ├── error-pattern-db.md / model-context-config.md
│   │       └── design-contract-typescript.md / design-contract-python.md / design-contract-go.md
│   ├── _platforms/           # Platform-specific files
│   └── trae/ cursor/ qoder/ claude/ codex/  # Each platform's build output
├── scripts/
│   ├── build.cjs             # Build script (path replacement + PLATFORM-ONLY + LANGUAGE-ONLY)
│   ├── dispatch.cjs          # Platform scheduling engine
│   ├── prepare-context.cjs   # Subagent context auto-injection (precise matching)
│   ├── segment-code.cjs      # Structured code segmented generation
│   ├── validate-result.cjs   # Subagent output auto-validation (multi-language enhanced)
│   ├── validate-contract.cjs # Design Contract validation
│   ├── audit.cjs             # File modification audit (zero-edit constitution + checksum)
│   ├── install.js            # Installation script
│   ├── version-check.js      # Version consistency check
│   └── pre-publish.js        # Pre-publish checks
├── tests/                    # Test suite
│   ├── build.test.js / links.test.js / size-warning.test.js / format.test.js
│   └── run-all.js
├── USER_GUIDE.md             # User operation manual
├── CHANGELOG.md
├── LICENSE
└── package.json
```

## Build & Development

```bash
npm run build                 # Build all platforms (include all languages)
npm run build -- --lang java  # Build and keep Java language content only
npm run verify                # Build verification
npm test                      # Run all tests
npm run test:version          # Version consistency check
```

## Supported Tools

| Tool | Trigger Method | Subagent Scheduling | References |
|------|----------------|---------------------|-------------|
| Cursor | `/dev-flow` | Multi-Task parallel | ✅ |
| Trae | `/dev-flow` | Native parallelism | ✅ |
| Qoder | `/dev-flow` | Sequential simulated parallelism | ✅ |
| Claude Code | `/dev-flow` | Native parallelism | ✅ |
| OpenAI Codex | Natural language / `$dev-flow` | Limited parallelism | ✅ |

## License

[MIT](./LICENSE)
