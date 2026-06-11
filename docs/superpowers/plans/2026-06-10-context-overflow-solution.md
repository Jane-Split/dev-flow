# 上下文溢出根治方案（Phase 1+2+3）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 彻底解决 dev-flow 因 AI 上下文窗口有限导致的开发不完整、代码错误问题，使 128KB 模型也能稳定完成复杂微服务需求。

**Architecture:** 三层改造——Phase 1 硬约束脚本增强（动态上下文预算）、Phase 2 主 Agent 状态机化（对话历史解耦）、Phase 3 查询协议模板（预加载骨架+按步精准查询）。三层独立可部署，逐层叠加收益。

**Tech Stack:** Node.js (cjs)、YAML、Markdown、零外部依赖

---

## 问题定义

### 根本矛盾

```
AI 上下文窗口是有限的物理资源，三类信息竞争同一空间：

  指令规则（必须） + 项目知识（必须） + 代码生成（必须）
       ↑                  ↑                  ↑
   减少则违规        减少则做错         减少则截断
```

### 当前缺陷清单

| # | 缺陷 | 位置 | 影响 |
|---|------|------|------|
| 1 | `MAX_BRIEF_SIZE = 120KB` 固定值，不区分模型 | `prepare-context.cjs:29` | 128KB 模型子代理上下文被 brief 占满，无代码生成空间 |
| 2 | `extractRelevantContract()` 粗糙截取 | `prepare-context.cjs:448-481` | 契约提取不完整，子代理可能基于错误信息编码 |
| 3 | 主 Agent 对话历史持续累积，无有效压缩 | 全流程 | 9 阶段后主 Agent 上下文 ~78KB，调度精度下降 |
| 4 | 上下文监控阈值（70%/85%/95%）是软约束 | `context-manager.md` | AI 无法准确感知上下文使用率，所有保护形同虚设 |
| 5 | 子代理一次性加载 60-105KB brief | `prepare-context.cjs` | 大量当前步骤不需要的细节占用上下文 |
| 6 | `segment-code.cjs` 分段执行是建议性 | `segment-code.cjs` | 子代理可跳过分段，单次生成 50KB+ 代码导致截断 |

### 量化目标

| 指标 | 当前 | Phase 1 后 | Phase 1+2 后 | Phase 1+2+3 后 |
|------|------|-----------|-------------|---------------|
| 主 Agent 上下文（9 阶段后） | ~78KB | ~78KB | ~19KB | ~19KB |
| 子代理初始上下文 | 60-105KB | 45-90KB（动态） | 45-90KB | 8-33KB（分层） |
| 128KB 模型代码生成空间 | 0-23KB | 23-38KB | 23-38KB | 43-83KB |
| 200KB 模型代码生成空间 | 35-65KB | 65-95KB | 65-95KB | 107-155KB |
| 上下文溢出风险 | 高频 | 中频 | 低频 | 极低频 |

---

## 文件变更清单

### 新增文件

| 文件路径 | 职责 |
|---------|------|
| `scripts/context-budget.cjs` | 上下文预算计算引擎（模型检测+动态阈值+预算报告） |
| `scripts/orchestrator-state.cjs` | 主 Agent 状态持久化/恢复工具 |
| `scripts/query-protocol.cjs` | 查询协议生成器（四源合并+查询清单生成+精准片段提取） |

### 修改文件

| 文件路径 | 修改内容 | Phase |
|---------|---------|-------|
| `scripts/prepare-context.cjs` | 动态 MAX_BRIEF_SIZE + 集成 context-budget.cjs + 集成 query-protocol.cjs | 1, 3 |
| `scripts/segment-code.cjs` | 分段执行强制化（生成锁文件） | 1 |
| `scripts/validate-result.cjs` | 增加分段锁文件验证 | 1 |
| `skill-templates/_core/SKILL.md` | 阶段间状态恢复逻辑 + 查询协议路由 | 2, 3 |
| `skill-templates/_core/stages/develop.md` | 域路由+查询协议+分层预加载说明 | 3 |
| `skill-templates/_core/agents/backend-develop-expert.md` | 分层预加载+查询协议执行流程 | 3 |
| `skill-templates/_core/agents/frontend-develop-expert.md` | 分层预加载+查询协议执行流程 | 3 |
| `skill-templates/_core/agents/context-manager.md` | 集成 context-budget.cjs + 硬约束升级 | 1 |
| `skill-templates/_core/references/protocol.md` | 阶段间状态恢复协议 + 分段锁协议 | 1, 2 |
| `skill-templates/_core/references/model-context-config.md` | 动态阈值配置更新 | 1 |

### 不修改的文件

- `skill-templates/_core/stages/research.md` — Research 子代理已是按需查询模式
- `skill-templates/_core/stages/clarify.md` — 输入量小，无需改造
- `skill-templates/_core/stages/analyze.md` — A 类预加载 ~21KB，安全
- `skill-templates/_core/stages/design.md` — A 类预加载 ~35-50KB，安全
- `skill-templates/_core/stages/task-split.md` — 输入量小，无需改造
- `skill-templates/_core/stages/test.md` — 天然适合按需查询
- `skill-templates/_core/stages/fix.md` — 输入量小，无需改造
- `skill-templates/_core/stages/delivery.md` — 输入量小，无需改造
- `scripts/build.cjs` — 构建脚本无需改动
- `scripts/dispatch.cjs` — 调度引擎无需改动
- `scripts/install.js` — 安装脚本无需改动

---

## Phase 1：硬约束脚本增强

### 目标

将上下文保护从"软约束（AI 自觉执行）"升级为"硬约束（脚本强制执行）"，消除 60% 的溢出风险。

### 设计原则

1. **脚本 > 提示词**：能由脚本强制执行的，不依赖 AI 自觉
2. **动态 > 静态**：根据模型窗口动态计算阈值，不使用固定值
3. **阻断 > 警告**：超限时强制分段，不是建议分段

---

### Task 1.1：创建 context-budget.cjs（上下文预算计算引擎）

**Files:**
- Create: `scripts/context-budget.cjs`

**职责**：

```yaml
核心功能:
  1. 模型上下文窗口检测
  2. 动态 MAX_BRIEF_SIZE 计算
  3. 上下文预算报告生成
  4. 分段模式强制触发

输入:
  --model <model_name>    模型名称（如 claude-3.5-sonnet, gpt-4, deepseek-v3）
  --task <task_id>        任务 ID
  --demand <demand_name>  需求名称
  --action <action>       calculate | report | enforce

输出:
  calculate: 输出动态阈值 JSON
  report:    输出上下文预算报告 YAML
  enforce:   检查并强制分段（如需要）
```

**模型上下文窗口映射表**：

```javascript
const MODEL_CONTEXT_WINDOWS = {
  // Claude 系列
  'claude-3.5-sonnet':  { window_kb: 200, safe_pct: 0.80 },
  'claude-3-opus':      { window_kb: 200, safe_pct: 0.80 },
  'claude-3-sonnet':    { window_kb: 200, safe_pct: 0.80 },
  'claude-3-haiku':     { window_kb: 200, safe_pct: 0.80 },

  // GPT 系列
  'gpt-4':              { window_kb: 128, safe_pct: 0.80 },
  'gpt-4-turbo':        { window_kb: 128, safe_pct: 0.80 },
  'gpt-4o':             { window_kb: 128, safe_pct: 0.80 },

  // DeepSeek 系列
  'deepseek':           { window_kb: 128, safe_pct: 0.80 },
  'deepseek-v3':        { window_kb: 128, safe_pct: 0.80 },

  // Qwen 系列
  'qwen':               { window_kb: 128, safe_pct: 0.80 },
  'qwen-max':           { window_kb: 128, safe_pct: 0.80 },

  // 默认（保守估计）
  'default':            { window_kb: 128, safe_pct: 0.80 },
};
```

**动态 MAX_BRIEF_SIZE 计算公式**：

```
可用上下文 = model_window_kb * safe_pct
系统提示词预留 = 15KB
代码读取预留 = 25KB（Step 2.5 依赖类读取）
代码生成预留 = 20KB（最小安全生成空间）
对话历史预留 = 10KB

MAX_BRIEF_SIZE = 可用上下文 - 系统提示词预留 - 代码读取预留 - 代码生成预留 - 对话历史预留

示例：
  Claude (200KB): MAX = 200*0.8 - 15 - 25 - 20 - 10 = 90KB
  GPT-4  (128KB): MAX = 128*0.8 - 15 - 25 - 20 - 10 = 32KB
  DeepSeek(128KB): MAX = 128*0.8 - 15 - 25 - 20 - 10 = 32KB
```

**上下文预算报告格式**：

```yaml
# .dev-flow/runtime/context-budget-{taskId}.yaml
task_id: "Task-5"
model: "gpt-4"
model_window_kb: 128
safe_available_kb: 102  # 128 * 0.8

budget_allocation:
  system_prompt: 15
  task_brief: 32        # 动态 MAX_BRIEF_SIZE
  code_read: 25
  code_generation: 20
  conversation: 10

brief_sections:
  - section: "Task Info"
    allocated_kb: 1
    priority: "critical"
  - section: "Design Contract (Signatures)"
    allocated_kb: 10
    priority: "critical"
  - section: "Subtask Design"
    allocated_kb: 8
    priority: "critical"
  - section: "Develop Rules"
    allocated_kb: 3
    priority: "critical"
  - section: "Dependency Definitions"
    allocated_kb: 10
    priority: "high"
  - section: "Coding Conventions"
    allocated_kb: 0     # 查询协议模式：按需加载
    priority: "medium"
  - section: "Error Patterns"
    allocated_kb: 0     # 查询协议模式：按需加载
    priority: "medium"

enforcement:
  segmentation_required: false
  segmentation_reason: ""
  brief_truncation_required: false
```

- [ ] **Step 1: 创建 context-budget.cjs 骨架**

创建 `scripts/context-budget.cjs`，包含参数解析、模型映射表、核心计算函数。

- [ ] **Step 2: 实现 calculate 动作**

实现 `calculateAction(modelName)` 函数，返回动态阈值 JSON。

- [ ] **Step 3: 实现 report 动作**

实现 `reportAction(taskId, demandName, modelName)` 函数，读取 task-dag 和 design-contract，生成上下文预算报告 YAML。

- [ ] **Step 4: 实现 enforce 动作**

实现 `enforceAction(taskId, demandName, modelName)` 函数：
1. 调用 report 生成预算报告
2. 如果 brief 预估大小 > MAX_BRIEF_SIZE，生成分段锁文件
3. 如果 design-contract > MAX_BRIEF_SIZE * 0.6，标记需要查询协议模式

- [ ] **Step 5: 测试 context-budget.cjs**

```bash
node scripts/context-budget.cjs --model gpt-4 --action calculate
# 预期输出: {"model":"gpt-4","window_kb":128,"max_brief_kb":32,...}

node scripts/context-budget.cjs --model claude-3.5-sonnet --action calculate
# 预期输出: {"model":"claude-3.5-sonnet","window_kb":200,"max_brief_kb":90,...}
```

---

### Task 1.2：改造 prepare-context.cjs（动态 MAX_BRIEF_SIZE）

**Files:**
- Modify: `scripts/prepare-context.cjs`

**改造内容**：

1. **删除固定 MAX_BRIEF_SIZE**（第 29 行）
2. **集成 context-budget.cjs**：启动时调用 `calculateAction()` 获取动态阈值
3. **新增 --model 参数**：接受模型名称，传递给 context-budget.cjs
4. **brief 生成时强制裁剪**：当某个 section 超出分配预算时，按优先级裁剪

**具体修改**：

```javascript
// 删除第 29 行：
// const MAX_BRIEF_SIZE = 120 * 1024;

// 新增：
const { calculateBudget } = require('./context-budget.cjs');

// 在 main() 中，parseArgs 后新增：
const budget = calculateBudget(opts.model || 'default');
const MAX_BRIEF_SIZE = budget.max_brief_kb * 1024;

console.log(`[INFO] Model: ${budget.model}, Window: ${budget.window_kb}KB, MAX_BRIEF: ${budget.max_brief_kb}KB`);
```

**addSection 函数增强**：

```javascript
function addSection(title, content, priority) {
  if (!content || content.trim() === '') return false;

  // priority: critical=不可裁剪, high=可裁剪50%, medium=可裁剪70%, low=可省略
  const TRIM_RATIO = { critical: 1.0, high: 0.5, medium: 0.3, low: 0 };
  const maxSectionSize = MAX_BRIEF_SIZE * (TRIM_RATIO[priority] || 0.3);

  let trimmedContent = content;
  if (content.length > maxSectionSize && priority !== 'critical') {
    trimmedContent = content.substring(0, maxSectionSize) +
      `\n\n<!-- [TRIMMED] Original size: ${Math.round(content.length / 1024)}KB, trimmed to ${Math.round(maxSectionSize / 1024)}KB. Full content available via query protocol. -->`;
    console.warn(`[WARN] Section "${title}" trimmed: ${Math.round(content.length / 1024)}KB → ${Math.round(maxSectionSize / 1024)}KB`);
  }

  const section = `\n## ${title}\n\n${trimmedContent.trim()}\n`;
  if (totalSize + section.length > MAX_BRIEF_SIZE) {
    if (priority === 'critical') {
      console.error(`[ERROR] Critical section "${title}" cannot fit in budget. Consider enabling query protocol mode.`);
      // 仍然尝试添加，但标记为溢出
    } else {
      console.warn(`[WARN] Context budget exceeded, skipping: ${title}`);
      return false;
    }
  }
  sections.push(section);
  totalSize += section.length;
  return true;
}
```

**collectTaskContext 调用改造**：

```javascript
// 所有 addSection 调用增加 priority 参数
addSection('Task Info', taskInfoContent, 'critical');
addSection('Design Contract (Relevant)', contractContent, 'critical');
addSection('Subtask Design', subtaskDesignContent, 'critical');
addSection('Develop Rules (Core)', developRulesContent, 'critical');
addSection('Dependency Class Definitions', depDefinitions, 'high');
addSection('Coding Conventions', convContent, 'medium');
addSection('Error Patterns to Avoid', mistakesContent, 'medium');
addSection('Parent Task Results', parentResults, 'low');
```

- [ ] **Step 1: 修改 prepare-context.cjs，集成 context-budget.cjs**

替换固定 MAX_BRIEF_SIZE 为动态计算值。

- [ ] **Step 2: 增强 addSection 函数，支持优先级裁剪**

- [ ] **Step 3: 更新所有 addSection 调用，添加 priority 参数**

- [ ] **Step 4: 更新 generateBrief 函数，输出预算信息**

在 brief 头部增加预算报告摘要：

```markdown
> Budget: 32KB / 128KB model window | Sections: 6/8 loaded | Trimmed: 2
> Query protocol: ENABLED for Coding Conventions, Error Patterns
```

- [ ] **Step 5: 测试 prepare-context.cjs**

```bash
node scripts/prepare-context.cjs --task Task-5 --demand user-management --model gpt-4
# 预期: MAX_BRIEF=32KB, 部分 section 被 trimmed

node scripts/prepare-context.cjs --task Task-5 --demand user-management --model claude-3.5-sonnet
# 预期: MAX_BRIEF=90KB, 大部分 section 完整加载
```

---

### Task 1.3：segment-code.cjs 分段执行强制化

**Files:**
- Modify: `scripts/segment-code.cjs`

**改造内容**：

1. **生成分段锁文件**：`--plan` 执行后，生成 `.dev-flow/runtime/segment-lock-{taskId}.yaml`
2. **validate-result.cjs 增加锁文件验证**：检查分段锁文件中的所有 segment 是否已执行
3. **子代理必须按锁文件执行**：跳过任何 segment 会导致验证失败

**分段锁文件格式**：

```yaml
# .dev-flow/runtime/segment-lock-{taskId}.yaml
task_id: "Task-5"
lock_created_at: "2026-06-10T10:00:00Z"
segmentation_mode: "skeleton_plus_fill"
total_segments: 5

segments:
  - id: "seg-1"
    type: "skeleton"
    status: "pending"      # pending | completed | skipped
    completed_at: null
    output_file: "OrderServiceImpl.java"

  - id: "seg-2"
    type: "method_fill"
    target_method: "createOrder"
    status: "pending"
    completed_at: null
    depends_on: ["seg-1"]

  - id: "seg-3"
    type: "method_fill"
    target_method: "cancelOrder"
    status: "pending"
    completed_at: null
    depends_on: ["seg-1"]

  - id: "seg-4"
    type: "method_fill"
    target_method: "queryOrders"
    status: "pending"
    completed_at: null
    depends_on: ["seg-1"]

  - id: "seg-5"
    type: "verify"
    status: "pending"
    completed_at: null
    depends_on: ["seg-2", "seg-3", "seg-4"]

enforcement:
  all_must_complete: true
  skip_any_segment: "FAIL"
  verification_required: true
```

**segment-code.cjs 新增 --complete 动作**：

```bash
node scripts/segment-code.cjs --complete --segment seg-2 --task Task-5 --demand user-management
# 将 seg-2 的 status 更新为 completed
```

**validate-result.cjs 增加锁文件验证**：

```javascript
// 在 validate-result.cjs 的验证流程中增加：
function validateSegmentLock(taskId) {
  const lockPath = path.join(RUNTIME_DIR, `segment-lock-${taskId}.yaml`);
  if (!fs.existsSync(lockPath)) return { passed: true, reason: 'no_segment_lock' };

  const lockContent = safeRead(lockPath);
  const segments = parseSegments(lockContent);

  const pending = segments.filter(s => s.status === 'pending' && s.type !== 'verify');
  if (pending.length > 0) {
    return {
      passed: false,
      reason: `incomplete_segments`,
      details: pending.map(s => `${s.id} (${s.target_method || s.type})`).join(', ')
    };
  }
  return { passed: true };
}
```

- [ ] **Step 1: 修改 segment-code.cjs --plan，生成锁文件**

- [ ] **Step 2: 新增 --complete 动作，更新锁文件 segment 状态**

- [ ] **Step 3: 修改 validate-result.cjs，增加锁文件验证**

- [ ] **Step 4: 测试分段锁流程**

```bash
node scripts/segment-code.cjs --plan --task Task-5 --demand user-management
# 预期: 生成 segment-lock-Task-5.yaml

node scripts/segment-code.cjs --complete --segment seg-1 --task Task-5
# 预期: seg-1 status → completed

node scripts/validate-result.cjs --task Task-5
# 预期: 如果有 pending segment → FAIL
```

---

### Task 1.4：更新 context-manager.md 和 model-context-config.md

**Files:**
- Modify: `skill-templates/_core/agents/context-manager.md`
- Modify: `skill-templates/_core/references/model-context-config.md`

**改造内容**：

1. **context-manager.md**：将"建议性阈值"改为"调用 context-budget.cjs 强制执行"
2. **model-context-config.md**：更新动态阈值配置，引用 context-budget.cjs 的计算结果

**context-manager.md 关键修改**：

```yaml
# 旧（软约束）
context_usage_monitoring:
  thresholds:
    warning: 70%
    critical: 85%
  actions:
    warning_level:
      action: "log_warning"

# 新（硬约束）
context_budget_enforcement:
  engine: "scripts/context-budget.cjs"
  trigger: "Orchestrator 在派发 subagent 前自动执行"
  command: "node scripts/context-budget.cjs --model {model} --task {taskId} --action enforce"

  mandatory_checks:
    - check: "MAX_BRIEF_SIZE 动态计算"
      enforcement: "脚本强制，AI 无法绕过"

    - check: "brief 裁剪"
      enforcement: "addSection 按 priority 裁剪，critical 不可裁剪"

    - check: "分段锁"
      enforcement: "validate-result.cjs 检查锁文件，未完成 segment = FAIL"
```

- [ ] **Step 1: 更新 context-manager.md，集成 context-budget.cjs**

- [ ] **Step 2: 更新 model-context-config.md，引用动态计算**

- [ ] **Step 3: 更新 protocol.md，增加分段锁协议说明**

---

## Phase 2：主 Agent 状态机化

### 目标

将主 Agent 从"对话累积型"变为"文件恢复型"，消除 80% 的主 Agent 溢出风险。

### 设计原则

1. **状态持久化 > 对话历史**：调度状态写入文件，不依赖对话历史
2. **每阶段从文件恢复**：进入新阶段时读取状态文件，而非依赖上下文中的旧消息
3. **对话历史可安全压缩**：状态已持久化，对话历史可以安全清理

---

### Task 2.1：创建 orchestrator-state.cjs（状态持久化工具）

**Files:**
- Create: `scripts/orchestrator-state.cjs`

**职责**：

```yaml
核心功能:
  1. 保存主 Agent 调度状态到文件
  2. 从文件恢复调度状态
  3. 更新阶段进度
  4. 生成状态摘要

输入:
  --action save     保存当前状态
  --action restore  从文件恢复状态
  --action update   更新特定字段
  --action summary  输出状态摘要
  --session <id>    会话 ID
  --demand <name>   需求名称
  --stage <stage>   当前阶段
  --data <yaml>     更新数据（YAML 字符串）
```

**状态文件格式**：

```yaml
# .dev-flow/sessions/{session-id}/orchestrator-state.yaml
version: "1.0"
session_id: "sess-20260610-001"
demand_name: "订单管理模块"
demand_short: "订单管理"
created_at: "2026-06-10T09:00:00Z"
updated_at: "2026-06-10T11:30:00Z"

current_stage: "develop"
stage_entered_at: "2026-06-10T11:00:00Z"

stages_completed:
  - stage: "research"
    confirmed_at: "2026-06-10T09:30:00Z"
    deliverable: ".dev-flow/deliverables/订单管理模块/01-research-report.md"
    summary_file: ".dev-flow/sessions/sess-20260610-001/stage-summaries/research-summary.yaml"
    key_decisions:
      - "项目为 Spring Boot 微服务架构"
      - "使用 MyBatis-Plus ORM"

  - stage: "clarify"
    confirmed_at: "2026-06-10T09:45:00Z"
    deliverable: ".dev-flow/deliverables/订单管理模块/02-clarification-report.md"
    summary_file: ".dev-flow/sessions/sess-20260610-001/stage-summaries/clarify-summary.yaml"
    key_decisions: []

  - stage: "analyze"
    confirmed_at: "2026-06-10T10:15:00Z"
    deliverable: ".dev-flow/deliverables/订单管理模块/PRD-订单管理模块.md"
    summary_file: ".dev-flow/sessions/sess-20260610-001/stage-summaries/analyze-summary.yaml"
    key_decisions:
      - "需求拆分为 6 个子任务"

  - stage: "design"
    confirmed_at: "2026-06-10T10:45:00Z"
    deliverable: ".dev-flow/deliverables/订单管理模块/03-design-result.md"
    summary_file: ".dev-flow/sessions/sess-20260610-001/stage-summaries/design-summary.yaml"
    key_decisions:
      - "OrderService 使用状态机模式"
      - "对接 SAP 使用 Feign Client"

  - stage: "task-split"
    confirmed_at: "2026-06-10T11:00:00Z"
    deliverable: ".dev-flow/deliverables/订单管理模块/04-task-breakdown.md"
    summary_file: ".dev-flow/sessions/sess-20260610-001/stage-summaries/task-split-summary.yaml"
    key_decisions:
      - "6 个子任务，3 批次并行"
      - "Task-1,2 并行 → Task-3,4 并行 → Task-5,6 并行"

develop_progress:
  mode: "parallel"
  completed_tasks: ["Task-1", "Task-2"]
  current_batch: ["Task-3", "Task-4"]
  pending_tasks: ["Task-5", "Task-6"]
  failed_tasks: []

next_action: "dispatch backend-develop-expert for Task-3 and Task-4 (parallel)"

user_preferences:
  - "优先使用 Lambda 表达式"
  - "Service 方法必须加 @Transactional"

context_snapshot:
  model: "gpt-4"
  estimated_main_agent_usage_kb: 19
  last_budget_check: "2026-06-10T11:00:00Z"
```

- [ ] **Step 1: 创建 orchestrator-state.cjs 骨架**

- [ ] **Step 2: 实现 save 动作**

从 `.dev-flow/stage-confirmations/` 和 `.dev-flow/sessions/` 读取已有状态，合并写入 orchestrator-state.yaml。

- [ ] **Step 3: 实现 restore 动作**

读取 orchestrator-state.yaml，输出结构化摘要（供主 Agent 恢复上下文用）。

- [ ] **Step 4: 实现 update 动作**

更新特定字段（如 develop_progress、next_action）。

- [ ] **Step 5: 实现 summary 动作**

输出 ~2KB 的精简摘要（供主 Agent 在新阶段开始时读取）。

- [ ] **Step 6: 测试 orchestrator-state.cjs**

```bash
node scripts/orchestrator-state.cjs --action save --session sess-001 --demand 订单管理模块 --stage develop
node scripts/orchestrator-state.cjs --action summary --session sess-001
# 预期: 输出 ~2KB 状态摘要
```

---

### Task 2.2：修改 SKILL.md（阶段间状态恢复逻辑）

**Files:**
- Modify: `skill-templates/_core/SKILL.md`

**改造内容**：

在 SKILL.md 的阶段路由逻辑中，增加"阶段间状态恢复"步骤：

```yaml
# 在每个阶段入口处增加：
stage_entry_protocol:
  step_1: "读取 orchestrator-state.yaml（node scripts/orchestrator-state.cjs --action summary --session {sessionId}）"
  step_2: "从状态文件恢复调度上下文（替代对话历史）"
  step_3: "执行门禁检查（Gate-A + Gate-B）"
  step_4: "读取目标阶段指令文件"
  step_5: "执行阶段调度"

stage_exit_protocol:
  step_1: "生成阶段摘要（stage-summary.yaml）"
  step_2: "更新 orchestrator-state.yaml（node scripts/orchestrator-state.cjs --action update ...）"
  step_3: "用户确认后写入 .confirmed 文件"
  step_4: "输出状态摘要（~2KB，供下一阶段入口读取）"
```

**关键修改点**：

1. **Router Step 0**：创建 orchestrator-state.yaml 初始状态
2. **每个阶段入口**：先读状态文件，再执行门禁
3. **每个阶段出口**：更新状态文件，输出摘要
4. **阶段历史压缩**：状态已持久化，主 Agent 可安全压缩对话历史

- [ ] **Step 1: 修改 SKILL.md Router Step 0，增加状态初始化**

- [ ] **Step 2: 修改阶段路由表，增加入口/出口状态协议**

- [ ] **Step 3: 修改 protocol.md，增加阶段间状态恢复协议**

---

### Task 2.3：修改 protocol.md（阶段间状态恢复协议）

**Files:**
- Modify: `skill-templates/_core/references/protocol.md`

**新增内容**：

```markdown
## 🔴 阶段间状态恢复协议（v3.7 — 主 Agent 上下文保护）

> **核心原则**：主 Agent 的调度状态必须持久化到文件，不依赖对话历史。
> 每个阶段入口从文件恢复状态，出口更新状态文件。

### 状态恢复流程

```
阶段 N 完成
    │
    ▼
Step S1: 生成阶段摘要
  ├── 写入 .dev-flow/sessions/{id}/stage-summaries/{stage}-summary.yaml
  └── 摘要大小目标: ~1-2KB

Step S2: 更新调度状态
  ├── 执行: node scripts/orchestrator-state.cjs --action update --session {id} --stage {stage}
  └── 更新: stages_completed, develop_progress, next_action

Step S3: 用户确认
  ├── 写入 .confirmed 文件
  └── 确认后进入下一阶段

Step S4: 阶段 N+1 入口
  ├── 执行: node scripts/orchestrator-state.cjs --action summary --session {id}
  ├── 从文件恢复调度上下文（~2KB）
  └── 执行门禁检查 → 读取阶段指令 → 开始调度
```

### 状态恢复铁律

1. **入口必读**：进入任何阶段前，必须读取 orchestrator-state.yaml 摘要
2. **出口必写**：离开任何阶段后，必须更新 orchestrator-state.yaml
3. **对话历史可压缩**：状态已持久化，主 Agent 可在阶段间压缩对话历史
4. **断点续传**：如果会话中断，从 orchestrator-state.yaml 恢复最后状态
```

- [ ] **Step 1: 在 protocol.md 中增加阶段间状态恢复协议**

- [ ] **Step 2: 更新确认持久化规则，增加状态更新步骤**

---

## Phase 3：查询协议模板

### 目标

将子代理从"预加载全量 brief"变为"分层预加载+按步精准查询"，子代理上下文从 60-105KB 降至 8-33KB 预加载 + 15-30KB 按步查询。

### 设计原则

1. **A 类信息始终预加载**：任务目标、接口签名、逻辑步骤、禁止事项——不知道就"不知道做什么"
2. **B 类信息按步查询**：依赖类完整实现、编码规范详情、错误模式——不知道就"可能做错"，但可以按需查
3. **查询清单脚本预生成**：不依赖子代理判断"该查什么"
4. **查询返回完整文件**：不是摘要，不是截取，是 Read 原文件
5. **四源合并**：design-contract + subtask-design + conventions + Grep 扫描

---

### Task 3.1：创建 query-protocol.cjs（查询协议生成器）

**Files:**
- Create: `scripts/query-protocol.cjs`

**职责**：

```yaml
核心功能:
  1. 四源合并生成查询清单
  2. 精准片段提取（从大文件中提取指定段）
  3. 查询清单注入 task-skeleton
  4. 查询执行辅助（子代理调用时返回精准片段）

输入:
  --action generate    为指定任务生成查询清单
  --action extract     从文件中提取指定段
  --action execute     执行指定查询项，返回精准片段
  --task <taskId>      任务 ID
  --demand <name>      需求名称
  --query <queryId>    查询项 ID（execute 时使用）
```

**四源合并逻辑**：

```javascript
function generateQueryList(taskId, demandName) {
  const queries = [];

  // 源 1: design-contract.yaml 的依赖列表
  const contract = readDesignContract(demandName);
  const taskDeps = extractTaskDependencies(contract, taskId);
  for (const dep of taskDeps.entities) {
    queries.push({
      id: `q${queries.length + 1}`,
      source: 'design-contract',
      type: 'entity_definition',
      target: dep.file_path,
      fields: ['fields', 'annotations', 'table_name', 'getter_setter_names'],
      step: '2.5',
      estimated_kb: estimateEntitySize(dep),
    });
  }
  for (const dep of taskDeps.services) {
    queries.push({
      id: `q${queries.length + 1}`,
      source: 'design-contract',
      type: 'service_signatures',
      target: dep.file_path,
      fields: ['method_signatures', 'return_types', 'parameter_types'],
      step: '2.5',
      estimated_kb: estimateServiceSize(dep),
    });
  }

  // 源 2: subtask-design.yaml 的 read_files 字段
  const subtaskDesign = readSubtaskDesign(taskId, demandName);
  if (subtaskDesign.read_files) {
    for (const file of subtaskDesign.read_files) {
      if (!queries.find(q => q.target === file)) {
        queries.push({
          id: `q${queries.length + 1}`,
          source: 'subtask-design',
          type: 'reference_code',
          target: file,
          fields: ['all'],
          step: '2.5',
          estimated_kb: 5,
        });
      }
    }
  }

  // 源 3: conventions.md 中引用的工具类
  const conventions = readConventions();
  const toolClasses = extractToolClassReferences(conventions);
  for (const cls of toolClasses) {
    if (!queries.find(q => q.target && q.target.includes(cls))) {
      queries.push({
        id: `q${queries.length + 1}`,
        source: 'conventions',
        type: 'tool_class',
        target: `Grep:class ${cls}`,
        fields: ['method_signatures'],
        step: '2.5',
        estimated_kb: 2,
      });
    }
  }

  // 源 4: Grep 扫描 subtask-design 中的类名引用（传递依赖）
  const classNames = extractClassNamesFromDesign(subtaskDesign);
  for (const cls of classNames) {
    if (!queries.find(q => q.target && q.target.includes(cls))) {
      queries.push({
        id: `q${queries.length + 1}`,
        source: 'grep-scan',
        type: 'transitive_dependency',
        target: `Grep:class ${cls}`,
        fields: ['signatures'],
        step: '2.5',
        estimated_kb: 2,
      });
    }
  }

  // 按步骤分组
  return groupByStep(queries);
}
```

**查询清单输出格式**：

```yaml
# .dev-flow/runtime/query-protocol-{taskId}.yaml
task_id: "Task-5"
demand_name: "订单管理模块"
generated_at: "2026-06-10T11:00:00Z"
total_queries: 8
total_estimated_kb: 22

steps:
  step_2_5_dependency_verify:
    description: "验证所有依赖类的实际代码"
    queries:
      - id: "q1"
        source: "design-contract"
        type: "entity_definition"
        target: "src/main/java/com/example/order/entity/Order.java"
        fields: ["fields", "annotations", "table_name"]
        estimated_kb: 3
        priority: "critical"

      - id: "q2"
        source: "design-contract"
        type: "service_signatures"
        target: "src/main/java/com/example/order/service/OrderService.java"
        fields: ["method_signatures"]
        estimated_kb: 2
        priority: "critical"

      - id: "q3"
        source: "design-contract"
        type: "mapper_interface"
        target: "src/main/java/com/example/order/mapper/OrderMapper.java"
        fields: ["method_signatures"]
        estimated_kb: 1
        priority: "critical"

      - id: "q4"
        source: "design-contract"
        type: "dto_definition"
        target: "src/main/java/com/example/order/dto/OrderDTO.java"
        fields: ["fields", "validation_annotations"]
        estimated_kb: 2
        priority: "critical"

      - id: "q5"
        source: "conventions"
        type: "convention_rules"
        target: ".dev-flow/memory/conventions.md#service_implementation"
        fields: ["rules"]
        estimated_kb: 2
        priority: "high"

    total_estimated_kb: 10

  step_3_code_generation:
    description: "生成代码"
    queries:
      - id: "q6"
        source: "subtask-design"
        type: "logic_steps"
        target: ".dev-flow/contracts/订单管理模块/design-contract.yaml#services.OrderService.createOrder"
        fields: ["logic_steps", "validation_rules", "error_handling"]
        estimated_kb: 3
        priority: "critical"

      - id: "q7"
        source: "design-contract"
        type: "feign_signature"
        target: "src/main/java/com/example/order/feign/PaymentFeignClient.java"
        fields: ["method_signatures"]
        estimated_kb: 1
        priority: "high"

      - id: "q8"
        source: "conventions"
        type: "error_patterns"
        target: ".dev-flow/memory/mistakes.md"
        fields: ["relevant_patterns"]
        estimated_kb: 1
        priority: "medium"

    total_estimated_kb: 5
```

- [ ] **Step 1: 创建 query-protocol.cjs 骨架**

- [ ] **Step 2: 实现 generate 动作（四源合并）**

- [ ] **Step 3: 实现 extract 动作（精准片段提取）**

从大文件中提取指定段，例如从 design-contract.yaml 中只提取 `entities.Order` 段。

- [ ] **Step 4: 实现 execute 动作（查询执行）**

根据 queryId 读取目标文件，返回精准片段。

- [ ] **Step 5: 测试 query-protocol.cjs**

```bash
node scripts/query-protocol.cjs --action generate --task Task-5 --demand 订单管理模块
# 预期: 生成 query-protocol-Task-5.yaml

node scripts/query-protocol.cjs --action execute --task Task-5 --query q1
# 预期: 返回 Order.java 的字段+注解+表名
```

---

### Task 3.2：改造 prepare-context.cjs（集成查询协议）

**Files:**
- Modify: `scripts/prepare-context.cjs`

**改造内容**：

当 context-budget.cjs 报告 brief 预算不足以容纳全量信息时，自动切换为查询协议模式：

1. **生成 task-skeleton（~8KB）**：只包含 Layer 0 + Layer 1 + Layer 2 + 查询清单
2. **不再生成全量 task-brief**：改为生成 task-skeleton + query-protocol 文件
3. **子代理按查询清单执行**：每个步骤先查询，再执行

**task-skeleton 格式**：

```markdown
# Task Skeleton: Task-5

> Auto-generated by prepare-context.cjs (query-protocol mode)
> Model: gpt-4 (128KB window) | Budget: 32KB brief | Skeleton: 8KB
> Query Protocol: ENABLED — 8 queries, ~22KB total (loaded per-step)

## Instructions

1. Read this skeleton carefully — it contains your task goals, interface signatures, and logic steps
2. Before each step, execute the queries listed in the Query Checklist
3. Each query returns a precise file fragment — read it completely before proceeding
4. After code generation: compile -> QuickTest -> logic coverage verification
5. Write result to task-result-Task-5.yaml when done

## Layer 0: Task Info

Task ID: Task-5
Name: Implement OrderService
Domain: backend
Dependencies: Task-1 (Order Entity), Task-2 (OrderDTO)
Description: Implement OrderServiceImpl with createOrder, cancelOrder, queryOrders methods

## Layer 1: Design Contract Signatures

### Entity: Order
Fields: id(Long), orderNo(String), status(byte), userId(Long), amount(BigDecimal), createdAt(LocalDateTime), updatedAt(LocalDateTime)
Table: t_order

### Service: OrderService
Methods:
  - createOrder(orderDTO: OrderDTO): OrderVO
  - cancelOrder(orderId: Long): void
  - queryOrders(query: OrderQueryDTO): Page<OrderVO>

### DTO: OrderDTO
Fields: orderNo(String, @NotNull), userId(Long, @NotNull), amount(BigDecimal, @NotNull @DecimalMin("0.01"))

### Mapper: OrderMapper
Extends: BaseMapper<Order>
Custom methods:
  - selectByOrderNo(orderNo: String): Order
  - selectPageByCondition(query: OrderQueryDTO): IPage<Order>

## Layer 2: Subtask Design (Logic Steps)

### createOrder
  Step 1: validate - 校验订单参数（orderNo 唯一性、userId 存在性）
  Step 2: convert - OrderDTO → Order Entity
  Step 3: assign - 设置初始状态 status = DRAFT(0)
  Step 4: call - orderMapper.insert(order)
  Step 5: convert - Order → OrderVO
  Step 6: return - 返回 OrderVO

### cancelOrder
  Step 1: query - 查询订单是否存在
  Step 2: validate - 校验订单状态是否允许取消
  Step 3: assign - 更新状态 status = CANCELLED(3)
  Step 4: call - orderMapper.updateById(order)

### queryOrders
  Step 1: convert - OrderQueryDTO → QueryWrapper
  Step 2: call - orderMapper.selectPageByCondition(query)
  Step 3: convert - Page<Order> → Page<OrderVO>
  Step 4: return - 返回分页结果

## Prohibitions (Must Follow)

1. No TODO/FIXME/placeholder — every method must be fully implemented
2. No guessing import paths — verify with Grep before use
3. No log-only method bodies — must contain real business logic
4. No return null — must return actual computed result
5. Business code first (P0), test code only after P0 complete

## Query Checklist

> Execute queries BEFORE each step. Each query returns a precise file fragment.

### Before Step 2.5 (Dependency Verify):
- [ ] q1: Read Order.java full definition (entity, ~3KB)
- [ ] q2: Read OrderService.java method signatures (~2KB)
- [ ] q3: Read OrderMapper.java interface definition (~1KB)
- [ ] q4: Read OrderDTO.java full definition (~2KB)
- [ ] q5: Read conventions.md#service_implementation rules (~2KB)

### Before Step 3 (Code Generation):
- [ ] q6: Read createOrder logic steps detail (~3KB)
- [ ] q7: Read PaymentFeignClient method signatures (~1KB)
- [ ] q8: Read mistakes.md relevant patterns (~1KB)

### How to Execute Queries:
  node scripts/query-protocol.cjs --action execute --task Task-5 --query q1
  Then Read the returned file fragment completely before proceeding.
```

**prepare-context.cjs 修改逻辑**：

```javascript
function collectTaskContext(taskId, demandName) {
  const budget = calculateBudget(opts.model || 'default');
  const MAX_BRIEF_SIZE = budget.max_brief_kb * 1024;

  // 估算全量 brief 大小
  const estimatedFullBrief = estimateFullBriefSize(taskId, demandName);

  if (estimatedFullBrief <= MAX_BRIEF_SIZE * 0.8) {
    // 模式 A：全量 brief（简单任务，空间足够）
    return generateFullBrief(taskId, demandName, MAX_BRIEF_SIZE);
  } else {
    // 模式 B：查询协议（复杂任务，空间不足）
    return generateSkeletonWithQueryProtocol(taskId, demandName, budget);
  }
}

function generateSkeletonWithQueryProtocol(taskId, demandName, budget) {
  // 1. 生成查询清单
  execSync(`node scripts/query-protocol.cjs --action generate --task ${taskId} --demand ${demandName}`);

  // 2. 生成 task-skeleton（Layer 0 + Layer 1 + Layer 2 + 查询清单引用）
  const skeleton = buildSkeleton(taskId, demandName);

  // 3. 写入 task-skeleton 文件（替代 task-brief）
  const skeletonPath = path.join(RUNTIME_DIR, `task-skeleton-${taskId}.md`);
  fs.writeFileSync(skeletonPath, skeleton, 'utf-8');

  return { path: skeletonPath, mode: 'query-protocol', size: skeleton.length };
}
```

- [ ] **Step 1: 在 prepare-context.cjs 中增加 brief 大小估算逻辑**

- [ ] **Step 2: 实现 generateSkeletonWithQueryProtocol 函数**

- [ ] **Step 3: 实现 buildSkeleton 函数（生成 Layer 0+1+2+查询清单）**

- [ ] **Step 4: 修改输出逻辑，区分 full-brief 和 skeleton 模式**

- [ ] **Step 5: 测试两种模式**

```bash
# 简单任务（Claude 200KB，空间足够）→ 全量 brief
node scripts/prepare-context.cjs --task Task-1 --demand user-mgmt --model claude-3.5-sonnet
# 预期: 生成 task-brief-Task-1.md（full-brief 模式）

# 复杂任务（GPT-4 128KB，空间不足）→ 查询协议
node scripts/prepare-context.cjs --task Task-5 --demand user-mgmt --model gpt-4
# 预期: 生成 task-skeleton-Task-5.md + query-protocol-Task-5.yaml
```

---

### Task 3.3：修改 develop.md（查询协议执行流程）

**Files:**
- Modify: `skill-templates/_core/stages/develop.md`

**改造内容**：

在 develop.md 中增加查询协议模式的执行流程说明：

```yaml
query_protocol_mode:
  trigger: "task-skeleton-{taskId}.md 存在（而非 task-brief-{taskId}.md）"

  execution_flow:
    step_1: "读取 task-skeleton-{taskId}.md（~8KB）"
    step_2: "识别查询清单（Query Checklist）"
    step_3: "按步骤执行查询"
    step_4: "每步查询后执行当前步骤任务"
    step_5: "完成后写入 task-result"

  step_2_5_with_query_protocol:
    description: "按查询清单逐项读取依赖类"
    flow:
      - "执行 q1-q5 查询（每项 1-5KB）"
      - "每项查询后立即验证（方法签名、字段类型、import 路径）"
      - "汇总验证结果到依赖类确认表"
    advantage: "每次只加载 1-5KB，上下文始终安全"

  step_3_with_query_protocol:
    description: "按查询清单获取逻辑步骤详情，逐方法生成代码"
    flow:
      - "执行 q6-q8 查询（获取逻辑步骤+Feign签名+错误模式）"
      - "按逻辑步骤逐方法生成代码"
      - "如果预估输出 >15KB，触发分段生成（segment-code.cjs）"
    advantage: "代码生成空间充裕（43-83KB），不会截断"
```

- [ ] **Step 1: 在 develop.md 中增加查询协议模式说明**

- [ ] **Step 2: 更新 Step 2.5，增加查询协议执行流程**

- [ ] **Step 3: 更新 Step 3，增加查询协议执行流程**

---

### Task 3.4：修改 backend-develop-expert.md 和 frontend-develop-expert.md

**Files:**
- Modify: `skill-templates/_core/agents/backend-develop-expert.md`
- Modify: `skill-templates/_core/agents/frontend-develop-expert.md`

**改造内容**：

在两个开发专家的"输入"部分，增加查询协议模式的说明：

```yaml
input_modes:
  mode_a_full_brief:
    trigger: "task-brief-{taskId}.md 存在"
    behavior: "读取全量 brief，按现有流程执行"

  mode_b_query_protocol:
    trigger: "task-skeleton-{taskId}.md 存在"
    behavior: "读取 skeleton，按查询清单逐步执行"

    step_0: "读取 task-skeleton-{taskId}.md（~8KB）"
    step_1: "理解任务目标、接口签名、逻辑步骤"
    step_2: "按 Query Checklist 执行 Step 2.5 查询（q1-q5）"
    step_3: "完成依赖验证表"
    step_4: "按 Query Checklist 执行 Step 3 查询（q6-q8）"
    step_5: "逐方法生成代码"
    step_6: "完整性防线检查"
    step_7: "编译验证"
    step_8: "写入 task-result"
```

- [ ] **Step 1: 修改 backend-develop-expert.md，增加查询协议模式**

- [ ] **Step 2: 修改 frontend-develop-expert.md，增加查询协议模式**

---

## 实施顺序与依赖关系

```
Phase 1（硬约束脚本增强）—— 独立可部署
  Task 1.1: context-budget.cjs          ← 无依赖
  Task 1.2: prepare-context.cjs 改造    ← 依赖 1.1
  Task 1.3: segment-code.cjs 强制化     ← 无依赖（可与 1.1 并行）
  Task 1.4: 更新 context-manager.md     ← 依赖 1.1

Phase 2（主 Agent 状态机化）—— 独立可部署，与 Phase 1 无依赖
  Task 2.1: orchestrator-state.cjs      ← 无依赖
  Task 2.2: SKILL.md 修改               ← 依赖 2.1
  Task 2.3: protocol.md 修改            ← 依赖 2.1

Phase 3（查询协议模板）—— 依赖 Phase 1
  Task 3.1: query-protocol.cjs          ← 依赖 1.1（使用 context-budget 判断模式）
  Task 3.2: prepare-context.cjs 集成    ← 依赖 3.1 + 1.2
  Task 3.3: develop.md 修改             ← 依赖 3.1
  Task 3.4: develop-expert 修改         ← 依赖 3.1

推荐实施顺序：
  1.1 → 1.3（并行）→ 1.2 → 1.4 → 2.1 → 2.2 + 2.3（并行）→ 3.1 → 3.2 → 3.3 + 3.4（并行）
```

---

## 各阶段子代理上下文预算对照表

### Phase 1+2+3 完成后

| 阶段 | A 类预加载 | B 类按步查询 | 峰值上下文 | 128KB 模型剩余 | 200KB 模型剩余 |
|------|-----------|-------------|-----------|--------------|--------------|
| Research | ~2KB | ~15KB（扫描中逐文件） | ~17KB | 111KB | 183KB |
| Clarify | ~6KB | ~10KB | ~16KB | 112KB | 184KB |
| Analyze | ~21KB | ~8KB | ~29KB | 99KB | 171KB |
| Design | ~35-50KB | ~10-15KB | ~50-60KB | 68-78KB | 140-150KB |
| Task Split | ~20KB | ~5KB | ~25KB | 103KB | 175KB |
| **Develop** | **~8-33KB** | **~15-30KB** | **~43KB** | **85KB** | **157KB** |
| Test | ~6KB | ~40-80KB | ~46-86KB | 42-82KB | 114-154KB |
| Fix | ~10KB | ~20KB | ~30KB | 98KB | 170KB |
| Delivery | ~5KB | ~10KB | ~15KB | 113KB | 185KB |

### Develop 子代理上下文详细分解（128KB 模型，查询协议模式）

```
┌──────────────────────────────────────────────────────────┐
│  Develop 子代理上下文（128KB 模型，Phase 3 查询协议模式） │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  预加载（task-skeleton，~8KB）：                          │
│    Layer 0: 任务信息 + 禁止事项            ~3KB          │
│    Layer 1: 接口签名（Entity/Service/DTO）  ~3KB          │
│    Layer 2: 逻辑步骤                       ~2KB          │
│                                                          │
│  Step 2.5 查询（逐项加载，不同时占用，~10KB）：           │
│    q1: Order.java 完整定义                 ~3KB          │
│    q2: OrderService.java 方法签名          ~2KB          │
│    q3: OrderMapper.java 接口               ~1KB          │
│    q4: OrderDTO.java 完整定义              ~2KB          │
│    q5: conventions.md Service 规范         ~2KB          │
│                                                          │
│  Step 3 查询（逐项加载，~5KB）：                          │
│    q6: createOrder 逻辑步骤详情            ~3KB          │
│    q7: PaymentFeignClient 签名             ~1KB          │
│    q8: mistakes.md 相关模式                ~1KB          │
│                                                          │
│  代码生成空间：                                           │
│    128KB - 15KB(系统) - 8KB(skeleton) - 10KB(查询)       │
│         = 95KB ← 远超 20KB 安全阈值                      │
│                                                          │
│  对比当前方案：                                           │
│    128KB - 15KB(系统) - 60KB(brief) = 53KB               │
│    代码读取 30KB 后仅剩 23KB ← 不够复杂 Service           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 风险分析与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 查询清单遗漏依赖类 | 中 | 子代理基于猜测编码 | 四源合并（contract+design+conventions+Grep）覆盖传递依赖 |
| 子代理不按查询清单执行 | 低 | 跳过查询直接编码 | task-skeleton 中无完整信息，不查询就无法编码（结构性约束） |
| context-budget.cjs 模型检测失败 | 低 | 使用默认 128KB 保守值 | 默认值是安全的，不会导致溢出 |
| orchestrator-state.yaml 损坏 | 极低 | 无法恢复调度状态 | 可从 stage-confirmations/ + stage-summaries/ 重建 |
| 查询协议模式增加步骤数 | 确定 | 子代理执行时间略增 | 每次查询 1-5KB，比一次性加载 60KB 更安全，时间增加 <30s |
| Design 阶段 A 类预加载仍较大 | 确定 | 128KB 模型 Design 阶段空间偏紧 | Design 阶段不改查询协议，保持当前模式；Phase 1 动态 MAX 已缓解 |

---

## 验证标准

### Phase 1 验证

- [ ] `context-budget.cjs --model gpt-4 --action calculate` 输出 MAX_BRIEF=32KB
- [ ] `context-budget.cjs --model claude-3.5-sonnet --action calculate` 输出 MAX_BRIEF=90KB
- [ ] `prepare-context.cjs --model gpt-4` 生成的 brief 不超过 32KB
- [ ] `segment-code.cjs --plan` 生成锁文件
- [ ] `validate-result.cjs` 检测到未完成 segment 时返回 FAIL

### Phase 2 验证

- [ ] `orchestrator-state.cjs --action save` 成功写入状态文件
- [ ] `orchestrator-state.cjs --action summary` 输出 ~2KB 摘要
- [ ] SKILL.md 中每个阶段入口包含状态恢复步骤
- [ ] 主 Agent 在 9 阶段全流程后上下文 < 25KB

### Phase 3 验证

- [ ] `query-protocol.cjs --action generate` 生成查询清单
- [ ] `query-protocol.cjs --action execute --query q1` 返回精准片段
- [ ] `prepare-context.cjs --model gpt-4` 对复杂任务生成 skeleton 而非 brief
- [ ] `prepare-context.cjs --model claude-3.5-sonnet` 对简单任务仍生成 full brief
- [ ] Develop 子代理 skeleton 模式下上下文峰值 < 50KB（128KB 模型）

### 端到端验证

- [ ] 在 128KB 模型上执行完整 9 阶段流程，无上下文溢出
- [ ] 在 200KB 模型上执行完整 9 阶段流程，代码完整性 100%
- [ ] 复杂微服务需求（6+ 子任务）在 128KB 模型上完整交付
- [ ] 纯后端项目流程与 v3.6.0 完全一致（向后兼容）

---

## 向后兼容保证

| 维度 | 保证 |
|------|------|
| 纯后端项目 | Phase 1+2+3 不改变 Research 后端扫描组逻辑 |
| Claude 200KB 模型 | 简单任务仍使用 full-brief 模式（空间足够） |
| 现有命令 | `/dev-flow`、`/dev-flow -subagent` 等命令不变 |
| 现有文件结构 | `.dev-flow/` 目录结构不变，新增文件不影响现有文件 |
| 现有阶段流程 | 9 阶段顺序、门禁检查、确认流程不变 |
| 不支持 --model 参数 | 默认使用 128KB 保守值，安全但可能过度裁剪 |

---

## 版本规划

| 版本 | 内容 | 依赖 |
|------|------|------|
| v3.7.0 | 前后端分离架构（已完成） | 无 |
| v3.8.0 | Phase 1（硬约束脚本增强） | v3.7.0 |
| v3.9.0 | Phase 2（主 Agent 状态机化） | v3.8.0 |
| v3.10.0 | Phase 3（查询协议模板） | v3.9.0 |

> Phase 1 和 Phase 2 可以并行开发（无依赖），但建议 Phase 2 先发布（主 Agent 溢出是更紧急的问题）。
> Phase 3 依赖 Phase 1 的 context-budget.cjs 判断查询协议模式。
