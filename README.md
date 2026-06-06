# dev-flow

[![node](https://img.shields.io/node/v/dev-flow.svg)](https://nodejs.org)
[![version](https://img.shields.io/badge/version-v3.3.0-blue)]()

> **当前版本: v3.3.0** | [更新日志](./CHANGELOG.md) | [用户手册](./USER_GUIDE.md)

AI 开发全流程编排 Skill，适用于 Cursor、Trae、Qoder、Claude Code、OpenAI Codex 等 AI 编程工具。

通过 `/dev-flow` 命令，AI 将按照结构化 **8 阶段流程** 逐步执行：**项目调研 → 需求分析 → 详细设计 → 任务拆分 → 代码开发 → 统一测试 → Bug 修复（按需）→ 交付**，每个阶段完成后暂停等待确认，确保产出质量。

**v3.3.0 核心架构**：主 Agent 纯调度枢纽（零编辑），所有文件操作由专门阶段 Subagent 执行。Research 阶段采用 **pre-scanner + 11 文件子代理 4 批次并行架构**，支持 **LANGUAGE-ONLY 按语言过滤** 减少上下文负载，**阶段历史压缩** 防止主 Agent 上下文溢出。

## 为什么需要 dev-flow？

AI 编程工具（Cursor/Trae/Qoder/Claude Code/Codex）虽然强大，但在处理复杂需求时容易：

- 跳过重要步骤（如先了解项目结构再写代码）
- 生成与项目风格不一致的代码
- 遗漏边界情况和错误处理
- 缺乏系统性的测试验证
- 不记住用户的偏好和项目的深层知识
- 大型项目上下文不足，跳过关键扫描步骤

dev-flow 通过**结构化的流程编排 + 项目记忆 + 长期记忆 + 学习能力 + 多 Subagent 并行 + 主 Agent 零编辑架构**解决这些问题，让 AI 编程工具**越用越好用**。

## 特性

### v3.3.0 上下文链优化

- **LANGUAGE-ONLY 按语言过滤** — build.cjs 支持 `--lang java` 参数，构建时按项目类型过滤多语言规范（develop-expert.md 节省 10.7KB，code-reference.md 节省 1.2KB）
- **阶段历史压缩** — 每阶段确认后自动压缩对话历史为结构化摘要（`stage-summary.yaml`），释放主 Agent 上下文空间
- **develop.md 二次瘦身** — 零编辑约束段精简为引用，转发段合并为表格，从 567 行 24.9KB 降至 493 行 22.7KB
- **PLATFORM-ONLY 标记** — YAML frontmatter + HTML 注释标记，构建时按平台过滤内容

### v3.2.0 架构精益化

- **公共协议层提取** — 新建 `references/protocol.md`（~320 行），消除 SKILL.md + 各阶段文件中的零编辑铁律、失败协议、交付物协议等 ~1500 行重复内容；SKILL.md 从 913 行降至 411 行（-55%）
- **Research 空操作消除** — 消除 Batch 5 的 mistakes/patterns 空 reader，子代理从 14 降至 12，批次从 5 降至 4
- **prepare-context.cjs 精确匹配** — `findDemandFile()` 从 `includes()` 模糊匹配升级为三级精确匹配（精确文件名 → 前缀+分隔符 → 词边界前缀）
- **统一 Test 阶段** — unit-test + smoke-test + e2e-test + integration-test 合并为统一 `test.md`，阶段数从 11 降至 **8 阶段**（Research → Analyze → Design → Task Split → Develop → Test → Fix(按需) → Delivery）
- **develop.md 职责分离** — 从 1308 行降至 516 行（-60%），重复执行规范改为引用 develop-expert.md，仅保留主 Agent 调度协议（D1-D9）
- **模式简化** — L0/L1/L2/L3 四级模式 → **标准模式（串行 Subagent）/ 企业级模式（并行 Subagent）** 两档
- **门禁合并** — Gate-1/1.5/2/2.5/3 五层 → **Gate-A（前置完整性）/ Gate-B（执行者审计）** 两层
- **audit.cjs 审计脚本** — 零编辑铁律 v2.0 可验证约束，扫描白名单、@generated-by 溯源注释、SHA-256 checksum
- **多语言 Design Contract 外置** — TS/Python/Go Contract 格式外置到 references，design.md 从 1245 行降至 879 行
- **结构化进度汇报** — develop.md 新增 `task-progress-{taskId}.yaml` 格式定义 + ASCII 进度看板
- **validate-result.cjs 多语言增强** — 新增 Java 注解/泛型、TS、Python、Go 空方法检测 + 日志替代检测

### v3.1.0 主 Agent 零编辑架构 + 业务代码优先铁律

- **主 Agent 零编辑铁律 v2.0** — 主 Agent 仅作为交互枢纽和纯调度器，绝不直接编辑任何文件。文件白名单 + @generated-by 溯源 + 每阶段文件修改审计
- **统一 Subagent 执行模型** — 所有阶段统一由 Subagent 执行（简单需求串行 / 复杂需求并行）
- **业务代码优先铁律** — P0 业务代码必须先于 P1 测试代码全部完成
- **阶段交付物审批** — 每个阶段产出独立交付物文档（`.dev-flow/deliverables/`），Gate 检查交付物存在性
- **Subagent 失败硬阻断** — 三级失败处理协议（L1 自动重试 → L2 诊断重试 → L3 人工升级）
- **Research 多子代理分批架构** — pre-scanner + 11 文件子代理 4 批次并行，上下文从 ~250KB 降至 ~25-40KB/subagent
- **零编辑铁律 v2.0** — 文件白名单 + @generated-by 溯源注释 + 文件修改审计

### v3.0.0 上下文注入革命 + 结构化分段生成

- **上下文自动注入** — `prepare-context.cjs`，Subagent 派发前自动收集上下文，生成 task-brief
- **50KB 硬约束移除** — 改为基于模型上下文窗口和任务需求动态计算
- **结构化代码分段生成** — `segment-code.cjs`，"骨架 + 逐方法填充"四阶段协议
- **自动产出校验** — `validate-result.cjs`，TODO/FIXME、空方法体、log-only、return null、Design Contract 签名一致性

### 核心特性

- **四层按需加载架构** — Router(17KB) + References(8 个) + 8 个阶段指令 + 20 个 Agent
- **8 阶段流程** — Research → Analyze → Design → Task Split → Develop → Test → Fix(按需) → Delivery
- **两档运行模式** — 标准模式（串行 Subagent）/ 企业级模式（并行 Subagent），动态重评估自动升级
- **两层门禁检查** — Gate-A（前置完整性：确认文件+交付物+内容校验）/ Gate-B（执行者审计：execution_trail+zero_edit_violation）
- **跨平台调度策略** — Trae 原生并行 / Cursor/Claude/Qoder 顺序模拟并行 / Codex 有限并行
- **智能任务拆分** — Design 输出全局契约，Task Split 生成子任务级设计 + DAG 依赖图 + 文件冲突检测
- **接口契约机制** — 跨子任务接口定义，契约冻结防止随意修改
- **设计→代码逻辑回溯验证** — Step 4.3 强制验证每个逻辑步骤都有代码实现，覆盖率 100%
- **合约一致性校验** — contract-validator R1-R5 规则（R5 逻辑步骤覆盖率 = critical 阻塞）
- **编译验证闭环** — 开发完成后强制编译验证，失败自动修复循环（最多 3 轮）
- **项目记忆** — 长期记忆（6 个文件，跨会话累积）+ 会话记忆（6 个文件，每次 Research 重建）
- **学习能力** — 从用户反馈、代码修改、测试 Bug 中自动学习
- **Design Contract 多语言** — 支持 Java / TypeScript / Python / Go 四种语言接口契约
- **全平台防护统一** — step-enforcer/contract-validator 等防护 agent 全平台共享
- **断点续传** — 长流程中断后可恢复
- **Context Manager 动态计算** — 三级监控 + 分段执行 + 串行兜底
- **代码完整性铁律** — 7 条正面规则 + 生产可用测试 + 完整性防线
- **多语言支持** — Java (Spring Boot/Cloud)、前端 (React/Vue)、Python、Go、Rust 等

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

也可以只安装特定工具：

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

执行：Research → Analyze → Design → **Task Split** → Develop → Test → Fix(按需) → Delivery

### 单阶段模式

```
/dev-flow -research          # 项目调研
/dev-flow -analyze <需求>    # 需求分析
/dev-flow -design <需求>     # 详细设计
/dev-flow -split <需求>      # 任务拆分（子任务级设计 + DAG）
/dev-flow -develop <需求>    # 直接开发（跳过设计和拆分，适合小需求）
/dev-flow -test              # 统一测试（单元+冒烟+E2E+集成）
/dev-flow -fix               # 分析并修复 Bug
/dev-flow -hotfix <错误信息>  # 紧急修复线上错误
```

### Subagent 模式

```
/dev-flow -subagent <需求描述>  # 并行 Subagent 调度（复杂任务）
```

**简单需求**（`/dev-flow <需求>`）→ 主 Agent 串行创建单个 Subagent。
**复杂需求**（`/dev-flow -subagent <需求>`）→ Orchestrator 按 DAG 批次并行调度多个 Subagent。

运行模式两档：
- **标准模式**（默认）：串行 Subagent，Task Split 后动态重评估是否升级
- **企业级模式**（`-subagent`）：并行 Subagent

### 记忆管理

```
/dev-flow -cleanup           # 清理会话记忆（保留长期记忆）
/dev-flow -cleanup --all     # 重置全部记忆
```

### 断点续传

```
/dev-flow --resume           # 从上次中断处继续
```

## 工作流程

```
Research → Analyze → Design → Task Split → Develop → Test → Fix(按需) → Delivery
  调研   →  分析  →  设计  →  任务拆分  →  开发  →  测试  →   修复    →  交付

Hotfix（独立模式，随时可用）
```

| 阶段 | AI 做什么 | 产出 |
|------|----------|------|
| **Research** | pre-scanner 全局索引 + 11 文件级 subagent 4 批次并行扫描，Smart Sampling 服务级独立，关键类强制全量读取，完整性 A/B/C/D 评级 | `.dev-flow/memory/` 13 个文件 + file-index.yaml + 阶段交付物 |
| **Analyze** | 解析需求、关联已有代码、识别歧义、一致性校验 | 需求分析文档 + 阶段交付物 |
| **Design** | 数据模型、API 接口、组件树、业务流程、结构化决策表 | `design-contract.yaml`（含多语言接口契约） |
| **Task Split** | 拆分子任务、冲突检测、DAG 构建、双维度选择、子任务级设计 | `task-dag.yaml` + `subtask-{id}-design.yaml` + `interface-registry.yaml` |
| **Develop** | develop-expert Subagent 按子任务开发、上下文自动注入、分段生成、业务代码优先、强制编译、逻辑回溯验证 | 代码文件 + 阶段交付物 |
| **Test** | 统一测试：单元测试 → 冒烟测试 → E2E 测试 → 集成测试 | 统一测试报告 |
| **Fix** | 分析失败原因、修复代码、回归测试（最多循环 3 次） | 修复后的代码（按需触发） |
| **Delivery** | 汇总全流程成果、生成交付清单 | 交付报告 |

## 架构

### 四层按需加载架构

```
第一层：Router（SKILL.md，~410 行，始终加载）
  ├── 命令解析 + 全局规则
  ├── 阶段路由表 + 主 Agent 调度流程
  ├── 记忆系统 + 学习能力快速引用
  └── 阶段确认机制（含历史压缩规则）

第二层：References（8 个按需加载参考文档）
  ├── protocol.md（零编辑铁律 + 失败协议 + 交付物 + 门禁 + 历史压缩）
  ├── memory-system.md / learning-system.md / error-pattern-db.md / model-context-config.md
  └── design-contract-typescript.md / design-contract-python.md / design-contract-go.md

第三层：阶段指令文件（进入阶段时加载，10 个文件）
  ├── research.md / analyze.md / design.md / task-split.md
  ├── develop.md（仅保留调度协议，执行规范引用 develop-expert.md）
  ├── test.md（统一测试：单元+冒烟+E2E+集成）
  └── fix.md / hotfix.md / delivery.md / code-reference.md

第四层：Agent 文件（Subagent 创建时加载，20 个）
  ├── develop-expert.md（支持 LANGUAGE-ONLY 语言过滤）
  ├── analyze-expert / design-expert / task-split-expert
  ├── contract-validator / verify-expert / step-enforcer
  └── ...共 20 个（含 5 个 legacy Research agent）
```

### Subagent 执行架构（统一模型）

```
用户 ←→ 主 Agent（纯调度枢纽，零编辑）
              │
              ├── [Research: pre-scanner + 11 file-level subagents, 4 batches]
              │     Phase 0: pre-scanner × 1          → file-index.yaml
              │     Phase 1: Batch 1 (基础层, 3并行) → project-overview / service-registry / architecture
              │              Batch 2 (数据层, 3并行) → common-modules / models / config
              │              Batch 3 (行为层, 3并行) → apis / utils / conventions
              │              Batch 4 (横切层, 2并行) → dependency-graph / decisions
              ├── analyze-expert     → 需求分析
              ├── design-expert      → 详细设计
              ├── task-split-expert  → 任务拆分 + DAG
              ├── develop-expert     → 代码开发（可并行多个）
              ├── test-expert        → 统一测试
              ├── fix-expert         → Bug 修复
              ├── delivery-expert    → 交付报告
              └── contract-validator → 契约校验 + 逻辑覆盖率验证（R5）
```

### 跨平台调度策略

| 平台 | Subagent 支持 | 并行能力 | Research 调度 | References |
|------|--------------|---------|---------------|------------|
| **Trae** | `/agent-name` 斜杠命令 | 原生并行 | 12 并行 | ✅ |
| **Cursor** | Task 工具 | 多 Task 并行 | 12 并行 | ✅ |
| **Claude Code** | 子 agent | 原生并行 | 12 并行 | ✅ |
| **Qoder** | 顺序 | 单会话串行 | 4 批次 | ✅ |
| **Codex** | `AGENTS.md` agents | 有限并行 | 2 批次合并 | ✅ |

## 项目结构

```
dev-flow/
├── skill-templates/          # Skill 文件模板
│   ├── _core/                # 核心模板源（所有平台公共基础）
│   │   ├── SKILL.md          # Router（~410 行，始终加载）
│   │   ├── stages/           # 10 个阶段指令文件（按需加载）
│   │   │   ├── research.md / analyze.md / design.md / task-split.md
│   │   │   ├── develop.md（主 Agent 调度协议）
│   │   │   ├── test.md（统一测试：单元+冒烟+E2E+集成）
│   │   │   └── fix.md / hotfix.md / delivery.md / code-reference.md
│   │   ├── agents/           # 20 个 Agent 定义（含 5 个 legacy Research agent）
│   │   │   ├── develop-expert.md（含 LANGUAGE-ONLY 多语言规范）
│   │   │   └── ...
│   │   └── references/       # 8 个按需参考文档
│   │       ├── protocol.md（零编辑铁律 + 失败协议 + 历史压缩 + 门禁 + 交付物）
│   │       ├── memory-system.md / learning-system.md
│   │       ├── error-pattern-db.md / model-context-config.md
│   │       └── design-contract-typescript.md / design-contract-python.md / design-contract-go.md
│   ├── _platforms/           # 平台特有文件
│   └── trae/ cursor/ qoder/ claude/ codex/  # 各平台构建输出
├── scripts/
│   ├── build.cjs             # 构建脚本（路径替换 + PLATFORM-ONLY + LANGUAGE-ONLY）
│   ├── dispatch.cjs          # 平台调度引擎
│   ├── prepare-context.cjs   # Subagent 上下文自动注入（精确匹配）
│   ├── segment-code.cjs      # 结构化代码分段生成
│   ├── validate-result.cjs   # Subagent 产出自动校验（多语言增强）
│   ├── validate-contract.cjs # Design Contract 校验
│   ├── audit.cjs             # 文件修改审计（零编辑铁律 + checksum）
│   ├── install.js            # 安装脚本
│   ├── version-check.js      # 版本号一致性检查
│   └── pre-publish.js        # 发布前检查
├── tests/                    # 测试套件
│   ├── build.test.js / links.test.js / size-warning.test.js / format.test.js
│   └── run-all.js
├── USER_GUIDE.md             # 用户操作手册
├── CHANGELOG.md
├── RELEASE.md
├── LICENSE
└── package.json
```

## 构建与开发

```bash
npm run build                 # 构建所有平台（包含全部语言）
npm run build -- --lang java  # 构建并仅保留 Java 语言内容
npm run verify                # 构建验证
npm test                      # 运行全部测试
npm run test:version          # 版本号一致性检查
```

## 支持的工具

| 工具 | 触发方式 | Subagent 调度 | References |
|------|---------|-------------|------------|
| Cursor | `/dev-flow` | 多 Task 并行 | ✅ |
| Trae | `/dev-flow` | 原生并行 | ✅ |
| Qoder | `/dev-flow` | 顺序模拟并行 | ✅ |
| Claude Code | `/dev-flow` | 原生并行 | ✅ |
| OpenAI Codex | 自然语言 / `$dev-flow` | 有限并行 | ✅ |

## License

[MIT](./LICENSE)
