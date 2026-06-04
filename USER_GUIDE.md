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
  - [6.10 与标准模式的对比](#610-与标准模式的对比)
- [7. Hotfix 模式](#7-hotfix-模式)
- [8. 断点续传](#8-断点续传)
- [9. 记忆系统](#9-记忆系统)
  - [9.1 长期记忆](#91-长期记忆)
  - [9.2 会话记忆](#92-会话记忆)
  - [9.3 记忆使用和更新规则](#93-记忆使用和更新规则)
  - [9.4 记忆清理](#94-记忆清理)
- [10. 学习能力](#10-学习能力)
- [11. v1.0.2 新特性](#11-v102-新特性)
- [12. v1.0.3 新特性](#12-v103-新特性)
- [13. v1.0.4 新特性](#13-v104-新特性)
- [14. v1.0.5 架构优化](#14-v105-架构优化)
- [15. v2.0.0 架构升级](#15-v200-架构升级)
  - [15.1 四层按需加载架构](#151-四层按需加载架构)
  - [15.2 会话/长期记忆分离](#152-会话长期记忆分离)
  - [15.3 Agent 智能拆分](#153-agent-智能拆分)
  - [15.4 完整测试覆盖与 CI](#154-完整测试覆盖与-ci)
  - [15.5 参考文件（References）](#155-参考文件references)
- [16. 常见问题](#16-常见问题)

---

## 1. 概述

dev-flow 是一个 AI 开发全流程编排 Skill，适用于 Cursor、Trae、Qoder、Claude Code、OpenAI Codex 等 AI 编程工具。

它通过结构化的 11 阶段流程（Research → Analyze → Design → Task Split → Develop → Unit Test → Smoke Test → E2E Test → Integration Test → Fix → Delivery），让 AI 编程工具按步骤执行开发任务，避免跳过重要步骤、生成不一致代码、遗漏边界情况等问题。

**核心特点**：
- 每个阶段完成后输出**结构化确认 Checklist**，逐项确认后才可进入下一阶段
- 自动记忆项目结构和编码规范，后续开发自动遵守
- 具备学习能力，使用越多越了解你的偏好
- **跨平台 Subagent 调度策略**（v2.0.0）：Trae 原生并行，Cursor/Claude/Qoder 顺序模拟并行
- **任务冲突检测**（v2.0.0）：并行任务间文件读写冲突自动检测和批次修正
- **端到端测试**（v2.0.0）：Java @SpringBootTest 完整链路 + Playwright 浏览器测试
- **强制编译验证**（v2.0.0）：开发完成必须编译，失败自动修复循环
- **Design Contract 多语言**（v2.0.0）：Java / TypeScript / Python / Go 接口契约
- **结构化业务逻辑**（v1.0.2）：设计阶段输出结构化决策表，消除自然语言歧义
- **编译验证闭环**（v1.0.2）：开发完成后自动编译验证，解析错误并自动修复
- **契约一致性校验**（v1.0.2）：自动验证代码与设计契约的一致性
- **错误经验学习**（v1.0.2）：从历史错误中提取模式，生成预防策略
- **步骤强制执行**（v1.0.3）：Step Enforcer 验证关键步骤完成质量，防止跳过
- **错误模式自动应用**（v1.0.3）：自动将学习到的模式应用到 Agent 指导
- **三层按需加载架构**（v1.0.5）：上下文占用从 357KB 降至 79KB，代码生成可用空间提升至 50%
- **代码完整性铁律**（v1.0.5）：正面规则 + 生产可用测试，确保代码 100% 完整实现
- **全平台防护统一**（v1.0.5）：step-enforcer 等防护 agent 全平台共享，不再仅限 Trae
- **四层按需加载 + References 层**（v2.0.0）：Router 从 27KB 精简至 17KB，新增 4 个按需参考文档
- **会话/长期记忆分离**（v2.0.0）：会话记忆每次 Research 自动重建，长期记忆跨会话累积
- **Agent 智能拆分**（v2.0.0）：大 Agent 核心保留，模式库外置为 references 按需加载
- **完整测试覆盖 + CI**（v2.0.0）：4 套自动化测试 + GitHub Actions CI

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
│   ├── SKILL.md                           # Router（17KB 骨架）
│   ├── stages/                            # 13 个阶段指令文件（按需加载）
│   │   ├── research.md
│   │   ├── analyze.md
│   │   ├── design.md
│   │   ├── task-split.md
│   │   ├── develop.md                      # 含代码完整性铁律 + 强制编译验证
│   │   ├── unit-test.md
│   │   ├── smoke-test.md
│   │   ├── e2e-test.md                     # 端到端测试 ← v2.0.0 新增
│   │   ├── integration-test.md
│   │   ├── fix.md
│   │   ├── hotfix.md
│   │   ├── delivery.md
│   │   └── code-reference.md              # 代码标准模板、错误模式
│   ├── agents/                            # 20 个 subagent 定义
│   └── references/                        # 按需加载参考文档 ← v2.0.0 新增
│       ├── memory-system.md               # 记忆系统详细规则
│       ├── learning-system.md             # 学习能力详细说明
│       ├── error-pattern-db.md            # 错误模式数据库
│       └── model-context-config.md        # 模型上下文配置
├── .cursor/
│   ├── commands/dev-flow.md               # Cursor Router
│   ├── stages/                            # 13 个阶段文件
│   ├── agents/
│   └── references/                        # ← v2.0.0 新增
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
├── AGENTS.md                              # OpenAI Codex 项目指令
├── .agents/skills/dev-flow/SKILL.md       # OpenAI Codex 仓库级 Skill
├── .codex/
│   ├── config.toml
│   ├── agents/*.toml                      # Codex custom agents
│   └── references/                        # ← v2.0.0 新增
└── .dev-flow/
    ├── memory/                            # 长期记忆目录
    │   ├── project-overview.md
    │   ├── conventions.md
    │   ├── patterns.md                    # 代码模式（跨会话累积）
    │   ├── mistakes.md                    # 常见错误（跨会话累积）
    │   ├── preferences.md                 # 用户偏好（跨会话累积）
    │   ├── decisions.md                   # 架构决策（跨会话累积）
    │   └── session/                       # 会话记忆 ← v2.0.0 新增
    │       ├── modules.md                 # 模块清单（每次 Research 重建）
    │       ├── apis.md
    │       ├── models.md
    │       ├── utils.md
    │       ├── config.md
    │       └── architecture.md
    └── sessions/                           # 会话记录目录
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
/dev-flow 实现用户登录功能，包含邮箱密码登录、表单验证和记住密码
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
| `/dev-flow <需求描述>` | 执行完整流程：Research → Analyze → Design → Develop → Unit Test → Smoke Test → E2E Test → Integration Test → Fix → Delivery |

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

### 记忆管理（v2.0.0 新增）

| 命令 | 说明 |
|------|------|
| `/dev-flow -cleanup` | 清理会话记忆（`session/` 目录），保留长期记忆 |
| `/dev-flow -cleanup --all` | 重置全部记忆文件（谨慎使用） |

## 5. 各阶段详解

### 5.1 Research（项目调研）

**做什么**：AI 扫描你的项目，了解项目结构、技术栈、编码规范、已有组件和 API。

**执行步骤**：
1. 扫描项目根目录，识别项目类型和配置文件
2. 扫描源码目录，识别入口文件、路由定义、分层架构
3. 列出所有已有组件、API、工具函数、数据模型
4. 读取 ESLint/Prettier/TypeScript 配置，推断编码规范
5. 将所有信息写入 `.dev-flow/memory/` 目录
6. **智能模式选择**：根据项目源码文件数自动选择执行模式：
   - < 50 个文件：标准模式（单 agent 直接执行）
   - 50-200 个文件：分组模式（2-3 个 subagent 并行）
   - > 200 个文件：完整模式（4 个 subagent 并行扫描）
   - 4 个 Research Subagent：dependency-scanner、service-scanner、structure-analyzer、config-analyzer
7. **深层依赖扫描**：自动识别项目内依赖（如 common-bean、basedata-api），扫描其 Entity/DTO/Enum/Util/Feign Client

**你会看到**：一张调研摘要表格，包含项目类型、语言、框架、组件数量、API 数量、编码规范等。

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
type: "ServiceTask"

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

**做什么**：AI 按照设计方案，按依赖顺序生成完整可运行的代码。

**执行步骤**：
1. 读取项目记忆（conventions、components、apis、utils、patterns）
2. 读取子任务设计文档，解析结构化业务逻辑（v1.0.2）
3. 按依赖顺序开发：数据模型 → 工具函数 → API/服务层 → 状态管理 → 展示组件 → 容器组件 → 路由
4. 每个文件生成后进行自检（类型错误、边界情况、风格一致性、安全漏洞）
5. **强制编译验证**（v2.0.0 升级）：代码生成后**必须执行**编译验证（Java: `mvn compile`，前端: `tsc --noEmit`），如编译失败自动进入修复循环（最多 3 轮），记录修复日志到 `compile-fix-log.yaml`
6. 简要说明每个文件的实现思路
7. 输出**结构化确认 Checklist**，等你确认代码质量

**你会看到**：完整的代码文件，每个文件附带实现思路说明。

**你需要做的**：检查代码质量，确认后进入 Test 阶段。

**重要**：
- dev-flow 要求 AI 生成**完整可运行**的代码，不会生成 `// TODO` 占位符
- AI 会自动遵守项目已有的编码风格
- AI 会自动复用已有的组件和工具函数

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

在 Subagent 模式下：
- **主 Agent（Orchestrator）** 作为协调者，负责任务拆分、调度和结果整合
- **专业 Subagent** 在独立上下文中执行各阶段任务
- **并行开发** 无依赖的任务可同时执行，效率翻倍
- **上下文隔离** 每个 subagent 只读取必要的文件，避免上下文膨胀

### 6.2 适用场景

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

### 6.4 架构

```
用户 ←→ 主 Agent（Orchestrator）
              │
              ├── research-expert  → 扫描项目，输出 memory/
              │     ├── dependency-scanner   → 深层扫描依赖项目
              │     ├── service-scanner      → 扫描当前服务
              │     ├── structure-analyzer   → 分析项目结构
              │     └── config-analyzer      → 分析配置规范
              ├── analyze-expert   → 分析需求，输出 task-breakdown.yaml
              ├── design-expert    → 详细设计，输出 design-contract.yaml
              ├── task-split-expert → 智能拆分，输出 DAG + 子任务设计
              ├── develop-expert   → 子任务级代码开发（可并行多个）
              ├── contract-validator → 契约一致性校验（v1.0.2）
              ├── error-pattern-learner → 错误模式学习（v1.0.2）
              └── verify-expert    → 代码验证
```

### 6.5 工作流程

1. **Research 阶段**：research-expert 扫描项目，生成项目记忆
2. **Analyze 阶段**：analyze-expert 分析需求，输出 `task-breakdown.yaml`（任务拆分和依赖关系）
3. **Design 阶段**：design-expert 基于分析结果进行详细设计，输出 `design-contract.yaml`（含接口契约）
4. **Task Split 阶段**：task-split-expert 将设计拆分为子任务，生成 DAG 依赖图和子任务级设计
5. **Develop 阶段**：orchestrator 根据 DAG 依赖图进行拓扑排序，分批启动 develop-expert
   - 无依赖的任务并行执行（如不同 Entity 的创建）
   - 有依赖的任务串行执行（如 Entity → Mapper → Service → Controller）
   - 每个 develop-expert 只接收自己子任务的设计文档（`subtask-{id}-design.yaml`）
   - 每个 develop-expert 完成后执行编译验证闭环（v1.0.2）
6. **全局集成编译**（v1.0.2）：所有子任务完成后，orchestrator 执行全局编译 + 契约一致性校验 + 错误分类 + 循环修复
7. **错误模式学习**（v1.0.2）：error-pattern-learner 从编译错误、契约违反中提取模式，生成预防策略
8. **Verify 阶段**：verify-expert 验证所有生成代码的质量和完整性

### 6.6 跨平台调度策略（v2.0.0 新增）

不同 AI 编程平台的 Subagent 能力差异很大，dev-flow 会自动检测当前平台并选择合适的调度策略。

**平台能力矩阵**：

| 平台 | Subagent 支持 | 并行能力 | 调度策略 |
|------|--------------|---------|---------|
| **Trae** | `/agent-name` 斜杠命令 | 原生并行 | 完整并行模式 |
| **Cursor** | 无子 agent 原生支持 | 单会话串行 | 顺序模拟并行 |
| **Claude Code** | 无子 agent 原生支持 | 单会话串行 | 顺序模拟并行 |
| **Qoder** | 无子 agent 原生支持 | 单会话串行 | 顺序模拟并行 |
| **Codex** | `AGENTS.md` agents 定义 | 有限并行 | 有限并行模式 |

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
| 4 | T5(Service 实现) + T6(Controller) | 并行 | 都依赖 T4 但互不依赖 |
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

# 方案C新增：跨子任务接口契约
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
| research-expert | pom.xml、README、application.yml | 每类 3-5 个样本代码 | node_modules、target、.git |
| analyze-expert | memory/ 中的项目记忆 | 需求相关的源码（接口定义） | 无关服务的代码 |
| design-expert | 分析结果、项目记忆 | 1-2 个同类设计参考 | 实现细节 |
| develop-expert | 设计文档、任务上下文 | 当前任务相关的已有代码 | 无关模块的代码 |
| verify-expert | 设计文档、开发结果 | 生成的代码文件 | 未被修改的文件 |

### 6.10 与标准模式的对比

| 特性 | 标准模式 | Subagent 模式 |
|------|----------|---------------|
| 适用场景 | 简单需求、单服务 | 复杂需求、多服务 |
| 执行方式 | 单 agent 串行 | 多 subagent 并行/顺序模拟并行 |
| 跨平台适配 | 统一流程 | Trae 原生并行 / Cursor/Claude/Qoder 顺序模拟并行 |
| 上下文管理 | 单上下文，逐步累积 | 多独立上下文，隔离膨胀 |
| 任务拆分 | 无 | DAG 依赖图 + 拓扑排序 + 冲突检测 |
| 设计粒度 | 完整设计文档 | 子任务级设计（ownDesign + dependencies + provides） |
| 依赖处理 | 手动管理 | 接口契约 + 接口注册表 + 契约冻结 |
| 代码生成 | 主 agent 直接生成 | develop-expert 按子任务并行生成 |
| 编译验证 | 建议执行 | **强制执行** + 修复循环（最多 3 轮） |
| 确认机制 | 暂停等待 | 结构化确认 Checklist 逐项确认 |
| 效率 | 适合小任务 | 复杂任务效率翻倍 |

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
- 续传时，AI 读取最近的未完成会话，从下一个未完成的阶段继续

**会话文件格式**（`.dev-flow/sessions/{sessionId}.md`）：
```markdown
# 会话：用户登录功能
- 状态：进行中
- 当前阶段：Design
- 已完成：Research → Analyze
- 开始时间：2026-05-24 10:00

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
- 添加时间：2026-05-24
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
- 添加时间：2026-05-24
- 使用次数：8
```

#### mistakes.md 示例

**前端项目示例：**

```markdown
# 常见错误及修复

## 类型错误：Promise 未 await
**错误模式**：`const data = fetchUser();`（忘记 await）
**修复方案**：`const data = await fetchUser();`
**出现次数**：3
**最后出现**：2026-05-24
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
**最后出现**：2026-05-24
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
**日期**：2026-05-24
**决策**：使用 React Hook Form 处理表单
**原因**：性能更好、TypeScript 集成更顺畅、包体积更小
**影响**：所有表单组件
```

### 9.3 记忆使用和更新规则

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

dev-flow 会从你的使用过程中持续学习，让 AI 越来越了解你的项目和偏好。

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

## 11. v1.0.2 新特性

v1.0.2 版本围绕**代码正确性和完整性**进行了 5 项重大优化，目标是在企业级项目中实现 100% 的代码正确性和完整性。

### 11.1 结构化业务逻辑

**问题**：设计阶段的业务逻辑使用自然语言描述，AI 理解和实现时可能产生歧义。

**解决方案**：设计阶段输出结构化决策表，每个步骤定义明确的 Action 类型和条件。

**支持的 Action 类型**：

| Action | 说明 | Java 代码示例 |
|--------|------|--------------|
| `validate` | 条件验证 | `if (!(condition)) { throw ... }` |
| `query` | 数据查询 | `user = userMapper.selectById(id);` |
| `convert` | 对象转换 | `userDTO = UserConvertor.convert(user);` |
| `assign` | 赋值操作 | `order.setStatus(OrderStatus.PAID);` |
| `throw` | 抛出异常 | `throw new BusinessException(...)` |
| `return` | 返回结果 | `return userDTO;` |
| `call` | 调用服务 | `inventoryService.deductStock(...)` |
| `branch` | 条件分支 | `if (condition) { ... } else { ... }` |

**结构化逻辑示例**：

```yaml
logic:
  - step: 1
    action: "validate"
    condition: "userId != null && userId > 0"
    onFail:
      action: "throw"
      exception: "BusinessException"
      errorCode: "INVALID_USER_ID"
    onSuccess: "goto_step_2"
  - step: 2
    action: "query"
    target: "userMapper.selectById"
    params: ["userId"]
    result: "user"
```

### 11.2 编译验证闭环

**问题**：AI 生成的代码可能存在编译错误（方法名错误、类型不匹配、缺少 import 等）。

**解决方案**：开发完成后自动执行编译验证，解析错误并自动修复。

**执行流程**：

```
代码生成 → 执行编译 → 解析错误 → 自动修复 → 重新编译（最多 3 轮）
```

**支持的编译命令**：

| 项目类型 | 编译命令 |
|---------|---------|
| Java (Maven) | `mvn clean compile -DskipTests -pl {模块} -am` |
| Java (Gradle) | `./gradlew compileJava` |
| 前端 (TypeScript) | `npx tsc --noEmit` |
| 前端 (构建) | `npm run build --if-present` |

**自动修复策略**：

| 错误类型 | 修复策略 |
|---------|---------|
| 找不到符号 | 修正 import 或类名 |
| 类型不匹配 | 添加类型转换 |
| 方法未找到 | 修正方法名或参数 |
| 缺少依赖 | 添加依赖声明 |

### 11.3 契约一致性校验

**问题**：AI 生成的代码可能与设计契约不一致（方法签名错误、字段缺失等）。

**解决方案**：新增 contract-validator Agent，自动验证代码与设计契约的一致性。

**4 条验证规则**：

| 规则 | 验证内容 | 示例 |
|------|---------|------|
| R1 | 方法签名一致性 | 设计定义 `getById(Long)` → 代码实现 `getById(Long)` |
| R2 | Entity 字段一致性 | 设计定义 10 个字段 → 代码实现 10 个字段 |
| R3 | 实现完整性 | 设计定义 5 个方法 → 代码实现 5 个方法 |
| R4 | 依赖调用一致性 | 调用方参数与提供方接口一致 |

### 11.4 全局集成编译

**问题**：单个子任务编译通过，但集成后可能存在跨任务接口不匹配。

**解决方案**：所有子任务完成后，orchestrator 执行全局编译 + 契约验证。

**错误分类与修复分配**：

| 类别 | 描述 | 修复策略 |
|------|------|---------|
| A | 单个子任务内部错误 | 重新调用 develop-expert 修复 |
| B | 跨任务接口不匹配 | 调用 contract-validator 定位 |
| C | 设计契约偏差 | 回退到 design-expert 更新设计 |
| D | 依赖版本冲突 | 调用 analyze-expert 分析依赖 |

### 11.5 错误经验学习

**问题**：同类错误在不同任务中重复出现。

**解决方案**：新增 error-pattern-learner Agent，从历史错误中提取模式，生成预防策略。

**学习流程**：

```
收集错误 → 提取模式 → 根因分析 → 生成预防策略 → 更新 Agent 指导
```

**错误模式示例**：

| 模式 | 描述 | 预防策略 |
|------|------|---------|
| P001 | Entity getter 方法名猜测错误 | 强制读取 Entity 实际定义 |
| P002 | DTO 校验注解缺失 | 添加校验注解检查清单 |
| P003 | Mapper 返回类型错误 | 验证 Mapper 接口签名 |

## 12. v1.0.3 新特性

### 12.1 步骤强制执行（Step Enforcer）

**解决的问题**：AI 可能"偷懒"跳过关键步骤（如 Step 2.5 强制读取验证）

**工作原理**：
1. 在关键步骤后插入强制验证（如 Step 2.5.9）
2. 验证必须输出文件是否存在（如 `entity-verification-table.md`）
3. 验证文件内容是否包含特定标记（如 `confirmed: true`）
4. 验证失败时**阻塞流程**，强制返回重试
5. 最多重试 3 次，耗尽后升级到 orchestrator 人工处理

**受保护的步骤**：
- Step 2.5: 强制读取验证
- Step 3.1: 结构化业务逻辑实现
- Step 5.7: 编译验证闭环

**用户价值**：
- 确保 AI 真正执行关键步骤，不是虚假声明
- 减少编译错误，提高代码质量
- 特别适合企业级项目（如 QMS）的严格开发流程

### 12.2 错误模式自动应用

**解决的问题**：学习到的错误模式需要人工更新 Agent 文件

**工作原理**：
1. Error Pattern Learner 自动收集编译/测试错误
2. 自动提取可复现模式（如"Entity getter 方法名猜测错误"）
3. 自动生成预防策略
4. **自动应用策略**到 Agent 指导（如 develop-expert.md）
5. **自动追踪策略效果**，成功率 > 95% 标记为标准规范

**自动应用条件**：
- 模式出现 ≥ 2 次 → 自动更新 Agent 警告提示
- 模式出现 ≥ 5 次 → 自动升级为强制检查项
- 策略成功率 > 95% → 自动标记为标准规范
- 策略成功率 < 50% → 自动调整策略内容

**用户价值**：
- 无需人工更新 Agent 文件
- 系统越用越好，自动积累项目知识
- 长期错误率下降 90%

## 13. v1.0.4 新特性

### 13.1 三层防御体系防止 Import 路径猜测错误

**解决的问题**：AI 根据类名猜测 import 路径导致编译错误（如看到 `ReworkSop` 就猜测有 `rework` 子包）

**常见错误示例**：
```
❌ 错误猜测：import com.xxx.entity.rework.ReworkSopRegister;
✅ 实际路径：import com.xxx.entity.entity.ReworkSopRegister;
```

### 13.2 第一层：代码生成前防御（P0 - Step Enforcer）

**强化内容**：
- 新增 `import-verification-table.md` 强制验证
- 验证所有 import 必须通过 Grep 搜索确认
- 验证所有 import 状态必须为 ✅（无 ❌ 或 ⏳）
- 验证失败时**阻塞代码生成**

**验证流程**：
```
1. 对每个需要 import 的类，执行 Grep 搜索：
   Grep "class ReworkSopRegister" --glob="**/*.java"
   
2. 找到类的实际位置后，记录到 import-verification-table.md：
   | 类名 | 猜测路径 | 实际路径 | 验证状态 |
   | ReworkSopRegister | entity.rework | entity.entity | ✅ 已修正 |

3. Step Enforcer 验证 import-verification-table.md 通过

4. 通过验证后才能生成代码
```

### 13.3 第二层：编译前防御（P1 - develop-expert）

**强化内容**：
- Step 2.5.2 明确禁止猜测 import 路径
- 必须通过 Grep 搜索确认类的实际位置
- 生成 import-verification-table.md 记录猜测路径 vs 实际路径

**禁止行为**：
```
❌ 根据类名中的关键词猜测子包（如 ReworkSop → rework 子包）
❌ 根据类名语义猜测包名（如 Exception → exception 包）
❌ 根据命名习惯假设包结构
```

**正确做法**：
```
✅ 必须执行 Grep 搜索确认实际路径
✅ 必须读取文件确认正确的 import 语句
✅ 必须记录猜测路径用于后续对比
```

### 13.4 第三层：编译后防御（P2 - Error Pattern Learner）

**强化内容**：
- P005 (Import 路径错误) 优先级从 medium 提升到 high
- 新增自动修复策略
- 新增 S005 预防策略

**自动修复流程**：
```
1. 检测编译错误：找不到符号: 类 Xxx

2. 自动提取类名（如 Xxx）

3. 自动 Grep 搜索：
   Grep "class Xxx" --glob="**/*.java"

4. 分析搜索结果，确定正确包路径

5. 自动修正 import 语句

6. 记录到 import-verification-table.md
```

### 13.5 防护效果

| 错误模式 | 防护前 | 防护后 |
|---------|--------|--------|
| 根据类名猜测子包 | 频繁发生 | ✅ 已防护 |
| 根据类名语义猜测包名 | 频繁发生 | ✅ 已防护 |
| Import 路径错误发生率 | 高 | **降低 95%** |

### 13.6 用户价值

- **零猜测**：所有 import 必须通过 Grep 搜索确认
- **零错误**：彻底杜绝 import 路径猜测错误
- **零等待**：减少编译-修复循环，提高开发效率
- **自动修复**：即使第一二层失效，第三层也能自动修复

## 14. v1.0.5 架构优化

v1.0.5 是一次架构级重构，围绕**上下文效率**和**代码完整性**进行了 4 项重大优化，将代码生成可用空间从 10% 提升至 50%。

### 14.1 三层按需加载架构

**问题**：原 SKILL.md 体积 140KB / 4000 行，AI 加载后消耗 55% 的上下文窗口，留给代码生成的空间严重不足，导致代码被截断、简化、用占位符填充。

**解决方案**：将 140KB 的单体 SKILL.md 拆分为三层按需加载架构。

```
第一层：Router（27KB，始终加载）
  ├── YAML front-matter + 命令解析
  ├── 全局规则（禁止事项 + 完整性铁律精简版）
  ├── 阶段路由表
  ├── 标准模式执行流程
  └── 记忆系统 + 学习能力

第二层：阶段指令文件（按需加载）
  ├── stages/research.md (15KB)     ← 进入 Research 阶段才加载
  ├── stages/analyze.md (10KB)     ← 进入 Analyze 阶段才加载
  ├── stages/design.md (22KB)      ← 进入 Design 阶段才加载
  ├── stages/task-split.md (7KB)   ← 进入 Task Split 才加载
  ├── stages/develop.md (28KB)     ← 进入 Develop 阶段才加载
  ├── stages/code-reference.md (10KB) ← Develop 阶段额外加载
  └── ...共 12 个文件

第三层：Agent 文件（仅 Develop 阶段加载）
  ├── develop-expert.md (26KB)     ← Subagent 模式下加载
  ├── step-enforcer.md              ← 验证步骤完整性
  ├── contract-validator.md         ← 契约一致性校验
  └── ...共 20 个 agent
```

**加载规则**：
- 标准模式：按顺序进入每个阶段时，读取对应阶段的 `stages/*.md` 文件
- Subagent 模式：每个 subagent 只加载自己阶段的指令文件，不加载其他阶段
- 跳过的阶段不加载

**各平台路径适配**：

| 平台 | Router 路径 | Stages 路径 | Agents 路径 |
|------|-----------|------------|------------|
| Trae | `.trae/skills/dev-flow/SKILL.md` | `stages/` | `agents/` |
| Cursor | `.cursor/commands/dev-flow.md` | `.cursor/stages/` | `.cursor/agents/` |
| Claude Code | `.claude/commands/dev-flow.md` | `.claude/stages/` | `.claude/agents/` |
| Qoder | `.qoder/commands/dev-flow.md` | `.qoder/stages/` | `.qoder/agents/` |

### 14.2 代码完整性铁律

**问题**：AI 在 subagent 模式下生成的代码包含大量空实现、TODO、`log.xxx()` 占位符，而非完整可运行的代码。之前的禁止列表只说了"不要做什么"，缺少"每个方法必须包含什么"的正面规则。

**解决方案**：在 develop-expert.md 中新增"代码完整性铁律"章节，定义正面规则和判断标准。

**7 条正面规则**：

1. **每个方法体必须包含实质性的业务操作**（数据库操作/外部调用/业务计算/状态变更）
2. **每个条件分支都必须有完整的处理逻辑**（if/else 每个分支都有实际代码）
3. **每个循环都必须有完整的循环体**（循环内有实际操作）
4. **每个 try-catch 的 catch 必须有实际错误处理**（不能只有 log）
5. **返回值必须经过实际计算/查询/转换**（不能直接 return null 或硬编码）
6. **外部调用（Feign/RPC/MQ/Redis/DB）必须使用真实调用代码**（不能被 log 替代）
7. **数据转换（Entity ↔ DTO）必须写完整字段映射**（不能省略）

**判断标准 — 生产可用测试**：

> 如果这段代码被直接部署到生产环境，它能正常工作吗？
> 答案为"否" → 代码不够完整，必须补充。

**禁止事项（扩展版）**：

| 禁止行为 | 正确做法 |
|---------|---------|
| `// TODO: 实现业务逻辑` | 必须实现完整逻辑 |
| `return null;` 空实现 | 必须实现完整逻辑 |
| 只有 `log.xxx()` 的方法体 | 必须包含真实业务调用 |
| `pass` / `...` / `raise NotImplementedError` | 必须实现完整逻辑 |
| `throw new UnsupportedOperationException` | 必须实现完整逻辑 |

### 14.3 代码完整性防线

**问题**：代码完整性规则依赖 AI 自觉执行，没有技术手段强制验证。

**解决方案**：在 develop-expert.md 的 Step 3（代码生成）中新增 Step 3.5"完整性防线"——每个文件写入后立即扫描占位模式，发现即修复。

**防线扫描的占位模式**：

- `TODO`、`FIXME`、`HACK`、`XXX` 占位注释
- `return null;` 空实现
- 只有 `log.xxx()` 的方法体
- `{/* 描述 */}` React 占位组件
- `pass` / `...` Python 占位
- `throw new UnsupportedOperationException`

**修复流程**：扫描发现占位 → 立即替换为完整实现 → 重新扫描确认 → 继续

### 14.4 全平台防护统一

**问题**：step-enforcer、contract-validator、bytecode-analyzer、design-contract-validator 等关键防护 agent 原本只在 Trae 平台有效，cursor/claude/qoder 平台缺少这些防护。

**解决方案**：将这些 agent 从 `_platforms/trae/agents/` 提升到 `_core/agents/`，所有平台共享。

**提升的 agent**（7 个）：

| Agent | 功能 |
|-------|------|
| `step-enforcer.md` | 步骤强制执行验证器 |
| `contract-validator.md` | 契约一致性校验 |
| `bytecode-analyzer.md` | 占位模式扫描 |
| `design-contract-validator.md` | 设计契约完整性验证 |
| `context-manager.md` | 上下文管理器 |
| `error-pattern-learner.md` | 错误模式学习 |
| `task-split-expert.md` | 智能任务拆分 |

### 14.5 标准模式执行流程

v1.0.5 在 Router 中新增了显式的标准模式执行流程，明确每个阶段的"读取指令→执行→暂停确认"三步循环。

**完整流程**：

```
Step 1:  Read stages/research.md → 执行 Research → 暂停确认
Step 2:  Read stages/analyze.md → 执行 Analyze → 暂停确认
Step 3:  Read stages/design.md → 执行 Design → 暂停确认
Step 4:  Read stages/task-split.md → 执行 Task Split → 暂停确认
Step 5:  Read stages/develop.md + stages/code-reference.md → 执行 Develop → 暂停确认
Step 6:  Read stages/unit-test.md → 执行 Test → 暂停确认
Step 7-N: Smoke Test → Integration Test → Delivery → 完成
```

**关键规则**：
- 每个阶段开始前必须先读取对应的阶段指令文件
- 每个阶段完成后必须暂停，等待用户确认后才能进入下一阶段
- 如果 AI 发现上下文接近溢出，提示用户切换到 Subagent 模式

### 14.6 上下文优化效果

| 指标 | 优化前 (v1.0.4) | 优化后 (v1.0.5) |
|------|----------------|----------------|
| Router 体积 | 140KB / 4000行 | **27KB / 616行（-81%）** |
| Develop 阶段上下文 | ~357KB（全量加载） | **~79KB（Router + develop + agent）** |
| 代码生成可用空间 | ~10% | **~50%** |
| 有防护的平台 | 仅 Trae | **trae/cursor/claude/qoder 全部** |
| Agent 防护数量 | 16 个（Trae）/ 9 个（其他） | **20 个（全平台统一）** |
| 阶段指令文件 | 0（内嵌 SKILL.md） | **12 个（按需加载）** |

## 15. v2.0.0 架构升级

v2.0.0 是一次重大架构升级，在 v1.0.5 三层按需加载基础上，新增 References 层、实现会话/长期记忆分离、完成 Agent 智能拆分、并建立完整测试覆盖体系。

### 15.1 四层按需加载架构

**问题**：v1.0.5 的 Router 仍有 27KB，其中记忆系统（目录结构、使用规则、文件格式示例）和学习能力（学习机制、示例、效果评估）占用大量空间，但这些内容并非每个阶段都需要。

**解决方案**：将 Router 中的详细参考内容外置为 References 层，Router 只保留快速引用。

```
第一层：Router（17KB，始终加载）← 原 27KB，减少 37%
  ├── 命令解析 + 全局规则
  ├── 阶段路由表
  ├── 记忆系统快速引用（5 行摘要 + references 链接）
  └── 学习能力快速引用（5 行摘要 + references 链接）

第二层：References（按需加载）← v2.0.0 新增
  ├── memory-system.md (15KB)     ← Research / 需要查阅记忆规则时
  ├── learning-system.md (8.5KB)  ← 阶段结束时读取
  ├── error-pattern-db.md (11.5KB)← Error Pattern Learner 读取
  └── model-context-config.md      ← Context Manager 读取

第三层：阶段指令文件（进入阶段时加载）
  └── stages/*.md（12 个文件）

第四层：Agent 文件（Subagent 模式下加载）
  └── agents/*.md（18 个文件）
```

**v2.0.0 vs v1.0.5 对比**：

| 指标 | v1.0.5 | v2.0.0 | 变化 |
|------|--------|--------|------|
| Router 体积 | 27KB | **17KB** | **-37%** |
| 始终加载内容 | 27KB | **17KB** | **-37%** |
| 按需参考文档 | 0 | **4 个（35KB）** | 新增 |
| 构建系统占位符 | `{{STAGES_PATH}}` `{{AGENTS_PATH}}` | + `{{REFERENCES_PATH}}` | 新增 |

### 15.2 会话/长期记忆分离

**问题**：v1.0.5 的所有记忆文件都在同一目录，Research 阶段会重建所有文件，导致长期积累的模式、错误、偏好数据丢失。不重建则可能数据过时。

**解决方案**：将记忆分为长期记忆和会话记忆，分别存放。

**长期记忆**（`.dev-flow/memory/` 根目录）：
- 跨会话保留，Research 阶段只更新不重建
- 包含：project-overview、conventions、patterns、mistakes、preferences、decisions、service-registry、dependency-graph、common-modules

**会话记忆**（`.dev-flow/memory/session/` 子目录）：
- 每次 Research 自动清空并重建，反映项目最新快照
- 包含：modules、apis、models、utils、config、architecture

**清理命令**：
- `/dev-flow -cleanup` — 清理 `session/` 目录，保留长期记忆
- `/dev-flow -cleanup --all` — 重置全部记忆文件

**Research 阶段变化**：
- Step 5.0 新增会话记忆清理逻辑（清空 session/ 目录 → 重建）
- 长期记忆只在有新数据时更新，不重建

### 15.3 Agent 智能拆分

**问题**：error-pattern-learner (27KB) 和 context-manager (22KB) 体积过大，Subagent 模式下加载时占用大量上下文。

**解决方案**：将大 Agent 中的详细数据库和配置外置为 references 文件，核心 Agent 保留工作流和关键规则。

| Agent | 原大小 | 拆分后核心 | 外置 references |
|-------|--------|-----------|----------------|
| error-pattern-learner | 27KB | **15.7KB** | error-pattern-db.md (11.5KB) |
| context-manager | 22KB | **18KB** | model-context-config.md |

核心 Agent 文件中通过 `{{REFERENCES_PATH}}xxx.md` 引用外置内容，需要时才读取。

### 15.4 完整测试覆盖与 CI

**问题**：v1.0.5 没有自动化测试，构建和发布完全依赖人工验证。

**解决方案**：新增 4 套自动化测试 + GitHub Actions CI。

| 测试 | 文件 | 检查内容 |
|------|------|---------|
| 构建测试 | `tests/build.test.js` | 核心文件存在性、构建输出、Router 大小、占位符替换 |
| 链接测试 | `tests/links.test.js` | README 链接有效性、SKILL.md 文件引用、路径替换 |
| 大小预警 | `tests/size-warning.test.js` | Router/Stage/Agent/Reference 大小阈值 |
| 格式检查 | `tests/format.test.js` | Markdown frontmatter 和格式规范 |

**CI 配置**（`.github/workflows/ci.yml`）：
- 双版本 Node.js（18/20）测试
- 自动构建验证
- 发布前检查（`scripts/pre-publish.js`）
- npm 自动发布

**版本号一致性检查**（`scripts/version-check.js`）：
- 自动比对 `package.json` vs `README.md` vs `CHANGELOG.md`
- `--fix` 参数自动修复 README 版本号

### 15.5 参考文件（References）

v2.0.0 新增的 References 层包含 4 个按需加载的深度参考文档：

| 文件 | 大小 | 加载时机 | 内容 |
|------|------|---------|------|
| `memory-system.md` | 15KB | Research / Develop 前查阅记忆规则 | 完整的记忆目录结构、使用规则、文件格式示例 |
| `learning-system.md` | 8.5KB | Research / Develop / Fix 结束时 | 学习机制、学习示例、效果评估 |
| `error-pattern-db.md` | 11.5KB | Error Pattern Learner Step 5/6 | 错误模式定义 P001-P009、预防策略 S001-S009 |
| `model-context-config.md` | — | Context Manager 计算动态阈值 | 模型上下文窗口配置、动态计算规则、分层设计文档裁剪 |

**各平台 References 安装路径**：

| 平台 | 路径 |
|------|------|
| Trae | `.trae/skills/dev-flow/references/` |
| Cursor | `.cursor/references/` |
| Claude Code | `.claude/references/` |
| Qoder | `.qoder/references/` |
| OpenAI Codex | `.codex/references/` |

## 16. 常见问题

### Q: 安装后找不到 /dev-flow 命令？

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
