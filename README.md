# dev-flow

[![node](https://img.shields.io/node/v/dev-flow.svg)](https://nodejs.org)

AI 开发全流程编排 Skill，适用于 Cursor、Trae、Qoder、Claude Code、OpenAI Codex 等 AI 编程工具。

通过 `/dev-flow` 命令，AI 将按照结构化流程逐步执行：**项目调研 → 需求分析 → 详细设计 → 代码开发 → 测试验证 → Bug 修复**，每个阶段完成后暂停等待确认，确保产出质量。

## 为什么需要 dev-flow？

AI 编程工具（Cursor/Trae/Qoder/Claude Code）虽然强大，但在处理复杂需求时容易：

- 跳过重要步骤（如先了解项目结构再写代码）
- 生成与项目风格不一致的代码
- 遗漏边界情况和错误处理
- 缺乏系统性的测试验证
- 不记住用户的偏好和项目的深层知识

dev-flow 通过**结构化的流程编排 + 项目记忆 + 长期记忆 + 学习能力**解决这些问题，让 AI 编程工具**越用越好用**。

## 特性

- **结构化流程** - 6 个阶段 + Hotfix 模式，每个阶段有明确的输入/输出和自检步骤
- **Subagent 模式** - 复杂任务拆分为独立 subagent 并行执行，上下文隔离，效率翻倍
- **项目记忆** - Research 阶段自动扫描并记录项目结构、组件、API、编码规范（7 个文件）
- **长期记忆** - 记录常见代码模式、错误修复方案、用户偏好、架构决策（4 个文件），跨会话持久化
- **学习能力** - 从用户反馈、代码修改、测试 Bug 中自动学习，持续优化代码生成策略
- **记忆强化** - 模式使用 >3 次标记"高频"优先推荐，>5 次标记"标准"必须遵守
- **阶段确认** - 每个阶段完成后暂停，展示成果并等待用户确认
- **断点续传** - 长流程中断后可从上次断点恢复（`.dev-flow/sessions/`）
- **Markdown 记忆** - 所有记忆使用 Markdown 格式，AI 可直接读写
- **多工具支持** - Cursor、Trae、Qoder、Claude Code、OpenAI Codex
- **多语言支持** - Java (Spring Boot)、前端 (React/Vue)、Python、Go、Rust 等主流技术栈
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
| OpenAI Codex | `AGENTS.md`（项目根目录） | 终端输入 `codex` 后使用自然语言 |

**Subagent 文件**（用于 `-subagent` 模式）：

| Agent | 文件路径 | 职责 |
|-------|----------|------|
| orchestrator | `.trae/skills/dev-flow/agents/orchestrator.md` | 主协调者，任务拆分和调度 |
| research-expert | `.trae/skills/dev-flow/agents/research-expert.md` | 项目研究，扫描技术栈 |
| analyze-expert | `.trae/skills/dev-flow/agents/analyze-expert.md` | 需求分析，影响评估 |
| design-expert | `.trae/skills/dev-flow/agents/design-expert.md` | 详细设计，接口定义 |
| develop-expert | `.trae/skills/dev-flow/agents/develop-expert.md` | 代码开发（可并行） |
| verify-expert | `.trae/skills/dev-flow/agents/verify-expert.md` | 代码验证，质量检查 |
| task-protocol | `.trae/skills/dev-flow/agents/task-protocol.md` | 任务拆分协议定义 |

同时创建 `.dev-flow/memory/` 目录（11 个 Markdown 记忆模板）和 `.dev-flow/sessions/` 目录（会话记录）。

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
```

AI 将按阶段逐步执行，每个阶段完成后等待你确认。

## 使用方法

### 全流程模式

```
/dev-flow <需求描述>
```

执行：Research → Analyze → Design → Develop → Test → Fix

### 单阶段模式

```
/dev-flow -research          # 项目调研
/dev-flow -analyze <需求>    # 需求分析
/dev-flow -design <需求>     # 详细设计
/dev-flow -develop <需求>    # 直接开发（跳过设计，适合小需求）
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
              ├── /research-expert  → 扫描项目，输出 memory/
              ├── /analyze-expert   → 分析需求，输出分析文档
              ├── /design-expert    → 详细设计，输出设计文档
              ├── /develop-expert   → 代码开发（可并行多个）
              └── /verify-expert    → 代码验证
```

**工作流程**：
1. 主 agent 接收需求，创建会话目录
2. 按顺序调度 subagent：Research → Analyze → Design → Develop → Verify
3. 每个 subagent 在独立上下文中执行，只读取必要的文件
4. Develop 阶段根据任务拆分可并行启动多个 develop-expert
5. 主 agent 收集各 subagent 结果，整合后向用户汇报

**任务拆分与依赖处理**：
- Analyze 阶段输出的 `task-breakdown.yaml` 定义所有开发任务及其依赖关系
- 主 agent 根据 DAG 依赖图进行拓扑排序，分批执行
- 无依赖的任务并行执行（如不同服务的开发任务）
- 有依赖的任务串行执行（如 Entity → DTO → Service → Controller）

### 断点续传

```
/dev-flow --resume           # 从上次中断处继续
```

## 工作流程

```
Research → Analyze → Design → Develop → Test → Fix
  调研   →  分析  →  设计  →  开发  → 测试 → 修复

Hotfix（独立模式，随时可用，直接输出无需等待确认）
```

| 阶段 | AI 做什么 | 产出 |
|------|----------|------|
| **Research** | 扫描项目文件、识别技术栈、提取编码规范、列出已有组件/API | `.dev-flow/memory/` 记忆文件 |
| **Analyze** | 解析需求、关联已有代码、识别歧义、评估影响范围 | 需求分析文档 |
| **Design** | 读取项目记忆、设计数据模型、API 接口、组件树、业务流程 | 设计文档 |
| **Develop** | 读取项目记忆、按依赖顺序生成完整可运行的代码 | 代码文件 |
| **Test** | 生成测试用例（覆盖正常/异常/边界）、执行测试、生成报告 | 测试报告 |
| **Fix** | 分析失败原因、修复代码、回归测试（最多循环 3 次） | 修复后的代码 |

## 记忆系统

记忆系统分为两部分：**基础记忆**（7 个文件）和**长期记忆**（4 个文件），共 11 个 Markdown 文件。

### 基础记忆（Research 阶段自动填充）

**前端/Node.js 项目：**
```
.dev-flow/memory/
├── project-overview.md    # 项目概览（技术栈、架构、目录结构）
├── conventions.md         # 编码规范（命名、导入、注释风格）
├── components.md          # 已有组件列表（名称、路径、Props、用途）
├── apis.md                # 已有 API 列表（路径、方法、参数、响应）
├── models.md              # 数据模型列表（名称、字段、关系）
├── utils.md               # 工具函数列表（名称、签名、用途）
└── architecture.md        # 架构决策
```

**Java 项目：**
```
.dev-flow/memory/
├── project-overview.md    # 项目概览（技术栈、架构、目录结构）
├── conventions.md         # 编码规范（命名、导入、注释风格）
├── modules.md             # 已有模块列表（Entity/Mapper/Service/Controller/DTO/Enum）
├── apis.md                # 已有 API 列表（路径、方法、参数、响应）
├── models.md              # 数据模型列表（Entity、DTO、数据库表）
├── utils.md               # 工具类列表（名称、签名、用途）
├── config.md              # 配置信息（数据库、Redis、中间件）
└── architecture.md        # 架构决策
```

### 长期记忆（自动学习积累）

```
.dev-flow/memory/
├── patterns.md            # 常见代码模式（可复用的代码片段、使用场景、使用次数）
├── mistakes.md            # 常见错误及修复（Bug 模式、修复方案、出现次数、预防措施）
├── preferences.md         # 用户偏好（代码风格、架构偏好、质量要求）
└── decisions.md           # 架构决策记录（ADR 格式：日期、决策、原因、影响）
```

### 记忆使用规则

| 时机 | 读取文件（前端项目） | 读取文件（Java 项目） |
|------|---------------------|----------------------|
| Develop 前 | conventions、components、apis、utils、patterns | conventions、modules、apis、utils、patterns |
| Design 前 | project-overview、architecture、decisions | project-overview、architecture、decisions |
| Analyze 前 | components、apis、models | modules、apis、models |
| Fix 前 | mistakes | mistakes |
| 所有阶段前 | preferences | preferences |

### 记忆更新规则

| 时机 | 更新的文件（前端项目） | 更新的文件（Java 项目） |
|------|----------------------|------------------------|
| Research 完成后 | 创建/更新所有基础记忆文件 | 创建/更新所有基础记忆文件 |
| Develop 完成后 | 更新 components、apis、models、patterns | 更新 modules、apis、models、patterns |
| Fix 完成后 | 更新 mistakes、patterns、conventions | 更新 mistakes、patterns、conventions |
| 用户明确反馈后 | 更新 preferences | 更新 preferences |
| 重大架构决策后 | 更新 decisions | 更新 decisions |

### 记忆强化机制

- 每个模式/错误/偏好记录使用次数
- 使用次数 > 3 次 → 标记为 **"高频"**，优先推荐
- 使用次数 > 5 次 → 标记为 **"标准"**，必须遵守

## 学习能力

dev-flow 具备从用户反馈中学习的能力，通过持续积累项目知识，实现"越用越好用"。

### 学习来源

| 来源 | 学习内容 | 更新文件 |
|------|----------|----------|
| 用户表扬某段代码 | 记录代码模式，标记为"推荐" | patterns.md |
| 用户修改了 AI 生成的代码 | 分析修改原因，更新偏好或模式 | preferences.md / patterns.md |
| 测试发现 Bug | 记录错误模式和修复方案 | mistakes.md |
| 用户明确指定偏好 | 记录偏好设置 | preferences.md |
| 重大架构决策 | 记录决策和原因 | decisions.md |
| 某模式被复用 3 次以上 | 标记为"高频模式"，优先推荐 | patterns.md |

### 学习方式

**1. 用户显式反馈**
- 用户说"这段代码很好，以后都按这个风格" → 更新 preferences.md
- 用户说"这个错误又出现了" → 更新 mistakes.md
- 用户修改了 AI 生成的代码 → 分析差异，更新 patterns.md

**2. 隐式学习**
- 观察用户如何修改 AI 生成的代码
- 统计哪些代码模式被复用最多
- 记录哪些错误反复出现

**3. 阶段间学习**
- Test 阶段发现的 Bug → 更新 mistakes.md
- Fix 阶段的修复方案 → 更新 patterns.md
- Develop 阶段的新模式 → 更新 patterns.md

### 学习效果评估

| 指标 | 目标 | 评估方式 |
|------|------|----------|
| 代码接受率 | > 80% | 用户修改 AI 生成代码的比例降低 |
| Bug 重复率 | < 10% | 同一错误不出现超过 2 次 |
| 模式复用率 | > 60% | 新代码复用已有模式的比例 |
| 用户满意度 | > 4.5/5 | 用户主观评价 |

## 代码生成规范

dev-flow 要求 AI 生成的代码必须：

- 完整可运行（禁止 `// TODO` 占位符）
- 包含完整类型定义和错误处理
- 遵守项目已有的编码风格
- 复用已有组件和工具函数
- 包含 JSDoc 注释（公共方法）
- 包含 Props 验证和默认值
- 包含 API 请求验证和错误响应

**禁止事项**：
- `// TODO: 实现业务逻辑`
- `{/* 描述 */}` 空 JSX
- `expect(true).toBe(true)` 无效测试
- `data: null` 硬编码返回
- 任何形式的空壳/占位代码

## 项目结构

```
dev-flow/
├── skill-templates/       # Skill 文件模板
│   ├── trae/SKILL.md      # Trae 模板（含 YAML frontmatter）
│   ├── cursor/dev-flow.md # Cursor 模板
│   ├── qoder/dev-flow.md  # Qoder 模板
│   └── claude/dev-flow.md # Claude Code 模板
├── scripts/
│   └── install.js         # 安装脚本（零依赖）
├── README.md
└── package.json
```

## License

[MIT](./LICENSE)
