# dev-flow

![node](https://img.shields.io/node/v/dev-flow.svg)

![version](https://img.shields.io/badge/version-v4.0.0-blue)

> **当前版本：v4.0.0** | [用户指南](./USER_GUIDE.md)

为 Cursor、Trae、Qoder、Claude Code、OpenAI Codex 等 AI 编程工具打造的开发流程编排 Skill。

通过 `/dev-flow` 命令，AI 会按照结构化的 **9 阶段工作流**执行：**Research → Clarify → Analyze → Design → Task Split → Develop → Test → Fix（按需）→ Delivery**，每个阶段完成后暂停确认，确保输出质量。

---

## 为什么需要 dev-flow？

AI 编程工具（Cursor/Trae/Qoder/Claude Code/Codex）很强大，但在处理复杂需求时往往会出现以下问题：

- 跳过重要步骤（比如在写代码前不先理解项目结构）
- 生成的代码与项目风格不一致
- 遗漏边界情况和错误处理
- 缺乏系统化的测试验证
- 不记住用户偏好和项目深层知识
- 大型项目上下文不足，跳过关键扫描步骤
- 需求文档不精确不完整，导致返工

dev-flow 通过**结构化流程编排 + 需求澄清迭代问答 + 项目记忆 + 长期记忆 + 学习能力 + 多子代理并行 + 主 Agent 零编辑架构 + 五层防御体系**来解决这些问题，让 AI 编程工具**越用越好用**。

---

## 核心特性

### 核心架构

- **四层按需加载架构** — Router（~10KB）+ References（11 个文件）+ 11 个阶段指令 + 25 个 Agent
- **9 阶段工作流** — Research → Clarify → Analyze → Design → Task Split → Develop → Test → Fix（按需）→ Delivery
- **两种运行模式** — 标准模式（串行子代理）/ 企业级模式（并行子代理），支持动态重评估与自动升级
- **两层门禁检查** — Gate-A（前置完整性：确认文件 + 交付物 + 内容校验）/ Gate-B（执行者审计：execution_trail + zero_edit_violation）
- **跨平台调度策略** — Trae / Cursor / Claude Code / Qoder 均支持并行调度 / Codex 有限并行

### 五层防御体系（v4.0.0 新增）

- **L1 上下文预算硬约束** — 动态预算计算（`prepare-context.cjs` 集成 `dynamic-budget.cjs`），支持 8+ 模型（Claude/GPT-4 等），`task-brief` 严格预算控制
- **L2 分段生成事务化** — Checkpoint 系统（`checkpoint-manager.cjs`），代码生成状态快照，支持失败回滚；方法依赖图拓扑排序（`method-dependency-graph.cjs`）确定最优填充顺序
- **L3 主 Agent 上下文隔离** — 完整性门控（`completeness-gate.cjs`），3 项检查（截断/缺失/契约）在 subagent 派发前硬阻断；阶段历史压缩释放主 Agent 上下文空间
- **L4 冗余验证链** — 静态验证套件（`static-validation-suite.cjs`），6 项 Layer 1 机器自动验证（语法、TODO、空方法、签名匹配）；独立验证工作进程（`validation-worker.cjs`），验证解耦主 Agent 只读摘要；R5 逻辑覆盖率自动化（`logic-coverage-auto.cjs`）
- **L5 故障自动恢复** — 降级策略矩阵（`degradation-matrix.md`），5 种故障场景 × 4 级降级策略；部分交付报告（`partial-delivery.cjs`）；编译循环管理（`compile-loop-manager.cjs`）
- **功能开关管理** — 11 个优化功能的独立开关配置（`feature-flag-manager.cjs` + `feature-flags.yaml`）

### 前后端分离架构（v3.7.0 新增）

- **Research 前后端分离扫描** — 自动识别项目类型（纯前端 / 纯后端 / 全栈），按需启动前端扫描组（9 子代理，3 批次）和/或后端扫描组（11 子代理，4 批次）
- **Develop 前后端分离开发** — `backend-develop-expert` + `frontend-develop-expert` 双专家域路由调度，前后端可并行开发
- **Task Split 域标签** — 每个任务自动标记 `domain: frontend | backend`，按文件扩展名和目录智能判定
- **全栈项目原生支持** — 纯后端 / 纯前端 / 全栈三种场景自动适配，纯后端项目零削弱

### 需求澄清（v3.6.0 新增）

- **迭代问答循环** — Clarify 阶段结合项目代码对需求文档进行多轮迭代问答，自动收敛直到无新问题
- **项目技术关联提问** — 10 个维度分析（Entity 复用、Service 复用、API 冲突、枚举复用、跨服务调用、公共模块变更、中间件依赖、数据权限、状态机、前端组件复用）
- **自动收敛机制** — 0 新问题即停止，最多 10 轮，防止无限循环
- **独立使用** — 产品经理可单独使用 `/dev-flow -clarify` 完善需求文档，不一定要走开发全流程
- **可选阶段** — Clarify 可跳过，跳过后 Analyze 完整执行所有步骤，不削弱任何现有能力

### 流程能力

- **智能任务拆分** — Design 输出全局契约，Task Split 生成子任务级设计 + DAG 依赖图 + 文件冲突检测
- **接口契约机制** — 跨子任务接口定义，契约冻结防止任意修改
- **设计→代码逻辑回溯验证** — Step 4.3 强制验证每个逻辑步骤都有代码实现，100% 覆盖
- **契约一致性校验** — contract-validator R1-R5 规则（R5 逻辑步骤覆盖率为阻塞级）
- **编译验证循环** — 开发完成后强制编译验证，自动修复循环（最多 3 轮）

### 记忆与学习

- **项目记忆** — 长期记忆（6 个文件，跨会话累积）+ 会话记忆（6 个文件，每次 Research 重建）
- **学习能力** — 自动从用户反馈、代码修改、测试 Bug 中学习
- **多语言设计契约** — 支持 Java / TypeScript / Python / Go 接口契约
- **跨平台统一防护** — step-enforcer/contract-validator 等防护 Agent 全平台共享
- **Session 隔离** — 基于需求简称的目录隔离，支持连续多个需求不覆盖文件

### 代码质量

- **主 Agent 零编辑铁律 v2.0** — 主 Agent 仅是交互枢纽和纯调度器，绝不直接编辑任何文件。文件白名单 + @generated-by 溯源 + 每阶段文件修改审计
- **业务代码优先铁律** — P0 业务代码必须先完成，P1 测试代码仅是验证手段
- **结构化代码分段生成** — `segment-code.cjs`，"骨架 + 逐方法填充" 四阶段协议
- **自动产出校验** — `validate-result.cjs`，TODO/FIXME、空方法体、仅日志、return null、设计契约签名一致性
- **上下文自动注入** — `prepare-context.cjs`，子代理派发前自动收集上下文，生成 task-brief
- **阶段历史压缩** — 每阶段确认后自动将对话历史压缩为结构化摘要（`stage-summary.yaml`），释放主 Agent 上下文空间
- **LANGUAGE-ONLY 语言过滤** — build.cjs 支持 `--lang java` 参数，构建时按项目类型过滤多语言规范，减少子代理上下文负担

---

## 安装

```bash
# 1. 安装到项目
npm install Jane-Split/dev-flow#release_4.0.0 --save-dev

# 2. 执行安装（生成 Skill 文件和记忆目录）
npx dev-flow install
```

安装后，项目中会自动生成以下文件：

| 工具 | 生成文件 | 触发方式 |
| --- | --- | --- |
| Trae | `.trae/skills/dev-flow/SKILL.md` + `stages/*.md` + `agents/*.md` + `references/*.md` | 输入框输入 `/dev-flow` |
| Cursor | `.cursor/commands/dev-flow.md` + `stages/*.md` + `agents/*.md` + `references/*.md` | 输入框输入 `/dev-flow` |
| Qoder | `.qoder/commands/dev-flow.md` + `stages/*.md` + `agents/*.md` + `references/*.md` | 输入框输入 `/dev-flow` |
| Claude Code | `.claude/commands/dev-flow.md` + `stages/*.md` + `agents/*.md` + `references/*.md` | 输入框输入 `/dev-flow` |
| OpenAI Codex | `AGENTS.md` + `.agents/skills/dev-flow/SKILL.md` + `.codex/agents/*.toml` + `.codex/references/*.md` | 终端输入 `codex` 后使用自然语言或 `$dev-flow` |

也可以只为特定工具安装：

```bash
npx dev-flow trae      # 仅安装到 Trae
npx dev-flow cursor    # 仅安装到 Cursor
npx dev-flow qoder     # 仅安装到 Qoder
npx dev-flow claude    # 仅安装到 Claude Code
npx dev-flow codex     # 仅安装到 OpenAI Codex
```

---

## 快速开始

```bash
# 1. 进入你的项目
cd your-project

# 2. 安装 dev-flow
npm install Jane-Split/dev-flow#release_4.0.0 --save-dev

# 3. 安装到指定工具（以 Cursor 为例）
npx dev-flow cursor

# 4. 在 Cursor / Trae / Qoder / Claude Code 中输入：
/dev-flow 实现用户登录功能，包含表单验证和记住密码
```

AI 会逐步执行，每个阶段完成后暂停等待你的确认。

---

## 使用方式

### 两种完整流程模式

dev-flow 提供两种完整流程模式，覆盖从需求到交付的全链路。选择哪种模式取决于需求规模和复杂度。

#### 模式一：标准模式（默认，适合大多数场景）

```text
/dev-flow <需求描述>
```

**执行流程**：Research → Clarify → Analyze → Design → Task Split → [动态重评估] → Develop（串行）→ Test → Fix（按需）→ Delivery

**Develop 阶段执行方式**：
```text
Subtask 1 → Subtask 2 → Subtask 3 → ... → Subtask N
（逐个串行执行，一个完成后再开始下一个）
```

**适用场景**：
- 初次使用 dev-flow，想逐步体验完整流程
- 中小型需求（预计修改 < 20 个文件、单模块）
- 需求较明确，逻辑链路短
- 不确定该用哪种模式时（Task Split 后会自动评估是否建议升级）

**特点**：
- 上下文占用低，一次只加载一个子代理
- 即时发现、即时修复问题
- Task Split 后满足条件可自动升级为并行调度

---

#### 模式二：企业级模式（并行调度，适合大型需求）

```text
/dev-flow -subagent <需求描述>
```

**执行流程**：Research → Clarify → Analyze → Design → Task Split → [DAG 批次并行] → Develop（并行）→ Test → Fix（按需）→ Delivery

**Develop 阶段执行方式**：
```text
Batch 1（并行）: Subtask A + Subtask B + Subtask C  同时执行
       ↓
Batch 2（并行）: Subtask D + Subtask E              同时执行（依赖 Batch 1）
       ↓
Batch 3（串行）: Subtask F                          单独执行（依赖 Batch 2，且有写写冲突）
```

**适用场景**：
- 大型需求（预计修改 ≥ 20 个文件、多服务/多模块）
- 需求涉及多个独立模块，天然可并行
- 对交付速度有较高要求
- 团队已熟悉 dev-flow 流程

**特点**：
- 同批次多个子代理同时执行，大幅缩短总耗时
- 同级子代理失败互不影响，其他任务继续执行
- 上下文占用较高（同时加载多个子代理上下文）

---

### 两种模式对比速查

| 维度 | **标准模式** `/dev-flow` | **企业级模式** `/dev-flow -subagent` |
| --- | --- | --- |
| **触发命令** | `/dev-flow <需求描述>` | `/dev-flow -subagent <需求描述>` |
| **调度方式** | 串行：逐个创建子代理 | 并行：按 DAG 依赖图批次执行 |
| **适用规模** | 中小型（< 20 文件、单模块） | 大型（≥ 20 文件、多服务/多模块） |
| **Develop 执行** | Subtask 1 → 2 → 3 → ... → N | Batch 1 并行 → Batch 2 并行 → ... |
| **并行能力** | 无并行（但可自动升级） | 完全并行 |
| **上下文占用** | 低 | 中-高 |
| **失败处理** | 即时发现、即时修复 | 同级独立失败，不影响其他任务 |
| **推荐使用** | 初次使用、不确定时 | 大型需求、追求速度时 |

> **核心原则**：无论哪种模式，主 Agent 始终是纯调度枢纽，绝不直接编辑任何文件。所有文件操作均由专业阶段子代理执行。

### 单阶段模式

| 命令 | 说明 | 适用场景 |
| --- | --- | --- |
| `/dev-flow -research` | 仅执行 Research 阶段 | 第一次使用 dev-flow，或项目结构有重大变化 |
| `/dev-flow -clarify <需求>` | 仅执行 Clarify 阶段（迭代问答） | 产品经理想完善需求文档，或开发前想澄清需求 |
| `/dev-flow -clarify @requirement.md` | 从文件读取需求并澄清 | 需求文档已写好，需要结合项目分析确认项 |
| `/dev-flow -analyze <需求>` | 仅执行 Analyze 阶段 | 需要先理解需求范围 |
| `/dev-flow -design <需求>` | 仅执行 Design 阶段 | 需要在开发前评审设计 |
| `/dev-flow -split <需求>` | 仅执行 Task Split 阶段（方案 C） | 需要将设计拆分为可并行子任务 |
| `/dev-flow -develop <需求>` | 直接开发（跳过设计和拆分） | 小型需求，无需详细设计 |
| `/dev-flow -test` | 统一测试（单元+冒烟+E2E+集成） | 已有代码，需要完整测试验证 |
| `/dev-flow -fix` | 分析并修复 Bug | 测试失败，需要修复 |
| `/dev-flow -hotfix <错误信息>` | 生产环境错误紧急热修复 | 生产报错，需要快速修复 |
| `/dev-flow -subagent <需求>` | 企业级并行子代理模式 | 复杂任务，涉及多服务/多模块 |

### Session 隔离

```text
/dev-flow <需求描述>   # 第一个需求
/dev-flow <另一个需求>   # 第二个需求 —— 文件自动隔离
```

每个需求的交付物和契约分别存放在独立的 `{需求简称}` 目录下，防止文件覆盖，支持完整追溯。

### 记忆管理

| 命令 | 说明 |
| --- | --- |
| `/dev-flow -cleanup` | 清理会话记忆（`session/` 目录），保留长期记忆 |
| `/dev-flow -cleanup --all` | 重置所有记忆文件（谨慎使用） |

### 断点续传

| 命令 | 说明 |
| --- | --- |
| `/dev-flow --resume` | 从上次中断处继续 |

---

## 工作流程

```text
Research → Clarify → Analyze → Design → Task Split → Develop → Test → Fix（按需）→ Delivery

Hotfix（独立模式，随时可用）
```

| 阶段 | AI 做什么 | 产出 |
| --- | --- | --- |
| **Research** | pre-scanner 全局索引 + 前后端存在性检测 + 后端 11 子代理 4 批次 + 前端 9 子代理 3 批次，Smart Sampling 服务级独立，关键类强制全量读取，完整性 A/B/C/D 评级 | `.dev-flow/memory/` 13+ 文件 + `memory/_index/file-index.yaml` + 阶段交付物 |
| **Clarify** | 解析需求文档，结合项目代码迭代问答，10 维度技术关联分析，自动收敛 | `clarification-result.yaml` + `02-clarification-report.md` |
| **Analyze** | 解析需求，关联已有代码，识别歧义，一致性校验，生成 PRD 契约 | PRD 文档 + `prd-contract.yaml` + `test-case-contract.yaml` + `runtime-contract.yaml` |
| **Design** | 数据模型、API 接口、组件树、业务流程、结构化决策表 | `design-result.md` + `design-contract.yaml`（含多语言接口契约） |
| **Task Split** | 拆分为子任务，域标签标记，冲突检测，DAG 构建，双维度选择，子任务级设计 | `task-breakdown.yaml` + `subtask-{id}-design.yaml` + `interface-registry.yaml` |
| **Develop** | backend-develop-expert + frontend-develop-expert 域路由调度，上下文自动注入，分段生成，业务代码优先，强制编译，逻辑回溯验证 | 代码文件 + 阶段交付物 |
| **Test** | 统一测试：单元测试 → 冒烟测试 → E2E 测试 → 集成测试 | 统一测试报告 |
| **Fix** | 分析失败原因，修复代码，回归测试（最多 3 轮循环） | `fix-report.md` + 修复后的代码（按需触发） |
| **Delivery** | 总结全流程结果，生成交付检查清单 | 交付报告 |

---

## 架构

### 四层按需加载架构

```text
Layer 1: Router（SKILL.md，~520 行，始终加载）
  ├── 命令解析 + 全局规则
  ├── 阶段路由表 + 主 Agent 调度流程
  ├── 记忆系统 + 学习能力快速参考
  └── 阶段确认机制（含历史压缩规则）

Layer 2: References（11 个按需加载的参考文档）
  ├── protocol.md（零编辑铁律 + 失败协议 + 交付物 + 门禁 + 历史压缩）
  ├── memory-system.md / learning-system.md / error-pattern-db.md / model-context-config.md
  ├── design-contract-typescript.md / design-contract-python.md / design-contract-go.md
  ├── runtime-protocol.md（运行时验证协议：服务编排、DB 核对、UI 验证、追溯矩阵）
  └── degradation-matrix.md（5 种故障场景 × 4 级降级策略，v4.0.0 新增）
  └── on-demand-loader.md（按需加载优化策略，v4.0.0 新增）

Layer 3: 阶段指令文件（进入阶段时加载，11 个文件）
  ├── research.md / clarify.md / analyze.md / design.md / task-split.md
  ├── develop.md（仅保留调度协议，执行规范引用 develop-expert.md）
  ├── test.md（统一测试：单元+冒烟+E2E+集成）
  └── fix.md / hotfix.md / delivery.md / code-reference.md

Layer 4: Agent 文件（创建子代理时加载，25 个文件）
  ├── clarify-expert.md（需求澄清，迭代问答消除歧义）
  ├── backend-develop-expert.md（后端开发专家，支持 LANGUAGE-ONLY 多语言规范过滤）
  ├── frontend-develop-expert.md（前端开发专家，v3.7.0 新增）
  ├── analyze-expert / design-expert / task-split-expert
  ├── contract-validator / verify-expert / step-enforcer
  └── ...共 25 个（含 5 个遗留 Research Agent + 3 个新增验证 Agent）

### 可靠性组件架构（v4.0.0 新增）

```text
五层防御体系
├── L1 上下文预算硬约束
│   └── prepare-context.cjs → dynamic-budget.cjs → task-brief（预算硬约束）
├── L2 分段生成事务化
│   ├── checkpoint-manager.cjs（代码生成状态快照 + 失败回滚）
│   └── method-dependency-graph.cjs（方法依赖图拓扑排序，最优填充顺序）
├── L3 主 Agent 上下文隔离
│   ├── completeness-gate.cjs（3 项检查：截断/缺失/契约，subagent 派发前硬阻断）
│   └── stage-summary.yaml（阶段历史压缩，释放主 Agent 上下文空间）
├── L4 冗余验证链
│   ├── static-validation-suite.cjs（6 项 Layer 1 机器自动验证：语法、TODO、空方法、签名匹配）
│   ├── validation-worker.cjs（独立验证工作进程，解耦主 Agent 只读摘要）
│   └── logic-coverage-auto.cjs（R5 逻辑覆盖率自动化）
└── L5 故障自动恢复
    ├── degradation-matrix.md（5 种故障场景 × 4 级降级策略）
    ├── partial-delivery.cjs（部分交付报告）
    └── compile-loop-manager.cjs（编译循环管理）

功能开关管理
└── feature-flag-manager.cjs + .dev-flow/feature-flags.yaml（11 个优化功能独立开关）
```

### 子代理执行架构（统一模型）

```text
用户 ←→ 主 Agent（纯调度枢纽，零编辑）
              │
              ├── [Research: pre-scanner + 前后端分离扫描]
              │     Phase 0: pre-scanner × 1          → file-index.yaml
              │     Phase 0.5: 前后端存在性检测        → project-domains.yaml
              │     后端扫描组 (11 子代理, 4 批次)
              │     ├── Batch 1（基础层，3 并行）→ project-overview / service-registry / architecture
              │     ├── Batch 2（数据层，3 并行）→ common-modules / models / config
              │     ├── Batch 3（行为层，3 并行）→ apis / utils / conventions
              │     └── Batch 4（横切层，2 并行）→ dependency-graph / decisions
              │     前端扫描组 (9 子代理, 3 批次)
              │     ├── Batch 1（基础层，3 并行）→ frontend-overview / frontend-structure / frontend-architecture
              │     ├── Batch 2（组件层，3 并行）→ components / routes-and-state / frontend-config
              │     └── Batch 3（行为层，3 并行）→ frontend-apis / frontend-utils / frontend-conventions
              ├── clarify-expert     → 需求澄清，迭代问答消除歧义
              ├── analyze-expert     → 需求分析
              ├── design-expert      → 详细设计
              ├── task-split-expert  → 任务拆分 + DAG + 域标签
              ├── backend-develop-expert  → 后端代码开发（可并行多个）
              ├── frontend-develop-expert → 前端代码开发（可并行多个）
              ├── test-expert        → 统一测试
              ├── fix-expert         → Bug 修复
              ├── delivery-expert    → 交付报告
              └── contract-validator → 契约校验 + 逻辑覆盖率验证（R5）
```

### 跨平台调度策略

| 平台 | 子代理支持 | 并行能力 | Research 调度 | References 支持 |
| --- | --- | --- | --- | --- |
| **Trae** | `/agent-name` 斜杠命令 | 并行调度 | 12 并行 | ✅ |
| **Cursor** | Task 工具 | 并行调度 | 12 并行 | ✅ |
| **Claude Code** | Sub agent | 并行调度 | 12 并行 | ✅ |
| **Qoder** | 并行调度 | 并行调度 | 4 批次 | ✅ |
| **Codex** | `AGENTS.md` Agent | 有限并行 | 2 批次合并 | ✅ |

---

## 项目结构

```text
dev-flow/
├── skill-templates/          # Skill 文件模板
│   ├── _core/                # 核心模板源（所有平台共用基础）
│   │   ├── SKILL.md          # Router（~520 行，始终加载）
│   │   ├── stages/           # 11 个阶段指令文件（按需加载）
│   │   │   ├── research.md / clarify.md / analyze.md / design.md / task-split.md
│   │   │   ├── develop.md（主 Agent 调度协议 + 域路由）
│   │   │   ├── test.md（统一测试：单元+冒烟+E2E+集成）
│   │   │   └── fix.md / hotfix.md / delivery.md / code-reference.md
│   │   ├── agents/           # 25 个 Agent 定义
│   │   │   ├── backend-develop-expert.md（后端开发专家）
│   │   │   ├── frontend-develop-expert.md（前端开发专家，v3.7.0 新增）
│   │   │   ├── clarify-expert.md（需求澄清，迭代问答）
│   │   │   └── ...
│   │   └── references/       # 11 个按需参考文档
│   │       ├── protocol.md（零编辑铁律 + 失败协议 + 历史压缩 + 门禁 + 交付物）
│   │       ├── memory-system.md / learning-system.md
│   │       ├── error-pattern-db.md / model-context-config.md
│   │       ├── design-contract-typescript.md / design-contract-python.md / design-contract-go.md
│   │       ├── runtime-protocol.md（运行时验证协议）
│   │       ├── degradation-matrix.md（降级策略矩阵，v4.0.0 新增）
│   │       └── on-demand-loader.md（按需加载优化策略，v4.0.0 新增）
│   ├── _platforms/           # 平台特定文件
│   └── trae/ cursor/ qoder/ claude/ codex/  # 各平台构建输出
├── scripts/
│   ├── build.cjs                     # 构建脚本（路径替换 + PLATFORM-ONLY + LANGUAGE-ONLY）
│   ├── dispatch.cjs                  # 平台调度引擎
│   ├── prepare-context.cjs           # 子代理上下文自动注入（精确匹配）
│   ├── dynamic-budget.cjs            # 动态预算计算（L1，v4.0.0 新增）
│   ├── segment-code.cjs              # 结构化代码分段生成
│   ├── checkpoint-manager.cjs        # 代码生成状态快照与回滚（L2，v4.0.0 新增）
│   ├── method-dependency-graph.cjs   # 方法依赖图拓扑排序（L2，v4.0.0 新增）
│   ├── completeness-gate.cjs         # 完整性门控（L3，v4.0.0 新增）
│   ├── static-validation-suite.cjs   # 静态验证套件（L4，v4.0.0 新增）
│   ├── validation-worker.cjs         # 独立验证工作进程（L4，v4.0.0 新增）
│   ├── logic-coverage-auto.cjs       # R5 逻辑覆盖率自动化（L4，v4.0.0 新增）
│   ├── partial-delivery.cjs          # 部分交付报告（L5，v4.0.0 新增）
│   ├── compile-loop-manager.cjs      # 编译循环管理（L5，v4.0.0 新增）
│   ├── dependency-resolver.cjs       # 依赖解析器（v4.0.0 新增）
│   ├── feature-flag-manager.cjs      # 功能开关管理（v4.0.0 新增）
│   ├── validate-result.cjs           # 子代理产出自动校验（多语言增强）
│   ├── validate-contract.cjs         # 设计契约校验
│   ├── audit.cjs                     # 文件修改审计（零编辑铁律 + checksum）
│   ├── install.js                    # 安装脚本
│   ├── version-check.js              # 版本一致性检查
│   └── pre-publish.js                # 发布前检查
├── tests/                    # 测试套件
│   ├── build.test.js / links.test.js / size-warning.test.js / format.test.js
│   └── run-all.js
├── USER_GUIDE.md             # 用户操作手册
├── CHANGELOG.md
├── LICENSE
└── package.json
```

---

## 构建与开发

```bash
npm run build                 # 构建所有平台（包含全部语言）
npm run build -- --lang java  # 构建并仅保留 Java 语言内容
npm run verify                # 构建验证
npm test                      # 运行全部测试
npm run test:version          # 版本号一致性检查
```

---

## 支持的工具

| 工具 | 触发方式 | 子代理调度 | References 支持 |
| --- | --- | --- | --- |
| Cursor | `/dev-flow` | 多 Task 并行 | ✅ |
| Trae | `/dev-flow` | 原生并行 | ✅ |
| Qoder | `/dev-flow` | 并行调度 | ✅ |
| Claude Code | `/dev-flow` | 原生并行 | ✅ |
| OpenAI Codex | 自然语言 / `$dev-flow` | 有限并行 | ✅ |

---

## 许可证

[MIT](./LICENSE)
