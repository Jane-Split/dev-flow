---
title: "Mode Comparison & Manual Override"
summary: "开发规模分级的模式对比速查表、手动覆盖规则详情"
read_when:
  - 需要向用户解释不同模式的差异
  - 用户手动指定模式（--lite / --detailed / -subagent）
  - 需要确认某模式包含的阶段的
---

# 开发规模分级 — 模式对比与手动覆盖

> 本文件是 SKILL.md「开发规模分级」章节的详细补充。
> SKILL.md 中仅保留模式自动检测规则和动态重评估网关摘要，详细对比表和覆盖规则见本文档。

---

## 模式对比速查（完整版）

| 维度 | L0 轻量 | L1 小型 | L2 标准 | L3 企业级 |
|------|---------|---------|---------|----------|
| 阶段数 | 3 | 6 | 8 | 10 |
| 代码量 | 1 个文件 | 2-5 个文件 | 5-10 个文件 | 10+ 个文件 |
| 是否需要 Task Split | ❌ | ❌ | ✅ | ✅ |
| 是否支持并行开发 | ❌ | ❌ | ❌ | ✅ 多 Agent |
| 测试深度 | 基础 | 单元测试 | 单元+冒烟 | 单元+冒烟+集成 |
| 交付物 | 代码变更 | 代码+报告 | 代码+完整报告 | 代码+详细报告+部署指南 |
| 适用场景 | 紧急修复、配置修改、单文件 Bug 修复 | 日常小需求、简单 CRUD | 常规功能、单服务开发 | 重大项目、多服务联调、大型重构 |
| 推荐命令 | `/dev-flow --lite <需求>` | `/dev-flow <需求>` | `/dev-flow --detailed <需求>` | `/dev-flow -subagent <需求>` |
| 流程 | Research(快速) → Fix → Delivery | Research → Analyze → Design → Develop → Test → Delivery | Research → Analyze → Design → Task Split → Develop → Unit Test → Smoke Test → Delivery | Research → Analyze → Design → Task Split → Develop(并行) → Unit Test → Smoke Test → E2E Test → Integration Test → Delivery |

---

## 手动覆盖规则（详细版）

任何时候用户都可以手动指定模式，覆盖自动检测结果。

### 覆盖命令

| 命令参数 | 强制模式 | 说明 |
|---------|---------|------|
| `--lite` | L0 轻量模式 | 强制跳过 Analyze/Design/Task Split，直接进入 Fix |
| `--detailed` | L2 标准模式 | 强制包含 Task Split 和 Smoke Test |
| `-subagent` | L3 企业级模式 | 强制启用并行 Subagent 调度（Orchestrator） |
| `--resume` | （恢复） | 从上次中断处继续，不重新检测模式 |

### 覆盖时的行为变化

```
用户手动指定模式后：

--lite 强制轻量模式
  ├── 跳过 Analyze、Design、Task Split 阶段
  ├── 执行流程：Research(快速) → Fix → Delivery
  └── 适用于：配置修改、常量添加、单文件 Bug 修复

--detailed 强制标准模式
  ├── 包含 Task Split 和 Smoke Test
  ├── 执行完整 L2 流程
  └── 适用于：需要详细设计和任务拆分的常规功能

-subagent 强制企业级模式
  ├── 启用 Orchestrator 并行调度
  ├── Develop 阶段按 DAG 批次并行执行
  └── 适用于：多服务联调、大型重构
```

### 模式冲突处理

| 场景 | 处理方式 |
|------|---------|
| 自动检测为 L1，用户指定 `--detailed` | 以用户指定为准，升级为 L2 |
| 自动检测为 L3，用户指定 `--lite` | 🔴 警告用户，确认是否真的要降级 |
| 用户指定多个模式参数 | 以最后一个为准 |
| `--resume` 与模式参数同时指定 | 先恢复会话，再应用模式参数（如恢复的阶段与新模式不兼容，提示用户） |

---

## 动态重评估网关（摘要）

> 详细流程见 SKILL.md「模式动态重评估网关」章节。
> 此处仅提供速查要点。

**重评估触发时机**：Task Split 阶段确认后，Develop 阶段进入前。

**升级为并行调度的条件**（满足任一即升级）：
- `total_tasks > 5`
- `write_conflicts > 0`（存在需要串行化的文件冲突）
- `dag_depth > 3`（依赖链条过长）
- `batch_count > 3`（批次过多）

**升级时通知用户**，无需额外确认（Task Split 确认清单中已包含"开发模式选择"项）。

---

> 本文档由 SKILL.md 开发规模分级章节提取而来（v3.1.0）。
> 修改本文件后，需同步更新 SKILL.md 中的引用说明。
