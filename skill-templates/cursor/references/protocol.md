---
type: reference
name: protocol
description: 公共协议 - 零编辑铁律、阶段交付物协议、门禁检查、确认清单模板
---

# 公共协议（Protocol）

> **本文件是所有阶段的共享协议，由 Router 层和阶段指令共同引用。**
> **修改本文件即修改全局行为，无需逐个修改阶段文件。**

---

## 🔴🔴 主 Agent 零编辑铁律 v2.0（最高优先级，不可违反，可验证硬约束）

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
| 阶段确认文件 | `.dev-flow/stage-confirmations/{需求简称}/*.confirmed` | 记录用户阶段确认 |
| 会话初始化文件 | `.dev-flow/sessions/{id}/session-init.yaml` | 创建新会话 |
| 需求索引文件 | `.dev-flow/session-index.yaml` | 需求追溯索引 |

> **禁止写入的文件（非穷举示例）**：
> - ❌ 任何源代码文件（`.java`, `.ts`, `.py`, `.go`, `.rs` 等）
> - ❌ 任何配置文件（`.yaml`, `.yml`, `.json`, `.xml`, `.toml` 等）
> - ❌ 任何文档文件（`.md` 除白名单外）
> - ❌ 任何构建/部署脚本（`.sh`, `.cjs`, `.js` 等）
> - ❌ `.dev-flow/memory/` 目录下的任何文件
> - ❌ `.dev-flow/contracts/` 目录下的任何文件
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
>     executor: "{stage}-expert subagent"
>     files_produced:
>       - path: ".dev-flow/deliverables/{deliverable-file}"
>         generated_by: "{stage}-expert"
>         checksum: "abc123..."
>     zero_edit_violation: false
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

**违反检测与纠正（v2.0 增强版）**：
- 如果主 Agent 在执行中发现自己正在输出 `Edit` 或 `Write` 操作 → **立即停止**，改为创建对应 subagent 执行
- 如果主 Agent 已在某个阶段直接编辑了文件 → 该阶段产出标记为无效，要求由 subagent 重新执行
- 每个阶段结束时的文件修改审计自动检测违规 → 违规文件标记为无效，阶段必须由 subagent 重新执行
- 连续 3 次文件修改审计发现违规 → 🔴 强制终止会话，输出违规报告

---

## 🔴🔴 Subagent 失败硬阻断规则

> **核心原则**：Subagent 执行失败后，主 Agent **绝对禁止**直接介入执行任务。
> 必须遵循三级失败处理协议，逐步升级，最终由人工介入。

### 三级失败处理协议

```
🔴 三级失败处理协议（硬阻断，不可跳过任何级别）

Level 1 — 自动重试（Auto-Retry）
  触发：Subagent 返回错误状态或产出不完整
  ├── 操作：主 Agent 自动重新创建同一个 subagent，传递相同的上下文
  ├── 信息传递：将上一次失败的诊断信息附加到 subagent 的 prompt 中
  ├── 最大重试次数：1 次（即总共最多执行 2 次）
  └── 成功 → 继续流程 ｜ 仍失败 → 升级到 Level 2

Level 2 — 诊断重试（Diagnose & Retry）
  触发：Level 1 自动重试后仍失败
  ├── 操作：主 Agent 创建诊断型 subagent（同类型 expert），但 prompt 侧重于诊断
  ├── 最大重试次数：1 次（诊断 + 重试）
  └── 成功 → 继续流程 ｜ 仍失败 → 升级到 Level 3

Level 3 — 🔴 人工升级（Escalate to Human）
  触发：Level 2 诊断重试后仍失败
  ├── 操作：主 Agent **停止一切自动化操作**，不执行任何文件编辑
  ├── 输出升级报告给用户，提供可选操作（重试/跳过/手动/终止）
  └── 主 Agent 进入等待状态，不再执行任何自动化操作
```

### 🔴 主 Agent 禁止行为表（Subagent 失败场景）

| 违规行为 | 严重级别 | 说明 |
|---------|---------|------|
| 主 Agent 直接使用 Edit/Write 工具编辑代码文件 | 🔴 P0 严重违规 | 违反零编辑铁律，立即终止 |
| 主 Agent 在对话中直接输出代码代替 Subagent 执行 | 🔴 P0 严重违规 | 代码输出视为文件编辑 |
| 主 Agent 跳过 Level 1 直接升级到 Level 3 | 🟡 P1 违规 | 未执行自动重试 |
| 主 Agent 跳过 Level 2 直接升级到 Level 3 | 🟡 P1 违规 | 未执行诊断分析 |
| 主 Agent 自行修改 subagent 的产出文件 | 🔴 P0 严重违规 | 违反零编辑铁律 |
| 主 Agent 在 Level 3 等待期间自行执行任务 | 🔴 P0 严重违规 | 越过人工决策 |
| 主 Agent 向用户隐瞒 Subagent 失败的事实 | 🟡 P1 违规 | 透明度违规 |

> **⚠️ 关键规则**：上述三级协议是**硬阻断机制**，不可被任何条件覆盖。
> 即使用户说"直接帮我修复"或"你自己做吧"，主 Agent 也必须遵循此协议，不得越权执行。

---

## 🔴 阶段交付物协议（v3.5 — 硬性约束）

> **核心原则**：每个阶段完成后，必须生成独立的交付物文档（存放于 `.dev-flow/deliverables/`），
> 主 Agent 读取并打开交付物文档供用户审阅，用户确认后写入 `.confirmed` 文件方可进入下一阶段。

**交付物目录结构（按需求隔离）**：

```
.dev-flow/deliverables/{需求简称}/
├── 01-research-report.md         # Research 阶段交付物
├── PRD-{需求简称}.md               # Analyze 阶段交付物（人类可读 PRD 文档）
├── 03-design-result.md           # Design 阶段交付物
├── 04-task-breakdown.md          # Task Split 阶段交付物
├── 05-develop-result.md          # Develop 阶段交付物
├── 06-test-report.md             # Test 阶段交付物（统一测试报告）
├── 07-fix-report.md              # Fix 阶段交付物
└── 11-delivery-report.md         # Delivery 阶段交付物
├── 07-db-assertions-report.md    # DB 断言报告（新增）
├── 08-ui-test-report.md          # UI 测试报告（新增）
└── 09-verification-trace.md      # 验证追溯报告（新增）
```

**数据交换目录结构（按需求隔离）**：

```
.dev-flow/contracts/{需求简称}/
├── design-contract.yaml          # Design → Develop 标准数据交换
├── prd-contract.yaml             # Analyze 输出（PRD 契约 — 单一真相源，包含验收标准+追溯矩阵+业务规则+数据模型）
├── task-dag.yaml                 # Task Split 任务依赖图
├── fix-log.yaml                  # Fix 修复日志
└── develop-integration.yaml      # Develop 集成验证结果
├── test-case-contract.yaml       # 测试用例契约（新增，从 PRD 自动派生）
├── runtime-contract.yaml         # 运行时环境契约（新增，服务编排配置）
└── demand-draft.yaml             # 需求草稿（新增，产品输入解析中间产物）
```

**验证证据目录结构（新增）**：

```
.dev-flow/evidence/{需求简称}/
├── ui-test-report.yaml              # UI 测试报告
├── db-assertions-report.yaml        # DB 断言报告
├── verification-trace-report.yaml   # 验证追溯报告
└── screenshots/                     # UI 测试截图
    ├── {case_id}-step{N}-{action}.png
    └── ...
```

> **⚠️ 目录自动创建规则**：
> 每个阶段生成交付物前，subagent 必须先检查目录是否存在。
> 如不存在，执行 `Bash "mkdir -p .dev-flow/deliverables/{需求简称}/"` 或 `Bash "mkdir -p .dev-flow/contracts/{需求简称}/"` 创建目录后再写入文件。
> `{需求简称}` 在 Router Step 0 中提取，全流程一致使用。

**主 Agent 审批流程（每阶段统一执行）**：

```
Step A: Subagent 完成 → 交付物已生成到 .dev-flow/deliverables/{需求简称}/
Step B: 主 Agent 读取交付物文档（Read 工具）
Step C: 主 Agent 使用 open_result_view 打开交付物文档
Step D: 主 Agent 输出结构化确认 Checklist
Step E: 等待用户逐项确认
Step F: 用户确认后 → 写入 .dev-flow/stage-confirmations/{需求简称}/{stage}.confirmed
Step G: 进入下一阶段（Router 层门禁检查交付物存在性）
```

> **⚠️ 关键规则**：
> - ❌ 禁止仅在对话栏展示结果而不生成交付物文档
> - ❌ 禁止在交付物文档未生成时请求用户确认
> - ❌ 禁止用"已在对话中展示"代替打开交付物文档
> - ✅ 每个阶段必须生成独立的 `.dev-flow/deliverables/{需求简称}/` 下的文档
> - ✅ 主 Agent 必须主动打开交付物文档供用户查看

---

## 🔴 确认持久化规则

> 阶段确认不仅是 prompt 软约束，必须写入确认文件作为硬约束。
> 后续阶段在开始执行前，必须检查前一阶段的确认文件是否存在。

**确认文件格式（v3.1 增强版）**：

```yaml
# .dev-flow/stage-confirmations/{需求简称}/{stage}.confirmed
stage: {stage}
confirmed_at: "YYYY-MM-DDTHH:mm:ss"
confirmed_by: user
session_id: "{session-id}"
demand_name: "{需求简称}"
deliverable: ".dev-flow/deliverables/{需求简称}/{deliverable-file}"
deliverable_checksum: "abc123..."
checklist:
  - item: "{确认项}"
    status: confirmed
execution_trail:
  executor: "{stage}-expert subagent"
  files_produced:
    - path: ".dev-flow/deliverables/{需求简称}/{deliverable-file}"
      checksum: "abc123..."
  zero_edit_violation: false
notes: ""
```

---

## 🔴 阶段门禁检查（Router 层硬性约束）

> **这是系统级硬约束，不是 prompt 级软约束。无论通过何种方式进入某阶段，都必须先执行此门禁检查。**
> **此检查在读取阶段指令文件之前执行，确保即使 AI 跳过阶段指令中的门禁描述，也无法绕过检查。**

**门禁检查流程（两层检查，进入任何阶段前，第一条执行的逻辑）**：

```
🔴 阶段门禁硬性检查（Router 层执行）

进入目标阶段 X 之前：

  🔵 Gate-A: 前置阶段完整性检查（确认文件 + 交付物 + 内容校验）
    ├── Step A1: 读取确认文件目录
    │     ├── 执行：Bash "ls .dev-flow/stage-confirmations/{需求简称}/" 或 Glob
    │     └── 获取已确认的阶段列表
    │
    ├── Step A2: 🔴 交付物存在性检查
    │     ├── 根据阶段依赖链检查前置阶段交付物是否存在
    │     ├── 交付物存在且非空 → ✅
    │     └── 交付物不存在或为空 → ❌ 拒绝进入
    │
    ├── Step A3: 确认文件内容校验
    │     ├── 读取前置确认文件
    │     ├── 校验必填字段（stage/confirmed_at/confirmed_by/session_id/checklist）
    │     ├── 校验 checklist 所有 item.status = "confirmed"
    │     └── 缺失或不完整 → ❌ 拒绝进入
    │
    └── Gate-A 判定：✅ 全部通过 → 进入 Gate-B ｜ ❌ 任一失败 → 拒绝进入

  🔵 Gate-B: 执行者审计（零编辑铁律验证）
    ├── Step B1: 检查前一阶段确认文件的 execution_trail 字段
    │     ├── executor 必须为 "{stage}-expert subagent"
    │     └── executor 为主 Agent → ❌ 零编辑违规
    │
    ├── Step B2: 检查 zero_edit_violation 字段
    │     ├── false → ✅
    │     └── true → ❌ 零编辑违规
    │
    └── Gate-B 判定：✅ 通过 → 允许进入目标阶段 ｜ ❌ 失败 → 拒绝进入
```

**确认文件内容校验规则**：

```yaml
# 有效的确认文件必须包含以下所有字段：
stage: "research"              # 必填
confirmed_at: "2026-06-05T..." # 必填
confirmed_by: "user"            # 必填
session_id: "session-xxx"       # 必填
checklist:                      # 必填
  - item: "项目架构已识别"
    status: "confirmed"         # 每个item必须为confirmed
```

**阶段依赖链（严格顺序）**：

```
Research ← (无前置)
Analyze  ← {需求简称}/research.confirmed + 01-research-report.md
Design   ← {需求简称}/analyze.confirmed + PRD-{需求简称}.md
TaskSplit ← {需求简称}/design.confirmed + 03-design-result.md
Develop  ← {需求简称}/task-split.confirmed + 04-task-breakdown.md
Test     ← {需求简称}/develop.confirmed + 05-develop-result.md
Fix      ← (由 Test 阶段触发，无前置确认要求)
Delivery ← {需求简称}/test.confirmed + 06-test-report.md
```

> **⚠️ 关键规则**：即使阶段指令文件中也包含门禁检查描述，
> Router 层的检查仍然必须执行。这是双重保险机制。
> **执行顺序**：先执行 Router 层门禁检查 → 通过后 → 再读取目标阶段指令文件。

---

## 标准确认 Checklist 模板

```markdown
## ✅ 阶段确认清单 — {阶段名称}

📄 **交付物文档**：`.dev-flow/deliverables/{需求简称}/{序号}-{阶段}-{文档名}.md`
   → 已自动打开，请切换到文档Tab查看完整内容

| # | 确认项 | 状态 |
|---|--------|------|
| 0 | **执行者审计**：本阶段由 {stage}-expert subagent 执行，主 Agent 未直接编辑任何文件 | ⬜ 待确认 |
| 0.5 | **交付物完整性**：交付物文档已生成且内容非空，文件修改审计通过 | ⬜ 待确认 |
| 1 | [阶段核心产出描述 — 各阶段自定义] | ⬜ 待确认 |
| 2 | [完整性检查描述 — 各阶段自定义] | ⬜ 待确认 |
| 3 | [与需求一致性检查 — 各阶段自定义] | ⬜ 待确认 |
| 4 | [后续阶段准备就绪 — 各阶段自定义] | ⬜ 待确认 |

**用户操作**：
- 📖 请先查看已打开的交付物文档（`.dev-flow/deliverables/{需求简称}/` 下的对应文件）
- 确认无误 → 回复 "确认" 或 "继续" 进入下一阶段（系统自动写入确认文件）
- 需要修改 → 指出具体问题，返回当前阶段修正
- 需要重新执行 → 回复 "重新执行"
```

**硬性阻断规则**：
- ❌ 禁止跳过确认直接进入下一阶段
- ❌ 禁止用"看起来没问题"等模糊描述代替逐项确认
- ❌ 禁止在确认文件不存在的情况下进入下一阶段
- ✅ 如果用户说"继续"但 Checklist 未全部确认，补充确认遗漏项
- ✅ 用户确认后，立即将确认文件写入 `.dev-flow/stage-confirmations/{需求简称}/`

---

## 🔴 阶段历史压缩规则（v3.2 — 上下文保护）

> **核心原则**：每个阶段确认后，主 Agent 必须将本阶段的详细对话历史压缩为结构化摘要，
> 释放上下文空间，防止后续阶段因历史对话过长导致调度精度下降。

**压缩时机**：每个阶段写入 `.confirmed` 文件后、进入下一阶段门禁检查前。

**压缩流程**：

```
🔴 阶段历史压缩（每个阶段确认后自动执行）

Step H1: 生成结构化摘要
  ├── 输出路径: .dev-flow/sessions/{id}/stage-summaries/{stage}-summary.yaml
  └── 摘要格式:

stage: {stage}
completed_at: "YYYY-MM-DDTHH:mm:ss"
subagent: "{stage}-expert"
status: "confirmed"
deliverables:
  - path: ".dev-flow/deliverables/{file}"
    checksum: "abc123..."
key_decisions:
  - "{本阶段做出的关键决策 1}"
  - "{本阶段做出的关键决策 2}"
user_feedback: "{用户确认时的反馈（如有修改意见）}"
files_produced:
  - "{本阶段产出的代码/文档文件路径列表}"
notes: "{需要注意的上下文信息}"

Step H2: 确认摘要已写入
  ├── Bash "mkdir -p .dev-flow/sessions/{id}/stage-summaries/"
  └── Write 摘要文件

Step H3: 继续下一阶段门禁检查
```

**摘要内容规范**：
- 摘要应保留**决策性信息**（为什么选了 X 方案）、**关键路径**（产出文件位置）、**用户偏好**
- 摘要不应包含**过程性信息**（subagent 的每一步操作细节、中间讨论）
- 每个阶段摘要目标大小：~1-2KB（控制在 20 行 YAML 以内）

> **⚠️ 平台差异说明**：
> - Claude Code：支持 `/compact` 命令，主 Agent 可执行真正的上下文压缩
> - Cursor：Task 工具有独立上下文窗口，主对话历史由平台自动管理
> - 其他平台：主 Agent 输出摘要后，历史对话的实际压缩取决于平台实现
> 无论平台是否支持真正的上下文压缩，**摘要文件必须写入**，作为持久化的阶段记忆。

---

## 🔴 阶段入口铁律模板（各阶段文件头部引用）

> **以下内容在每个阶段指令文件的头部以引用方式包含，各阶段仅需填写 {expert} 和 {stage} 变量。**

```
### 🔴🔴 主 Agent 零编辑约束（本阶段入口铁律）

> **⚠️ 最高优先级**：主 Agent 在本阶段的唯一角色是**调度器**。
> **主 Agent 绝对禁止直接使用 Edit/Write 工具编辑本阶段的任何产出文件。**
> **所有文件编辑必须由 {expert} subagent 执行。**
```

**如果主 Agent 发现自己正在输出代码编辑内容**：
1. 立即停止
2. 改为创建 {expert} subagent 执行该任务
3. 将已输出的编辑内容作为 subagent 的初始上下文传递
```

---

## 🔴 需求简称命名规范（v3.4 — Session 隔离）

> **核心原则**：`{需求简称}` 是全流程文件隔离的唯一标识，从 Router Step 0 提取后不可更改。

**命名规范**：

| 规则 | 说明 |
|------|------|
| 长度 | 2-20 字符 |
| 来源 | 主 Agent 从用户需求描述中提取核心名词短语 |
| 允许字符 | 中文、英文（a-zA-Z）、数字（0-9）、连字符（-）、下划线（_） |
| 禁止字符 | 空格、特殊字符（/ \ : * ? " < > \|）、纯数字 |
| 唯一性 | 读取 session-index.yaml，已有同名则追加 "-2" 递增 |
| 提取策略 | 取用户需求的核心名词短语（如"实现用户登录注册" → "用户登录注册"） |

**示例**：

| 用户需求 | 提取的需求简称 |
|----------|--------------|
| "实现用户登录注册功能" | `用户登录注册` |
| "重构订单系统的支付模块" | `订单支付模块` |
| "添加 Redis 缓存层" | `Redis缓存层` |
| "修复首页加载慢的问题" | `首页加载优化` |
| "接入微信支付" | `微信支付接入` |

**路径使用规则**：

```
# 所有产出路径必须包含 {需求简称} 子目录
.dev-flow/deliverables/{需求简称}/01-research-report.md
.dev-flow/contracts/{需求简称}/design-contract.yaml
.dev-flow/stage-confirmations/{需求简称}/research.confirmed
```
