---
title: "Deliverable Protocol v3.1"
summary: "阶段交付物协议的完整规范：交付物目录结构、确认文件格式、审批流程、标准 Checklist 模板"
read_when:
  - 需要生成阶段交付物文档
  - 需要撰写或检查 .confirmed 确认文件格式
  - 需要输出阶段确认 Checklist
---

# 阶段交付物协议 v3.1 — 完整规范

> 本文件是 SKILL.md「阶段交付物协议」章节的详细补充。
> SKILL.md 中仅保留核心原则和交付物检查表摘要，详细格式和模板见本文档。

---

## 交付物目录结构

```
.dev-flow/deliverables/
├── 01-research-report.md         # Research 阶段交付物
├── 02-analyze-result.md          # Analyze 阶段交付物
├── 03-design-result.md           # Design 阶段交付物（含 design-contract.yaml）
├── 04-task-breakdown.md          # Task Split 阶段交付物（含 task-dag.yaml）
├── 05-develop-result.md          # Develop 阶段交付物
├── 06-unit-test-report.md        # Unit Test 阶段交付物
├── 07-fix-report.md              # Fix 阶段交付物
├── 08-smoke-test-report.md      # Smoke Test 阶段交付物
├── 09-e2e-test-report.md        # E2E Test 阶段交付物
├── 10-integration-test-report.md # Integration Test 阶段交付物
└── 11-delivery-report.md        # Delivery 阶段交付物
```

> **⚠️ 目录自动创建规则**：
> 每个阶段生成交付物前，subagent 必须先检查 `.dev-flow/deliverables/` 目录是否存在。
> 如不存在，执行 `Bash "mkdir -p .dev-flow/deliverables/"` 创建目录后再写入文件。

---

## 确认文件格式（v3.1 增强版）

路径：`.dev-flow/stage-confirmations/{stage}.confirmed`

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

> **校验规则**：有效的确认文件必须包含 `stage`、`confirmed_at`、`confirmed_by`、`session_id`、`checklist` 字段。
> `checklist` 中每个 item 的 `status` 必须为 `confirmed`。

---

## 主 Agent 审批流程（详细版）

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

---

## 标准确认 Checklist 模板

向用户输出的 Checklist 格式（Markdown）：

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

---

## 阶段门禁检查（交付物存在性）

进入下一阶段前，Router 层必须检查前置阶段交付物是否存在：

```
进入 Analyze 阶段前 → 检查 .dev-flow/deliverables/01-research-report.md 是否存在
进入 Design  阶段前 → 检查 .dev-flow/deliverables/02-analyze-result.md 是否存在
进入 TaskSplit 阶段前 → 检查 .dev-flow/deliverables/03-design-result.md 是否存在
进入 Develop 阶段前 → 检查 .dev-flow/deliverables/04-task-breakdown.md 是否存在
进入 UnitTest 阶段前 → 检查 .dev-flow/deliverables/05-develop-result.md 是否存在
进入 SmokeTest 阶段前 → 检查 .dev-flow/deliverables/06-unit-test-report.md 是否存在
进入 E2ETest 阶段前 → 检查 .dev-flow/deliverables/08-smoke-test-report.md 是否存在
进入 IntegrationTest 阶段前 → 检查 .dev-flow/deliverables/09-e2e-test-report.md 是否存在
进入 Delivery 阶段前 → 检查 .dev-flow/deliverables/10-integration-test-report.md 是否存在

如果交付物不存在 → 拒绝进入，输出：
  【🔴 交付物缺失】
  当前尝试进入：{目标阶段}
  缺失交付物：{交付物文件路径}
  原因：前置阶段的交付物尚未生成
  操作：请先完成前置阶段，确保 .dev-flow/deliverables/ 下文档已生成
```

---

## 各阶段交付物索引

| 目标阶段 | 前置交付物（必须存在） |
|---------|----------------------|
| Analyze | `.dev-flow/deliverables/01-research-report.md` |
| Design | `.dev-flow/deliverables/02-analyze-result.md` |
| TaskSplit | `.dev-flow/deliverables/03-design-result.md` |
| Develop | `.dev-flow/deliverables/04-task-breakdown.md` |
| UnitTest | `.dev-flow/deliverables/05-develop-result.md` |
| SmokeTest | `.dev-flow/deliverables/06-unit-test-report.md` |
| E2ETest | `.dev-flow/deliverables/08-smoke-test-report.md` |
| IntegrationTest | `.dev-flow/deliverables/09-e2e-test-report.md` |
| Delivery | `.dev-flow/deliverables/10-integration-test-report.md` |

---

> 本文档由 SKILL.md 阶段交付物协议章节提取而来（v3.1.0）。
> 修改本文件后，需同步更新 SKILL.md 中的引用说明。
