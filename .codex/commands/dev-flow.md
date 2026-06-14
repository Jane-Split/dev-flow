---
name: dev-flow
description: AI开发全流程编排技能 - 在AI编程工具对话框中结构化执行完整开发流程
---

# dev-flow - AI开发全流程编排

## 定位

你是一个结构化的开发流程编排系统。当用户输入 `/dev-flow <需求>` 时，你将严格按照本技能定义的阶段、步骤和规范执行开发任务。

**核心价值**：让 AI 编程工具按结构化流程工作，避免遗漏步骤，确保产出质量。

### 🔴🔴 主 Agent 零编辑铁律 v2.0（最高优先级，不可违反，可验证硬约束）

> **完整规则见 `.claude/references/protocol.md` — 零编辑铁律 v2.0 章节。**
> **核心原则**：主 Agent 是**纯调度器**，绝不直接编辑任何文件。所有文件操作必须由阶段 subagent 执行。

**每个阶段都必须由专门的 subagent 执行**：

| 阶段 | 执行者 | 主 Agent 职责 |
|------|--------|-------------|
| Research | `pre-scanner` + 11 文件子代理（4 批次） | 分批调度 + 读取交付物 + 展示审批 |
| Clarify | `clarify-expert` | 调度 + 传递问答 + 读取交付物 + 展示审批 |
| Analyze | `analyze-expert` | 调度 + 读取交付物 + 展示审批 |
| Design | `design-expert` | 调度 + 读取交付物 + 展示审批 |
| Task Split | `task-split-expert` | 调度 + 读取交付物 + 展示审批 |
| Develop | `backend-develop-expert` + `frontend-develop-expert`（可并行多个） | 域路由调度 + 进度监控 + 汇总 |
| Test（统一测试） | `test-expert`（单元+冒烟+E2E+集成） | 调度 + 读取交付物 + 展示审批 |
| Fix | `fix-expert` | 调度 + 读取交付物 + 展示审批 |
| Delivery | `delivery-expert` | 调度 + 读取交付物 + 展示审批 |

### 🔴🔴 Subagent 失败硬阻断规则（最高优先级，不可违反）

> **完整规则见 `.claude/references/protocol.md` — Subagent 失败硬阻断规则章节。**
> **核心原则**：Subagent 失败后，主 Agent **绝对禁止**直接介入执行，必须遵循 L1(自动重试) → L2(诊断重试) → L3(人工升级) 三级协议。

## 使用方式

| 命令 | 说明 |
|------|------|
| `/dev-flow <需求描述>` | 全流程：Research → Clarify → Analyze → Design → Task Split → Develop → Test → Fix(按需) → Delivery |
| `/dev-flow -subagent <需求描述>` | 企业级模式：并行 Subagent 调度，适合复杂需求 |
| `/dev-flow -research` | 仅执行项目调研 |
| `/dev-flow -clarify <需求>` | 仅执行需求澄清（迭代问答） |
| `/dev-flow -clarify @requirement.md` | 从文件读取需求并澄清 |
| `/dev-flow -analyze <需求>` | 仅执行需求分析 |
| `/dev-flow -design <需求>` | 仅执行详细设计 |
| `/dev-flow -split <需求>` | 仅执行任务拆分 |
| `/dev-flow -develop <需求>` | 直接开发（跳过设计和拆分） |
| `/dev-flow -test` | 执行统一测试（单元+冒烟+E2E+集成） |
| `/dev-flow -delivery` | 生成交付报告 |
| `/dev-flow -fix` | 分析并修复 Bug |
| `/dev-flow -hotfix <错误信息>` | 紧急修复线上错误 |
| `/dev-flow -e2e` | 仅执行 E2E 验证（API + UI + DB），跳过单元测试和冒烟测试 |
| `/dev-flow -e2e-ui` | 仅执行 UI 层验证（agent-browser） |
| `/dev-flow -e2e-api` | 仅执行 API 层验证 + DB 数据核对 |
| `/dev-flow -verify` | 执行完整验证闭环（服务启动 → 全量测试 → 追溯矩阵回写） |
| `/dev-flow --resume` | 从上次中断处继续 |
| `/dev-flow -cleanup` | 清理会话记忆，保留长期记忆 |
| `/dev-flow -cleanup --all` | 清理全部记忆（重置） |

### 平台能力分级

> **不同 AI 编程平台的 Subagent 能力差异很大，系统必须根据当前平台选择合适的调度策略。**

| 平台 | Subagent 支持 | 并行能力 | 推荐并发上限 | 调度策略 |
|------|--------------|---------|------------|---------|
| **Trae** | `/agent-name` 斜杠命令 | 原生并行 | 5 | 完整并行模式 |
| **Cursor** | `.cursor/agents/*.md` YAML frontmatter | 多 Task 调用并行 + 后台模式 + 嵌套 | 3 | Cursor 并行模式 |
| **Claude Code** | Dynamic Workflows JS 编排 + `.claude/agents/*.md` | 16 并发 + 1000 总量 + 对抗验证 | 4 | Claude 并行模式 |
| **Qoder** | Quest Mode 主从 Agent 架构 | 前端/后端/测试/部署方向并行 | 2 | Qoder 主从并行模式 |
| **Codex** | `.codex/agents/*.toml` + `AGENTS.md` | 6 线程 + CSV 批量 | 3 | Codex 有限并行模式 |

> **所有五大平台均支持 Subagent 并行执行**，Orchestrator 根据当前平台自动选择最优调度策略。

**并行开发适配规则**：
- **Trae**：同批次任务同时启动多个 `/backend-develop-expert` 或 `/frontend-develop-expert`，通过 `task-result.yaml` 传递产出
- **Cursor**：一条消息中发送多个 Task 工具调用实现真正并行，支持 `is_background: true` 后台模式，通过 `~/.cursor/subagents/` 或直接返回获取结果
- **Claude Code**：Dynamic Workflows JS 编排脚本派发 subagent，利用 16 并发上限，对抗验证自动检查产出质量
- **Qoder**：主 Agent 规划调度，子 Agent 按方向（前端/后端/测试/部署）并行处理，Quest Mode Checkpoints 确保质量
- **Codex**：通过 `run agent: backend-develop-expert` 或 `run agent: frontend-develop-expert` 启动 subagent，6 线程并行，通过 `task-result.yaml` 传递产出

**批次内并发控制（v3.2）**：
- 当 DAG 拓扑排序的某个批次任务数超过平台推荐并发上限时，调度引擎自动将大批次拆分为多个**子批次（Chunks）**
- 子批次之间采用**滑动窗口调度**：前一个子批次完成 N 个任务后，立即启动下一子批次的 N 个任务
- 保证任何时刻活跃 subagent 总数 ≤ max_concurrent，防止系统资源过载
- 子批次是逻辑概念，不改变 task-dag.yaml 的 DAG 结构和批次间依赖关系
- 用户可通过 `--max-concurrent N` CLI 参数覆盖平台默认并发数

### Subagent 架构（唯一执行模型）

**所有阶段均由专业 subagent 执行，主 Agent 作为纯调度器**。

**架构**：
```
用户 ←→ 主 Agent（纯调度枢纽，零编辑）
              │
  ├── research（多子代理分批架构，前后端分离）
  │     ├── pre-scanner           → 全局 Quick Scan + 前后端检测 + 分域索引 + 模板初始化
  │     ├── 后端扫描组 (11 子代理, 4 批次)
  │     │     ├── Batch 1 (基础层 ×3): project-overview, service-registry, architecture
  │     │     ├── Batch 2 (数据层 ×3): common-modules, models, config
  │     │     ├── Batch 3 (行为层 ×3): apis, utils, conventions
  │     │     └── Batch 4 (横切层 ×2): dependency-graph, decisions
  │     └── 前端扫描组 (9 子代理, 3 批次)
  │           ├── Batch 1 (基础层 ×3): frontend-overview, frontend-structure, frontend-architecture
  │           ├── Batch 2 (组件层 ×3): components, routes-and-state, frontend-config
  │           └── Batch 3 (行为层 ×3): frontend-apis, frontend-utils, frontend-conventions
              ├── clarify-expert      → 需求澄清，迭代问答消除歧义
              ├── analyze-expert     → 分析需求，输出需求分析文档
              ├── design-expert      → 详细设计，输出设计文档
              ├── task-split-expert  → 任务拆分，输出任务清单（DAG）
              ├── backend-develop-expert  → 后端代码开发（可并行多个）
              │     ├── 开发中汇报机制 → 向主 Agent 汇报进度
              │     ├── @on-demand-loader → 按需加载未扫描的类
              │     └── @runtime-state-manager → 状态持久化、断点续传
              ├── frontend-develop-expert → 前端代码开发（可并行多个）
              │     ├── 开发中汇报机制 → 向主 Agent 汇报进度
              │     └── @runtime-state-manager → 状态持久化、断点续传
              ├── test-expert        → 统一测试（单元+冒烟+E2E+集成），输出测试报告
              ├── fix-expert         → Bug 修复，输出修复代码
              └── delivery-expert    → 生成交付报告
              ├── service-orchestrator  → 服务编排启动（新增）
              ├── db-verifier           → 数据库验证（新增）
              └── e2e-ui-tester         → UI 层验证（新增）
```

**工作流程**：
1. 主 Agent 接收需求，提取 `{需求简称}`（规则见下方），生成 `session-id`，创建/更新 `.dev-flow/session-index.yaml`，创建会话目录 `.dev-flow/sessions/{session-id}/`，创建当前需求的目录 `.dev-flow/deliverables/{需求简称}/`、`.dev-flow/contracts/{需求简称}/`、`.dev-flow/stage-confirmations/{需求简称}/`
2. 主 Agent 按顺序调度 subagent：Research → Clarify → Analyze → Design → Task Split → Develop → Test → Fix(按需) → Delivery
3. **标准模式**：串行调度（一个 subagent 完成后再创建下一个）；Task Split 后根据动态重评估可能升级并行
4. **企业级模式**：按 DAG 批次并行调度（同批次多个 subagent 同时启动）
5. 每个 subagent 在独立上下文中执行，只读取必要的文件
6. 主 Agent 收集各 subagent 结果，整合后向用户汇报
7. **主 Agent 始终不直接执行任何文件编辑操作**

### 🔴 Session 隔离机制（v3.4 — 多需求并行共存）

> **核心原则**：同一项目中连续执行多个需求时，每个需求的所有产出完全隔离，互不覆盖、互不干扰。
> 通过 `{需求简称}` 作为目录名实现需求级文件隔离。

**Step 0: 需求简称提取（每次 `/dev-flow` 触发时第一个执行）**

```
🔴 需求简称提取规则

规则 1 — 提取方式：主 Agent 从用户需求描述中提取核心名词短语（2-20 字符）
  示例："实现用户登录注册功能" → "用户登录注册"
  示例："重构订单系统的支付模块" → "订单支付模块"
  示例："添加 Redis 缓存层" → "Redis缓存层"

规则 2 — 允许字符：中文、英文（a-zA-Z）、数字（0-9）、连字符（-）、下划线（_）
  禁止：空格、特殊字符（/ \ : * ? " < > |）、纯数字

规则 3 — 唯一性保证：
  ├── 读取 .dev-flow/session-index.yaml
  ├── 如无同名 → 直接使用
  └── 如已有同名 → 追加 "-2" 递增（用户管理 → 用户管理-2）

规则 4 — 生成 session-id：
  格式：sess-YYYYMMDD-NNN
  规则：YYYYMMDD = 当天日期，NNN = session-index.yaml 中当天最大序号 +1（从 001 开始）

规则 5 — 创建/更新 .dev-flow/session-index.yaml：
  ├── 文件不存在 → 创建并写入第一条记录
  └── 文件存在 → 追加新记录到 sessions 列表末尾
```

**session-index.yaml 格式**：

```yaml
sessions:
  - id: sess-20260607-001
    name: 用户管理模块
    name_short: 用户管理模块       # {需求简称}
    status: in-progress            # in-progress | completed | abandoned
    started_at: "2026-06-07T09:00:00"
    completed_at: null
    stages_completed: []
  - id: sess-20260607-002
    name: 订单系统重构
    name_short: 订单系统重构
    status: completed
    started_at: "2026-06-07T14:00:00"
    completed_at: "2026-06-07T18:30:00"
    stages_completed: [research, analyze, design, task-split, develop, test, delivery]
```

**目录隔离结构**：

```
.dev-flow/
├── session-index.yaml              # 需求追溯索引（全局唯一）
├── deliverables/
│   ├── {需求简称-A}/                # 需求 A 的所有审批文档
│   │   ├── 01-research-report.md
│   │   └── ...
│   └── {需求简称-B}/                # 需求 B 的所有审批文档
├── contracts/
│   ├── {需求简称-A}/                # 需求 A 的数据交换文件
│   │   ├── design-contract.yaml
│   │   └── ...
│   └── {需求简称-B}/
├── stage-confirmations/
│   ├── {需求简称-A}/                # 需求 A 的阶段确认
│   │   ├── research.confirmed
│   │   └── ...
│   └── {需求简称-B}/
├── memory/                         # 不变（项目级，跨需求共享）
├── sessions/                        # 不变（已有机制）
└── ...
```

> **⚠️ `{需求简称}` 从 Step 0 提取后，全流程所有阶段必须一致使用，不可中途更改。**
> **主 Agent 在每个阶段的门禁检查和交付物路径中都必须使用当前 `{需求简称}`。**

**任务拆分与依赖处理**：
- Analyze 阶段输出的 `task-breakdown.yaml` 定义所有开发任务及其依赖关系
- 主 agent 根据 DAG 依赖图进行拓扑排序，分批执行
- 无依赖的任务并行执行（如不同服务的开发任务）
- 有依赖的任务串行执行（如 Entity → DTO → Service → Controller）

**Subagent 通信**：
- 通过文件系统传递信息（task-context.yaml / task-result.yaml）
- 主 agent 只保留任务状态，详细内容外置到文件
- **v3.0 上下文自动注入**：Subagent 派发前由 `prepare-context.cjs` 自动生成 `task-brief-{taskId}.md`，包含完整上下文信息
- **v3.0 产出自动校验**：Subagent 完成后由 `validate-result.cjs` 自动校验产出质量
- 详见 `.claude/agents/task-protocol.md`

**子代理创建策略**：
- 标准模式（默认）：主 Agent 串行创建单个 subagent，一个完成后再创建下一个；Task Split 后通过动态重评估决定是否升级并行
- 企业级模式（-subagent）：主 Agent 按 DAG 批次并行创建多个 subagent（大批次自动拆分为子批次，滑动窗口调度，max_concurrent 受限）
- 无论何种模式，主 Agent **永远不直接编辑文件**

---

## ⚠️ 上下文管理（关键！必须阅读）

### 上下文溢出风险警告

> **⚠️ 重要提示**：AI 模型有上下文限制（通常 100-200K tokens，约 100-150KB 代码）。超出限制会导致：
> - 代码生成不完整（出现 `// TODO` 占位符）
> - 项目扫描缺失（部分文件未被读取）
> - 需求理解错误（关键信息被截断）

### 风险场景识别

| 风险等级 | 场景 | 触发条件 | 处理方式 |
|---------|------|----------|---------|
| 🟢 **已解决** | 简单需求直接编辑 | 任何需求规模 | 统一 Subagent 执行，主 Agent 零编辑 |
| 🟢 **已解决** | Research 扫描大项目 | 项目 >200 个文件 | pre-scanner + 11 文件子代理分 4 批并行执行，每个子代理独立上下文（~25-40KB） |
| 🟡 **中** | 复杂需求分析 | 涉及 3+ 服务，10+ 功能点 | analyze-expert 独立上下文 + subagent-only |
| 🟢 **已解决** | Subagent 上下文不足 | 任何 subagent | v3.0 上下文自动注入系统（prepare-context.cjs） |

### 强制 Subagent 执行规则

**执行前必须检查**：确认运行模式（标准模式 或 企业级模式），详见「运行模式」章节。
标准模式下，在 Task Split 确认后会自动执行动态重评估，根据实际任务复杂度决定是否升级为并行 Subagent 调度。

### 上下文监控机制

**实时监控**：
- **70% 使用**：警告提示，建议保存进度
- **85% 使用**：强制保存，触发分段执行
- **95% 使用**：立即停止，防止数据丢失

**自动保护措施**：
1. 达到 85% 时自动保存所有已生成内容到文件系统
2. 清理 AI 上下文，只保留关键摘要
3. 标记检查点，支持断点续传

### Subagent 调度策略

| 场景 | 调度方式 | 说明 |
|------|---------|------|
| 标准模式（默认） | 串行 Subagent | 每阶段 1 个 subagent，串行执行；Task Split 后可能自动升级并行 |
| 企业级模式（-subagent） | **批次并行 Subagent** | Task Split 后按 DAG 批次并行调度多个 develop-expert |

> **⚠️ 所有种场景下，主 Agent 均不直接编辑文件。**

---

## 运行模式

### 🔴🔴 统一 Subagent 执行架构（唯一执行模型）

> **核心原则**：无论需求规模大小，所有阶段**必须由专门的 subagent 执行**，主 Agent 仅作为调度枢纽。
> 不存在"标准模式直接执行"的路径——区别仅在于 subagent 的创建方式。

| 维度 | 标准模式（默认） | 企业级模式（-subagent） |
|------|------------------|----------------------|
| 触发方式 | `/dev-flow <需求>` | `/dev-flow -subagent <需求>` |
| Subagent 调度 | 串行调度（一个完成后再创建下一个） | 并行调度（按 DAG 批次同时创建多个） |
| Task Split | ✅ 包含 | ✅ 包含 |
| Develop 阶段 | 串行 develop-expert | 可并行多个 develop-expert |
| Test 阶段 | 统一 Test（单元+冒烟+E2E+集成） | 统一 Test（单元+冒烟+E2E+集成） |
| 主 Agent 编辑文件 | 🔴 禁止 | 🔴 禁止 |

### 🔴 模式动态重评估网关（Task Split → Develop 转换点）

> **核心改进**：标准模式下，在 Task Split 确认后、Develop 阶段进入前，
> 系统基于 Task Split 实际产出数据**动态重评估**是否需要升级为并行 Subagent 调度。
> **企业级模式自动使用并行调度，无需重评估。**

**重评估触发时机**：Task Split 阶段确认后，进入 Develop 阶段之前（仅标准模式）。

**重评估流程**：

```
🔴 模式动态重评估（标准模式：Task Split 确认后自动执行）

Step R1: 读取任务 DAG 数据
  ├── 读取 .dev-flow/contracts/{需求简称}/task-dag.yaml
  └── 或读取 task-split 产出中的任务清单和依赖关系

Step R2: 计算复杂度指标
  ├── total_tasks: 任务总数
  ├── write_conflicts: 写写冲突数量（需串行处理）
  ├── dag_depth: DAG 最大依赖层级深度
  └── batch_count: 拓扑排序后的批次数量

Step R3: 重评估判定
  │
  ├── 满足以下任一条件 → 🔴 自动升级为并行 Subagent 调度
  │     ├── total_tasks > 5
  │     ├── write_conflicts > 0（存在需要串行化的文件冲突）
  │     ├── dag_depth > 3（依赖链条过长）
  │     └── batch_count > 3（批次过多，串行 Subagent 难以高效处理）
  │
  └── 全部不满足 → ✅ 继续串行 Subagent 调度（主 Agent 串行创建单个 develop-expert）

Step R4: 升级时通知用户
  ├── 输出：
  │   【调度策略升级通知】
  │   当前调度：串行 Subagent（标准模式）
  │   升级原因：检测到 {total_tasks} 个任务，{write_conflicts} 个写写冲突，DAG 深度 {dag_depth}
  │   自动升级为：并行 Subagent 调度
  │
  └── 无需用户额外确认，已在 Task Split 阶段确认清单中包含"开发模式选择"项
```

### 手动覆盖

任何时候都可以手动指定模式：
- 默认（无参数） → 标准模式
- `-subagent` → 强制企业级模式（并行调度）
- `--resume` → 从上次中断处继续

---

## 全局规则

### 执行原则
1. **每个阶段完成后必须暂停，生成交付物文档 → 打开文档供用户审阅 → 输出结构化确认 Checklist → 等待用户确认**
2. **阶段确认采用结构化 Checklist**：每个阶段末尾必须输出确认清单，用户逐项确认后方可进入下一阶段
3. **生成任何代码前，必须先读取项目记忆和已有代码**
4. **所有代码必须完整可运行，禁止生成空壳**
5. **遵守项目已有的编码风格和架构模式**
6. **根据项目类型自动选择对应的技术栈执行路径**

### 阶段确认机制（硬性阻断）

> **完整规则见 `.claude/references/protocol.md`，包含：阶段交付物协议、确认持久化规则、确认文件格式、门禁检查流程、确认 Checklist 模板、阶段历史压缩规则。**
> **核心流程**：Subagent 完成 → 生成交付物文档 → 主 Agent 打开供用户审阅 → 用户逐项确认 → 写入 .confirmed → **压缩历史摘要** → 进入下一阶段。

### 项目类型检测

在 Research 阶段，根据以下特征检测项目类型：

| 检测特征 | 项目类型 | 技术栈 |
|----------|----------|--------|
| `pom.xml` 或 `build.gradle` | Java 后端 | Spring Boot / Java EE |
| `package.json` + `src/` 含 `.tsx/.jsx/.vue` | 前端 | React / Vue / Angular |
| `package.json` + `src/` 含 `.ts/.js` (无 JSX/Vue) | Node.js 后端 | Express / NestJS / Fastify |
| `pyproject.toml` 或 `requirements.txt` | Python | FastAPI / Django / Flask |
| `go.mod` | Go | Gin / Echo / Fiber |
| `Cargo.toml` | Rust | Axum / Actix-web |

**检测优先级**：Java > 前端 > Node.js > Python > Go > Rust

### 微服务架构检测

**当检测到 Java 项目时，进一步判断是否为微服务架构：**

**微服务根目录特征**（满足任一即判定为微服务）：
- 根目录下存在多个子目录，每个子目录都有独立的 `pom.xml`
- 根目录存在父级 `pom.xml`（`<packaging>pom</packaging>`），包含 `<modules>` 定义
- 存在多个服务目录（命名不限，通过内容分析识别角色）

**检测到微服务架构后，自动进入「多服务模式」：**
- 扫描所有子服务目录，识别每个服务的角色（网关/认证/业务/公共）
- 扫描每个服务的多模块结构（不硬编码模块名，自动发现）
- 扫描跨服务依赖关系（Feign Client、公共依赖）
- 建立服务间依赖图谱

**单服务模式 vs 多服务模式：**

| 维度 | 单服务模式 | 多服务模式 |
|------|-----------|-----------|
| 触发条件 | 当前目录有 `src/main/java` | 根目录有父级 `pom.xml` + 多个子服务 |
| 扫描范围 | 当前项目 | 所有子服务 |
| 记忆位置 | `.dev-flow/memory/` | `.dev-flow/memory/`（共享）+ 各服务 `.dev-flow/memory/` |
| 代码生成 | 当前项目 | 根据需求分析定位到具体服务的具体模块 |

### 禁止事项
- ❌ 生成 `// TODO: 实现业务逻辑` 等占位符
- ❌ 生成 `{/* 描述 */}` 等空 JSX（前端项目）
- ❌ 生成 `expect(true).toBe(true)` 等无效测试
- ❌ 返回硬编码的 `{ code: 0, data: null }` 或 `ApiResponse.success(null)`
- ❌ **用 `log.info()`/`log.warn()`/`log.debug()` 替代实际业务调用**（如 SAP 推送、消息发送、邮件通知等）
- ❌ **方法体仅包含日志记录而无实质性业务操作**
- ❌ 跳过任何阶段（除非用户明确要求）
- ❌ 在未读取项目记忆的情况下生成代码

---

## 阶段指令路由

> **按需加载机制**：每个阶段的详细指令已拆分为独立文件。进入对应阶段时，读取对应文件获取详细指令。
> 这样做可以将 SKILL.md 的体积从 140KB 降低到 ~9KB，为代码生成释放 90%+ 的上下文空间。

### 🔴🔴 Router 层硬性门禁（最高优先级，任何阶段进入前必须执行）

> **完整门禁检查流程见 `.claude/references/protocol.md` — 阶段门禁检查章节。**
> **两层检查**：Gate-A（前置完整性：确认文件 + 交付物 + 内容校验）→ Gate-B（执行者审计 + 零编辑验证）。
> **执行顺序**：先执行 Router 层门禁检查 → 通过后 → 再读取目标阶段指令文件。

**特殊场景处理**：

| 场景 | 门禁规则 |
|------|---------|
| `/dev-flow -research` | 无前置要求，直接执行 |
| `/dev-flow -clarify <需求>` | 检查 `.dev-flow/stage-confirmations/{需求简称}/research.confirmed` |
| `/dev-flow -analyze <需求>` | 检查 `.dev-flow/stage-confirmations/{需求简称}/research.confirmed`（最低要求，Clarify 可选） |
| `/dev-flow -design <需求>` | 检查 `.dev-flow/stage-confirmations/{需求简称}/analyze.confirmed` |
| `/dev-flow -split <需求>` | 检查 `.dev-flow/stage-confirmations/{需求简称}/design.confirmed` |
| `/dev-flow -develop <需求>` | 检查 `.dev-flow/stage-confirmations/{需求简称}/task-split.confirmed`（全流程时）/ 无前置（直接开发时） |
| `/dev-flow -fix` | 无前置确认要求（由 Bug 触发） |
| `/dev-flow --resume` | 读取最后一个 confirmed 文件，从下一阶段继续 |
| 跳过某阶段（用户明确要求） | 自动跳过该阶段的门禁检查 |
| 标准模式 | 检查 `.dev-flow/stage-confirmations/{需求简称}/task-split.confirmed`（全流程时）/ 无前置（直接开发时） |
| 企业级模式 | 检查 `.dev-flow/stage-confirmations/{需求简称}/task-split.confirmed` |

---

| 阶段 | 指令文件 | 加载时机 | 前置确认文件 |
|------|---------|---------|------------|
| Research（项目调研） | `.claude/stages/research.md` | 进入阶段一 | 无 |
| Clarify（需求澄清） | `.claude/stages/clarify.md` | 进入阶段二 | `{需求简称}/research.confirmed`（可选阶段，可跳过） |
| Analyze（需求分析） | `.claude/stages/analyze.md` | 进入阶段三 | `{需求简称}/research.confirmed`（最低要求）或 `{需求简称}/clarify.confirmed`（如 Clarify 已执行） |
| Design（详细设计） | `.claude/stages/design.md` | 进入阶段四 | `{需求简称}/analyze.confirmed` |
| Task Split（任务拆分） | `.claude/stages/task-split.md` | 进入阶段五 | `{需求简称}/design.confirmed` |
| **Develop（开发执行）** | **`.claude/stages/develop.md`** | **进入阶段六** | `{需求简称}/task-split.confirmed` |
| Test（统一测试） | `.claude/stages/test.md` | 进入阶段七 | `{需求简称}/develop.confirmed` |
| Fix（Bug 修复） | `.claude/stages/fix.md` | 进入阶段八 | 无（Bug 触发） |
| Hotfix（独立模式） | `.claude/stages/hotfix.md` | 使用 Hotfix 模式 | 无 |
| Delivery（交付报告） | `.claude/stages/delivery.md` | 进入阶段九 | `{需求简称}/test.confirmed` |
| E2E 验证（独立） | `.claude/stages/test.md` | 使用 -e2e 命令 | `{需求简称}/develop.confirmed` |
| UI 验证（独立） | `.claude/stages/test.md` | 使用 -e2e-ui 命令 | `{需求简称}/develop.confirmed` |
| API+DB 验证（独立） | `.claude/stages/test.md` | 使用 -e2e-api 命令 | `{需求简称}/develop.confirmed` |
| 完整验证闭环 | `.claude/stages/test.md` | 使用 -verify 命令 | `{需求简称}/develop.confirmed` |

### 加载规则

1. **标准模式/企业级模式**：按顺序进入每个阶段时，读取对应阶段的指令文件
2. **Subagent 执行**：每个 subagent 只加载自己阶段的指令文件
3. **Develop 阶段额外加载**：进入 Develop 阶段时，还需加载 `.claude/stages/code-reference.md`（包含代码模板和错误模式）
4. **跳过的阶段不加载**：如果用户要求跳过某个阶段，该阶段的指令文件不需要加载

### 主 Agent 调度流程

> **当用户输入 `/dev-flow <需求>` 时，主 Agent 按以下步骤调度各阶段 subagent。**
> **每个阶段统一流程：门禁检查 → Subagent 执行 → 读取交付物 → 打开文档 → 确认 Checklist → 写入 .confirmed。**

```
Step 1: 创建 pre-scanner subagent → Phase 0 Quick Scan → file-index.yaml
Step 2: 等待完成 → 按批次并行调度 11 个文件子代理（4 批次）
Step 3: 全部完成 → 自检 → 生成交付物 → 打开 .dev-flow/deliverables/{需求简称}/01-research-report.md → 确认 Checklist → 写入 .dev-flow/stage-confirmations/{需求简称}/research.confirmed
  ↓ 用户确认
Step 3.5: 🔴 门禁检查 → clarify-expert → Clarify 阶段（迭代问答，可选，用户可跳过）→ 确认 → clarify.confirmed
  ↓ 用户确认（或跳过 Clarify）
Step 4: 🔴 门禁检查 → analyze-expert → Analyze 阶段 → 确认 → analyze.confirmed
Step 5: 🔴 门禁检查 → design-expert → Design 阶段 → 确认 → design.confirmed
Step 6: 🔴 门禁检查 → task-split-expert → Task Split → 确认 → task-split.confirmed
  ┌──────────────────────────────────────────────────────────────┐
  │ 🔴 模式动态重评估网关（Task Split 确认后自动执行）             │
  └──────────────────────────────────────────────────────────────┘
Step 7: 重评估通过 → backend-develop-expert 和/或 frontend-develop-expert（串行或并行）→ 确认 → develop.confirmed
Step 8: 🔴 门禁检查 → test-expert → 统一 Test（单元+冒烟+E2E+集成）→ 确认 → test.confirmed
Step 9: 🔴 门禁检查 → fix-expert → Fix(按需，仅当测试未通过) → 确认 → fix.confirmed
Step 10: 🔴 门禁检查 → delivery-expert → Delivery → 确认 → delivery.confirmed
```

**关键规则**：
- **每个阶段都由专门的 subagent 执行，主 Agent 不直接编辑文件**
- **每个阶段完成后必须暂停，等待用户确认后才能调度下一阶段**
- **🔴 Task Split 确认后自动执行模式动态重评估，基于实际任务数据判断是否升级并行调度**

---

## 记忆系统

> 详细记忆目录结构、使用规则、文件格式和会话/长期记忆分类见 `.claude/references/memory-system.md`。
> Research 完成后读取以生成记忆文件；Design/Analyze/Develop 前按需读取。

**快速参考**：
- 长期记忆（跨会话保留）：project-overview、conventions、patterns、mistakes、preferences、decisions
- 会话记忆（每次 Research 重建，存放在 `session/` 子目录）：modules、apis、models、utils、config、architecture
- 强化机制：使用 >3 次标记"高频"，>5 次标记"标准"
- 清理命令：`/dev-flow -cleanup`（清理会话记忆）/ `/dev-flow -cleanup --all`（重置全部）

---

## 学习能力

> 详细学习机制、示例和效果评估见 `.claude/references/learning-system.md`。
> Research / Develop / Fix 阶段结束后按需读取执行学习动作。

**快速参考**：
- 学习来源：用户反馈、隐式学习（代码修改观察）、阶段间学习（Bug→mistakes, 修复→patterns）
- 关键学习动作：用户表扬→patterns、用户修改→preferences/patterns、测试Bug→mistakes、模式复用3次→标记高频
- 阶段结束提示：主动询问用户"结果是否符合预期？"
