# dev-flow 用户操作手册

## 目录

- [1. 概述](#1-概述)
- [2. 安装](#2-安装)
- [3. 快速上手](#3-快速上手)
- [4. 命令参考](#4-命令参考)
- [5. 各阶段详解](#5-各阶段详解)
  - [5.1 Research（项目调研）](#51-research项目调研)
  - [5.2 Analyze（需求分析）](#52-analyze需求分析)
  - [5.3 Design（详细设计）](#53-design详细设计)
  - [5.4 Task Split（智能任务拆分）](#54-task-split智能任务拆分)
  - [5.5 Develop（开发执行）](#55-develop开发执行)
  - [5.6 Unit Test（单元测试）](#56-unit-test单元测试)
  - [5.7 Smoke Test（冒烟测试）](#57-smoke-test冒烟测试)
  - [5.8 E2E Test（端到端测试）](#58-e2e-test端到端测试)
  - [5.9 Integration Test（集成测试）](#59-integration-test集成测试)
  - [5.10 Fix（Bug 修复）](#510-fixbug-修复)
- [6. Subagent 模式](#6-subagent-模式)
  - [6.1 什么是 Subagent 模式](#61-什么是-subagent-模式)
  - [6.2 适用场景](#62-适用场景)
  - [6.3 命令](#63-命令)
  - [6.4 架构](#64-架构)
  - [6.5 工作流程](#65-工作流程)
  - [6.6 跨平台调度策略](#66-跨平台调度策略)
  - [6.7 任务拆分与依赖处理](#67-任务拆分与依赖处理)
  - [6.8 方案C：子任务级设计与接口契约](#68-方案c子任务级设计与接口契约)
  - [6.9 精准按需加载](#69-精准按需加载)
- [7. Hotfix 模式](#7-hotfix-模式)
- [8. 断点续传](#8-断点续传)
- [9. 记忆系统](#9-记忆系统)
  - [9.1 长期记忆](#91-长期记忆)
  - [9.2 会话记忆](#92-会话记忆)
  - [9.3 记忆使用和更新规则](#93-记忆使用和更新规则)
  - [9.4 记忆清理](#94-记忆清理)
- [10. 学习能力](#10-学习能力)
- [11. 常见问题](#11-常见问题)

---

## 1. 概述

dev-flow 是一个 AI 开发全流程编排 Skill，适用于 Cursor、Trae、Qoder、Claude Code、OpenAI Codex 等 AI 编程工具。

它通过结构化的 11 阶段流程（Research → Analyze → Design → Task Split → Develop → Unit Test → Smoke Test → E2E Test → Integration Test → Fix → Delivery），让 AI 编程工具按步骤执行开发任务，避免跳过重要步骤、生成不一致代码、遗漏边界情况等问题。

**v3.2.0 核心特点**：
- 每个阶段完成后输出**结构化确认 Checklist**，逐项确认后才可进入下一阶段
- 自动记忆项目结构和编码规范，后续开发自动遵守
- 具备学习能力，使用越多越了解你的偏好
- **主 Agent 零编辑架构**：主 Agent 仅作为调度枢纽，所有文件操作由专门的阶段 Subagent 执行
- **Router 瘦身至 ~23KB**：详细内容外置到 6 个独立 reference 文件，按需加载不浪费初始上下文
- **阶段交付物审批机制**：每个阶段产出独立审批文档，主 Agent 读取并打开供用户审阅
- **Subagent 失败硬阻断**：三级失败处理协议（L1 自动重试 → L2 诊断重试 → L3 人工升级），防止主 Agent 越权

## 2. 安装

### 前置条件

- Node.js >= 18.0.0
- 已安装 Cursor / Trae / Qoder / Claude Code / OpenAI Codex 中的任意一个

### 安装步骤

```bash
# 1. 进入你的项目目录
cd your-project

# 2. 安装 dev-flow
npm install Jane-Split/dev-flow --save-dev

# 3. 执行安装
npx dev-flow install
```

### 安装产物

安装完成后，你的项目中会新增以下文件：

```
your-project/
├── .trae/skills/dev-flow/
│   ├── SKILL.md                       # Router（~23KB 骨架）
│   ├── stages/                        # 13 个阶段指令文件（按需加载）
│   │   ├── research.md
│   │   ├── analyze.md
│   │   ├── design.md
│   │   ├── task-split.md
│   │   ├── develop.md
│   │   ├── unit-test.md
│   │   ├── smoke-test.md
│   │   ├── e2e-test.md
│   │   ├── integration-test.md
│   │   ├── fix.md
│   │   ├── hotfix.md
│   │   ├── delivery.md
│   │   └── code-reference.md
│   ├── agents/                        # 20 个 subagent 定义
│   └── references/                    # 10 个参考文档（按需加载）
│       ├── zero-edit-audit.md         # 零编辑审计规范（v3.2.0 新增）
│       ├── failure-decision-tree.md    # 失败决策树（v3.2.0 新增）
│       ├── deliverable-protocol.md     # 交付物协议（v3.2.0 新增）
│       ├── gate-checks.md             # 门禁检查详情（v3.2.0 新增）
│       ├── mode-comparison.md         # 模式对比速查表（v3.2.0 新增）
│       ├── platform-adapters.md        # 平台适配规则（v3.2.0 新增）
│       ├── memory-system.md           # 记忆系统（v2.0.0）
│       ├── learning-system.md          # 学习系统（v2.0.0）
│       ├── error-pattern-db.md        # 错误模式库（v2.0.0）
│       └── model-context-config.md     # 模型上下文配置（v2.0.0）
├── .cursor/                          # Cursor 安装产物（结构同上）
├── .qoder/                          # Qoder 安装产物（结构同上）
├── .claude/                         # Claude Code 安装产物（结构同上）
├── AGENTS.md                        # OpenAI Codex 项目指令
├── .agents/skills/dev-flow/SKILL.md # OpenAI Codex 仓库级 Skill
├── .codex/                         # Codex 格式适配（结构同上）
└── .dev-flow/
    ├── memory/                        # 长期记忆目录
    │   ├── project-overview.md
    │   ├── conventions.md
    │   ├── patterns.md                # 代码模式（跨会话累积）
    │   ├── mistakes.md                # 常见错误（跨会话累积）
    │   ├── preferences.md             # 用户偏好（跨会话累积）
    │   ├── decisions.md               # 架构决策（跨会话累积）
    │   └── session/                   # 会话记忆（每次 Research 重建）
    │       ├── modules.md
    │       ├── apis.md
    │       ├── models.md
    │       ├── utils.md
    │       ├── config.md
    │       └── architecture.md
    └── sessions/                     # 会话记录目录
        └── .gitkeep
```

**注意**：`components.md` 用于前端项目，`modules.md` 用于 Java 项目（记录 Entity/Mapper/Service/Controller/DTO/Enum）。安装脚本会根据项目类型自动创建对应的文件。

### 只安装特定工具

如果你只使用某个 AI 编程工具，可以只安装对应的 skill 文件：

```bash
npx dev-flow trae     # 仅安装 Trae
npx dev-flow cursor   # 仅安装 Cursor
npx dev-flow qoder    # 仅安装 Qoder
npx dev-flow claude   # 仅安装 Claude Code
npx dev-flow codex    # 仅安装 OpenAI Codex
```

### 重新安装

如果记忆文件已存在，安装脚本会跳过不覆盖。如需重新生成记忆文件，先删除 `.dev-flow/memory/` 目录：

```bash
rm -rf .dev-flow/memory
npx dev-flow install
```

## 3. 快速上手

### 3.1 前端项目示例（React + TypeScript）

**场景**：在一个 React + TypeScript 项目中实现用户登录功能。

#### Step 1：安装

```bash
cd my-react-app
npm install Jane-Split/dev-flow --save-dev
npx dev-flow install
```

#### Step 2：在 AI 编程工具中使用

打开 Cursor / Trae / Qoder / Claude Code，在对话框中输入：

```
/dev-flow 实现用户登录功能，包含表单验证和记住密码
```

#### Step 3：跟随阶段确认

AI 将按以下流程执行，每个阶段完成后暂停等你确认：

1. **Research** → AI 扫描你的项目，展示技术栈、已有组件等信息 → 你确认
2. **Analyze** → AI 分析需求，列出功能点和影响范围 → 你确认
3. **Design** → AI 设计数据模型、API、组件 → 你确认
4. **Task Split** → AI 将设计拆分为可并行的子任务，生成 DAG 依赖图 → 你确认
5. **Develop** → AI 按子任务并行生成完整可运行的代码 → 你确认
6. **Test** → AI 生成并执行测试 → 你确认
7. **Fix** → 如有失败用例，AI 自动修复（最多 3 轮）

### 3.2 Java 项目示例（Spring Boot + MyBatis-Plus）

**场景**：在一个 Spring Boot 微服务项目中实现订单管理功能。

#### Step 1：安装

```bash
cd my-java-service
npm install Jane-Split/dev-flow --save-dev
npx dev-flow install
```

#### Step 2：在 AI 编程工具中使用

打开 Cursor / Trae / Qoder / Claude Code，在对话框中输入：

```
/dev-flow 实现订单管理功能，包含订单创建、查询、取消，使用 MyBatis-Plus 操作数据库
```

#### Step 3：跟随阶段确认

AI 将按以下流程执行，针对 Java 项目的特点进行适配：

1. **Research** → AI 扫描 `pom.xml`，识别 Spring Boot 版本、MyBatis-Plus、分层架构（Entity/Mapper/Service/Controller）→ 你确认
2. **Analyze** → AI 分析需求，列出需要新增的 Entity、DTO、Mapper、Service、Controller、Enum → 你确认
3. **Design** → AI 设计数据库表、Entity 注解、API 端点、Service 接口、事务边界 → 你确认
4. **Task Split** → AI 将设计拆分为子任务（Entity → DTO → Mapper → Service → Controller），生成 DAG → 你确认
5. **Develop** → AI 按子任务并行生成代码：Enum → Entity → DTO → Mapper → Service → Controller → 你确认
6. **Test** → AI 生成 JUnit 5 + Mockito 测试（Controller/Service/Mapper 分层测试）→ 你确认
7. **Fix** → 如有失败用例，AI 自动修复（最多 3 轮）

#### Java 项目特别提示

- **分层架构**：AI 会自动识别和遵守 Controller → Service → Mapper → Entity 的分层规范
- **依赖注入**：AI 使用构造器注入（推荐）或 `@Autowired`
- **事务管理**：AI 会在 Service 层正确使用 `@Transactional(rollbackFor = Exception.class)`
- **代码规范**：AI 遵守 PascalCase（类名）、camelCase（方法/变量）、UPPER_SNAKE_CASE（常量）
- **Lombok**：AI 会自动使用 `@Data`、`@Builder`、`@RequiredArgsConstructor` 等注解简化代码
- **MyBatis-Plus**：AI 会正确使用 `@TableName`、`@TableId`、`@TableField` 等注解
- **校验注解**：AI 会在 DTO/Entity 中使用 `@NotNull`、`@Size`、`@Email` 等校验注解

## 4. 命令参考

### 全流程模式

| 命令 | 说明 |
|------|------|
| `/dev-flow <需求描述>` | 执行完整流程：Research → Analyze → Design → Task Split → Develop → Unit Test → Smoke Test → E2E Test → Integration Test → Fix → Delivery |

### 单阶段模式

| 命令 | 说明 | 使用场景 |
|------|------|----------|
| `/dev-flow -research` | 仅执行项目调研 | 项目首次使用 dev-flow，或项目结构有较大变化 |
| `/dev-flow -analyze <需求>` | 仅执行需求分析 | 需要先了解需求的影响范围 |
| `/dev-flow -design <需求>` | 仅执行详细设计 | 需要先看设计方案再开发 |
| `/dev-flow -split <需求>` | 仅执行任务拆分（方案C） | 需要将设计拆分为可并行的子任务 |
| `/dev-flow -develop <需求>` | 直接开发（跳过设计和拆分） | 小需求，不需要详细设计和任务拆分 |
| `/dev-flow -test` | 生成单元测试并执行 | 已有代码，需要补充测试 |
| `/dev-flow -smoke` | 执行冒烟测试 | 开发完成后快速验证核心流程 |
| `/dev-flow -e2e` | 执行端到端测试 | 冒烟测试通过后，验证功能正确性 |
| `/dev-flow -integration` | 执行集成测试 | 端到端测试通过后，验证跨服务/跨模块集成 |
| `/dev-flow -fix` | 分析并修复 Bug | 测试失败，需要修复 |
| `/dev-flow -hotfix <错误信息>` | 紧急修复线上错误 | 生产环境报错，需要快速修复 |
| `/dev-flow -subagent <需求>` | Subagent 并行模式 | 复杂任务，涉及多服务/多模块 |

### 断点续传

| 命令 | 说明 |
|------|------|
| `/dev-flow --resume` | 从上次中断处继续 |

### 记忆管理

| 命令 | 说明 |
|------|------|
| `/dev-flow -cleanup` | 清理会话记忆（`session/` 目录），保留长期记忆 |
| `/dev-flow -cleanup --all` | 重置全部记忆文件（谨慎使用） |

## 5. 各阶段详解

### 5.1 Research（项目调研）

**做什么**：AI 扫描你的项目，了解项目结构、技术栈、编码规范、已有组件和 API。

> **v3.1.0 架构升级**：Research 阶段从单 agent 串行扫描升级为 **pre-scanner + 13 个文件级 subagent 分批并行** 架构。微服务项目的所有关键类全量读取，记忆完整度从采样模式提升为全量覆盖。

**执行步骤**：

*Phase 0 — pre-scanner 全局索引（1 个子代理）*
1. 扫描项目根目录（`pom.xml` / `package.json` / `go.mod` 等），识别项目类型
2. 执行全局 Quick Scan（Glob）- 列出所有源码文件路径（不读取文件内容）
3. 输出 `file-index.yaml`：按模块/包分类，列出所有 Entity、DTO、Controller、Service、Config、Util 的完整路径

*Phase 1 — 13 个文件子代理分批并行*
4. **Batch 1（基础层，3 并行）**：project-overview-subagent、service-registry-subagent、architecture-overview-subagent
5. **Batch 2（数据层，3 并行）**：common-modules-subagent、models-subagent、config-files-subagent
6. **Batch 3（行为层，3 并行）**：project-api-subagent、utils-subagent、conventions-subagent
7. **Batch 4（横切层，2 并行）**：dependency-graph-subagent、decisions-subagent
8. **Batch 5（模板层，2 并行）**：mistakes-subagent、patterns-subagent

每个文件子代理的工作方式：读取 `file-index.yaml` → 按路径精确定位目标源码 → 读取并提取关键信息 → 直接写入目标 memory 文件。**13 个子代理互不依赖**，无需聚合器。

**核心优势**：
- 每个子代理独立上下文（~25-40KB），避免单 agent 上下文溢出
- Smart Sampling 从"被迫激进"升级为"从容全量"
- 关键类（Base/Abstract/Core/@Configuration/@Primary）强制全量读取
- 公共模块（common-bean 等）Entity/Enum 强制全量读取
- 记忆完整性 A/B/C/D 四级评级，低于 B 级不允许进入 Analyze

**你会看到**：交付物文档 `01-research-report.md`（`.dev-flow/deliverables/`），包含项目类型、语言、框架、组件数量、API 数量、编码规范、完整性评级。

**你需要做的**：检查调研结果是否准确，补充或纠正 AI 遗漏的信息。

**提示**：
- 首次使用 dev-flow 时，建议先单独执行 `/dev-flow -research` 建立项目记忆
- 项目结构有较大变化时，可以重新执行 Research 更新记忆

### 5.2 Analyze（需求分析）

**做什么**：AI 解析你的需求，关联已有代码，识别歧义和影响范围。

**执行步骤**：
1. 识别需求类型（新功能/增强/Bug 修复/重构/性能优化）和优先级
2. 提取核心功能点列表
3. 读取项目记忆，关联已有组件、API、数据模型
4. 列出不明确的地方，向你提问澄清
5. **需求一致性校验**（v2.0.0 新增）：自动检测逻辑矛盾、不可达状态、循环依赖、数据完整性约束
6. 生成需求分析文档
7. 输出**结构化确认 Checklist**，等你逐项确认

**你会看到**：需求分析文档，包含功能点、约束条件、歧义/待确认项、相关已有代码。

**你需要做的**：确认功能点是否完整，回答 AI 提出的歧义问题。

### 5.3 Design（详细设计）

**做什么**：AI 基于需求分析和项目记忆，设计数据模型、API 接口、组件树和业务流程。

**执行步骤**：
1. 读取项目记忆（project-overview、architecture、decisions）
2. 设计数据模型（TypeScript interface / Python dataclass 等）
3. 设计 API 端点（方法、路径、请求体、响应体、错误码）
4. 设计组件树（页面 → 容器 → 展示组件）
5. 描述核心业务流程
6. **结构化业务逻辑设计**（v1.0.2）：将业务逻辑转换为结构化决策表，包含 8 种 Action 类型（validate/query/convert/assign/throw/return/call/branch），每个步骤定义明确的条件、onFail/onSuccess 处理
7. 自检：确保每个功能点都有对应的设计覆盖

**你会看到**：设计文档，包含数据模型定义、API 设计表、组件设计表、业务流程描述、结构化业务逻辑决策表。

**你需要做的**：检查设计方案是否合理，确认或提出修改意见。

### 5.4 Task Split（智能任务拆分）

**做什么**：AI 将 Design 阶段输出的设计文档拆分为可并行执行的子任务，构建 DAG（有向无环图）依赖关系，并为每个子任务生成独立的设计文档。

**何时执行**：
- 全流程模式中 Design 阶段确认后自动执行
- 使用 `/dev-flow -split <需求>` 单独执行
- Subagent 模式下由 Orchestrator 调用 task-split-expert 执行

**执行步骤**：
1. **选择拆分维度**（v2.0.0 新增）：根据需求复杂度自动选择
   - 代码层维度：按 Entity → DTO → Mapper → Service → Controller 拆分（简单需求）
   - 功能维度：按业务功能拆分，每个任务 = 一个完整功能的端到端实现（复杂需求）
2. **分析设计文档**：读取 `design-contract.yaml`，理解所有 Entity、DTO、Service、Controller 定义
3. **识别子任务边界**：按选定维度拆分
4. **构建依赖 DAG**：分析子任务间的依赖关系，确定执行批次
5. **文件冲突检测**（v2.0.0 新增）：检测并行任务间的文件读写冲突（写写/写读/读写），修正 DAG 后重排批次
6. **生成子任务设计**：为每个子任务生成 `subtask-{id}-design.yaml`
7. **生成接口注册表**：汇总所有子任务提供的接口，生成 `interface-registry.yaml`
8. 输出**结构化确认 Checklist**，等你确认拆分方案

**产出文件**（写入 `.dev-flow/docs/{需求简称}-task-split/`）：

| 文件 | 说明 |
|------|------|
| `task-dag.yaml` | 任务依赖 DAG，包含节点定义和执行批次 |
| `subtask-{id}-design.yaml` | 每个子任务的独立设计文档 |
| `interface-registry.yaml` | 接口注册表，记录所有子任务提供的接口 |

**子任务设计文档结构**（`subtask-{id}-design.yaml`）：

```yaml
subtaskId: "task-003"
name: "UserService"

ownDesign:           # 本任务要实现的内容
  service:
    methods:
      - name: "getById"
        logic: [...]   # 详细的业务逻辑步骤

dependencies:        # 依赖其他任务的接口契约
  - subtaskId: "task-002"
    interfaceContract:
      methods: [...]

provides:            # 本任务对外提供的接口
  - interface: "UserService.getById"
    stability: "frozen"
```

**拆分粒度控制**：

| 场景 | 策略 |
|------|------|
| 单个 Service 方法 < 50 行 | 不拆分，一个 subagent 完成 |
| 50-200 行 | 拆分为多个子任务 |
| > 200 行 | 必须拆分，每步一个子任务 |
| 多个 Service 无依赖 | 每个 Service 一个子任务，并行执行 |

**你会看到**：任务拆分结果，包含 DAG 依赖图、执行批次、每个子任务的设计摘要。

**你需要做的**：确认拆分粒度是否合理，依赖关系是否正确。

### 5.5 Develop（开发执行）

**做什么**：develop-expert Subagent 按照设计方案，按依赖顺序生成完整可运行的代码。

> **v3.1.0 架构变更**：主 Agent 不直接编辑代码，仅负责创建 develop-expert Subagent、监控进度、收集结果并向用户汇报。所有代码编辑由 develop-expert 在独立上下文中执行。

**业务代码优先铁律**（v3.1.0 新增）：
- P0（最高优先级）：业务代码（Enum → Entity → DTO → Mapper → Service → Controller）必须先全部完成
- P1（验证手段）：测试代码仅在业务代码全部完成且编译通过后才生成
- 严禁在业务代码完成前生成任何 `*Test.java` / `*TestBase.java` 文件

**主 Agent 调度步骤**（v3.1.0 新增）：
1. 读取任务 DAG 和拆分文档
2. 运行 `prepare-context.cjs` 为每个任务生成上下文注入文件
3. 创建 develop-expert Subagent（串行或并行，取决于重评估结果）
4. 监控 Subagent 执行进度
5. 收集所有 `develop-result.yaml`
6. 运行 `validate-result.cjs` 验证产出
7. 向用户汇报开发结果，输出确认清单

**develop-expert Subagent 执行步骤**：
1. 读取上下文注入文件（task-brief-{taskId}.md）
2. 读取子任务设计文档，解析结构化业务逻辑
3. 按依赖顺序开发：Enum → Entity → DTO → Mapper → Service Interface → Service Impl → Controller
4. 每个文件生成后进行自检（类型错误、边界情况、风格一致性、安全漏洞）
5. **强制编译验证**：代码生成后**必须执行**编译验证（Java: `mvn compile`，前端: `tsc --noEmit`），如编译失败自动进入修复循环（最多 3 轮）
6. **业务代码优先铁律检查**：确认所有业务代码文件已生成且编译通过后，才可进入 Step 4.2 前置单元测试验证
7. **设计逻辑回溯验证**（Step 4.3）：编译通过后强制执行逻辑回溯验证
   - 从 `design-contract.yaml` 提取所有逻辑单元（logic_steps / conditions / call actions）
   - 在代码中逐条定位实现，验证 action 类型与代码特征匹配
   - 计算覆盖率（logic_step / condition / call_action），所有指标必须 100%
   - 输出 `logic-coverage-matrix.yaml` 包含完整可追溯矩阵
8. 简要说明每个文件的实现思路
9. 输出**结构化确认 Checklist**（含第 0 项执行者审计），等你确认代码质量

**v3.0.0 新增 — 结构化代码分段生成**：

当预估目标文件输出 > 20KB 时，develop-expert 自动启用"骨架 + 逐方法填充"模式：
1. 先生成完整骨架（imports + class + fields + 方法签名 TODO 体）
2. 然后逐方法填充（每次 Edit 替换一个 TODO 为完整方法体）
3. 最后全量验证（编译 + 契约校验 + 完整性扫描）

每次填充输出仅 5-10KB，始终保持在质量安全区（85-95%），避免单次大输出导致质量下降。

**你会看到**：完整的代码文件，每个文件附带实现思路说明。

**你需要做的**：检查代码质量，确认后进入 Test 阶段。

**重要**：
- dev-flow 要求 AI 生成**完整可运行**的代码，不会生成 `// TODO` 占位符
- AI 会自动遵守项目已有的编码风格
- AI 会自动复用已有的组件和工具函数
- v3.0.0: 大文件（>20KB）自动启用结构化分段生成，确保代码质量和完整性

### 5.6 Unit Test（单元测试）

**做什么**：AI 为开发的代码生成单元测试用例并执行。

**执行步骤**：
1. 为每个模块生成测试用例（组件测试、API 测试、工具函数测试）
2. 确保覆盖正常流程、异常流程、边界情况
3. 运行测试命令（npm test / pytest / mvn test）
4. 生成测试报告
5. 输出**结构化确认 Checklist**

**测试覆盖要求**：
- 行覆盖 ≥ 90%，方法覆盖 ≥ 95%
- 每个功能点至少有一个测试用例
- 禁止只测试渲染而不测试交互

### 5.7 Smoke Test（冒烟测试）

**做什么**：快速验证核心业务流程可运行。

**执行步骤**：
1. 启动服务（如需要）
2. 使用 curl 或手动方式调用核心 API
3. 验证基本功能是否可用
4. 输出冒烟测试报告
5. 输出**结构化确认 Checklist**

### 5.8 E2E Test（端到端测试）

> **v2.0.0 新增阶段**。冒烟测试通过后执行，验证功能是否正确。

**做什么**：使用自动化测试脚本验证完整的业务流程链路。

**执行步骤**：
1. **测试数据准备**：创建测试所需的初始数据（数据库种子、fixture 等）
2. **调用链执行**：按业务流程顺序调用多个 API/操作
3. **断言验证**：验证每个步骤的响应状态码、响应数据、数据库状态变更
4. **测试清理**：清理测试数据，确保不影响后续测试
5. 生成 E2E 测试报告
6. 输出**结构化确认 Checklist**

**技术栈适配**：

| 项目类型 | 测试框架 | 测试内容 |
|---------|---------|---------|
| Java (Spring Boot) | `@SpringBootTest` + `TestRestTemplate` | 完整 API 调用链、数据库状态验证 |
| 前端 (React/Vue) | Playwright | 浏览器级用户操作、页面渲染验证 |
| Python (FastAPI) | `pytest` + `httpx.AsyncClient` | 完整 API 调用链、数据一致性验证 |
| Go (Gin) | `net/http/httptest` | Handler 端到端测试 |

### 5.9 Integration Test（集成测试）

**做什么**：验证跨服务/跨模块的集成正确性。

**执行步骤**：
1. 验证 Feign Client 与目标 Controller 端点匹配
2. 验证跨服务数据一致性
3. 验证接口契约（serviceContracts/eventContracts/dataContracts）一致性
4. 生成集成测试报告
5. 输出**结构化确认 Checklist**

### 5.10 Fix（Bug 修复）

**做什么**：AI 分析测试失败原因，修复代码并回归测试。

**执行步骤**：

1. 读取失败测试的输出，定位出错代码
2. 分析根因（逻辑错误/类型错误/遗漏边界情况）
3. 修复代码，确保不引入新问题
4. 重新运行所有测试
5. 输出**结构化确认 Checklist**

**你会看到**：修复说明和回归测试结果。

**你需要做的**：确认修复是否正确。

**注意**：Fix 阶段最多循环 3 次。如果 3 次后仍有失败用例，AI 会提示你人工介入。

## 6. Subagent 模式

Subagent 模式是 dev-flow 的高级功能，适用于复杂任务，通过任务拆分和并行执行提升效率。

### 6.1 什么是 Subagent 模式？

> **v3.1.0 架构变更**：所有阶段统一由 Subagent 执行。Subagent 模式不再是"可选的高级功能"，而是 dev-flow 的**唯一执行模型**。

在 dev-flow 中：
- **主 Agent** 作为**纯调度枢纽**（零编辑），负责创建 Subagent、监控进度、向用户汇报
- **专业 Subagent** 在独立上下文中执行各阶段任务（Research / Analyze / Design / Develop / Test / Fix 等）
- **并行开发** 无依赖的任务可同时执行，效率翻倍
- **上下文隔离** 每个 Subagent 只读取必要的文件，避免上下文膨胀

**执行方式**（由需求复杂度自动决定）：
- **简单需求**：主 Agent 串行创建单个 Subagent（一个完成后再创建下一个）
- **复杂需求**：Orchestrator 按 DAG 批次并行创建多个 Subagent

### 6.2 适用场景

> **v3.1.0 更新**：Subagent 模式适用于所有需求。区别仅在于简单需求使用串行 Subagent，复杂需求使用并行 Subagent。

**并行 Subagent 适用于**：
- 需求涉及 **2 个以上服务/模块**
- 预计生成 **10 个以上文件**
- 项目代码量大（上下文可能不足）
- 需要 **并行开发加速**

### 6.3 命令

```
/dev-flow -subagent <需求描述>
```

**示例**：
```
/dev-flow -subagent 在质量检查服务中新增提交审批功能，当质检结果为不合格时调用工作流服务发起审批流程
```

### 6.4 架构（v3.1.0 统一 Subagent 架构）

```
用户 ←→ 主 Agent（纯调度枢纽，零编辑）
              │
              ├── [Research: pre-scanner + 13 file-level subagents, 5 batches]
              │     Phase 0: pre-scanner × 1          → file-index.yaml
              │     Phase 1: Batch 1-5, 13 subagents  → 13 memory 文件
              ├── analyze-expert   → 分析需求，输出需求分析文档
              ├── design-expert    → 详细设计，输出 design-contract.yaml
              ├── task-split-expert → 智能拆分，输出 DAG + 子任务设计
              ├── develop-expert   → 子任务级代码开发（可并行多个）
              ├── test-expert      → 单元测试，输出测试报告
              ├── smoke-test-expert → 冒烟测试，输出冒烟测试报告
              ├── e2e-test-expert  → 端到端测试，输出测试报告
              ├── integration-test-expert → 集成测试，输出测试报告
              ├── fix-expert       → Bug 修复，输出修复代码
              └── delivery-expert  → 生成交付报告
```

**所有阶段均由专业 subagent 执行，主 Agent 作为纯调度器**，不存在"标准模式直接执行"的路径。

### 6.5 工作流程

1. **Research 阶段**：pre-scanner 全局索引 + 13 个文件级 subagent 分批并行扫描，生成 13 个 memory 文件 + 阶段交付物
2. **Analyze 阶段**：analyze-expert 分析需求，输出 `task-breakdown.yaml`（任务拆分和依赖关系）
3. **Design 阶段**：design-expert 基于分析结果进行详细设计，输出 `design-contract.yaml`（含接口契约）
4. **Task Split 阶段**：task-split-expert 将设计拆分为子任务，生成 DAG 依赖图和子任务级设计
5. **Develop 阶段**：orchestrator 根据 DAG 依赖图进行拓扑排序，分批启动 develop-expert
   - 无依赖的任务并行执行（如不同 Entity 的创建）
   - 有依赖的任务串行执行（如 Entity → Mapper → Service → Controller）
   - 每个 develop-expert 只接收自己子任务的设计文档（`subtask-{id}-design.yaml`）
   - 每个 develop-expert 完成后执行编译验证闭环（v1.0.2）+ 逻辑回溯验证 Step 4.3（v2.1.0）
6. **多层验证**（v2.1.0 新增）：每个批次完成后，orchestrator 执行验证链
   - Step 5.1：develop-expert 开发自检（Step 4.3 逻辑回溯验证）
   - Step 5.2：contract-validator 独立验证（R1-R5，R5 为 critical 阻塞）
   - Step 5.3：verify-expert 质量检查（编译验证、代码质量）
   - 并行模式下的验证策略：批次统一验证、失败隔离
7. **全局集成编译**（v1.0.2）：所有子任务完成后，orchestrator 执行全局编译 + 契约验证 + 错误分类 + 循环修复
8. **错误模式学习**（v1.0.2）：error-pattern-learner 从编译错误、契约违反中提取模式，生成预防策略
9. **Verify 阶段**：verify-expert 验证所有生成代码的质量和完整性

### 6.6 跨平台调度策略（v2.0.0 新增）

不同 AI 编程平台的 Subagent 能力差异很大，dev-flow 会自动检测当前平台并选择合适的调度策略。

**平台能力矩阵**：

| 平台 | Subagent 支持 | 并行能力 | 调度策略 |
|------|--------------|---------|---------|
| **Trae** | `/agent-name` 斜杠命令 | 原生并行 | 完整并行模式 |
| **Cursor** | `.cursor/agents/*.md` YAML frontmatter | 多 Task 调用并行 | Cursor 并行模式 |
| **Claude Code** | Dynamic Workflows JS 编排 | 16 并发 | Claude 并行模式 |
| **Qoder** | Quest Mode 主从架构 | 方向并行 | Qoder 主从并行模式 |
| **Codex** | `.codex/agents/*.toml` | 6 线程 | Codex 有限并行模式 |

**策略一：Trae 完整并行模式**

同批次任务同时启动多个 `/develop-expert`，通过 `task-result.yaml` 汇报结果。

```
# 批次 1: 并行启动
/develop-expert [Task-1 上下文]
/develop-expert [Task-2 上下文]
/develop-expert [Task-3 上下文]
```

**策略二：顺序模拟并行模式（Cursor / Claude / Qoder）**

由于平台不支持原生并行 subagent，采用"上下文隔离 + 顺序执行"策略：

1. 构建完整 DAG + 拓扑排序 + 划分批次
2. 对每个任务：读取 `task-context.yaml` → 读取前序 `task-result.yaml` → 执行开发 → 写入 `task-result.yaml` → 清理上下文
3. 每个任务控制在 30% 上下文以内

**策略三：Codex 有限并行模式**

通过 `run agent: develop-expert` 切换 agent 上下文，按 DAG 顺序执行。

### 6.7 任务拆分与依赖处理

**DAG 依赖图**：
- Analyze 阶段输出的 `task-breakdown.yaml` 定义所有开发任务及其依赖关系
- Orchestrator 使用 Kahn 算法进行拓扑排序，确定执行批次

**执行批次示例**（8 个任务）：

| 批次 | 任务 | 模式 | 说明 |
|------|------|------|------|
| 1 | T1(实体字段) + T7(依赖配置) | 并行 | 无相互依赖 |
| 2 | T2(ApprovalRequest DTO) + T3(Response DTO) | 并行 | 都依赖 T1 但互不依赖 |
| 3 | T4(Service 接口) | 串行 | 依赖 T2 |
| 4 | T5(Service 实现) + T6(Controller) | 并行 | 都依赖 T4 |
| 5 | T8(代码验证) | 串行 | 依赖所有开发任务 |

### 6.8 方案C：子任务级设计与接口契约

方案C 是 dev-flow 在 Subagent 模式下的核心创新，通过**子任务级设计**和**接口契约机制**解决并行开发中的依赖一致性和上下文溢出问题。

#### 解决的问题

| 问题 | 原因 | 方案C 解决方案 |
|------|------|---------------|
| 代码生成遗漏 | Develop 阶段上下文不足，遗漏部分设计 | 每个子任务只接收自己的设计，上下文可控 |
| 实现偏差 | AI 猜测方法名/类型导致错误 | 接口契约明确定义方法签名，禁止猜测 |
| 跨子任务依赖错误 | 并行开发时接口定义不一致 | 接口注册表集中管理，契约冻结机制 |
| 上下文溢出 | 大项目超出 AI 上下文限制 | 子任务级设计，单文件 < 500 行 |

#### 核心机制

**1. 全局契约（design-contract.yaml）**

Design 阶段输出的标准数据交换格式，包含 8 个标准部分 + 接口契约：

```yaml
# 标准部分
entities: [...]      # Entity 定义
dtos: [...]          # DTO 定义
services: [...]      # Service 定义
controllers: [...]   # Controller 定义
mappers: [...]       # Mapper 定义
enums: [...]         # 枚举定义
feignClients: [...]  # Feign Client 定义
exceptions: [...]    # 异常类定义

# 方案C 新增：跨子任务接口契约
interfaces:
  serviceContracts:  # 服务接口契约
    - name: "UserService"
      methods:
        - name: "getById"
          params: ["Long"]
          returnType: "UserDTO"
          stability: "frozen"    # frozen = 设计确认后不可随意修改
  eventContracts:    # 事件契约
    - name: "OrderCreatedEvent"
      topic: "order-events"
      payload: [...]
  dataContracts:     # 数据契约
    - name: "UserSummary"
      fields: [...]
```

**2. 子任务级设计（subtask-{id}-design.yaml）**

每个子任务有独立的设计文档，包含三部分：

| 部分 | 说明 | 示例 |
|------|------|------|
| `ownDesign` | 本任务要实现的内容 | Service 的方法、业务逻辑步骤 |
| `dependencies` | 依赖其他任务的接口契约 | 需要调用哪个 Mapper 的哪个方法 |
| `provides` | 本任务对外提供的接口 | 提供 UserService.getById 接口 |

**3. 接口注册表（interface-registry.yaml）**

集中管理所有子任务提供的接口，确保调用方和被调用方使用同一接口定义。

**4. 契约冻结机制**

- 接口标记为 `stability: frozen` 后不可随意修改
- 如需修改，必须通知所有依赖方
- 防止并行开发中接口定义不一致

#### 执行流程示例

```
批次 1: [task-001: UserEntity]           ← 无依赖，并行执行
批次 2: [task-002: UserMapper]           ← 依赖 task-001
批次 3: [task-003: UserService]           ← 依赖 task-002
批次 4: [task-004: UserController]        ← 依赖 task-003
```

每个 develop-expert 执行时：
1. 读取自己的 `subtask-{id}-design.yaml`
2. 从 `interface-registry.yaml` 获取依赖接口定义
3. 只实现 `ownDesign` 中定义的内容
4. 完成后更新 `interface-registry.yaml`，注册自己提供的接口

### 6.9 精准按需加载

每个 subagent 只读取必要的文件：

| Subagent | 必读文件 | 按需读取 | 不读取 |
|----------|----------|----------|--------|
| pre-scanner | pom.xml、全局目录结构 | 无（仅 Glob，不读源码） | node_modules、target、.git |
| 文件子代理（×13） | file-index.yaml + 目标源码文件 | 关联源码文件 | 无关模块代码 |
| analyze-expert | memory/ 中的项目记忆 | 需求相关的源码（接口定义） | 无关服务的代码 |
| design-expert | 分析结果、项目记忆 | 1-2 个同类设计参考 | 实现细节 |
| develop-expert | 设计文档、任务上下文 | 当前任务相关的已有代码 | 无关模块的代码 |
| verify-expert | 设计文档、开发结果 | 生成的代码文件 | 未被修改的文件 |

## 7. Hotfix 模式

Hotfix 是独立模式，不需要经过完整流程，随时可用。

**使用场景**：生产环境报错，需要快速定位和修复。

**命令**：
```
/dev-flow -hotfix <错误信息>
```

**示例**：
```
/dev-flow -hotfix TypeError: Cannot read properties of undefined (reading 'map') at UserList.tsx:42
```

**执行流程**：
1. AI 解析错误类型和位置
2. 读取相关代码文件
3. 分析错误上下文
4. 提供根因分析和修复代码
5. 提供验证步骤

**特点**：Hotfix 直接输出结果，不需要等待确认。

## 8. 断点续传

当全流程执行到一半中断（如关闭了 AI 编程工具、会话超时等），可以使用断点续传从上次中断处继续。

**命令**：
```
/dev-flow --resume
```

**工作原理**：
- 每个阶段完成后，AI 会将进度写入 `.dev-flow/sessions/` 目录

**会话文件格式**（`.dev-flow/sessions/{sessionId}.md`）：
```markdown
# 会话：用户登录功能
- 状态：进行中
- 当前阶段：Design
- 已完成：Research → Analyze
- 开始时间：2026-06-05 10:00

## Research 摘要
[调研结果摘要]

## Analyze 摘要
[需求分析摘要]
```

## 9. 记忆系统

dev-flow 的记忆系统让 AI 能够记住项目信息和用户偏好，实现跨会话的知识积累。

v2.0.0 将记忆系统分为**长期记忆**和**会话记忆**两层：

- **长期记忆**（`.dev-flow/memory/` 根目录）：跨会话保留，Research 阶段只更新不重建
- **会话记忆**（`.dev-flow/memory/session/` 子目录）：每次 Research 自动重建，反映项目最新快照

### 9.1 长期记忆

长期记忆在 Research 阶段创建/更新，在 Develop/Fix/用户反馈时持续积累。

**所有项目通用的长期记忆**：

| 文件 | 内容 | 更新时机 |
|------|------|----------|
| `project-overview.md` | 项目概览：技术栈、架构、目录结构、入口文件 | Research |
| `conventions.md` | 编码规范：命名风格、导入排序、注释风格、文件组织 | Research / Fix |
| `patterns.md` | 常见代码模式：可复用代码片段、使用场景、使用次数 | Develop / 用户反馈 |
| `mistakes.md` | 常见错误及修复：Bug 模式、修复方案、出现次数、预防措施 | Test / Fix |
| `preferences.md` | 用户偏好：代码风格、架构偏好、质量要求 | 用户反馈 |
| `decisions.md` | 架构决策记录（ADR）：日期、决策、原因、影响 | 重大决策 |

**Spring Cloud 微服务额外长期记忆**：

| 文件 | 内容 | 更新时机 |
|------|------|----------|
| `service-registry.md` | 服务注册表：服务列表、端口、角色、子模块 | Research |
| `dependency-graph.md` | 依赖图谱：服务间依赖、Feign 调用关系 | Research |
| `common-modules.md` | 公共模块：通用 Entity/DTO/Enum/Util | Research |

### 9.2 会话记忆

会话记忆存放在 `.dev-flow/memory/session/` 子目录，每次 Research 开始时自动清空并重建。

| 文件 | 内容 | 更新时机 |
|------|------|----------|
| `modules.md` | 模块清单：Entity/Mapper/Service/Controller/DTO/Enum | Research / Develop |
| `apis.md` | API 列表：当前服务 API + Feign Client API | Research / Develop |
| `models.md` | 数据模型：Entity + DTO + 数据库表 | Research / Develop |
| `utils.md` | 工具函数/类 | Research |
| `config.md` | 配置信息：数据库/Redis/Nacos/中间件 | Research |
| `architecture.md` | 架构描述：分层方式、设计模式 | Research |

> **为什么分离？** 会话记忆反映项目代码的最新快照，每次 Research 都应重建以确保准确性。而长期记忆（模式、错误、偏好）是累积性的，不应被清空。

### 9.3 记忆使用和更新规则

#### patterns.md 示例

**前端项目示例：**

```markdown
# 常见代码模式

## API 错误处理模式
```typescript
try {
  const result = await apiCall();
  return { success: true, data: result };
} catch (error) {
  if (error.response?.status === 401) {
    return { success: false, error: '未授权，请重新登录' };
  }
  return { success: false, error: error.message || '服务器错误' };
}
```
- 使用场景：所有 API 调用
- 添加时间：2026-06-05
- 使用次数：5
```

**Java 项目示例：**

```markdown
# 常见代码模式

## Service 层标准模板
```java
@Service
@RequiredArgsConstructor
public class XxxServiceImpl implements XxxService {

    private final XxxMapper xxxMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ApiResponse<Xxx> create(XxxRequest request) {
        // 1. 参数校验
        if (request == null) {
            throw new BusinessException("请求参数不能为空");
        }

        // 2. 业务逻辑处理
        Xxx entity = new Xxx();
        BeanUtils.copyProperties(request, entity);

        // 3. 数据库操作
        xxxMapper.insert(entity);

        // 4. 返回结果
        return ApiResponse.success(entity);
    }
}
```
- 使用场景：所有 Service 实现类
- 添加时间：2026-06-05
- 使用次数：8
```
```

#### mistakes.md 示例

**前端项目示例：**

```markdown
# 常见错误及修复

## 类型错误：Promise 未 await
**错误模式**：`const data = fetchUser();`（忘记 await）
**修复方案**：`const data = await fetchUser();`
**出现次数**：3
**最后出现**：2026-06-05
**预防措施**：ESLint 规则 @typescript-eslint/no-floating-promises
```

**Java 项目示例：**

```markdown
# 常见错误及修复

## 空指针异常：未做空值检查
**错误模式**：`String name = user.getName().trim();`（name 可能为 null）
**修复方案**：
```java
String name = user.getName();
if (name != null) {
    name = name.trim();
}
// 或使用 Optional
String name = Optional.ofNullable(user.getName())
    .map(String::trim)
    .orElse("");
```
**出现次数**：5
**最后出现**：2026-06-05
**预防措施**：使用 `@NonNull` 注解、IDE 空值检查、Optional
```

#### preferences.md 示例

```markdown
# 用户偏好

## 代码风格
- 引号：单引号（'）
- 分号：必须
- 缩进：2 空格

## 架构偏好
- 状态管理：React Context + useReducer（不喜欢 Redux）
- 样式方案：Tailwind CSS（不喜欢 CSS Modules）
```

#### decisions.md 示例

```markdown
# 架构决策记录

## ADR-001：选择 React Hook Form 而非 Formik
**日期**：2026-06-05
**决策**：使用 React Hook Form 处理表单
**原因**：性能更好、TypeScript 集成更顺畅、包体积更小
**影响**：所有表单组件
```

#### 读取规则

| 时机 | 必须读取的文件 |
|------|---------------|
| Develop 前 | conventions、components、apis、utils、patterns |
| Design 前 | project-overview、architecture、decisions |
| Analyze 前 | components、apis、models |
| Fix 前 | mistakes |
| 所有阶段前 | preferences |

**Spring Cloud 微服务额外读取**：

| 时机 | 额外读取的文件 |
|------|---------------|
| Develop 前 | service-registry、dependency-graph、common-modules |
| Analyze 前 | service-registry、dependency-graph |

#### 更新规则

| 时机 | 更新的文件 |
|------|-----------|
| Research 完成后 | 所有基础记忆文件（前端 7 个 / Java 8 个 / 微服务 11 个） |
| Develop 完成后 | components/modules、apis、models、patterns |
| Fix 完成后 | mistakes、patterns、conventions |
| 用户明确反馈后 | preferences |
| 重大架构决策后 | decisions |

#### 记忆强化机制

- 每个模式/错误/偏好记录**使用次数**
- 使用次数 > 3 次 → 标记为 **"高频"**，AI 优先推荐
- 使用次数 > 5 次 → 标记为 **"标准"**，AI 必须遵守

### 9.4 记忆清理（v2.0.0 新增）

当记忆文件占用过大或数据过时时，可以使用清理命令：

| 命令 | 效果 | 适用场景 |
|------|------|----------|
| `/dev-flow -cleanup` | 仅清理 `session/` 目录，保留长期记忆 | 项目结构变化后，需重新扫描 |
| `/dev-flow -cleanup --all` | 清理全部记忆文件（包括长期记忆） | 重大架构变更后，从头重建 |

**安全提示**：
- `-cleanup` 不带 `--all` 只清理会话记忆，长期记忆（patterns/mistakes/preferences/decisions）安全保留
- `-cleanup --all` 会删除所有积累的知识，请谨慎使用
- 清理后执行 `/dev-flow -research` 重新生成记忆

## 10. 学习能力

dev-flow 具备从用户反馈中学习的能力，通过持续积累项目知识，实现"越用越好用"。

### 学习来源

| 来源 | AI 学到什么 | 更新的文件 |
|------|------------|-----------|
| 你表扬某段代码 | 记录代码模式，标记为"推荐" | patterns.md |
| 你修改了 AI 生成的代码 | 你的编码习惯和偏好 | preferences.md / patterns.md |
| 测试发现 Bug | 错误模式和修复方案 | mistakes.md |
| 你明确指定偏好 | 你的偏好设置 | preferences.md |
| 重大架构决策 | 决策和原因 | decisions.md |
| 某模式被复用 3 次以上 | 高频模式标记 | patterns.md |

### 学习示例

**示例 1：从代码修改中学习**

AI 生成的代码：
```typescript
const handleSubmit = async (data) => {
  await api.createUser(data);
  router.push('/users');
};
```

你修改为：
```typescript
const handleSubmit = async (data) => {
  try {
    await api.createUser(data);
    toast.success('用户创建成功');
    router.push('/users');
  } catch (error) {
    toast.error(error.message);
  }
};
```

AI 自动学习：
- 你偏好添加 toast 提示 → 更新 `preferences.md`
- API 调用需要 try-catch + toast → 更新 `patterns.md`

**示例 2：从错误中学习**

Test 阶段发现：组件未处理 loading 状态导致测试失败。
Fix 阶段修复：添加 loading 状态处理。

AI 自动学习：
- "忘记处理 loading 状态"是常见错误 → 更新 `mistakes.md`
- "标准 loading 处理模式" → 更新 `patterns.md`

### 学习效果评估

dev-flow 通过以下指标衡量学习效果：

| 指标 | 目标 | 评估方式 |
|------|------|----------|
| 代码接受率 | > 80% | 你修改 AI 生成代码的比例降低 |
| Bug 重复率 | < 10% | 同一错误不出现超过 2 次 |
| 模式复用率 | > 60% | 新代码复用已有模式的比例 |
| 用户满意度 | > 4.5/5 | 主观评价 |

### 如何帮助 AI 学得更好

1. **显式反馈**：直接告诉 AI 你的偏好，如"以后都用单引号"、"表单都用 React Hook Form"
2. **保持一致的修改风格**：AI 会观察你的修改模式，一致的修改更容易被学习
3. **及时确认好的输出**：当 AI 生成了满意的代码，确认"这段代码很好"
4. **定期检查记忆文件**：查看 `.dev-flow/memory/` 目录，确认 AI 的学习是否准确

## 11. 常见问题

确保你在 AI 编程工具中打开了安装了 dev-flow 的项目目录。Skill 文件是项目级别的，不是全局的。

### Q: AI 没有按阶段执行，直接生成了代码？

检查 Skill 文件是否正确安装：
- Trae：`.trae/skills/dev-flow/SKILL.md`
- Cursor：`.cursor/commands/dev-flow.md`
- Qoder：`.qoder/commands/dev-flow.md`
- Claude Code：`.claude/commands/dev-flow.md`
- OpenAI Codex：`AGENTS.md` 和 `.agents/skills/dev-flow/SKILL.md`

### Q: 记忆文件可以手动编辑吗？

可以。所有记忆文件都是标准 Markdown 格式，你可以直接编辑。AI 在读取时会使用你编辑后的内容。

### Q: 如何重置记忆？

删除 `.dev-flow/memory/` 目录，然后重新执行 `npx dev-flow install`。或者只删除需要重置的特定文件。

### Q: OpenAI Codex 如何使用 dev-flow？

1. 安装：`npx dev-flow codex`（写入 `AGENTS.md`、`.agents/skills/dev-flow/SKILL.md`、`.codex/agents/*.toml`，并在 `.codex/config.toml` 不存在时写入保守默认配置）
2. 启动：在终端运行 `codex`
3. 使用自然语言或显式 skill：`请使用 $dev-flow 执行 research` 或 `请使用 $dev-flow 全流程，实现用户登录功能`

Codex 会读取 `AGENTS.md` 作为项目指令，同时从 `.agents/skills/dev-flow/SKILL.md` 加载 dev-flow 工作流；复杂任务可使用 `.codex/agents/*.toml` 中的 custom agents。

### Q: Research 阶段的 memory 文件为空怎么办？

确保你使用的是最新版本的 dev-flow（包含 Research 智能模式选择）。如果项目源码文件数 > 50，dev-flow 会自动使用多 subagent 并行扫描，避免上下文不足导致跳过步骤。你也可以手动执行深层扫描：

```
请执行 dev-flow research，确保深层扫描所有依赖项目（common-bean、basedata-api 等）
```

### Q: 支持哪些编程语言和框架？

dev-flow 支持多种主流技术栈，AI 会根据项目特征自动识别并适配：

| 技术栈 | 检测特征 | 支持程度 |
|--------|----------|----------|
| **Java / Spring Boot** | `pom.xml` / `build.gradle` | ✅ 完全支持（含 MyBatis-Plus、JPA） |
| **前端 (React/Vue/Angular)** | `package.json` + JSX/Vue 文件 | ✅ 完全支持 |
| **Node.js 后端** | `package.json` + 无 JSX | ✅ 完全支持 |
| **Python (FastAPI/Django/Flask)** | `pyproject.toml` / `requirements.txt` | ✅ 支持 |
| **Go (Gin/Echo/Fiber)** | `go.mod` | ✅ 支持 |
| **Rust (Axum/Actix-web)** | `Cargo.toml` | ✅ 支持 |

**检测优先级**：Java > 前端 > Node.js > Python > Go > Rust

### Q: 可以在已有项目中使用吗？

可以。dev-flow 的 Research 阶段会自动扫描已有项目结构，不会影响已有代码。建议首次使用时先执行 `/dev-flow -research` 建立项目记忆。

### Q: Fix 阶段 3 次循环后仍有失败怎么办？

AI 会提示你人工介入。你可以：
1. 手动修复代码
2. 检查测试用例是否合理（可能是测试本身有问题）
3. 使用 `/dev-flow -hotfix <错误信息>` 针对特定错误修复

### Q: 多人协作时记忆会冲突吗？

dev-flow 的记忆文件是本地文件，建议将 `.dev-flow/memory/` 加入 `.gitignore`（安装脚本不会自动添加）。如果团队共享记忆，可以将基础记忆文件提交到 Git。

---

*本操作手册基于 dev-flow v3.2.0 编写。*
