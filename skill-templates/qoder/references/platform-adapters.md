---
title: "Platform Adapters & Context Management"
summary: "5 大平台 Subagent 适配规则详解、上下文监控机制、Subagent 调度策略"
read_when:
  - 需要根据当前平台选择 Subagent 调度策略
  - 需要了解某平台的具体 Subagent 创建和通信方式
  - 需要处理上下文溢出风险
---

# 平台适配规则与上下文管理 — 详细规范

> 本文件是 SKILL.md「运行模式」和「上下文管理」章节的详细补充。
> SKILL.md 中仅保留核心原则、平台能力表格摘要和架构图，详细说明见本文档。

---

## 五大平台 Subagent 适配规则（详细版）

> **不同 AI 编程平台的 Subagent 能力差异很大，系统必须根据当前平台选择合适的调度策略。**

### 平台能力总览

| 平台 | Subagent 创建方式 | 并行能力 | 上下文传递 | 结果获取 |
|------|-----------------|---------|----------|---------|
| **Trae** | `/agent-name` 斜杠命令 | 原生并行 | `task-result.yaml` | 文件读取 |
| **Cursor** | `.cursor/agents/*.md` YAML frontmatter | 多 Task 调用并行 + 后台模式 + 嵌套 | `~/.cursor/subagents/` | 文件读取或直接返回 |
| **Claude Code** | Dynamic Workflows JS 编排 + `.claude/agents/*.md` | 16 并发 + 1000 总量 + 对抗验证 | Workflow 脚本注入 | 对抗验证自动检查 |
| **Qoder** | Quest Mode 主从 Agent 架构 | 前端/后端/测试/部署方向并行 | Quest Mode Checkpoints | Checkpoints 自动同步 |
| **Codex** | `.codex/agents/*.toml` + `AGENTS.md` | 6 线程 + CSV 批量 | `task-result.yaml` | 文件读取 |

### 各平台并行开发适配规则（详细版）

#### Trae

```
并行开发适配规则 — Trae：

1. 同批次任务同时启动多个 /develop-expert：
   Bash "/develop-expert --task task-001 --context task-brief-001.md"
   Bash "/develop-expert --task task-002 --context task-brief-002.md"
   （在同一条消息中发送多个斜杠命令）

2. 通过 task-result.yaml 传递产出：
   每个 develop-expert 完成后写入：
     task_id: "task-001"
     status: "completed"
     output_files: ["./src/main/java/..."]
     notes: ""

3. 主 Agent 在所有 subagent 完成后统一读取所有 task-result.yaml
```

#### Cursor

```
并行开发适配规则 — Cursor：

1. 一条消息中发送多个 Task 工具调用实现真正并行：
   Task: { subagent_type: "develop-expert", prompt: "..." }
   Task: { subagent_type: "develop-expert", prompt: "..." }
   （两个 Task 调用在同一条消息中，Cursor 会真正并行执行）

2. 支持 is_background: true 后台模式：
   Task: { subagent_type: "develop-expert", prompt: "...", is_background: true }
   （后台任务不阻塞主 Agent，完成后通过 SendMessage 通知）

3. 支持嵌套 Subagent（一个 subagent 内部再创建 subagent）

4. 结果获取：
   - 方式一：subagent 写入 ~/.cursor/subagents/ 目录，主 Agent 读取
   - 方式二：subagent 直接返回结果（适用于小结果）
```

#### Claude Code

```
并行开发适配规则 — Claude Code：

1. Dynamic Workflows JS 编排脚本派发 subagent：
   // workflow.js
   export async function run(session) {
     const batch1 = session.dag.getBatch(1);
     for (const task of batch1) {
       await session.spawnAgent("develop-expert", { task_id: task.id });
     }
   }

2. 利用 16 并发上限：
   - Claude Code 支持最多 16 个 subagent 并发
   - 总量上限 1000 个 subagent（整个会话）

3. 对抗验证（Adversarial Verification）：
   - 自动启动一个验证 subagent 检查产出质量
   - 验证失败自动触发修复
```

#### Qoder

```
并行开发适配规则 — Qoder：

1. 主 Agent 规划调度，子 Agent 按方向并行处理：
   方向分类：前端 / 后端 / 测试 / 部署
   每个方向一个 subagent 并行处理

2. Quest Mode Checkpoints 确保质量：
   - 每个 Checkpoint 是一个质量门禁
   - subagent 完成后必须经过 Checkpoint 验证才能继续

3. 结果获取：通过 Quest Mode 状态共享自动同步
```

#### Codex

```
并行开发适配规则 — Codex：

1. 通过 run agent: develop-expert 启动 subagent：
   Bash: "run agent: develop-expert --task task-001 --context task-brief-001.md"

2. 6 线程并行：
   - Codex 支持最多 6 个 subagent 并行执行
   - 超过 6 个需分批执行

3. 通过 task-result.yaml 传递产出（同 Trae）

4. CSV 批量模式：
   - 支持从 CSV 文件批量读取任务并派发 subagent
   - 适用于大量同类任务（如批量 CRUD）
```

---

## 上下文监控机制（详细版）

> **⚠️ 重要提示**：AI 模型有上下文限制（通常 100-200K tokens，约 100-150KB 代码）。超出限制会导致：
> - 代码生成不完整（出现 `// TODO` 占位符）
> - 项目扫描缺失（部分文件未被读取）
> - 需求理解错误（关键信息被截断）

### 风险场景识别（完整版）

| 风险等级 | 场景 | 触发条件 | 处理方式 |
|---------|------|----------|---------|
| 🟢 **已解决** | 简单需求直接编辑 | 任何需求规模 | 统一 Subagent 执行，主 Agent 零编辑 |
| 🟢 **已解决** | Research 扫描大项目 | 项目 >200 个文件 | pre-scanner + 13 文件子代理分 5 批并行执行，每个子代理独立上下文（~25-40KB） |
| 🟡 **中** | 复杂需求分析 | 涉及 3+ 服务，10+ 功能点 | analyze-expert 独立上下文 + subagent-only |
| 🟢 **已解决** | Subagent 上下文不足 | 任何 subagent | v3.0 上下文自动注入系统（prepare-context.cjs） |

### 实时监控规则

| 上下文使用率 | 触发动作 |
|-------------|---------|
| **70% 使用** | 警告提示，建议保存进度 |
| **85% 使用** | 强制保存，触发分段执行 |
| **95% 使用** | 立即停止，防止数据丢失 |

### 自动保护措施（详细版）

```
达到 85% 时的自动保护流程：

Step 1: 自动保存所有已生成内容到文件系统
  ├── 代码文件 → 写入磁盘
  ├── 交付物文档 → 写入 .dev-flow/deliverables/
  └── 会话状态 → 写入 .dev-flow/sessions/{id}/

Step 2: 清理 AI 上下文，只保留关键摘要
  ├── 保留：当前阶段、当前任务、关键决策
  ├── 移除：已完成的阶段详情、已处理的文件内容
  └── 摘要写入 .dev-flow/sessions/{id}/context-summary.md

Step 3: 标记检查点，支持断点续传
  ├── 写入 .dev-flow/sessions/{id}/checkpoint-{timestamp}.yaml
  ├── 包含：当前阶段、当前任务、已完成任务列表
  └── 恢复时读取最新 checkpoint 继续
```

---

## Subagent 调度策略（详细版）

| 场景 | 调度方式 | 说明 | 适用平台 |
|------|---------|------|---------|
| 简单 CRUD（1-3 文件） | 串行 Subagent | 每阶段 1 个 subagent，串行执行 | 所有平台 |
| 中等需求（4-5 文件） | 串行 Subagent | 每阶段 1 个 subagent，串行执行 | 所有平台 |
| 复杂需求（6+ 文件） | **批次并行 Subagent** | Task Split 后按 DAG 批次并行 | Trae / Cursor / Claude Code / Qoder |
| 大型重构 | **完整并行 Subagent** | Orchestrator 调度 | Trae / Cursor / Claude Code |
| 多服务联调 | **完整并行 Subagent** | 并行开发 + 集成验证 | Trae / Cursor / Claude Code |

> **⚠️ 所有种场景下，主 Agent 均不直接编辑文件。**

---

> 本文档由 SKILL.md「运行模式」和「上下文管理」章节提取而来（v3.1.0）。
> 修改本文件后，需同步更新 SKILL.md 中的引用说明。
