# dev-flow

![node](https://img.shields.io/node/v/dev-flow.svg)
![version](https://img.shields.io/badge/version-v3.4.0-blue)

> **当前版本：v3.4.0** | [更新日志](./CHANGELOG.md) | [用户指南](./USER_GUIDE.md)

为 Cursor、Trae、Qoder、Claude Code、OpenAI Codex 等 AI 编程工具打造的开发流程编排 Skill。

通过 `/dev-flow` 命令，AI 会按照结构化的 **8 阶段工作流**执行：**Research → Analyze → Design → Task Split → Develop → Test → Fix（按需）→ Delivery**，每个阶段完成后暂停确认，确保输出质量。

---

## 为什么需要 dev-flow？

AI 编程工具（Cursor/Trae/Qoder/Claude Code/Codex）很强大，但在处理复杂需求时往往会出现以下问题：

- 跳过重要步骤（比如在写代码前不先理解项目结构）
- 生成的代码与项目风格不一致
- 遗漏边界情况和错误处理
- 缺乏系统化的测试验证
- 不记住用户偏好和项目深层知识
- 大型项目上下文不足，跳过关键扫描步骤

dev-flow 通过**结构化流程编排 + 项目记忆 + 长期记忆 + 学习能力 + 多子代理并行 + 主 Agent 零编辑架构**来解决这些问题，让 AI 编程工具**越用越好用**。

---

## 核心特性

### 核心架构

- **四层按需加载架构** — Router（~10KB）+ References（8 个文件）+ 8 个阶段指令 + 20 个 Agent
- **8 阶段工作流** — Research → Analyze → Design → Task Split → Develop → Test → Fix（按需）→ Delivery
- **两种运行模式** — 标准模式（串行子代理）/ 企业级模式（并行子代理），支持动态重评估与自动升级
- **两层门禁检查** — Gate-A（前置完整性：确认文件 + 交付物 + 内容校验）/ Gate-B（执行者审计：execution_trail + zero_edit_violation）
- **跨平台调度策略** — Trae 原生并行 / Cursor/Claude/Qoder 串行模拟 / Codex 有限并行

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
- **Session 隔离（v3.4.0）** — 基于需求简称的目录隔离，支持连续多个需求不覆盖文件

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
npm install dev-flow --save-dev

# 2. 执行安装（生成 Skill 文件和记忆目录）
npx dev-flow install
```

安装后，项目中会自动生成以下文件：

| 工具 | 生成文件 | 触发方式 |
|------|---------|---------|
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
npm install dev-flow --save-dev
npx dev-flow install

# 3. 在 Cursor / Trae / Qoder / Claude Code 中输入：
/dev-flow 实现用户登录功能，包含表单验证和记住密码
```

AI 会逐步执行，每个阶段完成后暂停等待你的确认。

---

## 使用方式

### 完整流程模式

```
/dev-flow <需求描述>
```

执行：Research → Analyze → Design → Task Split → Develop → Test → Fix（按需）→ Delivery

### 单阶段模式

| 命令 | 说明 | 适用场景 |
|------|------|---------|
| `/dev-flow -research` | 仅执行 Research 阶段 | 第一次使用 dev-flow，或项目结构有重大变化 |
| `/dev-flow -analyze <需求>` | 仅执行 Analyze 阶段 | 需要先理解需求范围 |
| `/dev-flow -design <需求>` | 仅执行 Design 阶段 | 需要在开发前评审设计 |
| `/dev-flow -split <需求>` | 仅执行 Task Split 阶段（方案 C） | 需要将设计拆分为可并行子任务 |
| `/dev-flow -develop <需求>` | 直接开发（跳过设计和拆分） | 小型需求，无需详细设计 |
| `/dev-flow -test` | 统一测试（单元+冒烟+E2E+集成） | 已有代码，需要完整测试验证 |
| `/dev-flow -fix` | 分析并修复 Bug | 测试失败，需要修复 |
| `/dev-flow -hotfix <错误信息>` | 生产环境错误紧急热修复 | 生产报错，需要快速修复 |
| `/dev-flow -subagent <需求>` | 企业级并行子代理模式 | 复杂任务，涉及多服务/多模块 |

### Session 隔离（v3.4.0）

```
/dev-flow <需求描述>   # 第一个需求
/dev-flow <另一个需求>   # 第二个需求 —— 文件自动隔离
```

每个需求的交付物和契约分别存放在独立的 `{需求简称}` 目录下，防止文件覆盖，支持完整追溯。

### 记忆管理

| 命令 | 说明 |
|------|------|
| `/dev-flow -cleanup` | 清理会话记忆（`session/` 目录），保留长期记忆 |
| `/dev-flow -cleanup --all` | 重置所有记忆文件（谨慎使用） |

### 断点续传

| 命令 | 说明 |
|------|------|
| `/dev-flow --resume` | 从上次中断处继续 |

---

## 工作流程

```
Research → Analyze → Design → Task Split → Develop → Test → Fix（按需）→ Delivery

Hotfix（独立模式，随时可用）
```

| 阶段 | AI 做什么 | 产出 |
|------|----------|------|
| **Research** | pre-scanner 全局索引 + 11 个文件级子代理分 4 批次，Smart Sampling 服务级独立，关键类强制全量读取，完整性 A/B/C/D 评级 | `.dev-flow/memory/` 13 个文件 + `memory/_index/file-index.yaml` + 阶段交付物 |
| **Analyze** | 解析需求，关联已有代码，识别歧义，一致性校验 | 需求分析文档 + 阶段交付物 |
| **Design** | 数据模型、API 接口、组件树、业务流程、结构化决策表 | `design-result.md` + `design-contract.yaml`（含多语言接口契约） |
| **Task Split** | 拆分为子任务，冲突检测，DAG 构建，双维度选择，子任务级设计 | `task-breakdown.yaml` + `subtask-{id}-design.yaml` + `interface-registry.yaml` |
| **Develop** | develop-expert 子代理按子任务开发，上下文自动注入，分段生成，业务代码优先，强制编译，逻辑回溯验证 | 代码文件 + 阶段交付物 |
| **Test** | 统一测试：单元测试 → 冒烟测试 → E2E 测试 → 集成测试 | 统一测试报告 |
| **Fix** | 分析失败原因，修复代码，回归测试（最多 3 轮循环） | `fix-report.md` + 修复后的代码（按需触发） |
| **Delivery** | 总结全流程结果，生成交付检查清单 | 交付报告 |

---

## 架构

### 四层按需加载架构

```
Layer 1: Router（SKILL.md，~410 行，始终加载）
  ├── 命令解析 + 全局规则
  ├── 阶段路由表 + 主 Agent 调度流程
  ├── 记忆系统 + 学习能力快速参考
  └── 阶段确认机制（含历史压缩规则）

Layer 2: References（8 个按需加载的参考文档）
  ├── protocol.md（零编辑铁律 + 失败协议 + 交付物 + 门禁 + 历史压缩）
  ├── memory-system.md / learning-system.md / error-pattern-db.md / model-context-config.md
  └── design-contract-typescript.md / design-contract-python.md / design-contract-go.md

Layer 3: 阶段指令文件（进入阶段时加载，10 个文件）
  ├── research.md / analyze.md / design.md / task-split.md
  ├── develop.md（仅保留调度协议，执行规范引用 develop-expert.md）
  ├── test.md（统一测试：单元+冒烟+E2E+集成）
  └── fix.md / hotfix.md / delivery.md / code-reference.md

Layer 4: Agent 文件（创建子代理时加载，20 个文件）
  ├── develop-expert.md（支持 LANGUAGE-ONLY 多语言规范过滤）
  ├── analyze-expert / design-expert / task-split-expert
  ├── contract-validator / verify-expert / step-enforcer
  └── ...共 20 个（含 5 个遗留 Research Agent）
```

### 子代理执行架构（统一模型）

```
用户 ←→ 主 Agent（纯调度枢纽，零编辑）
              │
              ├── [Research: pre-scanner + 11 个文件级子代理，4 批次]
              │     Phase 0: pre-scanner × 1          → file-index.yaml
              │     Phase 1: Batch 1（基础层，3 并行）→ project-overview / service-registry / architecture
              │              Batch 2（数据层，3 并行）→ common-modules / models / config
              │              Batch 3（行为层，3 并行）→ apis / utils / conventions
              │              Batch 4（横切层，2 并行）→ dependency-graph / decisions
              ├── analyze-expert      → 需求分析
              ├── design-expert       → 详细设计
              ├── task-split-expert   → 任务拆分 + DAG
              ├── develop-expert      → 代码开发（可并行多个）
              ├── test-expert         → 统一测试
              ├── fix-expert          → Bug 修复
              ├── delivery-expert     → 交付报告
              └── contract-validator  → 契约校验 + 逻辑覆盖率验证（R5）
```

### 跨平台调度策略

| 平台 | 子代理支持 | 并行能力 | Research 调度 | References 支持 |
|------|-----------|---------|--------------|-----------------|
| **Trae** | `/agent-name` 斜杠命令 | 原生并行 | 12 并行 | ✅ |
| **Cursor** | Task 工具 | 多 Task 并行 | 12 并行 | ✅ |
| **Claude Code** | Sub agent | 原生并行 | 12 并行 | ✅ |
| **Qoder** | 串行 | 单会话串行 | 4 批次 | ✅ |
| **Codex** | `AGENTS.md` Agent | 有限并行 | 2 批次合并 | ✅ |

---

## 项目结构

```
dev-flow/
├── skill-templates/          # Skill 文件模板
│   ├── _core/                # 核心模板源（所有平台共用基础）
│   │   ├── SKILL.md          # Router（~410 行，始终加载）
│   │   ├── stages/           # 10 个阶段指令文件（按需加载）
│   │   │   ├── research.md / analyze.md / design.md / task-split.md
│   │   │   ├── develop.md（主 Agent 调度协议）
│   │   │   ├── test.md（统一测试：单元+冒烟+E2E+集成）
│   │   │   └── fix.md / hotfix.md / delivery.md / code-reference.md
│   │   ├── agents/           # 20 个 Agent 定义（含 5 个遗留 Research Agent）
│   │   │   ├── develop-expert.md（含 LANGUAGE-ONLY 多语言规范）
│   │   │   └── ...
│   │   └── references/       # 8 个按需参考文档
│   │       ├── protocol.md（零编辑铁律 + 失败协议 + 历史压缩 + 门禁 + 交付物）
│   │       ├── memory-system.md / learning-system.md
│   │       ├── error-pattern-db.md / model-context-config.md
│   │       └── design-contract-typescript.md / design-contract-python.md / design-contract-go.md
│   ├── _platforms/           # 平台特定文件
│   └── trae/ cursor/ qoder/ claude/ codex/  # 各平台构建输出
├── scripts/
│   ├── build.cjs             # 构建脚本（路径替换 + PLATFORM-ONLY + LANGUAGE-ONLY）
│   ├── dispatch.cjs          # 平台调度引擎
│   ├── prepare-context.cjs   # 子代理上下文自动注入（精确匹配）
│   ├── segment-code.cjs      # 结构化代码分段生成
│   ├── validate-result.cjs   # 子代理产出自动校验（多语言增强）
│   ├── validate-contract.cjs # 设计契约校验
│   ├── audit.cjs             # 文件修改审计（零编辑铁律 + checksum）
│   ├── install.js            # 安装脚本
│   ├── version-check.js      # 版本一致性检查
│   └── pre-publish.js        # 发布前检查
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
|------|---------|-----------|-----------------|
| Cursor | `/dev-flow` | 多 Task 并行 | ✅ |
| Trae | `/dev-flow` | 原生并行 | ✅ |
| Qoder | `/dev-flow` | 串行模拟并行 | ✅ |
| Claude Code | `/dev-flow` | 原生并行 | ✅ |
| OpenAI Codex | 自然语言 / `$dev-flow` | 有限并行 | ✅ |

---

## 许可证

[MIT](./LICENSE)
