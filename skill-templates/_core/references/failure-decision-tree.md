---
title: "Subagent Failure Decision Tree"
summary: "Subagent 失败硬阻断规则的详细决策树、Level 2 诊断报告模板、Level 3 升级报告模板"
read_when:
  - Subagent 执行失败，需要执行三级失败处理协议
  - 需要撰写 Level 2 诊断报告
  - 需要撰写 Level 3 人工升级报告
---

# Subagent 失败硬阻断 — 详细决策树与报告模板

> 本文件是 SKILL.md「Subagent 失败硬阻断规则」章节的详细补充。
> SKILL.md 中仅保留三级协议摘要和禁止行为表，详细决策树和报告模板见本文档。

---

## 完整决策树（详细版）

```
主 Agent 检测到 Subagent 返回失败状态
  │
  ├── Step 1: 记录失败信息
  │   ├── 错误类型：{error_type}
  │   ├── 错误详情：{error_detail}
  │   ├── 失败的 subagent 名称和阶段：{stage}-expert
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

---

## Level 2 — 诊断报告模板

文件名：`.dev-flow/sessions/{session-id}/diagnosis-{stage}.md`

```markdown
# 诊断报告：{stage} 阶段

## 失败摘要

| 字段 | 值 |
|------|-----|
| 阶段 | {stage} |
| Subagent | {stage}-expert |
| 总尝试次数 | {attempt_count} |
| 诊断时间 | {timestamp} |

## 失败历史

### 第 1 次（原始执行）
- 错误类型：{error_type_1}
- 错误详情：{error_detail_1}

### 第 2 次（Level 1 自动重试）
- 错误类型：{error_type_2}
- 错误详情：{error_detail_2}
- 附加上下文：{added_context}

## 根因分析

- **根因分类**：{environment_issue | context_insufficient | instruction_ambiguous | task_too_complex}
- **详细描述**：{root_cause_detail}
- **影响范围**：{impact_scope}

## 修复建议

- **Prompt 调整**：{prompt_adjustment}
- **上下文增强**：{context_enhancement}
- **任务拆分建议**：{task_split_suggestion}

## 重试计划

- 调整后 Prompt 关键点：{key_points}
- 额外上下文文件：{additional_files}
- 预期改善：{expected_improvement}
```

---

## Level 3 — 人工升级报告模板

向用户输出的升级报告（完整格式）：

```
【🔴 Subagent 执行失败 — 需要人工介入】
╔══════════════════════════════════════

失败阶段：{stage}
失败 Subagent：{stage}-expert
已尝试次数：{attempt_count} 次（含自动重试 + 诊断重试）

失败摘要：
- 第 1 次（原始执行）：{error_summary_1}
- 第 2 次（Level 1 自动重试）：{error_summary_2}
- 第 3 次（Level 2 诊断重试）：{error_summary_3}

诊断结果：
- 根因分析：{root_cause}
- 诊断报告：.dev-flow/sessions/{id}/diagnosis-{stage}.md

当前状态：流程暂停，等待人工决策

可选操作：
1. 回复「重试」→ 再次尝试执行（使用优化后的 prompt）
2. 回复「跳过」→ 跳过当前阶段，继续下一阶段
3. 回复「手动」→ 用户自行描述要求和上下文，由主 Agent 创建新的 subagent
4. 回复「终止」→ 结束本次 dev-flow 会话
╚══════════════════════════════════════
```

---

## subagent-failures.yaml 格式

```yaml
# .dev-flow/sessions/{session-id}/subagent-failures.yaml
session_id: "session-20260605-001"

failures:
  - stage: "develop"
    subagent: "develop-expert"
    attempts:
      - level: "original"
        error_type: "compile_error"
        error_summary: "Maven 编译失败：缺少依赖 xxx"
        timestamp: "2026-06-05T14:30:00"
      - level: "L1_retry"
        error_type: "compile_error"
        error_summary: "重试后仍然缺少依赖 xxx"
        timestamp: "2026-06-05T14:32:00"
      - level: "L2_diagnosis"
        error_type: "context_insufficient"
        error_summary: "诊断发现：pom.xml 中依赖范围是 provided，需调整"
        diagnosis_report: ".dev-flow/sessions/session-20260605-001/diagnosis-develop.md"
        timestamp: "2026-06-05T14:35:00"
    final_action: "escalate_to_human"
    escalated_at: "2026-06-05T14:36:00"
```

---

## 主 Agent 禁止行为速查表

| 违规行为 | 严重级别 | 说明 |
|---------|---------|------|
| 主 Agent 直接使用 Edit/Write 工具编辑代码文件 | 🔴 P0 严重违规 | 违反零编辑铁律，立即终止 |
| 主 Agent 在对话中直接输出代码代替 Subagent 执行 | 🔴 P0 严重违规 | 代码输出视为文件编辑 |
| 主 Agent 跳过 Level 1 直接升级到 Level 3 | 🟡 P1 违规 | 未执行自动重试 |
| 主 Agent 跳过 Level 2 直接升级到 Level 3 | 🟡 P1 违规 | 未执行诊断分析 |
| 主 Agent 自行修改 subagent 的产出文件 | 🔴 P0 严重违规 | 违反零编辑铁律 |
| 主 Agent 在 Level 3 等待期间自行执行任务 | 🔴 P0 严重违规 | 越过人工决策 |
| 主 Agent 向用户隐瞒 Subagent 失败的事实 | 🟡 P1 违规 | 透明度违规 |

> 违反 P0 规则 → 立即终止会话，输出违规报告。
> 违反 P1 规则 → 记录到 audit-log.yaml，继续流程但标记警告。

---

> 本文档由 SKILL.md Subagent 失败硬阻断章节提取而来（v3.1.0）。
> 修改本文件后，需同步更新 SKILL.md 中的引用说明。
