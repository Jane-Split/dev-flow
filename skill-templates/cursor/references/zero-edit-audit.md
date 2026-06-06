---
title: "Zero Edit Audit Protocol v2.0"
summary: "主 Agent 零编辑铁律的详细审计规范，从 SKILL.md 提取为独立 reference"
read_when:
  - 需要执行阶段结束后的文件修改审计
  - 需要验证 @generated-by 溯源注释格式
  - 需要撰写或检查 audit-log.yaml 内容
---

# 零编辑铁律 v2.0 — 详细审计规范

> 本文件是 SKILL.md「主 Agent 零编辑铁律 v2.0」章节的详细补充。
> SKILL.md 中仅保留核心约束摘要，详细格式和流程见本文档。

---

## 产出文件溯源格式规范

每个由 subagent 产生的文件**必须**在文件首行包含溯源注释。

### 源码文件格式

```java
// @generated-by: develop-expert subagent | session: session-20260605-001 | stage: develop
```

```typescript
// @generated-by: develop-expert subagent | session: session-20260605-001 | stage: develop
```

```python
# @generated-by: develop-expert subagent | session: session-20260605-001 | stage: develop
```

```go
// @generated-by: develop-expert subagent | session: session-20260605-001 | stage: develop
```

### `.confirmed` 文件中的执行轨迹

```yaml
execution_trail:
  executor: "pre-scanner + file-level subagents (13 total, 5 batches)"
  files_produced:
    - path: ".dev-flow/memory/project-overview.md"
      generated_by: "project-overview-subagent"
      checksum: "abc123..."
  zero_edit_violation: false  # 主 Agent 是否违规编辑
```

---

## 文件修改审计流程（详细版）

每个阶段结束后自动执行，验证主 Agent 未违反零编辑铁律。

### 审计步骤

```
审计流程（每阶段结束时自动执行）：

Step 1: 扫描本阶段产生的所有新文件和修改的文件
  ├── 工具：Bash "git diff --name-only HEAD~1" 或文件时间戳对比
  └── 输出：changed-files.list

Step 2: 对每个文件执行合规检查
  ├── 检查 1：是否在白名单中？
  │   └── 是 → ✅ 合法（如 .confirmed 文件，需进一步验证内容）
  ├── 检查 2：是否包含 @generated-by 溯源注释？
  │   ├── 是 → 提取 generated_by 值
  │   └── 判断：generated_by 是否包含 "subagent"？
  │       ├── 是 → ✅ 合法
  │       └── 否 → 🔴 违规！标记 zero_edit_violation = true
  └── 检查 3：无溯源注释且不在白名单中？
      └── 是 → 🔴 违规！

Step 3: 汇总审计结果，写入 audit-log.yaml
```

### audit-log.yaml 格式

```yaml
# .dev-flow/sessions/{session-id}/audit-log.yaml
session_id: "session-20260605-001"
stage: "research"
audit_time: "2026-06-05T16:30:00"

files_checked: 15
files_compliant: 15
files_violated: 0

violations: []
# 如有违规，格式如下：
# - file: ".dev-flow/memory/project-overview.md"
#   violation_type: "missing_generated_by"
#   detected_by: "main_agent"
#   zero_edit_violation: true

compliance_status: "compliant"  # 或 "violated"
```

---

## 违规纠正机制

| 检测时机 | 纠正动作 |
|---------|---------|
| 执行中检测到主 Agent 正在输出 Edit/Write | 立即停止，改为创建对应 subagent |
| 阶段结束时审计发现违规 | 该阶段产出标记为无效，要求 subagent 重新执行 |
| 连续 3 次审计发现违规 | 🔴 强制终止会话，输出违规报告 |

---

## 与主 Agent 禁止行为表的对应关系

本文档覆盖的审计项对应 SKILL.md 主 Agent 禁止行为表：

| 禁止行为 | 审计检查方式 |
|---------|------------|
| 直接使用 Edit/Write 编辑代码文件 | 检查 @generated-by 是否含 "subagent" |
| 在对话中直接输出代码 | 检查产出文件是否存在且含溯源注释 |
| 自行修改 subagent 产出文件 | 对比文件首行溯源注释与 execution_trail |

---

> 本文档由 SKILL.md 零编辑铁律章节提取而来（v3.1.0）。
> 修改本文件后，需同步更新 SKILL.md 中的引用说明。
