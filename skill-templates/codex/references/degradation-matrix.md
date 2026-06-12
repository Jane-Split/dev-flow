---
name: "degradation-matrix"
description: "故障降级策略矩阵。当开发过程中遇到上下文不足、编译错误、subagent 无响应等故障时，按此矩阵执行优雅降级。所有 subagent 在遇到困难时应首先查阅此文档。"
---

# 优雅降级策略矩阵

> **核心原则**: 故障是常态，恢复是关键。任何单点失败都不应阻断全流程。

## 快速决策流程

```
遇到故障？
  ├─ 是否可自动修复？ → 执行对应 Level 1
  ├─ 是否可隔离处理？ → 执行对应 Level 2
  ├─ 是否可回滚重试？ → 执行对应 Level 3
  └─ 以上都不可行？ → 执行 Level 4（人工升级或跳过）
```

---

## 场景 1: 上下文不足（CONTEXT_INSUFFICIENT）

**触发条件**: 完整性门控阻断 或 subagent 返回上下文溢出错误

| 级别 | 条件 | 动作 | 输出 |
|------|------|------|------|
| **L1** 拆分任务 | 任务包含 >3 个方法 或 依赖文件总大小 > 预算 80% | 将任务拆分为更小的子任务 | 多个独立 task-brief |
| **L2** 按需加载 | 只有 1-2 个超大依赖文件 | 启用 @on-demand-loader，运行时读取 | 带按需加载标记的 task-brief |
| **L3** 骨架交付 | 即使按需加载也不足 | 只生成骨架（签名 + 空实现） | 可编译但功能未实现的文件 |
| **L4** 跳过边缘 | 当前任务是边缘功能（日志/监控/导出） | 跳过该任务，记录到 pending 清单 | pending 记录 |

**决策示例**:
- OrderService (8 个方法，依赖 3 个 >30KB 文件) → **L1 拆分**为 OrderValidator + OrderCalculator + OrderSaver
- OrderService (3 个方法，依赖 1 个 85KB 文件) → **L2 按需加载**
- OrderExportService (边缘功能，依赖复杂) → **L4 跳过**

---

## 场景 2: 编译验证失败（COMPILATION_ERROR）

**触发条件**: 编译器返回错误（javac/mvn/npm tsc 等）

| 级别 | 条件 | 动作 | 输出 |
|------|------|------|------|
| **L1** 自动修复 | 语法错误、类型不匹配、缺失导入 | 自动修复（最多 3 轮） | 修复后的代码 |
| **L2** 隔离修复 | 错误集中在单个文件，其他文件已验证通过 | 锁定其他文件（只读），只修复错误文件 | 聚焦的修复上下文 |
| **L3** 回滚重试 | 自动修复 3 轮后仍失败 | 回滚到上一个 checkpoint，尝试替代实现 | 替代方案代码 |
| **L4** 人工修复 | 回滚后仍失败，或错误涉及复杂业务逻辑 | 标记为 NEEDS_HUMAN_FIX，继续其他文件 | 修复指南 + 错误日志 |

**编译循环上下文管理**:
- Round 1: 保留完整错误日志
- Round 2: 压缩 Round 1 日志（只保留错误类型和位置）
- Round 3: 完全清理 Round 1-2 日志，只保留当前轮次
- Round 3 失败: 不再继续，触发 L3/L4

---

## 场景 3: Subagent 无响应（SUBAGENT_TIMEOUT）

**触发条件**: subagent 调用超时 或 返回空内容

| 级别 | 条件 | 动作 | 输出 |
|------|------|------|------|
| **L1** 重启 | 首次超时 | 重启 subagent（保留 task-brief） | 重新执行 |
| **L2** 简化任务 | 重启后仍超时 | 去掉非核心功能，减少上下文 | 简化版 task-brief |
| **L3** 串行降级 | 并行模式下频繁超时 | 降级到串行模式 | 串行执行计划 |
| **L4** 人工升级 | 串行模式下仍超时 | 标记为 NEEDS_HUMAN_ATTENTION | 任务描述 + 上下文摘要 |

---

## 场景 4: 设计契约冲突（CONTRACT_MISMATCH）

**触发条件**: contract-validator 发现 R1-R4 失败

| 级别 | 条件 | 动作 | 输出 |
|------|------|------|------|
| **L1** 自动对齐 | 命名风格、注解缺失、参数顺序差异 | 自动调整代码以匹配契约 | 修正后的代码 |
| **L2** 更新契约 | 契约设计不合理（如循环依赖） | 更新设计契约（记录变更原因） | 变更日志 |
| **L3** 部分实现 | 契约中部分方法在当前上下文中无法实现 | 实现可完成的部分，标记不可完成的 | 部分实现 + 待实现标记 |
| **L4** 重新设计 | 契约与实现根本冲突 | 触发重新设计（回到 Design 阶段） | 重新设计需求（限 1 次） |

---

## 场景 5: Session 不稳定（SESSION_UNSTABLE）

**触发条件**: 主 Agent 响应变慢、上下文使用率 >90%

| 级别 | 条件 | 动作 | 输出 |
|------|------|------|------|
| **L1** 压缩历史 | 上下文使用率 70-85% | 强制压缩阶段历史，只保留最近 2 个阶段 | 精简后的上下文 |
| **L2** 保存续跑 | 上下文使用率 85-95% | 保存 checkpoint，提示用户重新开始 session | checkpoint 文件 |
| **L3** 部分交付 | 上下文使用率 >95% 且无法压缩 | 立即交付已完成的部分 | 部分交付报告 |
| **L4** 紧急停止 | 系统级错误（文件系统满、内存不足） | 紧急停止，保留所有 checkpoint | 紧急状态记录 |

---

## 任务分类体系

### 阻塞性任务（BLOCKING）
- **定义**: 下游任务依赖此任务
- **失败策略**: 必须成功，否则下游无法继续
- **示例**: OrderService（被 OrderController 依赖）

### 核心非阻塞任务（CORE_NON_BLOCKING）
- **定义**: 核心功能，但无下游依赖
- **失败策略**: 可延期到后续迭代
- **示例**: OrderAuditLogService

### 边缘功能任务（EDGE）
- **定义**: 非核心功能，不影响主流程
- **失败策略**: 可跳过，记录到 pending 清单
- **示例**: OrderExportService, OrderMetricsService

### 优化类任务（OPTIMIZATION）
- **定义**: 性能优化、代码重构
- **失败策略**: 可跳过
- **示例**: OrderCacheOptimizer

### 自动分类规则
1. 如果被 >2 个其他任务依赖 → **阻塞性**
2. 如果属于核心业务流程（CRUD 中的 CUD）→ **核心非阻塞**
3. 如果名称包含 Export, Metrics, Cache, Log, Report → **边缘或优化**
4. 人工标注优先于自动分类

---

## 部分交付报告格式

当流程在部分任务失败的情况下继续时，生成以下报告：

```yaml
partial_delivery_report:
  summary:
    total_tasks: 20
    completed: 16
    failed: 3
    skipped: 1
    
  completed_features:
    - "订单创建流程"
    - "库存检查"
    - "价格计算"
    
  pending_features:
    - task: "订单导出功能"
      task_id: "T15"
      classification: "EDGE"
      reason: "上下文不足，Excel 生成库依赖复杂"
      guide: ".dev-flow/pending/T15-fix-guide.md"
      suggested_action: "人工实现 Excel 导出逻辑"
      
    - task: "订单监控指标"
      task_id: "T18"
      classification: "EDGE"
      reason: "编译错误，Micrometer 配置冲突"
      guide: ".dev-flow/pending/T18-fix-guide.md"
      suggested_action: "检查 Micrometer 依赖版本兼容性"
      
  next_steps:
    - "查看 .dev-flow/pending/ 了解待完成功能"
    - "按修复指南人工完成失败任务"
    - "重新运行 dev-flow 验证完整性"
```

---

## 使用指南

### 对于 Develop Subagent
1. 开发前检查 task-brief 是否有 `ON_DEMAND_LOAD_REQUIRED` 标记
2. 编译失败时，先尝试 L1 自动修复（最多 3 轮）
3. 每轮修复前清理历史错误日志
4. 3 轮失败后，根据错误类型选择 L2-L4

### 对于 Orchestrator (Main Agent)
1. 派发 subagent 前确认完整性门控已通过
2. 监控上下文使用率，>70% 时触发 L1 压缩
3. 任务失败时根据分类决定：重试 / 降级 / 跳过
4. 阻塞性任务失败时不得跳过，必须重试或人工升级

### 对于 Contract Validator
1. R1-R4 失败时，先判断是否为 L1 可自动对齐的问题
2. 如果是契约设计问题，记录变更原因后更新契约
3. 不要直接阻断，给出降级建议
