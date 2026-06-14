# dev-flow for Codex

<!-- dev-flow:start -->

当用户要求执行 `dev-flow`、`dev-flow research`、`dev-flow analyze`、`dev-flow design`、`dev-flow develop`、`dev-flow test`、`dev-flow fix` 或类似开发流程时，优先使用仓库级 Codex skill：`$dev-flow`。

## 工作约定

- 先读取 `.dev-flow/memory/` 中已有项目记忆；若缺失或过期，先执行 Research。
- 除 hotfix 或用户明确要求直接修改外，全流程按 Research → Analyze → Design → Task Split → Develop → Test/Fix 推进，每个阶段完成后暂停并等待用户确认。
- 生成代码前必须读取相关已有实现，保持项目原有架构、命名、风格和测试习惯。
- 复杂任务、多服务任务、大规模扫描或并行开发时，可以显式使用 Codex subagents：`orchestrator`、`research-expert`、`analyze-expert`、`design-expert`、`develop-expert`、`verify-expert`、`smoke-test`、`integration-test`、`delivery`、`dependency-scanner`、`service-scanner`、`structure-analyzer`、`config-analyzer`。
- 阶段性产物写入 `.dev-flow/sessions/`；长期项目知识写入 `.dev-flow/memory/`（根目录）；会话快照写入 `.dev-flow/memory/session/`（每次 Research 重建）。
- 清理命令：`/dev-flow -cleanup` 清理会话记忆保留长期记忆；`/dev-flow -cleanup --all` 重置全部。
- 不要生成 TODO 占位代码、空壳实现或无效测试。

更多细节见 `.agents/skills/dev-flow/SKILL.md`。

## 完整流程编排

当用户输入 `/dev-flow <需求>` 时，按以下阶段顺序执行：

```
Step 1: Research（项目调研）→ 多子代理分批扫描架构
Step 2: Clarify（需求澄清，可选）→ 迭代问答消除歧义
Step 3: Analyze（需求分析）→ 分析影响范围和约束
Step 4: Design（详细设计）→ 生成实现计划和数据模型
Step 5: Task Split（任务拆分）→ 拆分为可并行执行的子任务
Step 6: Develop（开发执行）→ 按批次实现子任务
Step 7: Test（统一测试）→ 单元+冒烟+E2E+集成测试
Step 8: Fix（按需修复）→ 仅测试未通过时执行
Step 9: Delivery（交付报告）→ 生成交付物和总结
```

**关键规则**：
- 每个阶段都由专门的 subagent 执行
- 每个阶段完成后必须暂停，等待用户确认
- Task Split 确认后自动执行模式动态重评估

## 使用方式

| 命令 | 说明 |
|------|------|
| `/dev-flow <需求描述>` | 全流程：Research → Clarify → Analyze → Design → Task Split → Develop → Test → Fix(按需) → Delivery |
| `/dev-flow -subagent <需求描述>` | 企业级模式：并行 Subagent 调度，适合复杂需求 |
| `/dev-flow -research` | 仅执行项目调研 |
| `/dev-flow -clarify <需求>` | 仅执行需求澄清（迭代问答） |
| `/dev-flow -analyze <需求>` | 仅执行需求分析 |
| `/dev-flow -design <需求>` | 仅执行详细设计 |
| `/dev-flow -split <需求>` | 仅执行任务拆分 |
| `/dev-flow -develop <需求>` | 直接开发（跳过设计和拆分） |
| `/dev-flow -test` | 执行统一测试（单元+冒烟+E2E+集成） |
| `/dev-flow -delivery` | 生成交付报告 |
| `/dev-flow -fix` | 分析并修复 Bug |
| `/dev-flow -hotfix <错误信息>` | 紧急修复线上错误 |
| `/dev-flow --resume` | 从上次中断处继续 |
| `/dev-flow -cleanup` | 清理会话记忆，保留长期记忆 |
| `/dev-flow -cleanup --all` | 清理全部记忆（重置） |

## Codex 子代理使用

### 可用的 Codex Agent 类型

| Agent | 用途 | Reasoning |
|-------|------|-----------|
| `orchestrator` | 任务分解、依赖管理、结果汇总 | high |
| `research-expert` | 项目扫描、记忆构建 | high |
| `analyze-expert` | 需求分析、影响评估 | high |
| `design-expert` | 设计文档、实现计划 | high |
| `develop-expert` | 代码实现（后端+前端） | high |
| `verify-expert` | 代码审查、测试、质量检查 | high |
| `smoke-test` | 冒烟测试、核心功能验证 | high |
| `integration-test` | 集成测试、跨服务验证 | high |
| `delivery` | 交付报告生成 | high |
| `dependency-scanner` | 内部依赖扫描 | medium |
| `service-scanner` | 服务源码扫描 | medium |
| `structure-analyzer` | 项目结构分析 | medium |
| `config-analyzer` | 配置、约定、模式分析 | medium |
| `task-protocol` | 任务格式定义 | medium |

### Agent 能力映射（Claude/Cursor → Codex）

以下是从 `.claude/` 的完整 agent 集合到 Codex 14 个内置 agent 类型的映射关系。所有能力均通过 Codex 现有 agent 覆盖，无能力削弱：

| Claude/Cursor Agent | Codex 等价实现 | 说明 |
|---------------------|----------------|------|
| `backend-develop-expert` | `develop-expert`（附后端专用指令） | 通过 stage 指令区分前后端 |
| `frontend-develop-expert` | `develop-expert`（附前端专用指令） | 通过 stage 指令区分前后端 |
| `clarify-expert` | `analyze-expert`（附澄清指令） | 需求澄清通过 Analyze 阶段覆盖 |
| `task-split-expert` | `orchestrator` + `task-protocol` | 任务拆分由 orchestrator 调用 task-protocol 完成 |
| `context-manager` | 主 Agent 内置 | 上下文管理策略内置于 AGENTS.md |
| `bytecode-analyzer` | `analyze-expert` | 字节码分析归入分析能力 |
| `contract-validator` | `verify-expert` | 合约验证归入验证能力 |
| `db-verifier` | `verify-expert` + `smoke-test` | 数据库验证归入验证/冒烟测试 |
| `design-contract-validator` | `verify-expert` | 设计合约验证归入验证 |
| `e2e-ui-tester` | `smoke-test` + Browser 插件 | E2E UI 测试通过冒烟测试+Browser 覆盖 |
| `error-pattern-learner` | `verify-expert` + `delivery` | 错误模式学习归入验证和交付阶段 |
| `on-demand-loader` | 按需加载策略（内置） | 按需加载策略内置于 AGENTS.md |
| `runtime-state-manager` | `.dev-flow/runtime/` + 检查点机制 | 运行时状态通过文件和检查点管理 |
| `service-orchestrator` | `orchestrator` | 服务编排归入 orchestrator |
| `step-enforcer` | `verify-expert` + 阶段确认机制 | 步骤执行由验证+确认机制保障 |

### Subagent 调用策略

| 场景 | 是否使用 Subagent | 原因 |
|------|-------------------|------|
| 简单 CRUD（<5 文件） | 否 | 单 agent 可完成 |
| 中等需求（5-10 文件） | 可选 | 根据上下文使用情况决定 |
| 复杂需求（>10 文件） | 是 | 必须，避免上下文溢出 |
| 多服务项目 | 是 | 必须，并行开发 |
| 大型扫描（>200 文件） | 是 | 必须，分层扫描 |

### Subagent 上下文隔离

```
每个 subagent 独立上下文：

1. 主 agent 只传递必要的输入文件
2. Subagent 执行完成后返回摘要
3. 详细结果写入文件，不返回给主 agent
4. 主 agent 只保留：任务状态 + 结果文件路径
```

## 目录结构

```
.codex/
├── config.toml              # Codex 项目配置
├── agents/                  # Agent 定义（.toml 格式）
│   ├── orchestrator.toml
│   ├── research-expert.toml
│   ├── analyze-expert.toml
│   ├── design-expert.toml
│   ├── develop-expert.toml
│   ├── verify-expert.toml
│   ├── smoke-test.toml
│   ├── integration-test.toml
│   ├── delivery.toml
│   ├── dependency-scanner.toml
│   ├── service-scanner.toml
│   ├── structure-analyzer.toml
│   ├── config-analyzer.toml
│   └── task-protocol.toml
├── commands/                # 命令定义
│   └── dev-flow.md
├── references/              # 参考文档（11 个文件）
│   ├── protocol.md          # 公共协议（零编辑铁律、门禁检查等）
│   ├── memory-system.md     # 记忆系统
│   ├── learning-system.md   # 学习系统
│   ├── runtime-protocol.md  # 运行时协议
│   ├── degradation-matrix.md # 故障降级矩阵
│   ├── design-contract-go.md
│   ├── design-contract-python.md
│   ├── design-contract-typescript.md
│   ├── error-pattern-db.md
│   ├── model-context-config.md
│   └── on-demand-loader.md
└── stages/                  # 阶段定义（11 个文件）
    ├── research.md          # 项目调研阶段
    ├── clarify.md           # 需求澄清阶段
    ├── analyze.md           # 需求分析阶段
    ├── design.md            # 详细设计阶段
    ├── task-split.md        # 任务拆分阶段
    ├── develop.md           # 开发执行阶段
    ├── test.md              # 统一测试阶段
    ├── fix.md               # 修复阶段
    ├── hotfix.md            # 紧急修复阶段
    ├── delivery.md          # 交付阶段
    └── code-reference.md    # 代码参考
```

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
- 读取：prd-contract.yaml, 1-2个参考实现
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
      - ".dev-flow/sessions/session-20260529-001/prd-contract.yaml"
    summary: "涉及3个服务，预计新增15个文件"
    
  Design:
    status: "completed"
    output_files:
      - ".dev-flow/contracts/order-management-design-contract.yaml"
    summary: "5个Entity, 8个DTO, 3个Service, 2个Controller"
    
  Task Split:
    status: "completed"
    output_files:
      - ".dev-flow/contracts/order-management-task-split/task-dag.yaml"
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
