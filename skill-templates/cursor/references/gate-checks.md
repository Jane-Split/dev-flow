---
title: "Router Gate Checks v3.1"
summary: "Router 层阶段门禁的详细规范：Gate-1/1.5/2/2.5/3 详细流程、特殊场景处理、确认文件校验规则"
read_when:
  - 进入任何阶段前需要执行 Router 层门禁检查
  - 需要校验 .confirmed 确认文件格式
  - 需要处理特殊场景（--resume、跳过阶段、L0 轻量模式）
---

# Router 层阶段门禁 — 详细规范 v3.1

> 本文件是 SKILL.md「阶段指令路由」章节中 Router 层硬性门禁的详细补充。
> SKILL.md 中仅保留门禁检查流程摘要和阶段依赖表，详细说明见本文档。

---

## 门禁检查完整流程

> **这是系统级硬约束**，不是 prompt 级软约束。无论通过何种方式进入某阶段，都必须先执行此门禁检查。
> 此检查在读取阶段指令文件**之前**执行，确保即使 AI 跳过阶段指令中的门禁描述，也无法绕过检查。

```
🔴 阶段门禁硬性检查（Router 层执行）

进入目标阶段 X 之前：

 Step Gate-1: 读取确认文件目录
   ├── 执行：Bash "ls .dev-flow/stage-confirmations/" 或 Glob ".dev-flow/stage-confirmations/*.confirmed"
   └── 获取已确认的阶段列表

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

 Step Gate-2: 匹配前置阶段确认
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

---

## 确认文件内容校验规则（详细版）

有效的确认文件（` .dev-flow/stage-confirmations/{stage}.confirmed`）**必须**包含以下所有字段：

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

### 校验失败处理

| 缺失字段 | 处理方式 |
|---------|---------|
| `stage` 缺失或值不匹配 | 拒绝进入，提示"确认文件 stage 字段缺失或值不匹配" |
| `confirmed_at` 缺失 | 拒绝进入，提示"确认文件缺少确认时间" |
| `checklist` 缺失 | 拒绝进入，提示"确认文件缺少 Checklist" |
| `checklist` 中某项 `status ≠ confirmed` | 拒绝进入，提示"Checklist 存在未确认项" |
| `execution_trail` 中 `zero_edit_violation: true` | 🔴 拒绝进入，触发违规报告 |

---

## 特殊场景处理

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

---

## 执行顺序关键规则

> **⚠️ 关键规则**：即使阶段指令文件（如 `stages/research.md`）中也包含门禁检查描述，**Router 层的检查仍然必须执行**。这是双重保险机制。

**执行顺序**：
1. 先执行 Router 层门禁检查（本文档）→ 通过后
2. 再读取目标阶段指令文件 → 阶段指令中的门禁作为二次确认

---

> 本文档由 SKILL.md Router 层硬性门禁章节提取而来（v3.1.0）。
> 修改本文件后，需同步更新 SKILL.md 中的引用说明。
