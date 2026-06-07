# dev-flow User Guide

## Table of Contents

- [1. Overview](#1-overview)
- [2. Installation](#2-installation)
- [3. Quick Start](#3-quick-start)
- [4. Command Reference](#4-command-reference)
- [5. Stage Details](#5-stage-details)
  - [5.1 Research (Project Research)](#51-research-project-research)
  - [5.2 Analyze (Requirement Analysis)](#52-analyze-requirement-analysis)
  - [5.3 Design (Detailed Design)](#53-design-detailed-design)
  - [5.4 Task Split (Intelligent Task Splitting)](#54-task-split-intelligent-task-splitting)
  - [5.5 Develop (Development Execution)](#55-develop-development-execution)
  - [5.6 Test (Unified Testing)](#56-test-unified-testing)
  - [5.7 Fix (Bug Fixing)](#57-fix-bug-fixing)
- [6. Subagent Mode](#6-subagent-mode)
  - [6.1 What is Subagent Mode?](#61-what-is-subagent-mode)
  - [6.2 Applicable Scenarios](#62-applicable-scenarios)
  - [6.3 Commands](#63-commands)
  - [6.4 Architecture](#64-architecture)
  - [6.5 Workflow](#65-workflow)
  - [6.6 Cross-Platform Scheduling Strategy](#66-cross-platform-scheduling-strategy)
  - [6.7 Task Splitting and Dependency Handling](#67-task-splitting-and-dependency-handling)
  - [6.8 Scheme C: Subtask-Level Design and Interface Contracts](#68-scheme-c-subtask-level-design-and-interface-contracts)
  - [6.9 Precise On-Demand Loading](#69-precise-on-demand-loading)
- [7. Hotfix Mode](#7-hotfix-mode)
- [8. Breakpoint Resume](#8-breakpoint-resume)
- [9. Memory System](#9-memory-system)
- [10. Learning Capability](#10-learning-capability)
- [11. FAQ](#11-faq)

---

## 1. Overview

dev-flow is an AI-powered development workflow orchestration skill for Cursor, Trae, Qoder, Claude Code, OpenAI Codex, and other AI coding tools.

It follows a structured **8-stage workflow** (Research → Analyze → Design → Task Split → Develop → Test → Fix (on-demand) → Delivery), guiding AI coding tools to execute development tasks step by step, avoiding skipped steps, inconsistent code generation, and missed edge cases.

**Core Features**:
- After each stage completes, output a **structured confirmation Checklist** — the next stage only proceeds after item-by-item confirmation
- Automatically memorize project structure and coding conventions for automatic compliance in subsequent development
- Possesses learning capabilities — the more you use it, the better it understands your preferences
- **Main Agent Zero-Edit Architecture**: The main Agent serves only as a pure scheduling hub; all file operations are executed by dedicated stage subagents
- **8-Stage Workflow**: Research → Analyze → Design → Task Split → Develop → Test → Fix (on-demand) → Delivery
- **Two Operation Modes**: Standard Mode (serial subagents) / Enterprise Mode (parallel subagents)
- **Two-Layer Gate Checks**: Gate-A (prerequisite completeness) / Gate-B (executor audit)
- **LANGUAGE-ONLY Language Filtering**: Filter multi-language specifications by project type during build to reduce subagent context load
- **Stage History Compression**: Automatically compress conversation history into structured summaries after each stage confirmation to prevent main Agent context overflow
- **Research Multi-Subagent Architecture**: pre-scanner + 11 file-level subagents in 4 batches
- **Context Auto-Injection**: Automatically collect complete context before subagent dispatch
- **Structured Code Segmented Generation**: Large files automatically enable "skeleton + method-by-method filling"
- **Design→Code Logic Backtracking Verification**: Step 4.3 enforces 100% coverage verification
- **Design Contract Multi-Language**: Java / TypeScript / Python / Go interface contracts
- **Session Isolation (v3.4.0)**: Requirement-nickname-based directory isolation, supports multiple consecutive requirements without file overwrite

## 2. Installation

### Prerequisites

- Node.js >= 18.0.0
- At least one of the following AI coding tools installed: Cursor / Trae / Qoder / Claude Code / OpenAI Codex

### Installation Steps

```bash
# 1. Enter your project directory
cd your-project

# 2. Install dev-flow
npm install dev-flow --save-dev

# 3. Execute installation
npx dev-flow install
```

### Installation Output

After installation completes, the following files are added to your project:

```
your-project/
├── .trae/skills/dev-flow/
│   ├── SKILL.md                           # Router (~10KB skeleton)
│   ├── stages/                            # 8 stage instruction files (on-demand loaded)
│   │   ├── research.md
│   │   ├── analyze.md
│   │   ├── design.md
│   │   ├── task-split.md
│   │   ├── develop.md                      # Contains code integrity constitution + mandatory compilation verification
│   │   ├── test.md                        # Unified test stage
│   │   ├── fix.md
│   │   ├── hotfix.md
│   │   └── delivery.md
│   ├── agents/                            # 20 subagent definitions
│   └── references/                        # On-demand loaded reference documents
│       ├── protocol.md                    # Common protocol layer
│       ├── memory-system.md              # Memory system detailed rules
│       ├── learning-system.md            # Learning capability detailed description
│       ├── error-pattern-db.md          # Error pattern database
│       └── model-context-config.md      # Model context configuration
├── .cursor/
│   ├── commands/dev-flow.md             # Cursor Router
│   ├── stages/                            # 8 stage files
│   ├── agents/
│   └── references/
├── .qoder/
│   ├── commands/dev-flow.md
│   ├── stages/
│   ├── agents/
│   └── references/
├── .claude/
│   ├── commands/dev-flow.md
│   ├── stages/
│   ├── agents/
│   └── references/
├── AGENTS.md                              # OpenAI Codex project instructions
├── .agents/skills/dev-flow/SKILL.md       # OpenAI Codex repo-level Skill
├── .codex/
│   ├── config.toml
│   ├── agents/*.toml                      # Codex custom agents
│   └── references/
└── .dev-flow/
    ├── memory/                            # Long-term memory directory
    │   ├── project-overview.md
    │   ├── conventions.md
    │   ├── patterns.md                    # Code patterns (cross-session accumulative)
    │   ├── mistakes.md                   # Common errors (cross-session accumulative)
    │   ├── preferences.md                # User preferences (cross-session accumulative)
    │   ├── decisions.md                 # Architecture decisions (cross-session accumulative)
    │   └── session/                       # Session memory (rebuilt each Research)
    │       ├── modules.md                 # Module list (rebuilt each Research)
    │       ├── apis.md
    │       ├── models.md
    │       ├── utils.md
    │       ├── config.md
    │       └── architecture.md
    ├── sessions/                           # Session record directory
    │   └── .gitkeep
    ├── deliverables/                       # Human-readable stage approval deliverables
    │   └── {requirement-nickname}/      # Session isolation (v3.4.0)
    │       ├── 01-research-report.md
    │       ├── 02-analyze-result.md
    │       └── ...
    └── contracts/                         # Machine-readable structured data exchange files
        └── {requirement-nickname}/      # Session isolation (v3.4.0)
            ├── design-contract.yaml
            ├── task-breakdown.yaml
            └── ...
```

**Note**: `components.md` is used for frontend projects, `modules.md` for Java projects (records Entity/Mapper/Service/Controller/DTO/Enum). The installation script automatically creates corresponding files based on project type.

### Install for Specific Tools Only

If you only use one AI coding tool, you can install only the corresponding skill files:

```bash
npx dev-flow trae     # Install for Trae only
npx dev-flow cursor   # Install for Cursor only
npx dev-flow qoder    # Install for Qoder only
npx dev-flow claude   # Install for Claude Code only
npx dev-flow codex    # Install for OpenAI Codex only
```

### Reinstallation

If memory files already exist, the installation script skips them without overwriting. To regenerate memory files, first delete the `.dev-flow/memory/` directory:

```bash
rm -rf .dev-flow/memory
npx dev-flow install
```

## 3. Quick Start

### 3.1 Frontend Project Example (React + TypeScript)

**Scenario**: Implement user login functionality in a React + TypeScript project.

#### Step 1: Install

```bash
cd my-react-app
npm install dev-flow --save-dev
npx dev-flow install
```

#### Step 2: Use in AI Coding Tool

Open Cursor / Trae / Qoder / Claude Code, and type in the dialog box:

```
/dev-flow Implement user login function with email/password login, form validation, and remember password
```

#### Step 3: Follow Stage Confirmations

AI will execute the following workflow, pausing after each stage for your confirmation:

1. **Research** → AI scans your project, displays tech stack, existing components, etc. → You confirm
2. **Analyze** → AI analyzes requirements, lists functional points and impact scope → You confirm
3. **Design** → AI designs data models, APIs, components → You confirm
4. **Task Split** → AI splits design into parallelizable subtasks, generates DAG dependency graph → You confirm
5. **Develop** → AI generates complete, runnable code by subtask in parallel → You confirm
6. **Test** → AI generates and executes tests → You confirm
7. **Fix** → If there are failed test cases, AI automatically fixes (max 3 rounds)

### 3.2 Java Project Example (Spring Boot + MyBatis-Plus)

**Scenario**: Implement order management functionality in a Spring Boot microservice project.

#### Step 1: Install

```bash
cd my-java-service
npm install dev-flow --save-dev
npx dev-flow install
```

#### Step 2: Use in AI Coding Tool

Open Cursor / Trae / Qoder / Claude Code, and type in the dialog box:

```
/dev-flow Implement order management function with order creation, query, cancellation, using MyBatis-Plus for database operations
```

#### Step 3: Follow Stage Confirmations

AI will execute the following workflow, adapted to Java project characteristics:

1. **Research** → AI scans `pom.xml`, identifies Spring Boot version, MyBatis-Plus, layered architecture (Entity/Mapper/Service/Controller) → You confirm
2. **Analyze** → AI analyzes requirements, lists Entities, DTOs, Mappers, Services, Controllers, Enums needed → You confirm
3. **Design** → AI designs database tables, Entity annotations, API endpoints, Service interfaces, transaction boundaries → You confirm
4. **Task Split** → AI splits design into subtasks (Entity → DTO → Mapper → Service → Controller), generates DAG → You confirm
5. **Develop** → AI generates code by subtask: Enum → Entity → DTO → Mapper → Service → Controller → You confirm
6. **Test** → AI generates JUnit 5 + Mockito tests (Controller/Service/Mapper layered testing) → You confirm
7. **Fix** → If there are failed test cases, AI automatically fixes (max 3 rounds)

#### Java Project Special Tips

- **Layered Architecture**: AI automatically identifies and complies with Controller → Service → Mapper → Entity layered conventions
- **Dependency Injection**: AI uses constructor injection (recommended) or `@Autowired`
- **Transaction Management**: AI correctly uses `@Transactional(rollbackFor = Exception.class)` at the Service layer
- **Code Conventions**: AI complies with PascalCase (class names), camelCase (methods/variables), UPPER_SNAKE_CASE (constants)
- **Lombok**: AI automatically uses `@Data`, `@Builder`, `@RequiredArgsConstructor` and other annotations to simplify code
- **MyBatis-Plus**: AI correctly uses `@TableName`, `@TableId`, `@TableField` and other annotations
- **Validation Annotations**: AI uses `@NotNull`, `@Size`, `@Email` and other validation annotations in DTOs/Entities

## 4. Command Reference

### Full Workflow Mode

| Command | Description |
|---------|-------------|
| `/dev-flow <requirement description>` | Execute full workflow: Research → Analyze → Design → Task Split → Develop → Test → Fix (on-demand) → Delivery |

### Single Stage Mode

| Command | Description | Use Case |
|---------|-------------|----------|
| `/dev-flow -research` | Research stage only | First time using dev-flow, or project structure has major changes |
| `/dev-flow -analyze <requirement>` | Analyze stage only | Need to understand requirement impact scope first |
| `/dev-flow -design <requirement>` | Design stage only | Need to review design before development |
| `/dev-flow -split <requirement>` | Task Split stage only (Scheme C) | Need to split design into parallelizable subtasks |
| `/dev-flow -develop <requirement>` | Develop directly (skip design and split) | Small requirements, no detailed design and task split needed |
| `/dev-flow -test` | Unified test (unit+smoke+E2E+integration) | Already have code, need complete test verification |
| `/dev-flow -fix` | Analyze and fix bugs | Test failures, need fixes |
| `/dev-flow -hotfix <error message>` | Emergency hotfix for production errors | Production environment error, need quick fix |
| `/dev-flow -subagent <requirement>` | Enterprise parallel subagent mode | Complex tasks, involving multi-service/multi-module |

### Session Isolation (v3.4.0)

| Command | Description |
|---------|-------------|
| `/dev-flow <requirement description>` | First requirement (files stored in `{requirement-nickname}/` directory) |
| `/dev-flow <another requirement>` | Second requirement (auto-isolated, no file overwrite) |

Each requirement's deliverables and contracts are stored in separate `{requirement-nickname}` directories, preventing file overwrite and enabling full traceability.

### Breakpoint Resume

| Command | Description |
|---------|-------------|
| `/dev-flow --resume` | Continue from last interruption |

### Memory Management

| Command | Description |
|---------|-------------|
| `/dev-flow -cleanup` | Clean session memory (`session/` directory), keep long-term memory |
| `/dev-flow -cleanup --all` | Reset all memory files (use with caution) |

## 5. Stage Details

### 5.1 Research (Project Research)

**What it does**: AI scans your project, understands project structure, tech stack, coding conventions, existing components, and APIs.

**Execution Steps**:

*Phase 0 — pre-scanner Global Indexing (1 subagent)*
1. Scan project root directory (`pom.xml` / `package.json` / `go.mod`, etc.), identify project type
2. Execute global Quick Scan (Glob) — list all source code file paths (without reading file contents)
3. Output `file-index.yaml`: categorize by module/package, list complete paths for all Entities, DTOs, Controllers, Services, Configs, Utils

*Phase 1 — 11 File Subagents in 4 Batches*
4. **Batch 1 (Base Layer, 3 parallel)**: project-overview-subagent, service-registry-subagent, architecture-overview-subagent
5. **Batch 2 (Data Layer, 3 parallel)**: common-modules-subagent, models-subagent, config-files-subagent
6. **Batch 3 (Behavior Layer, 3 parallel)**: project-api-subagent, utils-subagent, conventions-subagent
7. **Batch 4 (Cross-Cutting Layer, 2 parallel)**: dependency-graph-subagent, decisions-subagent

Each file subagent's working method: Read `file-index.yaml` → Precisely locate target source code → Read and extract key information → Directly write to target memory file. **All 11 subagents are mutually independent**, requiring no aggregator.

**Core Advantages**:
- Each subagent has independent context (~25-40KB), avoiding single agent context overflow
- Smart Sampling upgraded from "forced agressive" to "relaxed full-volume"
- Critical classes (Base/Abstract/Core/@Configuration/@Primary) forcibly fully read
- Common modules (common-bean, etc.) Entity/Enum forcibly fully read
- Memory completeness A/B/C/D four-level rating, below B-level not allowed to enter Analyze

**You will see**: Deliverable document `01-research-report.md` (`.dev-flow/deliverables/{requirement-nickname}/`), containing project type, language, framework, component count, API count, coding conventions, completeness rating.

**What you need to do**: Check if research results are accurate, supplement or correct information missed by AI.

**Tips**:
- When using dev-flow for the first time, it's recommended to execute `/dev-flow -research` separately to establish project memory
- When project structure has major changes, you can re-execute Research to update memory

### 5.2 Analyze (Requirement Analysis)

**What it does**: AI parses your requirements, associates existing code, identifies ambiguities and impact scope.

**Execution Steps**:
1. Identify requirement type (new feature/enhancement/bug fix/refactoring/performance optimization) and priority
2. Extract core functional point list
3. Read project memory, associate existing components, APIs, data models
4. List unclear areas, ask you questions for clarification
5. **Requirement Consistency Validation**: Automatically detect logical contradictions, unreachable states, circular dependencies, data integrity constraints
6. Generate requirement analysis document
7. Output **structured confirmation Checklist**, waiting for your item-by-item confirmation

**You will see**: Requirement analysis document, containing functional points, constraints, ambiguities/pending confirmation items, related existing code.

**What you need to do**: Confirm if functional points are complete, answer ambiguity questions raised by AI.

### 5.3 Design (Detailed Design)

**What it does**: Based on requirement analysis and project memory, AI designs data models, API interfaces, component trees, and business processes.

**Execution Steps**:
1. Read project memory (project-overview, architecture, decisions)
2. Design data models (TypeScript interface / Python dataclass, etc.)
3. Design API endpoints (method, path, request body, response body, error codes)
4. Design component tree (page → container → presentation components)
5. Describe core business processes
6. **Structured Business Logic Design**: Convert business logic into structured decision tables, containing 8 action types (validate/query/convert/assign/throw/return/call/branch), each step defines clear conditions, onFail/onSuccess handling
7. Self-check: Ensure each functional point has corresponding design coverage

**You will see**: Design document, containing data model definitions, API design table, component design table, business process description, structured business logic decision table.

**What you need to do**: Check if design scheme is reasonable, confirm or propose modification suggestions.

### 5.4 Task Split (Intelligent Task Splitting)

**What it does**: AI splits the design document output from the Design stage into parallelizable subtasks, constructs DAG (Directed Acyclic Graph) dependency relationships, and generates independent design documents for each subtask.

**When to execute**:
- Automatically executed after Design stage confirmation in full workflow mode
- Execute separately using `/dev-flow -split <requirement>`
- Called by Orchestrator in Subagent mode

**Execution Steps**:
1. **Select Split Dimension**: Automatically select based on requirement complexity
   - Code layer dimension: Split by Entity → DTO → Mapper → Service → Controller (simple requirements)
   - Functional dimension: Split by business function, each task = one end-to-end implementation of a complete feature (complex requirements)
2. **Analyze Design Document**: Read `design-contract.yaml`, understand all Entities, DTOs, Services, Controllers definitions
3. **Identify Subtask Boundaries**: Split by selected dimension
4. **Construct Dependency DAG**: Analyze dependency relationships between subtasks, determine execution batches
5. **File Conflict Detection**: Detect file read-write conflicts between parallel tasks (write-write / write-read / read-write), correct DAG and reorder batches
6. **Generate Subtask Designs**: Generate `subtask-{id}-design.yaml` for each subtask
7. **Generate Interface Registry**: Aggregate all interfaces provided by subtasks, generate `interface-registry.yaml`
8. Output **structured confirmation Checklist**, waiting for your confirmation of the split scheme

**Output Files** (written to `.dev-flow/contracts/{requirement-nickname}/task-split/`):

| File | Description |
|------|-------------|
| `task-breakdown.yaml` | Task dependency DAG, containing node definitions and execution batches |
| `subtask-{id}-design.yaml` | Independent design document for each subtask |
| `interface-registry.yaml` | Interface registry, records all interfaces provided by subtasks |

**Subtask Design Document Structure** (`subtask-{id}-design.yaml`):

```yaml
subtaskId: "task-003"
name: "UserService"
type: "ServiceTask"

ownDesign:           # Content to be implemented by this task
  service:
    methods:
      - name: "getById"
        logic: [...]   # Detailed business logic steps

dependencies:        # Depend on interface contracts of other tasks
  - subtaskId: "task-002"
    interfaceContract:
      methods: [...]

provides:            # Interfaces provided externally by this task
  - interface: "UserService.getById"
    stability: "frozen"
```

**Split Granularity Control**:

| Scenario | Strategy |
|---------|----------|
| Single Service method < 50 lines | No split, one subagent completes |
| 50-200 lines | Split into multiple subtasks |
| > 200 lines | Must split, one subtask per step |
| Multiple Services with no dependencies | One subtask per Service, parallel execution |

**You will see**: Task split results, containing DAG dependency graph, execution batches, design summary for each subtask.

**What you need to do**: Confirm if split granularity is reasonable, dependency relationships are correct.

### 5.5 Develop (Development Execution)

**What it does**: develop-expert Subagent generates complete, runnable code in dependency order according to the design scheme.

**Business Code First Constitution**:
- P0 (Highest Priority): Business code (Enum → Entity → DTO → Mapper → Service → Controller) must all complete first
- P1 (Verification Means): Test code is only generated after business code is fully complete and compilation passes
- Strictly prohibited from generating any `*Test.java` / `*TestBase.java` files before business code completion

**Main Agent Scheduling Steps**:
1. Read task DAG and split documents
2. Run `prepare-context.cjs` to generate context injection file for each task
3. Create develop-expert Subagent (serial or parallel, depending on re-evaluation result)
4. Monitor Subagent execution progress
5. Collect all `develop-result.yaml`
6. Run `validate-result.cjs` to verify output
7. Report development results to user, output confirmation checklist

**develop-expert Subagent Execution Steps**:
1. Read context injection file (task-brief-{taskId}.md)
2. Read subtask design document, parse structured business logic
3. Develop in dependency order: Enum → Entity → DTO → Mapper → Service Interface → Service Impl → Controller
4. Self-check each file after generation (type errors, edge cases, style consistency, security vulnerabilities)
5. **Mandatory Compilation Verification**: After code generation, **must execute** compilation verification (Java: `mvn compile`, frontend: `tsc --noEmit`), if compilation fails, automatically enter fix loop (max 3 rounds)
6. **Business Code First Constitution Check**: Confirm all business code files have been generated and compilation passes before entering Step 4.2 pre-verification
7. **Design Logic Backtracking Verification** (Step 4.3): After compilation passes, forcibly execute logic backtracking verification
   - Extract all logic units (logic_steps / conditions / call actions) from `design-contract.yaml`
   - Locate implementations in code item by item, verify action type matches code characteristics
   - Calculate coverage (logic_step / condition / call_action), all metrics must be 100%
   - Output `logic-coverage-matrix.yaml` containing complete traceability matrix
8. Briefly explain implementation approach for each file
9. Output **structured confirmation Checklist** (including item 0 executor audit), waiting for your confirmation of code quality

**Structured Code Segmented Generation (v3.0.0 New)**:

When estimated target file output > 20KB, develop-expert automatically enables "skeleton + method-by-method filling" mode:
1. First generate complete skeleton (imports + class + fields + method signatures with TODO body)
2. Then fill methods one by one (each Edit replaces one TODO with complete method body)
3. Finally, full verification (compilation + contract validation + integrity scan)

Each filling output is only 5-10KB, always staying in the quality-safe zone (85-95%), avoiding quality degradation caused by single large output.

**You will see**: Complete code files, each file accompanied by implementation approach explanation.

**What you need to do**: Check code quality, confirm and enter Test stage.

**Important**:
- dev-flow requires AI to generate **complete, runnable** code, will not generate `// TODO` placeholders
- AI will automatically comply with your project's existing coding style
- AI will automatically reuse existing components and utility functions
- Large files (>20KB) automatically enable structured segmented generation to ensure code quality and integrity

### 5.6 Test (Unified Testing)

**What it does**: AI generates test cases for developed code and executes them, gradually verifying according to "unit test → smoke test → E2E test → integration test" sequence.

**Execution Steps**:
1. Read project memory and design documents
2. **Unit Test**: Generate test cases for each module (component testing, API testing, utility function testing), covering normal/exception/boundary cases, run `npm test` / `pytest` / `mvn test`
3. **Smoke Test**: Start service, quickly verify core business processes are runnable (curl or manual core API calls)
4. **E2E Test**: Use automated test scripts to verify complete business process chains (Java @SpringBootTest / Playwright / pytest httpx.AsyncClient / Gin httptest)
5. **Integration Test**: Verify cross-service/cross-module integration correctness (Feign Client endpoint matching, cross-service data consistency, interface contract consistency)
6. Generate unified test report `06-test-report.md`
7. Output **structured confirmation Checklist**

**Test Coverage Requirements**:
- Line coverage ≥ 90%, method coverage ≥ 95%
- At least one test case per functional point
- Prohibited from only testing rendering without testing interactions

**Tech Stack Adaptation**:

| Project Type | Unit Test | E2E Test |
|-------------|-----------|----------|
| Java (Spring Boot) | JUnit 5 + Mockito | `@SpringBootTest` + `TestRestTemplate` |
| Frontend (React/Vue) | Vitest / Jest | Playwright |
| Python (FastAPI) | pytest | `pytest` + `httpx.AsyncClient` |
| Go (Gin) | `testing` standard library | `net/http/httptest` |

### 5.7 Fix (Bug Fixing)

**What it does**: AI analyzes test failure causes, fixes code and performs regression testing.

**Execution Steps**:
1. Read failed test output, locate erroneous code
2. Analyze root cause (logic error/type error/missed edge cases)
3. Fix code, ensure no new problems introduced
4. Re-run all tests
5. Output **structured confirmation Checklist**

**You will see**: Fix explanation and regression test results.

**What you need to do**: Confirm if fix is correct.

**Note**: Fix stage loops at most 3 times. If there are still failed test cases after 3 times, AI will prompt you to intervene manually.

## 6. Subagent Mode

Subagent mode is an advanced feature of dev-flow, suitable for complex tasks, improving efficiency through task splitting and parallel execution.

### 6.1 What is Subagent Mode?

In dev-flow:
- **Main Agent** serves as a **pure scheduling hub** (zero-edit), responsible for creating subagents, monitoring progress, reporting to user
- **Professional Subagents** execute various stage tasks in independent contexts (Research / Analyze / Design / Develop / Test / Fix, etc.)
- **Parallel Development** — Tasks without dependencies can execute simultaneously, efficiency doubled
- **Context Isolation** — Each subagent only reads necessary files, avoiding context bloat

**Execution Method** (automatically determined by requirement complexity):
- **Simple Requirements**: Main Agent serially creates single subagent (start next after one completes)
- **Complex Requirements**: Orchestrator launches multiple subagents in parallel according to DAG batches

### 6.2 Applicable Scenarios

**Parallel Subagents Applicable To**:
- Requirement involves **2+ services/modules**
- Estimated to generate **10+ files**
- Large project code volume (context may be insufficient)
- Need **parallel development acceleration**

### 6.3 Commands

```
/dev-flow -subagent <requirement description>
```

**Example**:
```
/dev-flow -subagent Add approval functionality in quality inspection service, call workflow service to initiate approval process when quality inspection result is unqualified
```

### 6.4 Architecture

```
User ←→ Main Agent (pure scheduling hub, zero-edit)
              │
              ├── [Research: pre-scanner + 11 file-level subagents, 4 batches]
              │     Phase 0: pre-scanner × 1          → file-index.yaml
              │     Phase 1: Batch 1 (3) → 3 memory files (overview/registry/architecture)
              │              Batch 2 (3) → 3 memory files (common/models/config)
              │              Batch 3 (3) → 3 memory files (apis/utils/conventions)
              │              Batch 4 (2) → 2 memory files (dependency/decisions)
              ├── analyze-expert   → Analyze requirements, output task-breakdown.yaml
              ├── design-expert    → Detailed design, output design-contract.yaml
              ├── task-split-expert → Intelligent split, output DAG + subtask designs
              ├── develop-expert   → Subtask-level code development (can parallel multiple)
              ├── test-expert      → Unit testing
              ├── smoke-test-expert → Smoke testing
              ├── e2e-test-expert  → End-to-end testing
              ├── integration-test-expert → Integration testing
              ├── contract-validator → Contract consistency validation + logic coverage verification (R5)
              ├── fix-expert       → Bug fixing
              ├── error-pattern-learner → Error pattern learning
              ├── delivery-expert  → Delivery report
              └── verify-expert    → Code verification
```

### 6.5 Workflow

1. **Research Stage**: pre-scanner global indexing + 11 file-level subagents batch parallel scanning, generate 13 memory files + stage deliverable
2. **Analyze Stage**: analyze-expert analyzes requirements, outputs `task-breakdown.yaml` (task split and dependency relationships)
3. **Design Stage**: design-expert performs detailed design based on analysis results, outputs `design-contract.yaml` (including interface contracts)
4. **Task Split Stage**: task-split-expert splits design into subtasks, generates DAG dependency graph and subtask-level designs
5. **Develop Stage**: orchestrator performs topological sort according to DAG dependency graph, launches develop-expert in batches
   - Tasks without dependencies execute in parallel (e.g., creation of different Entities)
   - Tasks with dependencies execute serially (e.g., Entity → Mapper → Service → Controller)
   - Each develop-expert only receives its own subtask's design document (`subtask-{id}-design.yaml`)
   - After each develop-expert completes, execute compilation verification loop (max 3 rounds)
6. **Multi-Layer Verification**: After each batch completes, orchestrator executes verification chain
   - Step 5.1: develop-expert development self-check (Step 4.3 logic backtracking verification)
   - Step 5.2: contract-validator independent validation (R1-R5 rules, R5 is critical)
   - Step 5.3: verify-expert quality check (compilation verification + code quality)
   - Verification failure automatically returns to develop-expert for fix (max 2 rounds), exceeds then escalates to user
7. **Global Integration Compilation**: After all subtasks complete, orchestrator executes global compilation + contract consistency validation + error classification + loop fix
8. **Error Pattern Learning**: error-pattern-learner extracts patterns from compilation errors, contract violations, generates prevention strategies
9. **Verify Stage**: verify-expert verifies quality and integrity of all generated code

### 6.6 Cross-Platform Scheduling Strategy

Different AI coding platforms have greatly different subagent capabilities. dev-flow automatically detects the current platform and selects the appropriate scheduling strategy.

**Platform Capability Matrix**:

| Platform | Subagent Support | Parallel Capability | Scheduling Strategy |
|----------|-------------------|---------------------|-------------------|
| **Trae** | `/agent-name` slash command | Native parallelism | Full parallel mode |
| **Cursor** | Task tool | Multi-Task parallel | Sequential simulated parallelism |
| **Claude Code** | Sub agent | Native parallelism | Full parallel mode |
| **Qoder** | Sequential | Single session sequential | Sequential simulated parallelism |
| **Codex** | `AGENTS.md` agents definition | Limited parallelism | Limited parallel mode |

**Strategy 1: Trae Full Parallel Mode**

Launch multiple `/develop-expert` in the same batch, report results via `task-result.yaml`.

```
# Batch 1: Parallel launch
/develop-expert [Task-1 context]
/develop-expert [Task-2 context]
/develop-expert [Task-3 context]
```

**Strategy 2: Sequential Simulated Parallel Mode (Cursor / Claude / Qoder)**

Since the platform doesn't support native parallel subagents, adopt "context isolation + sequential execution" strategy:

1. Construct complete DAG + topological sort + divide into batches
2. For each task: Read `task-context.yaml` → Read previous `task-result.yaml` → Execute development → Write `task-result.yaml` → Clean context
3. Control each task within 30% context

**Strategy 3: Codex Limited Parallel Mode**

Switch agent context via `run agent: develop-expert`, execute according to DAG order.

### 6.7 Task Splitting and Dependency Handling

**DAG Dependency Graph**:
- `task-breakdown.yaml` output from Analyze stage defines all development tasks and their dependency relationships
- Orchestrator uses Kahn's algorithm for topological sorting, determining execution batches

**Execution Batch Example** (8 tasks):
| Batch | Tasks | Mode | Description |
|-------|-------|------|-------------|
| 1 | T1 (entity fields) + T7 (dependency config) | Parallel | No mutual dependencies |
| 2 | T2 (ApprovalRequest DTO) + T3 (Response DTO) | Parallel | Both depend on T1 but not each other |
| 3 | T4 (Service interface) | Serial | Depends on T2 |
| 4 | T5 (Service implementation) + T6 (Controller) | Parallel | Both depend on T4 but not each other |
| 5 | T8 (code verification) | Serial | Depends on all development tasks |

### 6.8 Scheme C: Subtask-Level Design and Interface Contracts

Scheme C is the core innovation of dev-flow in Subagent mode, solving dependency consistency and context overflow problems in parallel development through **subtask-level design** and **interface contract mechanism**.

#### Problems Solved

| Problem | Cause | Scheme C Solution |
|---------|-------|-----------------|
| Missing code generation | Insufficient context in Develop stage, missed parts of design | Each subtask only receives its own design, controllable context |
| Implementation deviation | AI guesses method names/types causing errors | Interface contract clearly defines method signatures, prohibits guessing |
| Cross-subtask dependency errors | Interface definitions inconsistent during parallel development | Interface registry centralized management, contract freeze mechanism |
| Context overflow | Large projects exceed AI context limit | Subtask-level design, single file < 500 lines |

#### Core Mechanism

**1. Global Contract (design-contract.yaml)**

Standard data exchange format output from Design stage, containing 8 standard sections + interface contracts:

```yaml
# Standard sections
entities: [...]      # Entity definitions
dtos: [...]          # DTO definitions
services: [...]      # Service definitions
controllers: [...]   # Controller definitions
mappers: [...]       # Mapper definitions
enums: [...]         # Enum definitions
feignClients: [...]  # Feign Client definitions
exceptions: [...]    # Exception class definitions

# Scheme C new: Cross-subtask interface contracts
interfaces:
  serviceContracts:  # Service interface contracts
    - name: "UserService"
      methods:
        - name: "getById"
          params: ["Long"]
          returnType: "UserDTO"
          stability: "frozen"    # frozen = cannot be modified arbitrarily after design confirmation
  eventContracts:    # Event contracts
    - name: "OrderCreatedEvent"
      topic: "order-events"
      payload: [...]
  dataContracts:     # Data contracts
    - name: "UserSummary"
      fields: [...]
```

**2. Subtask-Level Design (subtask-{id}-design.yaml)**

Each subtask has an independent design document, containing three parts:

| Section | Description | Example |
|---------|-------------|---------|
| `ownDesign` | Content to be implemented by this task | Service methods, business logic steps |
| `dependencies` | Depend on interface contracts of other tasks | Which Mapper's which method needs to be called |
| `provides` | Interfaces provided externally by this task | Provides UserService.getById interface |

**3. Interface Registry (interface-registry.yaml)**

Centralized management of all interfaces provided by subtasks, ensuring calling party and called party use the same interface definition.

**4. Contract Freeze Mechanism**

- After interface marked as `stability: frozen`, cannot be modified arbitrarily
- If modification needed, must notify all dependent parties
- Prevent interface definition inconsistency during parallel development

#### Execution Flow Example

```
Batch 1: [task-001: UserEntity]           ← No dependencies, parallel execution
Batch 2: [task-002: UserMapper]           ← Depends on task-001
Batch 3: [task-003: UserService]           ← Depends on task-002
Batch 4: [task-004: UserController]        ← Depends on task-003
```

Each develop-expert execution:
1. Read own `subtask-{id}-design.yaml`
2. Get dependent interface definitions from `interface-registry.yaml`
3. Only implement content defined in `ownDesign`
4. After completion, update `interface-registry.yaml`, register interfaces provided by self

### 6.9 Precise On-Demand Loading

Each subagent only reads necessary files:

| Subagent | Must-Read Files | On-Demand Read | Not Read |
|----------|-------------------|-----------------|----------|
| pre-scanner | pom.xml, global directory structure | None (only Glob, don't read source code) | node_modules, target, .git |
| File subagents (×13) | file-index.yaml + target source code files | Associated source code files | Irrelevant module code |
| analyze-expert | memory/ project memory | Requirement-related source code (interface definitions) | Other services' code |
| design-expert | Analysis results, project memory | 1-2 similar design references | Implementation details |
| develop-expert | Design document, task context | Currently task's related existing code | Other modules' code |
| verify-expert | Design document, development results | Generated code files | Unmodified files |

## 7. Hotfix Mode

Hotfix is an independent mode, doesn't need to go through the complete workflow, available at any time.

**Use Case**: Production environment error, need to quickly locate and fix.

**Command**:
```
/dev-flow -hotfix <error message>
```

**Example**:
```
/dev-flow -hotfix TypeError: Cannot read properties of undefined (reading 'map') at UserList.tsx:42
```

**Execution Flow**:
1. AI parses error type and location
2. Read related code files
3. Analyze error context
4. Provide root cause analysis and fix code
5. Provide verification steps

**Characteristics**: Hotfix directly outputs results, doesn't need to wait for confirmation.

## 8. Breakpoint Resume

When full workflow execution is interrupted halfway (e.g., closed AI coding tool, session timeout, etc.), you can use breakpoint resume to continue from the last interruption.

**Command**:
```
/dev-flow --resume
```

**Working Principle**:
- After each stage completes, AI writes progress to `.dev-flow/sessions/` directory
- When resuming, AI reads the most recent unfinished session, continues from the next uncompleted stage

**Session File Format** (`.dev-flow/sessions/{sessionId}.md`):
```markdown
# Session: User Login Function
- Status: In Progress
- Current Stage: Design
- Completed: Research → Analyze
- Start Time: 2026-06-07 10:00

## Research Summary
[Research result summary]

## Analyze Summary
[Requirement analysis summary]
```

## 9. Memory System

dev-flow's memory system enables AI to remember project information and user preferences, achieving cross-session knowledge accumulation.

The memory system is divided into **long-term memory** and **session memory** two layers:

- **Long-Term Memory** (`.dev-flow/memory/` root directory): Preserved across sessions, Research stage only updates without rebuilding
- **Session Memory** (`.dev-flow/memory/session/` subdirectory): Automatically emptied and rebuilt each Research, reflecting the latest project snapshot

### 9.1 Long-Term Memory

Long-term memory is created/updated during Research stage, continuously accumulated during Develop/Fix/user feedback.

**Common long-term memory for all projects**:

| File | Content | Update Timing |
|------|---------|----------------|
| `project-overview.md` | Project overview: tech stack, architecture, directory structure, entry files | Research |
| `conventions.md` | Coding conventions: naming style, import sorting, comment style, file organization | Research / Fix |
| `patterns.md` | Common code patterns: reusable code snippets, usage scenarios, usage count | Develop / User feedback |
| `mistakes.md` | Common errors and fixes: Bug patterns, fix solutions, occurrence count, prevention measures | Test / Fix |
| `preferences.md` | User preferences: code style, architecture preferences, quality requirements | User feedback |
| `decisions.md` | Architecture decision records (ADR): date, decision, reason, impact | Major decisions |

**Spring Cloud Microservices Additional Long-Term Memory**:

| File | Content | Update Timing |
|------|---------|----------------|
| `service-registry.md` | Service registry: service list, port, role, sub-modules | Research |
| `dependency-graph.md` | Dependency graph: inter-service dependencies, Feign call relationships | Research |
| `common-modules.md` | Common modules: universal Entity/DTO/Enum/Util | Research |

### 9.2 Session Memory

Session memory is stored in `.dev-flow/memory/session/` subdirectory, automatically emptied and rebuilt each Research.

| File | Content | Update Timing |
|------|---------|----------------|
| `modules.md` | Module list: Entity/Mapper/Service/Controller/DTO/Enum | Research / Develop |
| `apis.md` | API list: current service API + Feign Client API | Research / Develop |
| `models.md` | Data models: Entity + DTO + database tables | Research / Develop |
| `utils.md` | Utility functions/classes | Research |
| `config.md` | Configuration information: database/Redis/Nacos/middleware | Research |
| `architecture.md` | Architecture description: layering approach, design patterns | Research |

**Why Separate?** Session memory reflects the latest project code snapshot, should be rebuilt each Research to ensure accuracy. Long-term memory (patterns, errors, preferences) is accumulative, should not be emptied.

### 9.3 Memory Usage and Update Rules

#### Read Rules

| Timing | Must-Read Files |
|--------|-------------------|
| Before Develop | conventions, components, apis, utils, patterns |
| Before Design | project-overview, architecture, decisions |
| Before Analyze | components, apis, models |
| Before Fix | mistakes |
| Before All Stages | preferences |

**Spring Cloud Microservices Additional Reads**:

| Timing | Additional Files |
|--------|-------------------|
| Before Develop | service-registry, dependency-graph, common-modules |
| Before Analyze | service-registry, dependency-graph |

#### Update Rules

| Timing | Updated Files |
|--------|----------------|
| After Research completes | All basic memory files (frontend 7 / Java 8 / microservices 11) |
| After Develop completes | components/modules, apis, models, patterns |
| After Fix completes | mistakes, patterns, conventions |
| After user explicitly feedback | preferences |
| After major architecture decision | decisions |

#### Memory Reinforcement Mechanism

- Each pattern/error/preference record **usage count**
- Usage count > 3 times → Marked as **"high-frequency"**, AI prioritizes recommendation
- Usage count > 5 times → Marked as **"standard"**, AI must comply

### 9.4 Memory Cleanup

When memory files occupy too much space or data becomes outdated, you can use cleanup commands:

| Command | Effect | Applicable Scenario |
|---------|--------|---------------------|
| `/dev-flow -cleanup` | Only clean `session/` directory, keep long-term memory | After project structure changes, need to re-scan |
| `/dev-flow -cleanup --all` | Clean all memory files (including long-term memory) | After major architecture changes, rebuild from scratch |

**Safety Tips**:
- `-cleanup` without `--all` only cleans session memory, long-term memory (patterns/mistakes/preferences/decisions) safely preserved
- `-cleanup --all` will delete all accumulated knowledge, please use with caution
- After cleanup, execute `/dev-flow -research` to regenerate memory

## 10. Learning Capability

dev-flow continuously learns from your usage process, making AI increasingly understand your project and preferences.

### Learning Sources

| Source | What AI Learns | Updated File |
|--------|-----------------|-----------------|
| You praise a piece of code | Record code pattern, mark as "recommended" | patterns.md |
| You modified AI-generated code | Your coding habits and preferences | preferences.md / patterns.md |
| Test found Bug | Error patterns and fix solutions | mistakes.md |
| You explicitly specified preferences | Your preference settings | preferences.md |
| Major architecture decision | Decision and reason | decisions.md |
| A pattern reused 3+ times | High-frequency pattern marking | patterns.md |

### Learning Examples

**Example 1: Learning from Code Modifications**

AI-generated code:
```typescript
const handleSubmit = async (data) => {
  await api.createUser(data);
  router.push('/users');
};
```

You modified to:
```typescript
const handleSubmit = async (data) => {
  try {
    await api.createUser(data);
    toast.success('User created successfully');
    router.push('/users');
  } catch (error) {
    toast.error(error.message);
  }
};
```

AI automatically learns:
- You prefer adding toast notifications → Update `preferences.md`
- API calls need try-catch + toast → Update `patterns.md`

**Example 2: Learning from Errors**

Test stage discovered: Component didn't handle loading state causing test failure.
Fix stage fixed: Added loading state handling.

AI automatically learns:
- "Forgetting to handle loading state" is a common error → Update `mistakes.md`
- "Standard loading handling pattern" → Update `patterns.md`

### Learning Effectiveness Evaluation

dev-flow measures learning effectiveness through the following metrics:

| Metric | Target | Evaluation Method |
|--------|--------|---------------------|
| Code Acceptance Rate | > 80% | Proportion of times you modify AI-generated code decreases |
| Bug Recurrence Rate | < 10% | Same error doesn't appear more than 2 times |
| Pattern Reuse Rate | > 60% | Proportion of new code reusing existing patterns |
| User Satisfaction | > 4.5/5 | Subjective evaluation |

### How to Help AI Learn Better

1. **Explicit Feedback**: Directly tell AI your preferences, e.g., "use single quotes from now on", "always use React Hook Form for forms"
2. **Maintain Consistent Modification Style**: AI will observe your modification patterns, consistent modifications are easier to learn
3. **Timely Confirm Good Output**: When AI generates satisfactory code, confirm "this code is good"
4. **Regularly Check Memory Files**: View `.dev-flow/memory/` directory, confirm if AI's learning is accurate

## 11. FAQ

**Q: Why does dev-flow require Node.js to be installed?**
A: dev-flow is an npm package that provides AI Skill files for AI coding tools. The `npx dev-flow install` command generates the corresponding Skill files based on the platform.

**Q: Which AI coding tools does dev-flow support?**
A: Currently supports Cursor, Trae, Qoder, Claude Code, OpenAI Codex. More platforms may be supported in the future.

**Q: Will dev-flow overwrite my existing code?**
A: dev-flow only generates new code files and reads existing code files, will not arbitrarily modify your existing code. All generated code requires your confirmation before being written.

**Q: How to handle mid-process interruptions?**
A: Use `/dev-flow --resume` to resume from the last interruption.

**Q: How to clean up memory files?**
A: Use `/dev-flow -cleanup` to clean session memory, or `/dev-flow -cleanup --all` to reset all memory files.

**Q: How to handle generated code that doesn't meet expectations?**
A: You can directly modify the generated code, dev-flow will learn from your modifications and avoid similar problems in the future.

**Q: Does dev-flow support frontend projects?**
A: Yes, dev-flow supports frontend projects (React, Vue, etc.), backend projects (Java Spring Boot, Python FastAPI, Go Gin, etc.), and microservice architectures.

**Q: How to confirm if Research stage scanned the project correctly?**
A: After Research stage completes, check the `01-research-report.md` deliverable document, which contains project type, language, framework, component count, API count, coding conventions, completeness rating.

**Q: How to adjust task split granularity?**
A: In the Task Split stage, you can propose modification suggestions in the confirmation checklist, AI will adjust the split scheme according to your requirements.

**Q: What to do if tests fail?**
A: dev-flow will automatically enter Fix stage, analyze failure causes, fix code, and perform regression testing (max 3 rounds). If still failing after 3 rounds, AI will prompt you to intervene manually.

**Q: How to use dev-flow in multiple requirements scenarios?**
A: In v3.4.0, session isolation mechanism is introduced. Each requirement's deliverables and contracts are stored in separate `{requirement-nickname}` directories, preventing file overwrite and enabling full traceability.

---

*Document Version: v3.4.0*
*Last Updated: 2026-06-07*
