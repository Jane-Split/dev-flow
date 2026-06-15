---
name: dev-flow
description: AI 开发全流程编排器（9 阶段 + 30 subagent）。Use when the user types /dev-flow <需求> to start a structured 9-stage development workflow. Subcommands include -research, -clarify, -analyze, -design, -split, -develop, -test, -fix, -hotfix, -delivery, -verify, --resume, -cleanup.
---

# dev-flow 编排器

## 0. 触发与子命令

### 主入口
- `/dev-flow <需求描述>` — 全流程：Research → Clarify → Analyze → Design → Task Split → Develop → Test → Fix(按需) → Delivery
- `/dev-flow -subagent <需求描述>` — 企业级模式：并行 subagent 调度

### 单阶段子命令
| 子命令 | 行为 |
|--------|------|
| `/dev-flow -research` | 仅执行项目调研 |
| `/dev-flow -clarify <需求>` | 仅需求澄清（迭代问答）|
| `/dev-flow -clarify @file.md` | 从文件读取需求并澄清 |
| `/dev-flow -analyze <需求>` | 仅需求分析 |
| `/dev-flow -design <需求>` | 仅详细设计 |
| `/dev-flow -split <需求>` | 仅任务拆分 |
| `/dev-flow -develop <需求>` | 直接开发（跳过设计/拆分）|
| `/dev-flow -test` | 统一测试（单元+冒烟+E2E+集成）|
| `/dev-flow -fix` | 分析并修复 Bug |
| `/dev-flow -hotfix <错误>` | 紧急修复（独立模式）|
| `/dev-flow -delivery` | 生成交付报告 |
| `/dev-flow -e2e` | 仅 E2E 验证（API + UI + DB）|
| `/dev-flow -e2e-ui` | 仅 UI 验证（agent-browser）|
| `/dev-flow -e2e-api` | 仅 API 验证 + DB 核对 |
| `/dev-flow -verify` | 完整验证闭环 |
| `/dev-flow --resume` | 从中断处继续 |
| `/dev-flow -cleanup` | 清理会话记忆 |
| `/dev-flow -cleanup --all` | 重置全部记忆 |

## 1. 主 Agent 零编辑铁律

> 完整规则见 `AGENTS.md` 的"主 Agent 零编辑铁律"章节。

**关键约束**：
- 主 Agent 是**纯调度器**，禁止 Edit/Write 任何项目文件
- 唯一例外：`.codex/` 目录下的配置文件、AGENTS.md、SKILL.md
- 所有阶段文件操作必须由 `.codex/agents/*.toml` 中定义的 subagent 执行

## 2. 9 阶段流水线 ↔ Subagent 映射

| # | 阶段 | Subagent | 产出 |
|---|------|----------|------|
| 1 | Research | `research-expert` | `.dev-flow/memory/` |
| 2 | Clarify（可选）| `clarify-expert` | `clarification-result.yaml` |
| 3 | Analyze | `analyze-expert` | `PRD-{name}.md` + `prd-contract.yaml` |
| 4 | Design | `design-expert` | `design-contract.yaml` |
| 5 | Task Split | `task-split-expert` | `task-dag.yaml` |
| 6 | Develop | `backend-develop-expert` × N / `frontend-develop-expert` × N | 代码文件 |
| 7 | Test | `test-expert`（含单元+冒烟+E2E+集成）| `06-test-report.md` |
| 8 | Fix（按需）| `fix-expert` | `fix-report.md` |
| 9 | Delivery | `delivery-expert` | `delivery-report.md` |
| - | Hotfix（独立）| `fix-expert`（直接调度）| 修复 PR |

> 注：原 `delivery.toml` 已规划重命名为 `delivery-expert.toml`（O-09）。

## 3. Subagent 显式调用模板

> **关键事实**：Codex **不会**自动委派 subagent。主 Agent 必须用**显式语句**触发。

**单 subagent 委派**：
```
Spawn research-expert subagent for <需求简称>
```

**并行委派**（同一消息内）：
```
并行启动 3 个 scanner subagent:
- dependency-scanner
- service-scanner
- structure-analyzer
Wait for all 3, then summarize
```

**多 backend-develop-expert 并行**：
```
并行启动 2 个 backend-develop-expert subagent:
- Aurora: 处理 task-001 (Entity)
- Bolt: 处理 task-002 (DTO)
Wait for both, then summarize
```

## 4. 阶段门禁协议

每个 subagent 完成后：
1. 读取其交付物（位于 `.dev-flow/deliverables/{需求简称}/`）
2. 在主对话中向用户展示关键内容（TL;DR + 关键产出路径）
3. **等待用户在主对话中确认**
4. 由 `Stop` 钩子写 `.dev-flow/deliverables/{需求简称}/.confirmed`
5. 没有 `.confirmed` 标记 → **禁止进入下一阶段**

## 5. 失败协议 L1→L2→L3

| 级别 | 触发 | 主 Agent 行为 |
|------|------|------------|
| L1 自动重试 | subagent 临时错误 | 监控日志，不介入 |
| L2 诊断重试 | L1 失败 | 可改 prompt，**不直接编辑文件** |
| L3 升级人工 | L2 失败 | 写 `subagent-failures.log` → 提示用户 |

## 6. 调度策略（Codex 平台）

| 平台能力 | Codex 值 | 说明 |
|---------|---------|------|
| Subagent 存储 | `.codex/agents/*.toml` | 当前 29 个 subagent |
| 并行能力 | 6 线程 | `agents.max_threads` |
| 推荐并发上限 | 3 | dev-flow 设定 |
| 嵌套深度 | 1 | 防递归委派 |
| CSV 批处理 | `spawn_agents_on_csv` | 实验性 |
| 沙箱 | 4 级 | `read-only` / `workspace-write` / `danger-full-access` / 配置文件 |

## 7. 项目类型路由

在 Skill 入口检测：
- `pom.xml` → Java 微服务 → `backend-develop-expert`
- `package.json` + `frontend/` → 前端项目 → `frontend-develop-expert`
- 多语言 → `service-orchestrator` 分派
- 单 `go.mod` → Go 后端
- 单 `pyproject.toml` → Python 后端
- 未识别 → 主对话确认

## 8. 详细阶段指令（按需加载）

### 8.1 阶段入口
- `.codex/stages/research.md` — Research 阶段详细指令
- `.codex/stages/clarify.md` — Clarify 阶段详细指令
- `.codex/stages/analyze.md` — Analyze 阶段详细指令
- `.codex/stages/design.md` — Design 阶段详细指令
- `.codex/stages/task-split.md` — Task Split 阶段详细指令
- `.codex/stages/develop.md` — Develop 阶段详细指令
- `.codex/stages/test.md` — Test 阶段详细指令
- `.codex/stages/fix.md` — Fix 阶段详细指令
- `.codex/stages/delivery.md` — Delivery 阶段详细指令
- `.codex/stages/hotfix.md` — Hotfix 阶段详细指令
- `.codex/stages/code-reference.md` — 代码标准 + 错误模式

### 8.2 公共协议
- `.codex/references/protocol.md` — 零编辑铁律 / 门禁检查 / 失败协议
- `.codex/references/memory-system.md` — 记忆系统
- `.codex/references/learning-system.md` — 学习系统
- `.codex/references/runtime-protocol.md` — 运行时协议
- `.codex/references/degradation-matrix.md` — 故障降级矩阵
- `.codex/references/error-pattern-db.md` — 错误模式库
- `.codex/references/model-context-config.md` — 模型上下文配置
- `.codex/references/on-demand-loader.md` — 按需加载策略
- `.codex/references/design-contract-{go,python,typescript}.md` — 各语言契约模板

## 9. 与 AGENTS.md 配合

- 本 Skill 是**运行时调度器**，定义主 Agent 的子命令解析和阶段路由
- `AGENTS.md` 是**持久化指令集**，定义主 Agent 的零编辑铁律、门禁协议、失败协议
- 主 Agent 启动时同时加载两者
- 当 Skill 与 AGENTS.md 冲突时，**以 AGENTS.md 为准**（持久化指令优先级高）
