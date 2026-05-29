# dev-flow

[![node](https://img.shields.io/node/v/dev-flow.svg)](https://nodejs.org)
[![version](https://img.shields.io/badge/version-v1.0.2-blue)]()

> **当前版本: v1.0.2** | [更新日志](./CHANGELOG.md)

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

- **结构化流程** - 7 个阶段 + Hotfix 模式，每个阶段有明确的输入/输出和自检步骤
- **智能任务拆分** - 方案C：Design 输出全局契约，Task Split 生成子任务级设计 + DAG 依赖图，每个 subagent 只接收必要信息
- **接口契约机制** - 跨子任务接口定义（serviceContracts/eventContracts/dataContracts），契约冻结（stability: frozen）防止随意修改
- **多 Subagent 并行** - 复杂任务拆分为独立 subagent 并行执行，上下文隔离，效率翻倍
- **智能 Research** - 自动评估项目规模，选择标准模式或 4 subagent 并行扫描
- **深层依赖扫描** - 自动扫描微服务项目的依赖项目（common-bean、basedata-api 等）
- **项目记忆** - Research 阶段自动扫描并记录项目结构、组件、API、编码规范（12 个文件）
- **长期记忆** - 记录常见代码模式、错误修复方案、用户偏好、架构决策（4 个文件），跨会话持久化
- **结构化业务逻辑** - 设计阶段输出结构化决策表（8 种 Action 类型），开发阶段精确翻译为代码，消除自然语言歧义
- **编译验证闭环** - 开发完成后自动编译验证（Java/前端），解析错误并自动修复（最多 3 轮）
- **契约一致性校验** - contract-validator 自动验证方法签名、Entity 字段、实现完整性、依赖调用一致性
- **全局集成编译** - 所有子任务完成后全局编译 + 契约验证 + 错误分类 + 循环修复
- **错误经验学习** - 从编译错误、契约违反、测试失败中提取模式，生成预防策略，持续改进
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
| Trae | `.trae/skills/dev-flow/SKILL.md` | 输入框输入 `/dev-flow` |
| Cursor | `.cursor/commands/dev-flow.md` | 输入框输入 `/dev-flow` |
| Qoder | `.qoder/commands/dev-flow.md` | 输入框输入 `/dev-flow` |
| Claude Code | `.claude/commands/dev-flow.md` | 输入框输入 `/dev-flow` |
| OpenAI Codex | `AGENTS.md` + `.agents/skills/dev-flow/SKILL.md` + `.codex/agents/*.toml` | 终端输入 `codex` 后使用自然语言或 `$dev-flow` |

**Subagent 文件**（用于 `-subagent` 模式和 Research 并行扫描；Codex 使用 `.codex/agents/*.toml`）：

| Agent | 文件路径 | 职责 |
|-------|----------|------|
| orchestrator | `.codex/agents/orchestrator.toml` / 其他工具的 `agents/orchestrator.md` | 主协调者，DAG 调度和依赖检查 |
| research-expert | `.codex/agents/research-expert.toml` / 其他工具的 `agents/research-expert.md` | 项目研究，调度子 subagent 扫描 |
| analyze-expert | `.codex/agents/analyze-expert.toml` / 其他工具的 `agents/analyze-expert.md` | 需求分析，影响评估 |
| design-expert | `.codex/agents/design-expert.toml` / 其他工具的 `agents/design-expert.md` | 详细设计，接口定义 |
| **task-split-expert** | `.codex/agents/task-split-expert.toml` / 其他工具的 `agents/task-split-expert.md` | **智能任务拆分，生成子任务级设计 + DAG** |
| develop-expert | `.codex/agents/develop-expert.toml` / 其他工具的 `agents/develop-expert.md` | 代码开发（可并行，支持子任务级输入） |
| verify-expert | `.codex/agents/verify-expert.toml` / 其他工具的 `agents/verify-expert.md` | 代码验证，质量检查 |
| task-protocol | `.codex/agents/task-protocol.toml` / 其他工具的 `agents/task-protocol.md` | 任务拆分协议定义 |
| dependency-scanner | `.codex/agents/dependency-scanner.toml` / 其他工具的 `agents/dependency-scanner.md` | 依赖项目深层扫描（Entity/DTO/Enum/Util/Feign Client） |
| service-scanner | `.codex/agents/service-scanner.toml` / 其他工具的 `agents/service-scanner.md` | 当前服务源码扫描（Entity/Service/Controller/Mapper） |
| structure-analyzer | `.codex/agents/structure-analyzer.toml` / 其他工具的 `agents/structure-analyzer.md` | 项目结构和依赖关系分析 |
| config-analyzer | `.codex/agents/config-analyzer.toml` / 其他工具的 `agents/config-analyzer.md` | 配置和编码规范分析 |
| **contract-validator** | `.codex/agents/contract-validator.toml` / 其他工具的 `agents/contract-validator.md` | **契约一致性校验（方法签名/字段/实现/依赖）** |
| **error-pattern-learner** | `.codex/agents/error-pattern-learner.toml` / 其他工具的 `agents/error-pattern-learner.md` | **错误模式学习与预防策略生成** |

同时创建 `.dev-flow/memory/` 目录（12 个 Markdown 记忆模板）和 `.dev-flow/sessions/` 目录（会话记录）。

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
/dev-flow -fix               # 分析并修复 Bug
/dev-flow -hotfix <错误信息> # 紧急修复线上错误
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
              ├── task-split-expert → 智能拆分，输出 DAG + 子任务设计（方案C）
              ├── develop-expert   → 子任务级代码开发（可并行多个）
              └── verify-expert    → 代码验证
```

### 断点续传

```
/dev-flow --resume           # 从上次中断处继续
```

## 工作流程

```
Research → Analyze → Design → Task Split → Develop → Test → Fix
  调研   →  分析  →  设计  →  任务拆分  →  开发  → 测试 → 修复

Hotfix（独立模式，随时可用，直接输出无需等待确认）
```

| 阶段 | AI 做什么 | 产出 |
|------|----------|------|
| **Research** | 扫描项目文件、识别技术栈、深层扫描依赖项目、提取编码规范 | `.dev-flow/memory/` 12 个记忆文件 |
| **Analyze** | 解析需求、关联已有代码、识别歧义、评估影响范围 | 需求分析文档 |
| **Design** | 读取项目记忆、设计数据模型、API 接口、组件树、业务流程 | `design-contract.yaml`（含接口契约） |
| **Task Split** | 拆分为子任务、构建 DAG 依赖图、生成子任务级设计 | `task-dag.yaml` + `subtask-{id}-design.yaml` + `interface-registry.yaml` |
| **Develop** | 读取子任务设计、按 DAG 批次并行生成完整可运行的代码 | 代码文件 |
| **Test** | 生成测试用例（覆盖正常/异常/边界）、执行测试、生成报告 | 测试报告 |
| **Fix** | 分析失败原因、修复代码、回归测试（最多循环 3 次） | 修复后的代码 |

## Research 智能模式

Research 阶段会自动评估项目规模，选择最优执行模式：

| 源码文件数 | 执行模式 | 说明 |
|-----------|---------|------|
| < 50 个 | **标准模式** | 单 agent 直接执行检查清单 |
| 50-200 个 | **分组模式** | 2-3 个 subagent 并行扫描 |
| > 200 个 | **完整模式** | 4 个 subagent 并行扫描 |

**4 个 Research Subagent**：

| Subagent | 职责 | 输出文件 | 上下文 |
|----------|------|---------|--------|
| dependency-scanner | 深层扫描依赖项目 | common-modules.md, utils.md | ~30-50KB |
| service-scanner | 扫描当前服务 | models.md, apis.md | ~20-40KB |
| structure-analyzer | 分析项目结构 | project-overview.md, service-registry.md, dependency-graph.md | ~10-20KB |
| config-analyzer | 分析配置规范 | config.md, conventions.md, patterns.md, decisions.md, mistakes.md | ~10-20KB |

**上下文优化效果**：主 Agent 从 ~420KB 降至 ~5KB，降低 98.8%。

## 记忆系统

记忆系统分为两部分：**基础记忆**（12 个文件）和**长期记忆**（4 个文件），共 16 个 Markdown 文件。

### 基础记忆（Research 阶段自动填充）

**Spring Cloud 微服务（12 个文件）：**

```
.dev-flow/memory/
├── project-overview.md      # 项目概览（技术栈、服务列表、目录结构）
├── service-registry.md      # 服务注册表（服务名/端口/角色/子模块）
├── dependency-graph.md      # 服务间依赖图谱（Maven 依赖 + Feign 调用）
├── common-modules.md        # 公共模块清单（依赖项目的 Entity/DTO/Enum/Util）
├── conventions.md           # 编码规范（命名、注解、统一响应、异常处理）
├── config.md                # 配置信息（数据库/Redis/Nacos/中间件）
├── models.md                # 数据模型（当前服务 + 依赖项目的 Entity 和 DTO）
├── apis.md                  # API 列表（当前服务 API + Feign Client API）
├── utils.md                 # 工具类（当前服务 + 依赖项目的工具类）
├── patterns.md              # 常见代码模式
├── mistakes.md              # 常见错误及修复
└── decisions.md             # 架构决策记录
```

**前端/Node.js 项目（7 个文件）** 和 **Java 单服务项目（8 个文件）** 见用户操作手册。

### 长期记忆（自动学习积累）

```
.dev-flow/memory/
├── patterns.md              # 常见代码模式（可复用的代码片段、使用场景、使用次数）
├── mistakes.md              # 常见错误及修复（Bug 模式、修复方案、出现次数、预防措施）
├── preferences.md           # 用户偏好（代码风格、架构偏好、质量要求）
└── decisions.md             # 架构决策记录（ADR 格式：日期、决策、原因、影响）
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

| 工具 | 版本要求 | 触发方式 | Subagent 支持 |
|------|---------|---------|--------------|
| Cursor | 最新版 | `/dev-flow` | ✅ 原生支持 |
| Trae | 最新版 | `/dev-flow` | ✅ 原生支持 |
| Qoder | 最新版 | `/dev-flow` | ✅ 原生支持 |
| Claude Code | 最新版 | `/dev-flow` | ✅ 原生支持 |
| OpenAI Codex | 当前版本 | 自然语言 / `$dev-flow` | ✅ 原生支持（AGENTS.md + Skill + custom agents） |

## 项目结构

```
dev-flow/
├── skill-templates/       # Skill 文件模板
│   ├── trae/              # Trae 模板
│   │   ├── SKILL.md       # 主指令文件
│   │   └── agents/        # 14 个 subagent 定义（含 task-split-expert、contract-validator、error-pattern-learner）
│   ├── cursor/            # Cursor 模板
│   │   ├── dev-flow.md
│   │   └── agents/
│   ├── qoder/             # Qoder 模板
│   │   ├── dev-flow.md
│   │   └── agents/
│   ├── claude/            # Claude Code 模板
│   │   ├── dev-flow.md
│   │   └── agents/
│   └── codex/             # OpenAI Codex 模板
│       ├── AGENTS.md      # Codex 项目指令文件
│       ├── config.toml    # Codex 项目配置（安装到 .codex/config.toml）
│       ├── skills/        # Codex repo skill（安装到 .agents/skills/）
│       └── agents/        # 11 个 Codex custom agent TOML 定义
├── scripts/
│   └── install.js         # 安装脚本（零依赖）
├── USER_GUIDE.md          # 用户操作手册
├── README.md
└── package.json
```

## License

[MIT](./LICENSE)
