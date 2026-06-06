# dev-flow

[![node](https://img.shields.io/node/v/dev-flow.svg)](https://nodejs.org)
[![version](https://img.shields.io/badge/version-v3.2.0-blue)]()
[![license](https://img.shields.io/badge/license-MIT-green)]()

> **当前版本: v3.2.0** | [用户操作手册](./USER_GUIDE.md) | [更新日志](./CHANGELOG.md)

AI 开发全流程编排 Skill，适用于 Cursor、Trae、Qoder、Claude Code、OpenAI Codex 等 AI 编程工具。

通过 `/dev-flow` 命令，AI 将按照结构化流程逐步执行：**项目调研 → 需求分析 → 详细设计 → 代码开发 → 测试验证 → Bug 修复**，每个阶段完成后暂停等待确认，确保产出质量。

**v3.2.0 核心架构**：主 Agent 作为纯调度枢纽（零编辑），所有文件操作由专门的阶段 Subagent 执行。Router（SKILL.md）从 49KB 瘦身至 ~23KB，详细内容外置到 6 个独立 reference 文件按需加载。

## 为什么需要 dev-flow？

AI 编程工具（Cursor/Trae/Qoder/Claude Code/Codex）虽然强大，但在处理复杂需求时容易：

- 跳过重要步骤（如先了解项目结构再写代码）
- 生成与项目风格不一致的代码
- 遗漏边界情况和错误处理
- 缺乏系统性的测试验证
- 不记住用户的偏好和项目的深层知识
- 大型项目上下文不足，跳过关键扫描步骤

dev-flow 通过**结构化的流程编排 + 项目记忆 + 长期记忆 + 多 Subagent 并行 + 主 Agent 零编辑架构**解决这些问题，让 AI 编程工具**越用越好用**。

## 特性

### 主 Agent 零编辑架构

- **零编辑铁律 v2.0** — 主 Agent 仅作为交互枢纽和纯调度器，绝不直接编辑任何文件（Read ✅ / Bash ✅ / Edit 🔴 / Write 🔴），所有文件操作由专门的阶段 Subagent 执行
- **文件白名单** — 主 Agent 仅允许写入 `.confirmed` 确认文件和会话初始化文件
- **产出溯源机制** — 所有 Subagent 产出文件必须包含 `@generated-by` 注释，审计日志自动记录
- **文件修改审计** — 每个阶段结束时自动执行审计，检测违规行为

### 统一 Subagent 执行模型

- 所有阶段统一由 Subagent 执行（简单需求串行 Subagent / 复杂需求并行 Subagent）
- **三级失败处理协议** — Level 1 自动重试 → Level 2 诊断重试 → Level 3 人工升级，硬阻断主 Agent 越权
- **跨平台 Subagent 调度策略** — 自动检测当前平台能力，Trae 原生并行、Cursor/Claude/Qoder 顺序模拟并行、Codex 有限并行

### 阶段交付物审批机制

- **独立交付物文档** — 每个阶段产出独立审批文档（`.dev-flow/deliverables/`），而非仅在对话栏输出
- **交付物存在性检查（Gate-1.5）** — 阶段门禁新增交付物存在性检查，缺失则拒绝进入下一阶段
- **主 Agent 审批流程** — 读取并打开交付物文档供用户审批，替代"对话栏展示"

### Research 多子代理分批架构

- **pre-scanner + 13 文件子代理** — 从单 research-expert 串行扫描升级为 pre-scanner 全局索引 + 13 个独立文件子代理分批并行
- **file-index.yaml 中间格式** — pre-scanner 一次 Glob → 全局文件索引 → 每个文件子代理直接查索引精确定位，消除重复扫描
- **5 批次语义分组** — 基础层(3) → 数据层(3) → 行为层(3) → 横切层(2) → 模板层(2)，批次内并行、批次间等待
- **无聚合器架构** — 每个子代理独立上下文（~25-40KB），直接写入目标 memory 文件，互不依赖，故障隔离

### 上下文自动注入 + 结构化分段生成

- **上下文自动注入** — Subagent 派发前自动收集任务信息、设计文档、编码规范、依赖类定义，生成 `task-brief-{taskId}.md`，Subagent 打开即有完整上下文
- **结构化代码分段生成** — 当预估代码输出 > 20KB 时自动启用"骨架 + 逐方法填充"四阶段协议，每次填充 5-10KB 保持在质量安全区
- **自动产出校验** — Subagent 完成后自动校验文件存在性、TODO/FIXME、空方法体、Design Contract 签名一致性

### 四层按需加载架构（v3.2.0 优化）

- **Router（~23KB）** — 始终加载，包含路由表、全局规则摘要、阶段门禁
- **References（6 个文件，按需加载）** — 详细审计规范、失败决策树、交付物协议、门禁检查详情、模式对比、平台适配规则
- **阶段指令文件（13 个，按需加载）** — 进入对应阶段时才读取
- **Agent 文件（20 个，Subagent 模式加载）** — 专门的阶段执行者

**v3.2.0 优化亮点**：Router 从 49KB 瘦身至 ~23KB（减少 53%），详细内容外置到 6 个独立 reference 文件，按需加载不浪费初始上下文。

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

## 快速开始

```bash
# 1. 进入你的项目
cd your-project

# 2. 安装 dev-flow
npm install Jane-Split/dev-flow --save-dev
npx dev-flow install

# 3. 在 Cursor / Trae / Qoder / Claude Code 中输入：
/dev-flow 实现用户登录功能，包含表单验证和记住密码

# 4. 或在 OpenAI Codex 中：
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
/dev-flow -split <需求>     # 任务拆分（生成子任务级设计 + DAG）
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

### Subagent 模式

```bash
/dev-flow -subagent <需求描述>  # 并行 Subagent 调度（复杂任务）
```

**简单需求**（`/dev-flow <需求>`）→ 主 Agent 串行创建单个 Subagent，每阶段一个。
**复杂需求**（`/dev-flow -subagent <需求>`）→ Orchestrator 按 DAG 批次并行调度多个 Subagent。

### 断点续传

```bash
/dev-flow --resume           # 从上次中断处继续
```

## 工作流程

```
Research → Analyze → Design → Task Split → Develop → Unit Test → Smoke Test → E2E Test → Integration Test → Fix → Delivery
  调研   →  分析  →  设计  →  任务拆分  →  开发  →  单元测试 →  冒烟测试  →  E2E测试  →  集成测试   → 修复 →  交付
```

| 阶段 | AI 做什么 | 产出 |
|------|----------|------|
| **Research** | pre-scanner 全局索引 + 13 文件级 subagent 分批并行扫描，关键类强制全量读取，记忆完整性 A/B/C/D 四级评级 | `.dev-flow/memory/` 13 个 memory 文件 + file-index.yaml + 阶段交付物 |
| **Analyze** | 解析需求、关联已有代码、识别歧义、一致性校验、评估影响范围 | 需求分析文档 |
| **Design** | 读取项目记忆、设计数据模型、API 接口、组件树、业务流程 | `design-contract.yaml`（含接口契约，支持多语言） |
| **Task Split** | 拆分为子任务、冲突检测、构建 DAG、生成子任务级设计 | `task-dag.yaml` + `subtask-{id}-design.yaml` + `interface-registry.yaml` |
| **Develop** | develop-expert Subagent 按子任务并行生成代码、上下文自动注入、结构化分段生成、业务代码优先铁律、强制编译验证 | 代码文件 + `code-generation-plan.yaml` |
| **Unit Test** | 生成单元测试（覆盖正常/异常/边界）、执行测试 | 单元测试报告 |
| **Smoke Test** | 快速验证核心流程可运行（curl/手动验证） | 冒烟测试报告 |
| **E2E Test** | 端到端自动化测试（Java 完整链路 / Playwright 浏览器测试） | E2E 测试报告 |
| **Integration Test** | 跨服务/跨模块集成测试、接口契约验证 | 集成测试报告 |
| **Fix** | 分析失败原因、修复代码、回归测试 | 修复后的代码 |
| **Delivery** | 汇总全流程成果、生成交付清单 | 交付报告 |

## 架构详解

### 四层按需加载架构

v3.2.0 采用四层架构，最大限度地减少初始上下文占用：

```
第一层：Router（~23KB，始终加载）
  ├── YAML front-matter + 命令解析
  ├── 全局规则摘要（禁止事项 + 零编辑铁律核心）
  ├── 阶段路由表
  ├── 阶段门禁检查（Gate-1 ~ Gate-2.5）
  └── 记忆系统 / 学习能力快速引用

第二层：References（6 个文件，按需加载）
  ├── references/zero-edit-audit.md         ← 溯源格式、审计流程、audit-log.yaml 格式
  ├── references/failure-decision-tree.md    ← 决策树、L2 诊断报告、L3 升级报告
  ├── references/deliverable-protocol.md    ← 交付物结构、审批流程、Checklist 模板
  ├── references/gate-checks.md             ← Gate-1.5 检查、Gate-2.5 审计、校验规则
  ├── references/mode-comparison.md         ← 模式对比速查表、手动覆盖规则
  ├── references/platform-adapters.md        ← 5 平台适配规则、上下文监控、调度策略
  ├── references/memory-system.md            ← 记忆目录结构、使用规则（v2.0.0）
  ├── references/learning-system.md         ← 学习机制、示例和效果评估（v2.0.0）
  ├── references/error-pattern-db.md        ← 错误模式定义和预防策略（v2.0.0）
  └── references/model-context-config.md     ← 模型上下文窗口配置（v2.0.0）

第三层：阶段指令文件（进入阶段时加载）
  ├── stages/research.md ← 进入 Research 才加载
  ├── stages/design.md   ← 进入 Design 才加载
  └── ...共 13 个文件

第四层：Agent 文件（Subagent 模式下加载）
  ├── agents/develop-expert.md  ← Subagent 模式下加载
  ├── agents/contract-validator.md   ← 验证步骤完整性
  └── ...共 20 个 agent（含 legacy Research agent）
```

**v3.2.0 优化效果**：

| 指标 | v3.1.0 | v3.2.0 | 变化 |
|------|---------|---------|------|
| Router 体积 | ~49KB | **~23KB** | **-53%** |
| References 文件数 | 4 个 | **10 个** | +6 个 |
| 始终加载内容 | ~49KB | **~23KB** | **-53%** |
| 代码生成可用上下文 | ~50% | **~70%** | **+20%** |

### 统一 Subagent 执行架构

```
用户 ←→ 主 Agent（纯调度枢纽，零编辑）
              ├── research（pre-scanner + 13 文件子代理，5 批次）
              ├── analyze-expert     → 分析需求，输出需求分析文档
              ├── design-expert      → 详细设计，输出设计文档
              ├── task-split-expert  → 任务拆分，输出任务清单（DAG）
              ├── develop-expert     → 代码开发（可并行多个）
              ├── test-expert        → 单元测试，输出测试报告
              ├── smoke-test-expert  → 冒烟测试，输出冒烟测试报告
              ├── e2e-test-expert    → 端到端测试，输出测试报告
              ├── integration-test-expert → 集成测试，输出测试报告
              ├── fix-expert         → Bug 修复，输出修复代码
              └── delivery-expert    → 生成交付报告
```

**所有阶段均由专业 subagent 执行，主 Agent 作为纯调度器**，不存在"标准模式直接执行"的路径。

### 跨平台调度策略

| 平台 | Subagent 支持 | 并行能力 | 调度策略 |
|------|--------------|---------|---------|
| **Trae** | `/agent-name` 斜杠命令 | 原生并行 | 完整并行模式 |
| **Cursor** | `.cursor/agents/*.md` YAML frontmatter | 多 Task 调用并行 | Cursor 并行模式 |
| **Claude Code** | Dynamic Workflows JS 编排 | 16 并发 | Claude 并行模式 |
| **Qoder** | Quest Mode 主从架构 | 方向并行 | Qoder 主从并行模式 |
| **Codex** | `.codex/agents/*.toml` | 6 线程 | Codex 有限并行模式 |

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
│   │   ├── SKILL.md       # Router（~23KB 骨架文件）
│   │   ├── stages/        # 13 个阶段指令文件（按需加载）
│   │   ├── agents/        # 20 个 agent 定义（全平台共享，含 legacy Research agent）
│   │   └── references/    # 10 个参考文档（按需加载）
│   │       ├── zero-edit-audit.md         # 零编辑审计规范（v3.2.0 新增）
│   │       ├── failure-decision-tree.md    # 失败决策树（v3.2.0 新增）
│   │       ├── deliverable-protocol.md     # 交付物协议（v3.2.0 新增）
│   │       ├── gate-checks.md             # 门禁检查详情（v3.2.0 新增）
│   │       ├── mode-comparison.md         # 模式对比速查表（v3.2.0 新增）
│   │       ├── platform-adapters.md        # 平台适配规则（v3.2.0 新增）
│   │       ├── memory-system.md           # 记忆系统（v2.0.0）
│   │       ├── learning-system.md          # 学习系统（v2.0.0）
│   │       ├── error-pattern-db.md        # 错误模式库（v2.0.0）
│   │       └── model-context-config.md    # 模型上下文配置（v2.0.0）
│   ├── _platforms/         # 平台特有文件
│   │   ├── trae/agents/   # Trae 专有 agent 扩展
│   │   └── codex/         # Codex 格式适配指南
│   ├── trae/              # Trae 构建输出
│   ├── cursor/            # Cursor 构建输出
│   ├── qoder/             # Qoder 构建输出
│   ├── claude/            # Claude Code 构建输出
│   └── codex/             # OpenAI Codex 构建输出
├── scripts/
│   ├── build.cjs          # 构建脚本（模板组装 + 路径替换 + 校验 + references）
│   ├── dispatch.cjs       # 平台调度引擎（DAG 解析 + 拓扑排序 + 冲突检测）
│   ├── prepare-context.cjs # Subagent 上下文自动注入脚本
│   ├── segment-code.cjs   # 结构化代码分段生成脚本
│   ├── validate-result.cjs # Subagent 产出自动校验脚本
│   ├── install.js         # 安装脚本（零依赖，含 references 和会话/长期记忆分类）
│   ├── version-check.js   # 版本号一致性检查 + --fix 自动修复
│   └── pre-publish.js     # 发布前完整检查
├── tests/                 # 测试套件
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
