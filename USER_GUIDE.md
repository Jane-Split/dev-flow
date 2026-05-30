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
  - [5.6 Test（测试验证）](#56-test测试验证)
  - [5.7 Fix（Bug 修复）](#57-fixbug-修复)
- [6. Subagent 模式](#6-subagent-模式)
  - [6.1 什么是 Subagent 模式](#61-什么是-subagent-模式)
  - [6.2 适用场景](#62-适用场景)
  - [6.3 命令](#63-命令)
  - [6.4 架构](#64-架构)
  - [6.5 工作流程](#65-工作流程)
  - [6.6 任务拆分与依赖处理](#66-任务拆分与依赖处理)
  - [6.7 方案C：子任务级设计与接口契约](#67-方案c子任务级设计与接口契约)
  - [6.8 精准按需加载](#68-精准按需加载)
  - [6.9 与标准模式的对比](#69-与标准模式的对比)
- [7. Hotfix 模式](#7-hotfix-模式)
- [8. 断点续传](#8-断点续传)
- [9. 记忆系统](#9-记忆系统)
  - [9.1 基础记忆](#91-基础记忆)
  - [9.2 长期记忆](#92-长期记忆)
  - [9.3 记忆使用和更新规则](#93-记忆使用和更新规则)
- [10. 学习能力](#10-学习能力)
- [11. v1.0.2 新特性](#11-v102-新特性)
- [12. v1.0.3 新特性](#12-v103-新特性)
- [13. 常见问题](#13-常见问题)

---

## 1. 概述

dev-flow 是一个 AI 开发全流程编排 Skill，适用于 Cursor、Trae、Qoder、Claude Code、OpenAI Codex 等 AI 编程工具。

它通过结构化的 7 阶段流程（Research → Analyze → Design → Task Split → Develop → Test → Fix），让 AI 编程工具按步骤执行开发任务，避免跳过重要步骤、生成不一致代码、遗漏边界情况等问题。

**核心特点**：
- 每个阶段完成后暂停等待你确认，确保产出质量
- 自动记忆项目结构和编码规范，后续开发自动遵守
- 具备学习能力，使用越多越了解你的偏好
- **结构化业务逻辑**（v1.0.2）：设计阶段输出结构化决策表，消除自然语言歧义
- **编译验证闭环**（v1.0.2）：开发完成后自动编译验证，解析错误并自动修复
- **契约一致性校验**（v1.0.2）：自动验证代码与设计契约的一致性
- **错误经验学习**（v1.0.2）：从历史错误中提取模式，生成预防策略
- **步骤强制执行**（v1.0.3）：Step Enforcer 验证关键步骤完成质量，防止跳过
- **错误模式自动应用**（v1.0.3）：自动将学习到的模式应用到 Agent 指导

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
├── .trae/skills/dev-flow/SKILL.md        # Trae 的 Skill 文件
├── .cursor/commands/dev-flow.md          # Cursor 的命令文件
├── .qoder/commands/dev-flow.md           # Qoder 的命令文件
├── .claude/commands/dev-flow.md          # Claude Code 的命令文件
├── AGENTS.md                            # OpenAI Codex 的项目指令文件
├── .agents/skills/dev-flow/SKILL.md     # OpenAI Codex 的仓库级 Skill
├── .codex/
│   ├── config.toml                       # OpenAI Codex 的项目配置（如不存在才写入）
│   └── agents/*.toml                     # OpenAI Codex 的 custom agents
└── .dev-flow/
    ├── memory/                           # 记忆目录（12 个 Markdown 模板）
    │   ├── project-overview.md           # 项目概览
    │   ├── conventions.md                # 编码规范
    │   ├── components.md / modules.md    # 已有组件/模块列表
    │   ├── apis.md                       # 已有 API 列表
    │   ├── models.md                     # 数据模型列表
    │   ├── utils.md                      # 工具函数/类列表
    │   ├── architecture.md               # 架构决策
    │   ├── config.md                     # 配置信息（Java 项目）
    │   ├── patterns.md                   # 常见代码模式
    │   ├── mistakes.md                   # 常见错误及修复
    │   ├── preferences.md                # 用户偏好
    │   └── decisions.md                  # 架构决策记录
    └── sessions/                         # 会话记录目录
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
| `/dev-flow <需求描述>` | 执行完整流程：Research → Analyze → Design → Develop → Test → Fix |

### 单阶段模式

| 命令 | 说明 | 使用场景 |
|------|------|----------|
| `/dev-flow -research` | 仅执行项目调研 | 项目首次使用 dev-flow，或项目结构有较大变化 |
| `/dev-flow -analyze <需求>` | 仅执行需求分析 | 需要先了解需求的影响范围 |
| `/dev-flow -design <需求>` | 仅执行详细设计 | 需要先看设计方案再开发 |
| `/dev-flow -split <需求>` | 仅执行任务拆分（方案C） | 需要将设计拆分为可并行的子任务 |
| `/dev-flow -develop <需求>` | 直接开发（跳过设计和拆分） | 小需求，不需要详细设计和任务拆分 |
| `/dev-flow -test` | 生成测试并执行 | 已有代码，需要补充测试 |
| `/dev-flow -fix` | 分析并修复 Bug | 测试失败，需要修复 |
| `/dev-flow -hotfix <错误信息>` | 紧急修复线上错误 | 生产环境报错，需要快速修复 |
| `/dev-flow -subagent <需求>` | Subagent 并行模式 | 复杂任务，涉及多服务/多模块 |

### 断点续传

| 命令 | 说明 |
|------|------|
| `/dev-flow --resume` | 从上次中断处继续 |

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
5. 生成需求分析文档

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
1. **分析设计文档**：读取 `design-contract.yaml`，理解所有 Entity、DTO、Service、Controller 定义
2. **识别子任务边界**：按分层架构（Entity → DTO → Mapper → Service → Controller）和业务模块拆分
3. **构建依赖 DAG**：分析子任务间的依赖关系，确定执行批次
4. **生成子任务设计**：为每个子任务生成 `subtask-{id}-design.yaml`
5. **生成接口注册表**：汇总所有子任务提供的接口，生成 `interface-registry.yaml`

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
5. **编译验证闭环**（v1.0.2）：代码生成后自动执行编译验证（Java: `mvn compile`，前端: `tsc --noEmit`），如编译失败自动解析错误并修复（最多 3 轮）
6. 简要说明每个文件的实现思路

**你会看到**：完整的代码文件，每个文件附带实现思路说明。

**你需要做的**：检查代码质量，确认后进入 Test 阶段。

**重要**：
- dev-flow 要求 AI 生成**完整可运行**的代码，不会生成 `// TODO` 占位符
- AI 会自动遵守项目已有的编码风格
- AI 会自动复用已有的组件和工具函数

### 5.6 Test（测试验证）

**做什么**：AI 为开发的代码生成测试用例并执行。

**执行步骤**：
1. 为每个模块生成测试用例（组件测试、API 测试、工具函数测试）
2. 确保覆盖正常流程、异常流程、边界情况
3. 运行测试命令（npm test / pytest / mvn test）
4. 生成测试报告

**你会看到**：测试报告表格，包含各模块的测试数、通过数、失败数、覆盖率。

**你需要做的**：查看测试结果。如果有失败用例，确认后进入 Fix 阶段。

**测试覆盖要求**：
- 每个功能点至少有一个测试用例
- 组件测试覆盖渲染、交互、边界情况（空数据、加载状态、错误状态）
- API 测试覆盖成功流程、参数验证失败、权限不足、服务器错误
- 禁止只测试渲染而不测试交互

### 5.7 Fix（Bug 修复）

**做什么**：AI 分析测试失败原因，修复代码并回归测试。

**执行步骤**：
1. 读取失败测试的输出，定位出错代码
2. 分析根因（逻辑错误/类型错误/遗漏边界情况）
3. 修复代码，确保不引入新问题
4. 重新运行所有测试

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

### 6.6 任务拆分与依赖处理

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

### 6.7 方案C：子任务级设计与接口契约

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

### 6.8 精准按需加载

每个 subagent 只读取必要的文件：

| Subagent | 必读文件 | 按需读取 | 不读取 |
|----------|----------|----------|--------|
| research-expert | pom.xml、README、application.yml | 每类 3-5 个样本代码 | node_modules、target、.git |
| analyze-expert | memory/ 中的项目记忆 | 需求相关的源码（接口定义） | 无关服务的代码 |
| design-expert | 分析结果、项目记忆 | 1-2 个同类设计参考 | 实现细节 |
| develop-expert | 设计文档、任务上下文 | 当前任务相关的已有代码 | 无关模块的代码 |
| verify-expert | 设计文档、开发结果 | 生成的代码文件 | 未被修改的文件 |

### 6.9 与标准模式的对比

| 特性 | 标准模式 | Subagent 模式 |
|------|----------|---------------|
| 适用场景 | 简单需求、单服务 | 复杂需求、多服务 |
| 执行方式 | 单 agent 串行 | 多 subagent 并行 |
| 上下文管理 | 单上下文，逐步累积 | 多独立上下文，隔离膨胀 |
| 任务拆分 | 无 | DAG 依赖图 + 拓扑排序 |
| 设计粒度 | 完整设计文档 | 子任务级设计（ownDesign + dependencies + provides） |
| 依赖处理 | 手动管理 | 接口契约 + 接口注册表 + 契约冻结 |
| 代码生成 | 主 agent 直接生成 | develop-expert 按子任务并行生成 |
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

### 9.1 基础记忆

基础记忆在 Research 阶段自动创建和更新。

**前端项目（7 个文件）：**

| 文件 | 内容 | 更新时机 |
|------|------|----------|
| `project-overview.md` | 项目概览：技术栈、架构、目录结构、入口文件 | Research |
| `conventions.md` | 编码规范：命名风格、导入排序、注释风格、文件组织 | Research / Fix |
| `components.md` | 已有组件：名称、路径、Props、用途 | Research / Develop |
| `apis.md` | 已有 API：路径、方法、参数、响应格式 | Research / Develop |
| `models.md` | 数据模型：名称、字段、关系 | Research / Develop |
| `utils.md` | 工具函数：名称、签名、用途 | Research |
| `architecture.md` | 架构决策：分层方式、设计模式 | Research |

**Java 项目（8 个文件）：**

| 文件 | 内容 | 更新时机 |
|------|------|----------|
| `project-overview.md` | 项目概览：技术栈、架构、目录结构、入口文件 | Research |
| `conventions.md` | 编码规范：命名风格、导入排序、注释风格、文件组织 | Research / Fix |
| `modules.md` | 已有模块：Entity/Mapper/Service/Controller/DTO/Enum | Research / Develop |
| `apis.md` | 已有 API：路径、方法、参数、响应格式 | Research / Develop |
| `models.md` | 数据模型：Entity、DTO、数据库表 | Research / Develop |
| `utils.md` | 工具类：名称、签名、用途 | Research |
| `config.md` | 配置信息：数据库、Redis、中间件 | Research |
| `architecture.md` | 架构决策：分层方式、设计模式 | Research |

**Spring Cloud 微服务（12 个文件）：**

| 文件 | 内容 | 更新时机 |
|------|------|----------|
| `project-overview.md` | 项目概览：技术栈、架构、目录结构 | Research |
| `service-registry.md` | 服务注册表：服务列表、端口、角色、子模块 | Research |
| `dependency-graph.md` | 依赖图谱：服务间依赖、Feign 调用关系 | Research |
| `common-modules.md` | 公共模块：通用 Entity/DTO/Enum/Util | Research |
| `conventions.md` | 编码规范：命名风格、注解使用、异常处理 | Research / Fix |
| `modules.md` | 各服务模块：Entity/Mapper/Service/Controller | Research / Develop |
| `apis.md` | 已有 API：路径、方法、参数、响应 | Research / Develop |
| `models.md` | 数据模型：Entity、DTO、数据库表 | Research / Develop |
| `utils.md` | 工具类：名称、签名、用途 | Research |
| `config.md` | 配置信息：数据库、Redis、Nacos | Research |
| `common-modules.md` | 公共模块：依赖项目的 Entity/DTO/Enum/Util/Feign Client | Research |
| `architecture.md` | 架构决策：分层方式、设计模式 | Research |

### 9.2 长期记忆

长期记忆通过 AI 的学习能力自动积累，共 4 个文件：

| 文件 | 内容 | 积累方式 |
|------|------|----------|
| `patterns.md` | 常见代码模式：可复用的代码片段、使用场景、使用次数 | Develop 中记录新模式，复用时更新次数 |
| `mistakes.md` | 常见错误及修复：Bug 模式、修复方案、出现次数、预防措施 | Test/Fix 中记录新错误模式 |
| `preferences.md` | 用户偏好：代码风格、架构偏好、质量要求 | 用户反馈时记录 |
| `decisions.md` | 架构决策记录（ADR）：日期、决策、原因、影响 | 重大决策时记录 |

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

## 13. 常见问题

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
