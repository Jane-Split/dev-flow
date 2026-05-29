# dev-flow for Codex

<!-- dev-flow:start -->

当用户要求执行 `dev-flow`、`dev-flow research`、`dev-flow analyze`、`dev-flow design`、`dev-flow develop`、`dev-flow test`、`dev-flow fix` 或类似开发流程时，优先使用仓库级 Codex skill：`$dev-flow`。

## 工作约定

- 先读取 `.dev-flow/memory/` 中已有项目记忆；若缺失或过期，先执行 Research。
- 除 hotfix 或用户明确要求直接修改外，全流程按 Research → Analyze → Design → Task Split → Develop → Test/Fix 推进，每个阶段完成后暂停并等待用户确认。
- 生成代码前必须读取相关已有实现，保持项目原有架构、命名、风格和测试习惯。
- 复杂任务、多服务任务、大规模扫描或并行开发时，可以显式使用 Codex subagents：`orchestrator`、`research-expert`、`analyze-expert`、`design-expert`、`develop-expert`、`verify-expert`、`smoke-test`、`integration-test`、`delivery`、`dependency-scanner`、`service-scanner`、`structure-analyzer`、`config-analyzer`。
- 阶段性产物写入 `.dev-flow/sessions/`；长期项目知识写入 `.dev-flow/memory/`。
- 不要生成 TODO 占位代码、空壳实现或无效测试。

更多细节见 `.agents/skills/dev-flow/SKILL.md`。

## ⚠️ Codex 上下文管理（关键！）

### 上下文限制

Codex 有上下文限制，超出限制会导致：
- 代码生成不完整
- 项目扫描缺失
- 需求理解错误

### 上下文监控

**实时监控指标**：
- **70% 使用**：警告提示，建议保存进度
- **85% 使用**：强制保存，触发分段执行
- **95% 使用**：立即停止，防止数据丢失

### 上下文优化策略

#### 策略1：分段执行

```
当预估上下文使用 > 70% 时：

1. 将任务拆分为多个阶段
2. 每个阶段完成后：
   - 将结果写入文件
   - 清理上下文，只保留关键摘要
   - 标记检查点
3. 下一阶段从检查点继续
```

#### 策略2：按需加载

```
只读取当前阶段需要的文件：

Research 阶段：
- 读取：pom.xml, application.yml, 目录结构
- 不读取：源码内容（只 Glob 路径）

Analyze 阶段：
- 读取：memory/ 文件, 需求描述
- 不读取：无关服务代码

Design 阶段：
- 读取：analyze-result.md, 1-2个参考实现
- 不读取：所有源码

Develop 阶段：
- 读取：design-contract.yaml, 相关已有代码
- 不读取：无关模块
```

#### 策略3：结果外置

```
所有详细内容写入文件，上下文只保留摘要：

- 设计文档 → design-result.md
- 代码文件 → 直接写入磁盘
- 测试报告 → test-report.md
- 上下文只保留：文件路径 + 关键类名/方法名
```

### Subagent 调用策略

#### 何时使用 Subagent

| 场景 | 是否使用 Subagent | 原因 |
|------|-------------------|------|
| 简单 CRUD（<5 文件） | 否 | 单 agent 可完成 |
| 中等需求（5-10 文件） | 可选 | 根据上下文使用情况决定 |
| 复杂需求（>10 文件） | 是 | 必须，避免上下文溢出 |
| 多服务项目 | 是 | 必须，并行开发 |
| 大型扫描（>200 文件） | 是 | 必须，分层扫描 |

#### Subagent 上下文隔离

```
每个 subagent 独立上下文：

1. 主 agent 只传递必要的输入文件
2. Subagent 执行完成后返回摘要
3. 详细结果写入文件，不返回给主 agent
4. 主 agent 只保留：任务状态 + 结果文件路径
```

### 会话持久化

#### 检查点机制

```yaml
# .dev-flow/sessions/{session-id}/checkpoint.yaml
session_id: "session-20260529-001"
created_at: "2026-05-29 14:00:00"
updated_at: "2026-05-29 15:30:00"

current_phase: "Develop"
completed_phases: ["Research", "Analyze", "Design", "Task Split"]

phase_results:
  Research:
    status: "completed"
    output_files:
      - ".dev-flow/memory/project-overview.md"
      - ".dev-flow/memory/conventions.md"
    summary: "Java微服务项目，5个服务，200+文件"
    
  Analyze:
    status: "completed"
    output_files:
      - ".dev-flow/sessions/session-20260529-001/analyze-result.md"
    summary: "涉及3个服务，预计新增15个文件"
    
  Design:
    status: "completed"
    output_files:
      - ".dev-flow/docs/order-management-design-contract.yaml"
    summary: "5个Entity, 8个DTO, 3个Service, 2个Controller"
    
  Task Split:
    status: "completed"
    output_files:
      - ".dev-flow/docs/order-management-task-split/task-dag.yaml"
    summary: "15个子任务，4个批次"
    
  Develop:
    status: "in_progress"
    current_batch: 2
    completed_subtasks: ["task-001", "task-005"]
    pending_subtasks: ["task-002", "task-003", "task-004"]

context_usage: 65%
warnings: []
```

#### 恢复机制

```
当会话中断后恢复：

1. 读取 checkpoint.yaml
2. 确认当前阶段和进度
3. 从上次中断处继续执行
4. 恢复必要的上下文（从文件读取）
```

### 错误恢复

#### 常见错误处理

| 错误类型 | 处理方式 |
|----------|----------|
| 上下文溢出 | 保存进度 → 清理上下文 → 从检查点继续 |
| Subagent 超时 | 记录状态 → 重试或拆分任务 |
| 文件读取失败 | 检查路径 → 使用备选方案 |
| 编译错误 | 记录错误 → 进入 Fix 阶段 |

<!-- dev-flow:end -->
