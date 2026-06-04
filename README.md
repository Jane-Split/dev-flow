# dev-flow

[![node](https://img.shields.io/node/v/dev-flow.svg)](https://nodejs.org)
[![version](https://img.shields.io/badge/version-v2.0.0-blue)]()

> **当前版本: v2.0.0** | [更新日志](./CHANGELOG.md)

AI 开发全流程编排 Skill，适用于 Cursor、Trae、Qoder、Claude Code、OpenAI Codex 等 AI 编程工具。

通过 `/dev-flow` 命令，AI 将按照结构化流程逐步执行：**项目调研 → 需求分析 → 详细设计 → 代码开发 → 测试验证 → Bug 修复**，每个阶段完成后暂停等待确认，确保产出质量。

## 为什么需要 dev-flow？

AI 编程工具（Cursor/Trae/Qoder/Claude Code/Codex）虽然强大，但在处理复杂需求时容易：

- 跳过重要步骤（如先了解项目结构再写代码）
- 生成与项目风格不一致的代码
- 遗漏边界情况和错误处理
- 缺乏系统性的测试验证
- 不记住用户的偏好和项目的深层知识
- 大型项目上下文不足，跳过关键扫描步骤

dev-flow 通过**结构化的流程编排 + 项目记忆 + 长期记忆 + 学习能力 + 多 Subagent 并行**解决这些问题，让 AI 编程工具**越用越好用**。

## 特性

### v2.0.0 核心特性

- **四层按需加载架构** — Router(17KB) + references(按需) + 13 个阶段指令 + 20 个 Agent，上下文占用从 357KB 降至 79KB 以下，代码生成可用空间达 50%+
- **跨平台 Subagent 调度策略** — 自动检测当前平台能力，Trae 原生并行、Cursor/Claude/Qoder 顺序模拟并行、Codex 有限并行，全平台可用
- **任务冲突检测** — DAG 构建时自动检测文件读写冲突（写写/写读/读写矩阵），修正依赖后重排批次，防止多 Agent 写冲突
- **任务拆分双维度** — 自动选择代码层维度（Entity→DTO→Service→Controller）或功能维度（每个功能端到端实现）
- **端到端测试（E2E）** — 新增 E2E Test 阶段，支持 Java @SpringBootTest 完整链路测试 + 前端 Playwright 浏览器测试
- **强制编译验证** — 开发完成后必须执行编译验证，失败自动进入修复循环（最多 3 轮），不可跳过
- **全平台防护统一** — step-enforcer/contract-validator/bytecode-analyzer 等防护 agent 全平台共享
- **阶段确认硬性阻断** — 每个阶段末尾输出结构化确认 Checklist，用户逐项确认方可进入下一阶段
- **需求一致性校验** — Analyze 阶段自动检测逻辑矛盾、不可达状态、循环依赖、数据完整性约束
- **Design Contract 多语言** — 支持 Java / TypeScript / Python / Go 四种语言的接口契约格式
- **会话/长期记忆分离** — 会话记忆（modules/apis/models 等）每次 Research 自动重建，长期记忆（patterns/mistakes/preferences 等）跨会话累积
- **Agent 智能拆分** — 大 Agent 文件拆分为核心+references 模式库，按需加载不浪费上下文
- **完整测试覆盖** — 构建测试、链接检查、大小预警、格式检查，搭配 GitHub Actions CI
- **记忆清理命令** — `/dev-flow -cleanup` 安全清理会话记忆，`/dev-flow -cleanup --all` 重置全部

### 基础特性

- **结构化流程** - 11 个阶段 + Hotfix 模式，每个阶段有明确的输入/输出、自检步骤和结构化确认 Checklist
- **智能任务拆分** - Design 输出全局契约，Task Split 生成子任务级设计 + DAG 依赖图 + 文件冲突检测，每个 subagent 只接收必要信息
- **接口契约机制** - 跨子任务接口定义（serviceContracts/eventContracts/dataContracts），契约冻结（stability: frozen）防止随意修改
- **多 Subagent 并行** - 复杂任务拆分为独立 subagent 并行执行，上下文隔离，支持 Trae 原生并行和 Cursor/Claude/Qoder 顺序模拟并行
- **智能 Research** - 自动评估项目规模，选择标准模式或 4 subagent 并行扫描
- **深层依赖扫描** - 自动扫描微服务项目的依赖项目（common-bean、basedata-api 等）
- **项目记忆** - Research 阶段自动扫描并记录项目结构、组件、API、编码规范（16 个文件）
- **长期记忆** - 记录常见代码模式、错误修复方案、用户偏好、架构决策（6 个文件），跨会话持久化
- **结构化业务逻辑** - 设计阶段输出结构化决策表（8 种 Action 类型），开发阶段精确翻译为代码，消除自然语言歧义
- **编译验证闭环** - 开发完成后必须编译验证（Java/前端），解析错误并自动修复（最多 3 轮循环）
- **契约一致性校验** - contract-validator 自动验证方法签名、Entity 字段、实现完整性、依赖调用一致性
- **全局集成编译** - 所有子任务完成后全局编译 + 契约验证 + 错误分类 + 循环修复
- **错误经验学习** - 从编译错误、契约违反、测试失败中提取模式，生成预防策略，持续改进
- **步骤强制执行** (v1.0.3) - Step Enforcer 验证关键步骤完成质量，防止 AI "偷懒" 跳过
- **错误模式自动应用** (v1.0.3) - Error Pattern Learner 自动将学习到的模式应用到 Agent 指导
- **三层防御体系** (v1.0.4) - 防止 Import 路径猜测错误，代码生成前 Grep 强制验证 + 编译前阻塞 + 编译后自动修复
- **上下文智能管理** (v1.0.4_opt) - Context Manager 50KB 硬约束 + 三级监控 + 分段执行 + 串行兜底
- **代码完整性铁律** (v1.0.5) - 正面规则 + 生产可用测试 + 方法体最低标准，确保每个方法体都是 100% 可执行的完整实现
- **代码完整性防线** (v1.0.5) - 每个文件写入后立即扫描 TODO/空实现/日志占位，当场修复
- **全平台防护统一** (v1.0.5) - step-enforcer/contract-validator/bytecode-analyzer 等防护 agent 从 Trae-only 提升为全平台共享
- **阶段确认硬性阻断** (v2.0.0) - 每个阶段末尾结构化确认 Checklist，逐项确认后方可进入下一阶段
- **Design Contract 多语言** (v2.0.0) - 支持 Java / TypeScript / Python / Go 四种语言的接口契约格式
- **学习能力** - 从用户反馈、代码修改、测试 Bug 中自动学习，持续优化代码生成策略
- **记忆强化** - 模式使用 >3 次标记"高频"优先推荐，>5 次标记"标准"必须遵守
- **阶段确认** - 每个阶段完成后暂停，展示成果并等待用户确认
- **断点续传** - 长流程中断后可从上次断点恢复（`.dev-flow/sessions/`）
- **Markdown 记忆** - 所有记忆使用 Markdown 格式，AI 可直接读写
- **多工具支持** - Cursor、Trae、Qoder、Claude Code、OpenAI Codex
- **多语言支持** - Java (Spring Boot/Cloud)、前端 (React/Vue)、Python、Go、Rust 等主流技术栈
- **零依赖** - 纯 Markdown + 安装脚本，无需编译

## 安装

```bash
# 1. 安装到项目
npm install Jane-Split/dev-flow --save-dev

# 2. 执行安装（生成 skill 文件和记忆目录）
npx dev-flow install
```

安装后会自动在项目中生成：

| 工具 | 生成的文件 | 触发方式 |
|------|-----------|---------|
| Trae | `.trae/skills/dev-flow/SKILL.md` + `stages/*.md` + `agents/*.md` + `references/*.md` | 输入框输入 `/dev-flow` |
| Cursor | `.cursor/commands/dev-flow.md` + `stages/*.md` + `agents/*.md` + `references/*.md` | 输入框输入 `/dev-flow` |
| Qoder | `.qoder/commands/dev-flow.md` + `stages/*.md` + `agents/*.md` + `references/*.md` | 输入框输入 `/dev-flow` |
| Claude Code | `.claude/commands/dev-flow.md` + `stages/*.md` + `agents/*.md` + `references/*.md` | 输入框输入 `/dev-flow` |
| OpenAI Codex | `AGENTS.md` + `.agents/skills/dev-flow/SKILL.md` + `.codex/agents/*.toml` + `.codex/references/*.md` | 终端输入 `codex` 后使用自然语言或 `$dev-flow` |

**Subagent 文件**（用于 `-subagent` 模式和 Research 并行扫描；Codex 使用 `.codex/agents/*.toml`）：

| Agent | 文件路径 | 职责 |
|-------|----------|------|
| orchestrator | `agents/orchestrator.md` | 主协调者，DAG 调度和依赖检查 |
| research-expert | `agents/research-expert.md` | 项目研究，调度子 subagent 扫描 |
| analyze-expert | `agents/analyze-expert.md` | 需求分析，影响评估 |
| design-expert | `agents/design-expert.md` | 详细设计，接口定义 |
| task-split-expert | `agents/task-split-expert.md` | 智能任务拆分，生成子任务级设计 + DAG |
| develop-expert | `agents/develop-expert.md` | 代码开发（可并行，支持子任务级输入） |
| verify-expert | `agents/verify-expert.md` | 代码验证，质量检查 |
| contract-validator | `agents/contract-validator.md` | 契约一致性校验 |
| bytecode-analyzer | `agents/bytecode-analyzer.md` | 占位模式扫描检测 |
| design-contract-validator | `agents/design-contract-validator.md` | 设计契约完整性验证 |
| error-pattern-learner | `agents/error-pattern-learner.md` | 错误模式学习与预防策略 |
| step-enforcer | `agents/step-enforcer.md` | 步骤强制执行验证器 |
| context-manager | `agents/context-manager.md` | 上下文管理器 |
| dependency-scanner | `agents/dependency-scanner.md` | 依赖项目深层扫描 |
| service-scanner | `agents/service-scanner.md` | 当前服务源码扫描 |
| structure-analyzer | `agents/structure-analyzer.md` | 项目结构和依赖关系分析 |
| config-analyzer | `agents/config-analyzer.md` | 配置和编码规范分析 |
| task-protocol | `agents/task-protocol.md` | 任务拆分协议定义 |

**参考文件**（v2.0.0 新增，按需加载的深度参考文档）：

| 参考文件 | 加载时机 | 内容 |
|---------|---------|------|
| `references/memory-system.md` | Research / 需要查阅记忆规则时 | 记忆目录结构、使用规则、文件格式示例 |
| `references/learning-system.md` | Research / Develop / Fix 结束时 | 学习机制、示例和效果评估 |
| `references/error-pattern-db.md` | Error Pattern Learner Step 5/6 | 错误模式定义（P001-P009）和预防策略 |
| `references/model-context-config.md` | Context Manager 计算阈值时 | 模型上下文窗口配置、动态计算规则 |

**阶段指令文件**（按需加载，进入对应阶段时才读取，不占用初始上下文）：

| 阶段 | 文件 | 内容 |
|------|------|------|
| Research | `stages/research.md` | 项目调研指令 |
| Analyze | `stages/analyze.md` | 需求分析指令（含一致性校验） |
| Design | `stages/design.md` | 详细设计指令（含多语言契约） |
| Task Split | `stages/task-split.md` | 任务拆分指令（含冲突检测 + 双维度） |
| Develop | `stages/develop.md` | 代码开发指令（含代码完整性铁律 + 强制编译） |
| Unit Test | `stages/unit-test.md` | 单元测试指令 |
| Smoke Test | `stages/smoke-test.md` | 冒烟测试指令 |
| E2E Test | `stages/e2e-test.md` | 端到端测试指令 |
| Integration Test | `stages/integration-test.md` | 集成测试指令 |
| Fix | `stages/fix.md` | Bug 修复指令 |
| Hotfix | `stages/hotfix.md` | 紧急修复指令 |
| Delivery | `stages/delivery.md` | 交付指令 |
| Code Reference | `stages/code-reference.md` | 代码标准模板、错误模式、用户偏好 |

也可以只安装特定工具的 skill 文件：

```bash
npx dev-flow trae     # 仅安装 Trae
npx dev-flow cursor   # 仅安装 Cursor
npx dev-flow qoder    # 仅安装 Qoder
npx dev-flow claude   # 仅安装 Claude Code
npx dev-flow codex    # 仅安装 OpenAI Codex
```

## 快速开始

```bash
# 1. 进入你的项目
cd your-project

# 2. 安装 dev-flow
npm install Jane-Split/dev-flow --save-dev
npx dev-flow install

# 3. 在 Cursor / Trae / Qoder / Claude Code 中输入：
/dev-flow 实现用户登录功能，包含表单验证和记住密码

# 3. 或在 OpenAI Codex 中：
codex
> 请使用 $dev-flow 全流程，实现用户登录功能，包含表单验证和记住密码
```

AI 将按阶段逐步执行，每个阶段完成后等待你确认。

## 使用方法

### 全流程模式

```
/dev-flow <需求描述>
```

执行：Research → Analyze → Design → **Task Split** → Develop → Test → Fix

### 单阶段模式

```
/dev-flow -research          # 项目调研
/dev-flow -analyze <需求>    # 需求分析
/dev-flow -design <需求>     # 详细设计
/dev-flow -split <需求>     # 任务拆分（方案C：生成子任务级设计 + DAG）
/dev-flow -develop <需求>    # 直接开发（跳过设计和拆分，适合小需求）
/dev-flow -test              # 生成测试并执行
/dev-flow -smoke             # 冒烟测试
/dev-flow -e2e               # 端到端测试
/dev-flow -integration       # 集成测试
/dev-flow -fix               # 分析并修复 Bug
/dev-flow -hotfix <错误信息> # 紧急修复线上错误
```

### 记忆管理

```
/dev-flow -cleanup           # 清理会话记忆（保留长期记忆）
/dev-flow -cleanup --all     # 重置全部记忆
```

### Subagent 模式（复杂任务）

```
/dev-flow -subagent <需求描述>  # 使用 subagent 并行模式
```

适用于：
- 需求涉及 2 个以上服务/模块
- 预计生成 10 个以上文件
- 项目代码量大（上下文可能不足）
- 需要并行开发加速

**跨平台调度策略**（v2.0.0 新增）：
- **Trae**：原生并行 — 同批次任务同时启动多个 `/develop-expert`
- **Cursor / Claude Code / Qoder**：顺序模拟并行 — 按批次顺序执行，每个任务独立上下文，通过 `task-result.yaml` 传递产出
- **Codex**：有限并行 — 通过 `run agent: develop-expert` 切换 agent 上下文

**架构**：
```
用户 ←→ 主 Agent（协调者）
              │
              ├── research-expert  → 扫描项目，输出 memory/
              │     ├── dependency-scanner   → 深层扫描依赖项目
              │     ├── service-scanner      → 扫描当前服务
              │     ├── structure-analyzer   → 分析项目结构
              │     └── config-analyzer      → 分析配置规范
              ├── analyze-expert   → 分析需求，输出分析文档
              ├── design-expert    → 详细设计，输出 design-contract.yaml
              ├── task-split-expert → 智能拆分，输出 DAG + 子任务设计
              ├── develop-expert   → 子任务级代码开发（可并行多个）
              └── verify-expert    → 代码验证
```

### 断点续传

```
/dev-flow --resume           # 从上次中断处继续
```

## 工作流程

```
Research → Analyze → Design → Task Split → Develop → Unit Test → Smoke Test → E2E Test → Integration Test → Fix → Delivery
  调研   →  分析  →  设计  →  任务拆分  →  开发  →  单元测试 →  冒烟测试  →  E2E测试  →  集成测试   → 修复 →  交付

Hotfix（独立模式，随时可用，直接输出无需等待确认）
```

| 阶段 | AI 做什么 | 产出 |
|------|----------|------|
| **Research** | 扫描项目文件、识别技术栈、深层扫描依赖项目、提取编码规范 | `.dev-flow/memory/` 长期记忆 + 会话记忆 |
| **Analyze** | 解析需求、关联已有代码、识别歧义、**一致性校验**、评估影响范围 | 需求分析文档 |
| **Design** | 读取项目记忆、设计数据模型、API 接口、组件树、业务流程 | `design-contract.yaml`（含接口契约，支持多语言） |
| **Task Split** | 拆分为子任务、**冲突检测**、构建 DAG、**双维度选择**、生成子任务级设计 | `task-dag.yaml` + `subtask-{id}-design.yaml` + `interface-registry.yaml` |
| **Develop** | 读取子任务设计、按 DAG 批次并行生成代码、**强制编译验证** | 代码文件 |
| **Unit Test** | 生成单元测试（覆盖正常/异常/边界）、执行测试 | 单元测试报告 |
| **Smoke Test** | 快速验证核心流程可运行（curl/手动验证） | 冒烟测试报告 |
| **E2E Test** | 端到端自动化测试（Java 完整链路 / Playwright 浏览器测试） | E2E 测试报告 |
| **Integration Test** | 跨服务/跨模块集成测试、接口契约验证 | 集成测试报告 |
| **Fix** | 分析失败原因、修复代码、回归测试（最多循环 3 次） | 修复后的代码 |
| **Delivery** | 汇总全流程成果、生成交付清单 | 交付报告 |

## v2.0.0 架构详解

### 四层按需加载架构

v2.0.0 在 v1.0.5 三层架构基础上，新增了 references 层，将 Router 中的详细参考内容外置：

```
第一层：Router（17KB，始终加载）
  ├── YAML front-matter + 命令解析
  ├── 全局规则（禁止事项 + 完整性铁律精简版）
  ├── 阶段路由表
  ├── 标准模式执行流程
  └── 记忆系统快速引用 + 学习能力快速引用

第二层：References（按需加载的深度参考文档）
  ├── references/memory-system.md (15KB)    ← Research/Develop 时读取
  ├── references/learning-system.md (8.5KB)  ← 阶段结束时读取
  ├── references/error-pattern-db.md (11.5KB)← Error Pattern Learner 读取
  └── references/model-context-config.md      ← Context Manager 读取

第三层：阶段指令文件（进入阶段时加载）
  ├── stages/research.md ← 进入 Research 才加载
  ├── stages/design.md   ← 进入 Design 才加载
  └── ...共 13 个文件

第四层：Agent 文件（Subagent 模式下加载）
  ├── develop-expert.md  ← Subagent 模式下加载
  ├── step-enforcer.md   ← 验证步骤完整性
  └── ...共 18 个 agent
```

**与 v1.0.5 对比**：

| 指标 | v1.0.5 | v2.0.0 | 变化 |
|------|--------|--------|------|
| Router 体积 | 27KB | **17KB** | **-37%** |
| 始终加载内容 | 27KB | **17KB** | **-37%** |
| 按需参考文档 | 0 | **4 个（35KB）** | 新增 |
| 记忆分类 | 无 | **会话/长期** | 新增 |
| 测试覆盖 | 0 | **4 套 + CI** | 新增 |

### 会话/长期记忆分离

v2.0.0 将记忆系统分为两层：

```
.dev-flow/memory/
├── project-overview.md     # 长期：项目概览
├── conventions.md          # 长期：编码规范
├── patterns.md             # 长期：代码模式（跨会话累积）
├── mistakes.md             # 长期：常见错误（跨会话累积）
├── preferences.md          # 长期：用户偏好（跨会话累积）
├── decisions.md            # 长期：架构决策（跨会话累积）
├── service-registry.md     # 长期：服务注册表（微服务）
├── dependency-graph.md     # 长期：依赖图谱（微服务）
├── common-modules.md       # 长期：公共模块（微服务）
└── session/                # 会话记忆（每次 Research 重建）
    ├── modules.md          # 会话：模块清单
    ├── apis.md             # 会话：API 列表
    ├── models.md           # 会话：数据模型
    ├── utils.md            # 会话：工具函数
    ├── config.md           # 会话：配置信息
    └── architecture.md     # 会话：架构描述
```

**会话记忆**：反映项目最新快照，每次 Research 自动重建，不会无限膨胀。

**长期记忆**：跨会话累积的项目知识（模式、错误、偏好、决策），Research 阶段只更新不重建。

**清理命令**：
- `/dev-flow -cleanup` — 清理 `session/` 目录，保留长期记忆
- `/dev-flow -cleanup --all` — 重置全部记忆文件

### Agent 智能拆分

v2.0.0 将大 Agent 文件拆分为核心+references 模式，按需加载：

| Agent | 原大小 | 拆分后核心 | 外置 references |
|-------|--------|-----------|----------------|
| error-pattern-learner | 27KB | **15.7KB** | error-pattern-db.md (11.5KB) |
| context-manager | 22KB | **18KB** | model-context-config.md |

拆分出的 references 文件仅在需要时加载，不占用初始上下文。

## 记忆系统

记忆系统分为**长期记忆**和**会话记忆**两部分。

### 长期记忆（跨会话保留）

```
.dev-flow/memory/
├── project-overview.md      # 项目概览（技术栈、服务列表、目录结构）
├── conventions.md           # 编码规范（命名、注解、统一响应、异常处理）
├── patterns.md              # 常见代码模式（使用次数 >3 高频，>5 标准）
├── mistakes.md              # 常见错误及修复（Bug 模式、修复方案、出现次数）
├── preferences.md           # 用户偏好（代码风格、架构偏好、质量要求）
├── decisions.md             # 架构决策记录（ADR 格式）
├── service-registry.md      # 服务注册表（微服务）
├── dependency-graph.md      # 服务间依赖图谱（微服务）
└── common-modules.md        # 公共模块清单（微服务）
```

### 会话记忆（每次 Research 重建）

```
.dev-flow/memory/session/
├── modules.md               # 模块清单（Entity/Mapper/Service/Controller/DTO/Enum）
├── apis.md                  # API 列表（当前服务 + Feign Client）
├── models.md                # 数据模型（Entity + DTO + 数据库表）
├── utils.md                 # 工具类/函数
├── config.md                # 配置信息（数据库/Redis/Nacos/中间件）
└── architecture.md          # 架构描述
```

### 记忆强化机制

- 每个模式/错误/偏好记录使用次数
- 使用次数 > 3 次 → 标记为 **"高频"**，优先推荐
- 使用次数 > 5 次 → 标记为 **"标准"**，必须遵守

## 学习能力

dev-flow 具备从用户反馈中学习的能力，通过持续积累项目知识，实现"越用越好用"。

| 来源 | 学习内容 | 更新文件 |
|------|----------|----------|
| 用户表扬某段代码 | 记录代码模式，标记为"推荐" | patterns.md |
| 用户修改了 AI 生成的代码 | 分析修改原因，更新偏好或模式 | preferences.md / patterns.md |
| 测试发现 Bug | 记录错误模式和修复方案 | mistakes.md |
| 用户明确指定偏好 | 记录偏好设置 | preferences.md |
| 重大架构决策 | 记录决策和原因 | decisions.md |

## 代码生成规范

dev-flow 要求 AI 生成的代码必须：

- 完整可运行（禁止 `// TODO` 占位符）
- 包含完整类型定义和错误处理
- 遵守项目已有的编码风格
- 复用已有组件和工具函数
- 包含 JSDoc 注释（公共方法）
- 包含 Props 验证和默认值
- 包含 API 请求验证和错误响应

## 支持的工具

| 工具 | 版本要求 | 触发方式 | Subagent 调度策略 | References |
|------|---------|---------|-------------------|------------|
| Cursor | 最新版 | `/dev-flow` | 顺序模拟并行 | ✅ `.cursor/references/` |
| Trae | 最新版 | `/dev-flow` | 原生并行 | ✅ `.trae/skills/dev-flow/references/` |
| Qoder | 最新版 | `/dev-flow` | 顺序模拟并行 | ✅ `.qoder/references/` |
| Claude Code | 最新版 | `/dev-flow` | 顺序模拟并行 | ✅ `.claude/references/` |
| OpenAI Codex | 当前版本 | 自然语言 / `$dev-flow` | 有限并行 | ✅ `.codex/references/` |

## 项目结构

```
dev-flow/
├── skill-templates/       # Skill 文件模板
│   ├── _core/             # 核心模板源（所有平台的公共基础）
│   │   ├── SKILL.md       # Router（17KB 骨架文件）
│   │   ├── stages/        # 13 个阶段指令文件（按需加载）
│   │   ├── agents/        # 20 个 agent 定义（全平台共享）
│   │   └── references/    # 4 个参考文档（按需加载）← v2.0.0 新增
│   │       ├── memory-system.md
│   │       ├── learning-system.md
│   │       ├── error-pattern-db.md
│   │       └── model-context-config.md
│   ├── _platforms/         # 平台特有文件
│   │   ├── trae/agents/   # Trae 专有 agent 扩展
│   │   └── codex/         # Codex 格式适配指南
│   ├── trae/              # Trae 构建输出
│   │   ├── SKILL.md       # Router（路径替换后）
│   │   ├── stages/
│   │   ├── agents/
│   │   └── references/    ← v2.0.0 新增
│   ├── cursor/            # Cursor 构建输出
│   │   ├── dev-flow.md
│   │   ├── stages/
│   │   ├── agents/
│   │   └── references/
│   ├── qoder/             # Qoder 构建输出
│   ├── claude/            # Claude Code 构建输出
│   └── codex/             # OpenAI Codex 构建输出
├── scripts/
│   ├── build.cjs          # 构建脚本（模板组装 + 路径替换 + 校验 + references）
│   ├── install.js         # 安装脚本（零依赖，含 references 和会话/长期记忆分类）
│   ├── version-check.js   # 版本号一致性检查 + --fix 自动修复
│   └── pre-publish.js     # 发布前完整检查
├── tests/                 # 测试套件 ← v2.0.0 新增
│   ├── build.test.js      # 构建验证
│   ├── links.test.js      # 链接有效性
│   ├── size-warning.test.js # 大小预警
│   ├── format.test.js     # Markdown 格式检查
│   └── run-all.js         # 统一入口
├── .github/workflows/
│   └── ci.yml             # GitHub Actions CI
├── USER_GUIDE.md          # 用户操作手册
├── README.md
├── CHANGELOG.md
├── LICENSE
└── package.json
```

## License

[MIT](./LICENSE)
