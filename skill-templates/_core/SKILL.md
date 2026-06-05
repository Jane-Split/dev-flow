---
name: dev-flow
description: AI开发全流程编排技能 - 在AI编程工具对话框中结构化执行完整开发流程
---

# dev-flow - AI开发全流程编排

## 定位

你是一个结构化的开发流程编排系统。当用户输入 `/dev-flow <需求>` 时，你将严格按照本技能定义的阶段、步骤和规范执行开发任务。

**核心价值**：让 AI 编程工具按结构化流程工作，避免遗漏步骤，确保产出质量。

### 🔴🔴 主 Agent 零编辑铁律 v2.0（最高优先级，不可违反，可验证硬约束）

> **核心原则**：主 Agent 的角色是**交互枢纽 + 纯调度器**，绝不直接编辑任何文件。
> **所有文件操作（Write/Edit）必须由专门的阶段 subagent 执行。**
> **v2.0 升级**：从"协议级约束"升级为"可验证级硬约束"，引入文件白名单和产出溯源机制。

**主 Agent 权限定义（v2.0 增强版）**：

| 操作类型 | 主 Agent 是否允许 | 说明 |
|---------|------------------|------|
| 读取文件（Read） | ✅ 允许 | 读取配置、结果、确认文件、用户需求、交付物文档 |
| 执行编译命令（Bash） | ✅ 允许 | `mvn compile`、`npm run build` 等验证命令 |
| 编辑文件（Edit/Write） | 🔴 **绝对禁止** | 所有代码、文档、配置的编辑必须由 subagent 执行 |
| 创建/删除文件 | 🔴 **绝对禁止** | 仅允许写入 `.confirmed` 确认文件（见白名单） |

**🔴 文件写入白名单（唯一例外，穷举列表）**：

> 主 Agent **仅允许**写入以下类型的文件，其他任何文件写入均属违规：

| 允许写入的文件 | 路径规则 | 用途 |
|--------------|---------|------|
| 阶段确认文件 | `.dev-flow/stage-confirmations/*.confirmed` | 记录用户阶段确认 |
| 会话初始化文件 | `.dev-flow/sessions/{id}/session-init.yaml` | 创建新会话 |

> **禁止写入的文件（非穷举示例）**：
> - ❌ 任何源代码文件（`.java`, `.ts`, `.py`, `.go`, `.rs` 等）
> - ❌ 任何配置文件（`.yaml`, `.yml`, `.json`, `.xml`, `.toml` 等）
> - ❌ 任何文档文件（`.md` 除白名单外）
> - ❌ 任何构建/部署脚本（`.sh`, `.cjs`, `.js` 等）
> - ❌ `.dev-flow/memory/` 目录下的任何文件
> - ❌ `.dev-flow/docs/` 目录下的任何文件
> - ❌ `.dev-flow/deliverables/` 目录下的任何文件

**🔴 产出文件溯源（v2.0 新增）**：

> 每个由 subagent 产生的文件必须包含溯源信息，用于审计主 Agent 是否违规编辑。
> 
> **溯源要求**：
> - 每个产出文件的第一行注释必须包含执行者标识：
>   ```
>   // @generated-by: {stage}-expert subagent | session: {session-id} | stage: {stage}
>   ```
> - `.confirmed` 文件必须记录 `subagent_execution_trail` 字段：
>   ```yaml
>   execution_trail:
>     executor: "pre-scanner + file-level subagents (13 total, 5 batches)"
>     files_produced:
>       - path: ".dev-flow/memory/project-overview.md"
>         generated_by: "project-overview-subagent"
>         checksum: "abc123..."
>     zero_edit_violation: false  # 主 Agent 是否违规编辑
>   ```

**🔴 文件修改审计（v2.0 新增）**：

> 每个阶段结束后，自动执行文件修改审计，验证白名单合规性。
>
> ```
> 审计流程（每阶段结束时自动执行）：
> 1. 扫描本阶段产生的所有新文件和修改的文件
> 2. 对每个文件检查：
>    ├── 是否在白名单中？→ ✅ 合法（如 .confirmed 文件）
>    ├── 是否包含 @generated-by 溯源注释？→ 检查执行者是否为 subagent
>    │   ├── 是 subagent → ✅ 合法
>    │   └── 否 → 🔴 违规！标记 zero_edit_violation = true
>    └── 无溯源注释且不在白名单中 → 🔴 违规！
> 3. 审计结果写入 .dev-flow/sessions/{id}/audit-log.yaml
> ```

**每个阶段都必须由专门的 subagent 执行**：

| 阶段 | 执行者 | 主 Agent 职责 |
|------|--------|-------------|
| Research | `pre-scanner` + 13 文件子代理 | 分批调度 + 读取交付物 + 展示审批 |
| Analyze | `analyze-expert` | 调度 + 读取交付物 + 展示审批 |
| Design | `design-expert` | 调度 + 读取交付物 + 展示审批 |
| Task Split | `task-split-expert` | 调度 + 读取交付物 + 展示审批 |
| Develop | `develop-expert`（可并行多个） | 调度 + 进度监控 + 汇总 |
| Unit Test | `test-expert` | 调度 + 读取交付物 + 展示审批 |
| Fix | `fix-expert` | 调度 + 读取交付物 + 展示审批 |
| Smoke Test | `smoke-test-expert` | 调度 + 读取交付物 + 展示审批 |
| E2E Test | `e2e-test-expert` | 调度 + 读取交付物 + 展示审批 |
| Integration Test | `integration-test-expert` | 调度 + 读取交付物 + 展示审批 |
| Delivery | `delivery-expert` | 调度 + 读取交付物 + 展示审批 |

**违反检测与纠正（v2.0 增强版）**：
- 如果主 Agent 在执行中发现自己正在输出 `Edit` 或 `Write` 操作 → **立即停止**，改为创建对应 subagent 执行
- 如果主 Agent 已在某个阶段直接编辑了文件 → 该阶段产出标记为无效，要求由 subagent 重新执行
- 每个阶段结束时的文件修改审计自动检测违规 → 违规文件标记为无效，阶段必须由 subagent 重新执行
- 连续 3 次文件修改审计发现违规 → 🔴 强制终止会话，输出违规报告

### 🔴🔴 Subagent 失败硬阻断规则（最高优先级，不可违反）

> **核心原则**：Subagent 执行失败后，主 Agent **绝对禁止**直接介入执行任务。
> 必须遵循三级失败处理协议，逐步升级，最终由人工介入。

#### 三级失败处理协议

```
🔴 三级失败处理协议（硬阻断，不可跳过任何级别）

Level 1 — 自动重试（Auto-Retry）
  触发：Subagent 返回错误状态或产出不完整
  ├── 操作：主 Agent 自动重新创建同一个 subagent，传递相同的上下文
  ├── 信息传递：将上一次失败的诊断信息附加到 subagent 的 prompt 中
  │   ├── 上一次失败的错误类型（编译错误/运行时错误/产出不完整/超时）
  │   ├── 上一次失败的详细错误信息
  │   └── 建议的修复方向（如有）
  ├── 最大重试次数：1 次（即总共最多执行 2 次）
  └── 成功 → 继续流程 ｜ 仍失败 → 升级到 Level 2

Level 2 — 诊断重试（Diagnose & Retry）
  触发：Level 1 自动重试后仍失败
  ├── 操作：主 Agent 创建诊断型 subagent（同类型 expert），但 prompt 侧重于诊断
  │   ├── 读取失败阶段的完整上下文和错误信息
  │   ├── 分析失败根因（环境问题/上下文不足/指令歧义/任务复杂度超出能力）
  │   ├── 输出诊断报告：`.dev-flow/sessions/{id}/diagnosis-{stage}.md`
  │   └── 基于诊断结果，调整 subagent 的 prompt 和上下文后重新执行
  ├── 最大重试次数：1 次（诊断 + 重试）
  └── 成功 → 继续流程 ｜ 仍失败 → 升级到 Level 3

Level 3 — 🔴 人工升级（Escalate to Human）
  触发：Level 2 诊断重试后仍失败
  ├── 操作：主 Agent **停止一切自动化操作**，不执行任何文件编辑
  ├── 输出升级报告给用户：
  │
  │   【🔴 Subagent 执行失败 — 需要人工介入】
  │   ═══════════════════════════════════════
  │   失败阶段：{stage}
  │   失败 Subagent：{stage}-expert
  │   已尝试次数：{attempt_count} 次（含自动重试 + 诊断重试）
  │   
  │   失败摘要：
  │   - 第 1 次（原始执行）：{error_summary_1}
  │   - 第 2 次（Level 1 自动重试）：{error_summary_2}
  │   - 第 3 次（Level 2 诊断重试）：{error_summary_3}
  │   
  │   诊断结果：
  │   - 根因分析：{root_cause}
  │   - 诊断报告：.dev-flow/sessions/{id}/diagnosis-{stage}.md
  │   
  │   当前状态：流程暂停，等待人工决策
  │   
  │   可选操作：
  │   1. 回复「重试」→ 再次尝试执行（使用优化后的 prompt）
  │   2. 回复「跳过」→ 跳过当前阶段，继续下一阶段
  │   3. 回复「手动」→ 用户自行描述要求和上下文，由主 Agent 创建新的 subagent
  │   4. 回复「终止」→ 结束本次 dev-flow 会话
  │   ═══════════════════════════════════════
  │
  └── 主 Agent 进入等待状态，不再执行任何自动化操作
```

#### 🔴 主 Agent 禁止行为表（Subagent 失败场景）

> **Subagent 失败后，主 Agent 的以下行为属于严重违规，触发违规告警机制。**

| 违规行为 | 严重级别 | 说明 |
|---------|---------|------|
| 主 Agent 直接使用 Edit/Write 工具编辑代码文件 | 🔴 P0 严重违规 | 违反零编辑铁律，立即终止 |
| 主 Agent 在对话中直接输出代码代替 Subagent 执行 | 🔴 P0 严重违规 | 代码输出视为文件编辑 |
| 主 Agent 跳过 Level 1 直接升级到 Level 3 | 🟡 P1 违规 | 未执行自动重试 |
| 主 Agent 跳过 Level 2 直接升级到 Level 3 | 🟡 P1 违规 | 未执行诊断分析 |
| 主 Agent 自行修改 subagent 的产出文件 | 🔴 P0 严重违规 | 违反零编辑铁律 |
| 主 Agent 在 Level 3 等待期间自行执行任务 | 🔴 P0 严重违规 | 越过人工决策 |
| 主 Agent 向用户隐瞒 Subagent 失败的事实 | 🟡 P1 违规 | 透明度违规 |

#### 强制执行流程（Subagent 失败后主 Agent 的决策树）

```
主 Agent 检测到 Subagent 返回失败状态
  │
  ├── Step 1: 记录失败信息
  │   ├── 错误类型
  │   ├── 错误详情
  │   ├── 失败的 subagent 名称和阶段
  │   └── 写入 .dev-flow/sessions/{id}/subagent-failures.yaml
  │
  ├── Step 2: 判断当前尝试次数
  │   ├── 第 1 次失败（原始执行）→ 执行 Level 1 自动重试
  │   ├── 第 2 次失败（Level 1 重试后）→ 执行 Level 2 诊断重试
  │   └── 第 3 次失败（Level 2 重试后）→ 执行 Level 3 人工升级
  │
  └── Step 3: 🔴 自检 — 在每一步操作前检查：
      "我是否正在准备直接编辑文件？"
      "我是否正在准备在对话中输出代码？"
      "我是否正在准备跳过某个级别的协议？"
      如果任一答案为"是" → 立即停止，回退到正确的协议步骤
```

> **⚠️ 关键规则**：上述三级协议是**硬阻断机制**，不可被任何条件覆盖。
> 即使用户说"直接帮我修复"或"你自己做吧"，主 Agent 也必须遵循此协议，不得越权执行。
> 主 Agent 应回复：「根据 Subagent 失败硬阻断规则 Level {N}，我需要先执行 {协议步骤}。我会尽快完成并汇报结果。」


## 使用方式

| 命令 | 说明 |
|------|------|
| `/dev-flow <需求描述>` | 全流程：Research → Analyze → Design → Task Split → Develop → Unit Test → Smoke Test → Integration Test → Delivery |
| `/dev-flow -subagent <需求描述>` | Subagent 模式：主 agent 协调，各阶段由专业 subagent 独立执行 |
| `/dev-flow -research` | 仅执行项目调研 |
| `/dev-flow -analyze <需求>` | 仅执行需求分析 |
| `/dev-flow -design <需求>` | 仅执行详细设计 |
| `/dev-flow -split <需求>` | 仅执行任务拆分 |
| `/dev-flow -develop <需求>` | 直接开发（跳过设计和拆分） |
| `/dev-flow -test` | 生成单元测试并执行 |
| `/dev-flow -smoke` | 执行冒烟测试 |
| `/dev-flow -e2e` | 执行端到端测试 |
| `/dev-flow -integration` | 执行集成测试 |
| `/dev-flow -delivery` | 生成交付报告 |
| `/dev-flow -fix` | 分析并修复 Bug |
| `/dev-flow -hotfix <错误信息>` | 紧急修复线上错误 |
| `/dev-flow --resume` | 从上次中断处继续 |
| `/dev-flow -cleanup` | 清理会话记忆，保留长期记忆 |
| `/dev-flow -cleanup --all` | 清理全部记忆（重置） |

## 运行模式

### 🔴🔴 统一 Subagent 执行架构（唯一执行模型）

> **核心原则**：无论需求规模大小，所有阶段**必须由专门的 subagent 执行**，主 Agent 仅作为调度枢纽。
> 不存在"标准模式直接执行"的路径——区别仅在于 subagent 的创建方式。

| 维度 | 简单需求（≤5 文件） | 复杂需求（>5 文件） |
|------|-------------------|-------------------|
| 主 Agent 角色 | 串行调度（一个 subagent 完成后再创建下一个） | 并行调度（按 DAG 批次同时创建多个 subagent） |
| subagent 执行 | 每个 subagent 串行执行 | 同一批次的 subagent 并行执行 |
| 主 Agent 编辑文件 | 🔴 禁止 | 🔴 禁止 |

### 平台能力分级

> **不同 AI 编程平台的 Subagent 能力差异很大，系统必须根据当前平台选择合适的调度策略。**

| 平台 | Subagent 支持 | 并行能力 | 调度策略 |
|------|--------------|---------|---------|
| **Trae** | `/agent-name` 斜杠命令 | 原生并行 | 完整并行模式 |
| **Cursor** | `.cursor/agents/*.md` YAML frontmatter | 多 Task 调用并行 + 后台模式 + 嵌套 | Cursor 并行模式 |
| **Claude Code** | Dynamic Workflows JS 编排 + `.claude/agents/*.md` | 16 并发 + 1000 总量 + 对抗验证 | Claude 并行模式 |
| **Qoder** | Quest Mode 主从 Agent 架构 | 前端/后端/测试/部署方向并行 | Qoder 主从并行模式 |
| **Codex** | `.codex/agents/*.toml` + `AGENTS.md` | 6 线程 + CSV 批量 | Codex 有限并行模式 |

> **所有五大平台均支持 Subagent 并行执行**，Orchestrator 根据当前平台自动选择最优调度策略。

**并行开发适配规则**：
- **Trae**：同批次任务同时启动多个 `/develop-expert`，通过 `task-result.yaml` 传递产出
- **Cursor**：一条消息中发送多个 Task 工具调用实现真正并行，支持 `is_background: true` 后台模式，通过 `~/.cursor/subagents/` 或直接返回获取结果
- **Claude Code**：Dynamic Workflows JS 编排脚本派发 subagent，利用 16 并发上限，对抗验证自动检查产出质量
- **Qoder**：主 Agent 规划调度，子 Agent 按方向（前端/后端/测试/部署）并行处理，Quest Mode Checkpoints 确保质量
- **Codex**：通过 `run agent: develop-expert` 启动 subagent，6 线程并行，通过 `task-result.yaml` 传递产出

### Subagent 架构（唯一执行模型）

**所有阶段均由专业 subagent 执行，主 Agent 作为纯调度器**。

**架构**：
```
用户 ←→ 主 Agent（纯调度枢纽，零编辑）
              │
              ├── research（多子代理分批架构）
              │     ├── pre-scanner           → 全局 Quick Scan → file-index.yaml
              │     ├── batch-1 (基础层 ×3)   → project-overview / service-registry / architecture
              │     ├── batch-2 (数据层 ×3)   → common-modules / models / config
              │     ├── batch-3 (行为层 ×3)   → apis / utils / conventions
              │     ├── batch-4 (横切层 ×2)   → dependency-graph / decisions
              │     └── batch-5 (模板层 ×2)   → mistakes / patterns
              ├── analyze-expert     → 分析需求，输出需求分析文档
              ├── design-expert      → 详细设计，输出设计文档
              ├── task-split-expert  → 任务拆分，输出任务清单（DAG）
              ├── develop-expert     → 代码开发（可并行多个）
              │     ├── 开发中汇报机制 → 向主 Agent 汇报进度
              │     ├── @on-demand-loader → 按需加载未扫描的类
              │     └── @runtime-state-manager → 状态持久化、断点续传
              ├── test-expert        → 单元测试，输出测试报告
              ├── smoke-test-expert  → 冒烟测试，输出冒烟测试报告
              ├── e2e-test-expert    → 端到端测试，输出测试报告
              ├── integration-test-expert → 集成测试，输出测试报告
              ├── fix-expert         → Bug 修复，输出修复代码
              └── delivery-expert    → 生成交付报告
```

**工作流程**：
1. 主 Agent 接收需求，创建会话目录 `.dev-flow/sessions/{session-id}/`
2. 主 Agent 按顺序调度 subagent：Research → Analyze → Design → Develop → Verify
3. **简单需求**：串行调度（一个 subagent 完成后再创建下一个）
4. **复杂需求**：按 DAG 批次并行调度（同批次多个 subagent 同时启动）
5. 每个 subagent 在独立上下文中执行，只读取必要的文件
6. 主 Agent 收集各 subagent 结果，整合后向用户汇报
7. **主 Agent 始终不直接执行任何文件编辑操作**

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
- 详见 `{{AGENTS_PATH}}task-protocol.md`

**子代理创建策略**：
- 简单需求（≤5 文件/单服务）：主 Agent 串行创建单个 subagent，一个完成后再创建下一个
- 复杂需求（>5 文件/多服务/深度 DAG）：主 Agent 按 DAG 批次并行创建多个 subagent
- 无论何种复杂度，主 Agent **永远不直接编辑文件**

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
| 🟢 **已解决** | Research 扫描大项目 | 项目 >200 个文件 | pre-scanner + 13 文件子代理分 5 批并行执行，每个子代理独立上下文（~25-40KB） |
| 🟡 **中** | 复杂需求分析 | 涉及 3+ 服务，10+ 功能点 | analyze-expert 独立上下文 + subagent-only |
| 🟢 **已解决** | Subagent 上下文不足 | 任何 subagent | v3.0 上下文自动注入系统（prepare-context.cjs） |

### 强制 Subagent 执行规则

**执行前必须检查**：

```
Step 0: 检测需求规模（仅决定 subagent 创建方式，不决定是否使用 subagent）
  │
  ├── 预估文件数 ≤ 5 且 复杂度 = 低
  │     └── 串行 Subagent 模式：每个阶段创建 1 个 subagent，串行执行
  │
  ├── 预估文件数 > 5 或 复杂度 ≥ 中
  │     └── 批次并行 Subagent 模式：Task Split 后按 DAG 批次并行创建 subagent
  │
  └── 预估文件数 > 10 或 项目 >200 文件
        └── 强制并行 Subagent 模式：Orchestrator 完整调度

  ⚠️ 无论哪种规模，主 Agent 均不直接编辑文件。
```

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
| 简单 CRUD（1-3 文件） | 串行 Subagent | 每阶段 1 个 subagent，串行执行 |
| 中等需求（4-5 文件） | 串行 Subagent | 每阶段 1 个 subagent，串行执行 |
| 复杂需求（6+ 文件） | **批次并行 Subagent** | Task Split 后按 DAG 批次并行 |
| 大型重构 | **完整并行 Subagent** | Orchestrator 调度 |
| 多服务联调 | **完整并行 Subagent** | 并行开发 + 集成验证 |

> **⚠️ 所有种场景下，主 Agent 均不直接编辑文件。**

---

## 开发规模分级（Mode Selector）

> 根据需求规模和复杂度，自动推荐最适合的执行模式。用户也可手动选择。

| 级别 | 名称 | 代码量 | 适用范围 | 推荐命令 | 流程 |
|------|------|--------|----------|----------|------|
| L0 | 📋 **轻量模式** | 1 个文件 | 配置修改、常量添加、单文件 Bug 修复 | `/dev-flow --lite <需求>` | Research(快速) → Fix → Delivery |
| L1 | 🔧 **小型模式** | 2-5 个文件 | 简单 CRUD、小功能增强 | `/dev-flow <需求>` | Research → Analyze → Design → Develop → Test → Delivery |
| L2 | 🏗️ **标准模式** | 5-10 个文件 | 中等功能、单服务开发 | `/dev-flow --detailed <需求>` | Research → Analyze → Design → Task Split → Develop → Unit Test → Smoke Test → Delivery |
| L3 | 🏢 **企业级模式** | 10+ 个文件 | 复杂功能、多服务联调、大型重构 | `/dev-flow -subagent <需求>` | Research → Analyze → Design → Task Split → Develop(并行) → Unit Test → Smoke Test → E2E Test → Integration Test → Delivery |

### 模式自动检测规则

执行 `/dev-flow <需求>` 时，系统自动按以下规则判断 subagent 调度方式：

```
Step 0: 检测需求规模（初始决策，仅决定调度方式）
  │
  ├── 关键词含 "fix"/"修复" + 文件数 ≤ 1 → L0 轻量模式（串行 Subagent）
  │
  ├── 预估文件数 ≤ 5 + 复杂度 = 低 → L1 小型模式（串行 Subagent）
  │
  ├── 预估文件数 5-10 或 复杂度 = 中 → L2 标准模式（串行→可能升级并行）
  │     └── 完整流程，含 Task Split 和 Smoke Test
  │     └── ⚠️ 注意：进入 Develop 前会执行动态重评估（见下方）
  │
  └── 预估文件数 > 10 或 复杂度 = 高 → L3 企业级模式（并行 Subagent）
        └── Orchestrator 完整调度，含并行开发和 Integration Test

  ⚠️ 无论何种模式，主 Agent 始终不直接编辑文件。
```

### 🔴 模式动态重评估网关（Task Split → Develop 转换点）

> **核心改进**：调度策略不再是"一次性决策"。在 Task Split 确认后、Develop 阶段进入前，
> 系统基于 Task Split 实际产出数据**动态重评估**是否需要升级为并行 Subagent 调度。

**重评估触发时机**：Task Split 阶段确认后，进入 Develop 阶段之前。

**重评估流程**：

```
🔴 模式动态重评估（Task Split 确认后自动执行）

Step R1: 读取任务 DAG 数据
  ├── 读取 .dev-flow/docs/{需求简称}-task-dag.yaml
  └── 或读取 task-split 产出中的任务清单和依赖关系

Step R2: 计算复杂度指标
  ├── total_tasks: 任务总数
  ├── write_conflicts: 写写冲突数量（需串行处理）
  ├── dag_depth: DAG 最大依赖层级深度
  └── batch_count: 拓扑排序后的批次数量

Step R3: 重评估判定
  │
  ├── 满足以下任一条件 → 🔴 自动升级为并行 Subagent 调度（Orchestrator）
  │     ├── total_tasks > 5
  │     ├── write_conflicts > 0（存在需要串行化的文件冲突）
  │     ├── dag_depth > 3（依赖链条过长）
  │     └── batch_count > 3（批次过多，串行 Subagent 难以高效处理）
  │
  └── 全部不满足 → ✅ 继续串行 Subagent 调度（主 Agent 串行创建单个 develop-expert）

Step R4: 升级时通知用户
  ├── 输出：
  │   【调度策略升级通知】
  │   当前调度：串行 Subagent（L2）
  │   升级原因：检测到 {total_tasks} 个任务，{write_conflicts} 个写写冲突，DAG 深度 {dag_depth}
  │   自动升级为：并行 Subagent 调度（Orchestrator，L3）
  │   效果：Develop 阶段将由 Orchestrator 按批次并行调度多个 develop-expert subagent
  │
  └── 无需用户额外确认，已在 Task Split 阶段确认清单中包含"开发模式选择"项
```

### 模式对比速查

| 维度 | L0 轻量 | L1 小型 | L2 标准 | L3 企业级 |
|------|---------|---------|---------|----------|
| 阶段数 | 3 | 6 | 8 | 10 |
| 是否需要 Task Split | ❌ | ❌ | ✅ | ✅ |
| 是否支持并行开发 | ❌ | ❌ | ❌ | ✅ 多 Agent |
| 测试深度 | 基础 | 单元测试 | 单元+冒烟 | 单元+冒烟+集成 |
| 交付物 | 代码变更 | 代码+报告 | 代码+完整报告 | 代码+详细报告+部署指南 |
| 适用场景 | 紧急修复 | 日常小需求 | 常规功能 | 重大项目 |

### 手动覆盖

任何时候都可以手动指定级别：
- `--lite` → 强制轻量模式
- `--detailed` → 强制标准模式  
- `-subagent` → 强制企业级模式
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

> **每个阶段完成后，必须输出结构化确认 Checklist，等待用户逐项确认。未确认不得进入下一阶段。**

### 🔴 阶段交付物协议（v3.1 新增 — 硬性约束）

> **核心原则**：每个阶段完成后，必须生成独立的交付物文档（存放于 `.dev-flow/deliverables/`），
> 主 Agent 读取并打开交付物文档供用户审阅，用户确认后写入 `.confirmed` 文件方可进入下一阶段。

**交付物目录结构**：

```
.dev-flow/deliverables/
├── 01-research-report.md         # Research 阶段交付物
├── 02-analyze-result.md          # Analyze 阶段交付物
├── 03-design-result.md           # Design 阶段交付物（含 design-contract.yaml）
├── 04-task-breakdown.md          # Task Split 阶段交付物（含 task-dag.yaml）
├── 05-develop-result.md          # Develop 阶段交付物
├── 06-unit-test-report.md        # Unit Test 阶段交付物
├── 07-fix-report.md              # Fix 阶段交付物
├── 08-smoke-test-report.md       # Smoke Test 阶段交付物
├── 09-e2e-test-report.md         # E2E Test 阶段交付物
├── 10-integration-test-report.md # Integration Test 阶段交付物
└── 11-delivery-report.md         # Delivery 阶段交付物
```

> **⚠️ 目录自动创建规则（v3.1 新增）**：
> 每个阶段生成交付物前，subagent 必须先检查 `.dev-flow/deliverables/` 目录是否存在。
> 如不存在，执行 `Bash "mkdir -p .dev-flow/deliverables/"` 创建目录后再写入文件。
> 此规则适用于所有阶段交付物生成步骤（Step X.Y）。

**主 Agent 审批流程（每阶段统一执行）**：

```
Step A: Subagent 完成 → 交付物已生成到 .dev-flow/deliverables/
  │
Step B: 主 Agent 读取交付物文档（Read 工具）
  │
Step C: 主 Agent 使用 open_result_view 打开交付物文档
  │   ├── 用户可以在 IDE 中直接查看交付物内容
  │   └── 这是结构化的文档，不是对话栏的简短摘要
  │
Step D: 主 Agent 输出结构化确认 Checklist
  │   ├── Checklist 中明确引用交付物文件路径
  │   ├── 示例："📄 交付物：.dev-flow/deliverables/01-research-report.md"
  │   └── 提示用户打开文档查看详情
  │
Step E: 等待用户逐项确认
  │
Step F: 用户确认后 → 写入两样东西：
  │   ├── .dev-flow/stage-confirmations/{stage}.confirmed（确认文件）
  │   └── 确认文件中记录交付物路径和校验和
  │
Step G: 进入下一阶段（Router 层门禁检查交付物存在性）
```

> **⚠️ 关键规则**：
> - ❌ 禁止仅在对话栏展示结果而不生成交付物文档
> - ❌ 禁止在交付物文档未生成时请求用户确认
> - ❌ 禁止用"已在对话中展示"代替打开交付物文档
> - ✅ 每个阶段必须生成独立的 `.dev-flow/deliverables/` 下的文档
> - ✅ 主 Agent 必须主动打开交付物文档供用户查看


**🔴 确认持久化规则（文件级硬约束）**：

> 阶段确认不仅是 prompt 软约束，必须写入确认文件作为硬约束。
> 后续阶段在开始执行前，必须检查前一阶段的确认文件是否存在。

```
每个阶段确认后，必须写入确认文件：

.dev-flow/stage-confirmations/
├── research.confirmed      # Research 阶段确认文件
├── analyze.confirmed       # Analyze 阶段确认文件
├── design.confirmed        # Design 阶段确认文件
├── task-split.confirmed    # Task Split 阶段确认文件
├── develop.confirmed       # Develop 阶段确认文件
├── unit-test.confirmed     # Unit Test 阶段确认文件
├── smoke-test.confirmed    # Smoke Test 阶段确认文件
├── integration-test.confirmed  # Integration Test 阶段确认文件
└── e2e-test.confirmed      # E2E Test 阶段确认文件
```

**确认文件格式（v3.1 增强版）**：
```yaml
# .dev-flow/stage-confirmations/{stage}.confirmed
stage: research
confirmed_at: "2026-06-05T11:30:00"
confirmed_by: user
session_id: "session-xxx"
deliverable: ".dev-flow/deliverables/01-research-report.md"  # v3.1 新增：关联交付物路径
deliverable_checksum: "abc123..."                            # v3.1 新增：交付物校验和
checklist:
  - item: "项目架构已识别"
    status: confirmed
  - item: "技术栈已确认"
    status: confirmed
  - item: "影响范围已评估"
    status: confirmed
execution_trail:              # v3.1 新增：执行溯源
  executor: "pre-scanner + file-level subagents (13 total, 5 batches)"
  files_produced:
    - path: ".dev-flow/memory/project-overview.md"
      checksum: "def456..."
    - path: ".dev-flow/deliverables/01-research-report.md"
      checksum: "abc123..."
  zero_edit_violation: false
notes: ""
```

**🔴 阶段门禁检查（下一阶段开始前必须执行）**：

```
进入 Analyze 阶段前 → 检查 research.confirmed 是否存在
进入 Design 阶段前 → 检查 analyze.confirmed 是否存在
进入 Task Split 阶段前 → 检查 design.confirmed 是否存在
进入 Develop 阶段前 → 检查 task-split.confirmed 是否存在
进入 Unit Test 阶段前 → 检查 develop.confirmed 是否存在
进入 E2E Test 阶段前 → 检查 smoke-test.confirmed 是否存在
进入 Integration Test 阶段前 → 检查 e2e-test.confirmed 是否存在

如果确认文件不存在 → 拒绝进入下一阶段，提示用户先确认前一阶段
```

**标准确认 Checklist 模板**：
```markdown
## ✅ 阶段确认清单 — {阶段名称}

📄 **交付物文档**：`.dev-flow/deliverables/{序号}-{阶段}-{文档名}.md`
   → 已自动打开，请切换到文档Tab查看完整内容

| # | 确认项 | 状态 |
|---|--------|------|
| 0 | **执行者审计**：本阶段由 {stage}-expert subagent 执行，主 Agent 未直接编辑任何文件 | ⬜ 待确认 |
| 0.5 | **交付物完整性**：交付物文档已生成且内容非空，文件修改审计通过 | ⬜ 待确认 |
| 1 | [阶段核心产出描述] | ⬜ 待确认 |
| 2 | [完整性检查描述] | ⬜ 待确认 |
| 3 | [与需求一致性检查] | ⬜ 待确认 |
| 4 | [后续阶段准备就绪] | ⬜ 待确认 |

**用户操作**：
- 📖 请先查看已打开的交付物文档（`.dev-flow/deliverables/` 下的对应文件）
- 确认无误 → 回复 "确认" 或 "继续" 进入下一阶段（系统自动写入确认文件）
- 需要修改 → 指出具体问题，返回当前阶段修正
- 需要重新执行 → 回复 "重新执行"
```

**硬性阻断规则**：
- ❌ 禁止跳过确认直接进入下一阶段
- ❌ 禁止用"看起来没问题"等模糊描述代替逐项确认
- ❌ 禁止在确认文件不存在的情况下进入下一阶段
- ✅ 如果用户说"继续"但 Checklist 未全部确认，补充确认遗漏项
- ✅ 用户确认后，立即将确认文件写入 `.dev-flow/stage-confirmations/`

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

> **这是系统级硬约束，不是 prompt 级软约束。无论通过何种方式进入某阶段，都必须先执行此门禁检查。**
> **此检查在读取阶段指令文件之前执行，确保即使 AI 跳过阶段指令中的门禁描述，也无法绕过检查。**

**门禁检查流程（进入任何阶段前，第一条执行的逻辑）**：

```
🔴 阶段门禁硬性检查（Router 层执行）

进入目标阶段 X 之前：

  Step Gate-1: 读取确认文件目录
    ├── 执行：Bash "ls .dev-flow/stage-confirmations/" 或 Glob ".dev-flow/stage-confirmations/*.confirmed"
    └── 获取已确认的阶段列表

  Step Gate-2: 匹配前置阶段确认
  Step Gate-1.5: 🔴 交付物存在性检查（v3.1 新增）
    ├── 根据「阶段依赖链」检查目标阶段的前置阶段交付物是否存在
    │
    │  交付物检查表（与阶段对应）：
    │  Analyze  ← .dev-flow/deliverables/01-research-report.md 必须存在
    │  Design   ← .dev-flow/deliverables/02-analyze-result.md 必须存在
    │  TaskSplit ← .dev-flow/deliverables/03-design-result.md 必须存在
    │  Develop  ← .dev-flow/deliverables/04-task-breakdown.md 必须存在
    │  UnitTest ← .dev-flow/deliverables/05-develop-result.md 必须存在
    │  SmokeTest ← .dev-flow/deliverables/06-unit-test-report.md 必须存在
    │  E2ETest  ← .dev-flow/deliverables/08-smoke-test-report.md 必须存在
    │  IntegrationTest ← .dev-flow/deliverables/09-e2e-test-report.md 必须存在
    │  Delivery ← .dev-flow/deliverables/10-integration-test-report.md 必须存在
    │
    └── 交付物判定：
        ├── ✅ 交付物存在且非空 → 检查通过
        └── ❌ 交付物不存在或为空 → 拒绝进入，输出：
            【🔴 交付物缺失】
            当前尝试进入：{目标阶段}
            缺失交付物：{交付物文件路径}
            原因：前置阶段的交付物尚未生成
            操作：请先完成前置阶段，确保 .dev-flow/deliverables/ 下文档已生成


    ├── 根据「阶段依赖链」检查前置阶段确认文件是否存在
    │
    │  阶段依赖链（严格顺序）：
    │  Research ← (无前置) ← 第一个阶段，无需检查
    │  Analyze  ← Research.confirmed 必须存在
    │  Design   ← analyze.confirmed 必须存在
    │  TaskSplit ← design.confirmed 必须存在
    │  Develop  ← task-split.confirmed 必须存在
    │  UnitTest ← develop.confirmed 必须存在
    │  SmokeTest ← unit-test.confirmed 必须存在
    │  E2ETest  ← smoke-test.confirmed 必须存在
    │  IntegrationTest ← e2e-test.confirmed 必须存在
    │  Fix      ← 由 Test 阶段触发，无前置确认要求
    │  Delivery ← integration-test.confirmed 必须存在
    │
    └── 读取对应的确认文件，校验内容：
        ├── 文件必须包含 stage 字段且值匹配
        ├── 文件必须包含 confirmed_at 时间戳
        └── 文件必须包含 checklist 且每个 item 状态为 confirmed

  Step Gate-2.5: 🔴 执行者审计（🔴 零编辑铁律验证）
    ├── 检查前一阶段的确认文件中 checklist 是否包含执行者审计项
    │   ├── checklist 中应有："阶段由 {stage}-expert subagent 执行，主 Agent 未直接编辑文件"
    │   └── 如缺失 → 回退到前一阶段，要求由 subagent 重新执行
    │
    └── 如果前一阶段确认文件中标记了"主 Agent 直接编辑" → 拒绝进入下一阶段

  Step Gate-3: 门禁判定
    ├── ✅ 前置确认文件存在且内容完整 → 允许进入目标阶段
    ├── ❌ 确认文件不存在 → 拒绝进入，输出以下信息并停止：
    │
    │   【🔴 阶段门禁阻止】
    │   当前尝试进入：{目标阶段}
    │   缺少前置确认：{前置阶段}.confirmed
    │   原因：{前置阶段} 尚未完成用户确认
    │   操作：请先完成 {前置阶段} 并确认后，再进入 {目标阶段}
    │
    └── ❌ 确认文件内容不完整 → 拒绝进入，提示补充确认
```

**特殊场景处理**：

| 场景 | 门禁规则 |
|------|---------|
| `/dev-flow -research` | 无前置要求，直接执行 |
| `/dev-flow -analyze <需求>` | 检查 research.confirmed |
| `/dev-flow -design <需求>` | 检查 analyze.confirmed |
| `/dev-flow -split <需求>` | 检查 design.confirmed |
| `/dev-flow -develop <需求>` | 检查 task-split.confirmed（全流程时）/ 无前置（直接开发时） |
| `/dev-flow -fix` | 无前置确认要求（由 Bug 触发） |
| `/dev-flow --resume` | 读取最后一个 confirmed 文件，从下一阶段继续 |
| 跳过某阶段（用户明确要求） | 自动跳过该阶段的门禁检查，但后续阶段的门禁仍检查最后一个已确认的阶段 |
| L0 轻量模式 | 仅检查 research.confirmed（如存在） |

**确认文件内容校验规则**：

```yaml
# 有效的确认文件必须包含以下所有字段：
stage: "research"              # 必填：阶段名称
confirmed_at: "2026-06-05T..." # 必填：确认时间
confirmed_by: "user"            # 必填：确认人
session_id: "session-xxx"       # 必填：会话 ID
checklist:                      # 必填：确认清单
  - item: "项目架构已识别"
    status: "confirmed"         # 每个item必须为confirmed
# 至少包含以下校验：
artifacts_checksum: "abc123"    # 可选：产出物校验和（防伪造）
```

> **⚠️ 关键规则**：即使阶段指令文件（如 research.md）中也包含门禁检查描述，**Router 层的检查仍然必须执行**。这是双重保险机制。
> **执行顺序**：先执行 Router 层门禁检查（本节）→ 通过后 → 再读取目标阶段指令文件 → 阶段指令中的门禁作为二次确认。

---

| 阶段 | 指令文件 | 加载时机 | 前置确认文件 |
|------|---------|---------|------------|
| Research（项目调研） | `{{STAGES_PATH}}research.md` | 进入阶段一 | 无 |
| Analyze（需求分析） | `{{STAGES_PATH}}analyze.md` | 进入阶段二 | `research.confirmed` |
| Design（详细设计） | `{{STAGES_PATH}}design.md` | 进入阶段三 | `analyze.confirmed` |
| Task Split（任务拆分） | `{{STAGES_PATH}}task-split.md` | 进入阶段四 | `design.confirmed` |
| **Develop（开发执行）** | **`{{STAGES_PATH}}develop.md`** | **进入阶段五** | `task-split.confirmed` |
| Unit Test（单元测试） | `{{STAGES_PATH}}unit-test.md` | 进入阶段六 | `develop.confirmed` |
| Fix（Bug 修复） | `{{STAGES_PATH}}fix.md` | 进入阶段七 | 无（Bug 触发） |
| Hotfix（独立模式） | `{{STAGES_PATH}}hotfix.md` | 使用 Hotfix 模式 | 无 |
| Smoke Test（冒烟测试） | `{{STAGES_PATH}}smoke-test.md` | 进入阶段八 | `unit-test.confirmed` |
| E2E Test（端到端测试） | `{{STAGES_PATH}}e2e-test.md` | 进入阶段九 | `smoke-test.confirmed` |
| Integration Test（集成测试） | `{{STAGES_PATH}}integration-test.md` | 进入阶段十 | `e2e-test.confirmed` |
| Delivery（交付报告） | `{{STAGES_PATH}}delivery.md` | 进入阶段十一 | `integration-test.confirmed` |

### 加载规则

1. **标准模式**：按顺序进入每个阶段时，读取对应阶段的指令文件
2. **Subagent 模式**：每个 subagent 只加载自己阶段的指令文件
3. **Develop 阶段额外加载**：进入 Develop 阶段时，还需加载 `{{STAGES_PATH}}code-reference.md`（包含代码模板和错误模式）
4. **跳过的阶段不加载**：如果用户要求跳过某个阶段，该阶段的指令文件不需要加载

### 主 Agent 调度流程

> **当用户输入 `/dev-flow <需求>` 时，主 Agent 按以下步骤串行/并行调度各阶段 subagent：**
> **主 Agent 在整个流程中不直接编辑任何文件，仅负责调度、读取结果和与用户交互。**

```
Step 1: 创建 pre-scanner subagent → 执行 Phase 0 Quick Scan → 输出 file-index.yaml
Step 2: 等待 pre-scanner 完成 → 读取 file-index.yaml → 按批次并行调度 13 个文件子代理
Step 3: 等待全部 13 个文件子代理完成 → 执行 Step 7 自检 → Step 7.5 生成交付物 → 打开 01-research-report.md → 输出确认 Checklist → 等待用户确认
  ↓ 用户确认 → 写入 research.confirmed
Step 4: 🔴 门禁检查（Gate-1/1.5/2/2.5）→ 通过后创建 analyze-expert subagent → 执行 Analyze 阶段
Step 5: 等待 analyze-expert 完成 → 读取交付物
Step 6: 读取交付物文档 → 打开 02-analyze-result.md → 输出确认 Checklist → 等待用户确认
  ↓ 用户确认 → 写入 analyze.confirmed
Step 7: 🔴 门禁检查 → 通过后创建 design-expert subagent → 执行 Design 阶段
Step 8: 等待 design-expert 完成 → 读取交付物
Step 9: 读取交付物文档 → 打开 03-design-result.md → 输出确认 Checklist → 等待用户确认
  ↓ 用户确认 → 写入 design.confirmed
Step 10: 🔴 门禁检查 → 通过后创建 task-split-expert subagent → 执行 Task Split 阶段
Step 11: 等待 task-split-expert 完成 → 读取交付物
Step 12: 读取交付物文档 → 打开 04-task-breakdown.md → 输出确认 Checklist → 等待用户确认
  ↓ 用户确认 → 写入 task-split.confirmed
  ┌──────────────────────────────────────────────────────────────┐
  │ 🔴 模式动态重评估网关（详见「模式动态重评估网关」章节）         │
  │ 读取 task-dag.yaml → 计算复杂度指标 → 判断调度策略             │
  │ 满足条件（任务>5/写写冲突/DAG深度>3/批次>3）→ 升级为并行调度   │
  │ 不满足 → 继续串行调度（每阶段一个 subagent）                   │
  └──────────────────────────────────────────────────────────────┘
  ↓ 重评估通过
Step 13: 根据调度策略创建 develop-expert subagent
        ├── 串行调度 → 创建 1 个 develop-expert，串行执行所有任务
        └── 并行调度 → 启动 Orchestrator，按 DAG 批次并行派发多个 develop-expert
Step 14: 等待所有 develop-expert 完成 → 读取交付物 → 打开 05-develop-result.md → 输出确认 Checklist → 等待确认
  ↓ 用户确认 → 写入 develop.confirmed
Step 15: 🔴 门禁检查 → 通过后创建 test-expert subagent → 执行 Unit Test
Step 16: 等待完成 → 读取交付物 → 打开 06-unit-test-report.md → 输出确认 Checklist → 等待确认
  ↓ 用户确认 → 写入 unit-test.confirmed
Step 17-N: 🔴 继续调度 Smoke Test → E2E Test → Integration Test → Delivery
           各阶段统一流程：门禁检查 → Subagent 执行 → 读取交付物 → 打开文档 → 确认 Checklist → 写入 .confirmed
```

**关键规则**：
- **每个阶段都由专门的 subagent 执行，主 Agent 不直接编辑文件**
- **每个阶段完成后必须暂停，等待用户确认后才能调度下一阶段**
- **🔴 Task Split 确认后自动执行模式动态重评估，基于实际任务数据判断是否升级并行调度**
- **Develop 阶段根据重评估结果选择调度方式**：并行调度走 Orchestrator，串行调度走单个 develop-expert

---

## 记忆系统

> 详细记忆目录结构、使用规则、文件格式和会话/长期记忆分类见 `{{REFERENCES_PATH}}memory-system.md`。
> Research 完成后读取以生成记忆文件；Design/Analyze/Develop 前按需读取。

**快速参考**：
- 长期记忆（跨会话保留）：project-overview、conventions、patterns、mistakes、preferences、decisions
- 会话记忆（每次 Research 重建，存放在 `session/` 子目录）：modules、apis、models、utils、config、architecture
- 强化机制：使用 >3 次标记"高频"，>5 次标记"标准"
- 清理命令：`/dev-flow -cleanup`（清理会话记忆）/ `/dev-flow -cleanup --all`（重置全部）

---

## 学习能力

> 详细学习机制、示例和效果评估见 `{{REFERENCES_PATH}}learning-system.md`。
> Research / Develop / Fix 阶段结束后按需读取执行学习动作。

**快速参考**：
- 学习来源：用户反馈、隐式学习（代码修改观察）、阶段间学习（Bug→mistakes, 修复→patterns）
- 关键学习动作：用户表扬→patterns、用户修改→preferences/patterns、测试Bug→mistakes、模式复用3次→标记高频
- 阶段结束提示：主动询问用户"结果是否符合预期？"
