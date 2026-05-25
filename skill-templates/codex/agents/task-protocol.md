---
name: task-protocol
description: dev-flow 任务拆分与依赖管理协议定义。This is a protocol definition, not an executable agent.
---

# Task Split Protocol (任务拆分协议)

本协议定义 dev-flow subagent 架构中的任务拆分、依赖管理和执行调度规范。

## 1. 任务定义

### 1.1 任务结构

```yaml
task:
  id: string                    # 任务唯一标识符，格式：{type}-{number}
  type: enum                    # 任务类型
  name: string                  # 任务名称
  description: string           # 任务描述
  
  # 执行信息
  agent: string                 # 执行该任务的 subagent 名称
  status: enum                  # 任务状态
  
  # 依赖关系
  dependencies: [string]        # 依赖的任务 ID 列表
  dependents: [string]          # 依赖本任务的任务 ID 列表（自动计算）
  
  # 并行分组
  parallel_group: string        # 并行分组标识，同组任务可并行执行
  
  # 输入输出
  input_files: [string]         # 输入文件路径列表
  output_files: [string]        # 期望输出文件路径列表
  
  # 约束条件
  constraints:
    max_retries: int            # 最大重试次数
    timeout_minutes: int        # 超时时间
    required_tools: [string]    # 需要的工具列表
  
  # 元数据
  metadata:
    service: string             # 所属服务（多服务模式）
    module: string              # 所属模块
    layer: enum                 # 代码分层
    estimated_effort: enum      # 预估工作量
```

### 1.2 任务类型

| 类型 | 说明 | 对应 Agent |
|------|------|-----------|
| research | 项目研究 | research-expert |
| analyze | 需求分析 | analyze-expert |
| design | 详细设计 | design-expert |
| develop-entity | 实体开发 | develop-expert |
| develop-dto | DTO 开发 | develop-expert |
| develop-mapper | Mapper 开发 | develop-expert |
| develop-service | Service 开发 | develop-expert |
| develop-controller | Controller 开发 | develop-expert |
| verify | 代码验证 | verify-expert |

### 1.3 任务状态

```
pending → running → success
                   ↘ failed → retrying → success/failed
                            ↘ blocked
```

| 状态 | 说明 |
|------|------|
| pending | 等待执行 |
| running | 执行中 |
| success | 执行成功 |
| failed | 执行失败 |
| retrying | 重试中 |
| blocked | 被依赖任务阻塞 |
| skipped | 被跳过 |

### 1.4 代码分层

| 层级 | 说明 | 依赖 |
|------|------|------|
| enum | 枚举定义 | 无 |
| entity | 实体类 | enum |
| dto | 数据传输对象 | entity, enum |
| mapper | 数据访问层 | entity |
| service-interface | 服务接口 | dto, entity |
| service-impl | 服务实现 | service-interface, mapper, dto |
| controller | 控制器 | service-interface, dto |

## 2. 依赖图 (DAG)

### 2.1 依赖类型

**显式依赖**：在 `dependencies` 字段中明确声明
```yaml
tasks:
  - id: develop-service
    dependencies: [develop-entity, develop-dto]
```

**隐式依赖**：由任务类型和分层自动推断
- develop-dto 隐式依赖 develop-entity
- develop-service 隐式依赖 develop-dto
- develop-controller 隐式依赖 develop-service

**跨服务依赖**：通过 Feign Client 调用
```yaml
tasks:
  - id: develop-quality-service
    dependencies: [design-result]
    cross_service_calls: [workflow-service]
```

### 2.2 DAG 构建算法

```python
def build_dag(tasks):
    """
    构建有向无环图
    返回：邻接表表示的图 + 入度表
    """
    graph = {}          # 邻接表：task_id -> [dependent_task_ids]
    in_degree = {}      # 入度表：task_id -> 入度
    
    # 初始化
    for task in tasks:
        graph[task.id] = []
        in_degree[task.id] = 0
    
    # 构建边
    for task in tasks:
        for dep_id in task.dependencies:
            graph[dep_id].append(task.id)
            in_degree[task.id] += 1
    
    return graph, in_degree
```

### 2.3 拓扑排序算法 (Kahn)

```python
def topological_sort(tasks):
    """
    Kahn 算法拓扑排序
    返回：按批次分组的任务列表
    """
    graph, in_degree = build_dag(tasks)
    batches = []
    
    while in_degree:
        # 找到所有入度为 0 的任务
        ready = [tid for tid, deg in in_degree.items() if deg == 0]
        
        if not ready:
            raise CycleError("存在循环依赖")
        
        # 按 parallel_group 分组
        batch_groups = group_by_parallel_group(ready)
        batches.append(batch_groups)
        
        # 移除已处理的任务，更新入度
        for tid in ready:
            del in_degree[tid]
            for dependent in graph[tid]:
                in_degree[dependent] -= 1
    
    return batches
```

## 3. 执行调度

### 3.1 批次执行流程

```
批次 1: [research]
    ↓ 全部成功
批次 2: [analyze]
    ↓ 全部成功
批次 3: [design]
    ↓ 全部成功
批次 4: [develop-entity, develop-dto]  ← 并行
    ↓ 全部成功
批次 5: [develop-service]
    ↓ 全部成功
批次 6: [develop-controller]
    ↓ 全部成功
批次 7: [verify]
```

### 3.2 并行执行规则

**可并行条件**：
1. 同一批次内的任务
2. 无相互依赖
3. 属于不同 parallel_group 或同组但资源不冲突

**不可并行情况**：
1. 有依赖关系
2. 需要修改同一文件
3. 共享资源（如数据库表）

### 3.3 错误处理策略

| 场景 | 策略 |
|------|------|
| 单任务失败 | 重试 1 次，仍失败则标记为 failed |
| 批次中有失败 | 当前批次剩余任务继续，但下一批次阻塞 |
| 依赖任务失败 | 所有依赖它的任务标记为 blocked |
| 循环依赖 | 报错，要求人工检查任务定义 |

## 4. 通信协议

### 4.1 Orchestrator → Subagent

```yaml
# task-context.yaml
protocol_version: "1.0"
session_id: string
task:
  id: string
  type: string
  name: string
  description: string
  
input:
  files: [string]           # 输入文件路径
  memory_path: string       # memory 目录路径
  session_path: string      # session 目录路径
  
constraints:
  coding_style: string      # 编码规范要求
  max_lines_per_file: int   # 单文件最大行数
  require_tests: bool       # 是否需要测试
  
parent_results:
  - task_id: string
    status: string
    output_files: [string]
```

### 4.2 Subagent → Orchestrator

```yaml
# task-result.yaml
protocol_version: "1.0"
session_id: string
task:
  id: string
  type: string
  
status: success|partial|failed|blocked

output:
  files:                    # 生成的文件
    - path: string
      type: enum
      description: string
      checksum: string      # 文件校验和
      
artifacts:
  - type: code|doc|config|test
    path: string
    description: string
    
issues:
  - severity: warning|error|critical
    file: string
    line: int
    message: string
    suggestion: string
    
metrics:
  execution_time_seconds: int
  tokens_used: int
  files_created: int
  files_modified: int
  
next_tasks_hint: [string]   # 建议的后续任务
```

## 5. 文件组织

```
.dev-flow/
├── memory/                    # 项目记忆（持久化）
│   ├── project-overview.md
│   ├── service-registry.md
│   ├── dependency-graph.md
│   ├── common-modules.md
│   └── conventions.md
│
└── sessions/
    └── {session-id}/          # 单次会话
        ├── task-plan.yaml     # 任务计划
        ├── execution-log.yaml # 执行日志
        ├── task-context.yaml  # 当前任务上下文
        ├── task-result.yaml   # 当前任务结果
        ├── analyze-result.md  # 分析结果
        ├── design-result.md   # 设计结果
        ├── develop-result.yaml # 开发结果
        ├── verify-report.md   # 验证报告
        └── final-result.md    # 最终结果
```

## 6. 示例

### 6.1 单服务开发任务

```yaml
# task-plan.yaml
session_id: "sess-20250624-001"
tasks:
  - id: research
    type: research
    agent: research-expert
    dependencies: []
    output_files: [".dev-flow/memory/"]
  
  - id: analyze
    type: analyze
    agent: analyze-expert
    dependencies: [research]
    input_files: [".dev-flow/memory/"]
    output_files: ["analyze-result.md", "task-breakdown.yaml"]
  
  - id: design
    type: design
    agent: design-expert
    dependencies: [analyze]
    input_files: ["analyze-result.md"]
    output_files: ["design-result.md"]
  
  - id: develop-entity
    type: develop-entity
    agent: develop-expert
    dependencies: [design]
    parallel_group: "data-model"
    
  - id: develop-dto
    type: develop-dto
    agent: develop-expert
    dependencies: [design, develop-entity]
    parallel_group: "data-model"
    
  - id: develop-service
    type: develop-service
    agent: develop-expert
    dependencies: [develop-dto]
    
  - id: develop-controller
    type: develop-controller
    agent: develop-expert
    dependencies: [develop-service]
    
  - id: verify
    type: verify
    agent: verify-expert
    dependencies: [develop-controller]
```

### 6.2 多服务并行开发任务

```yaml
tasks:
  # ... research, analyze, design ...
  
  # Service A 开发（并行组 A）
  - id: develop-service-a
    type: develop-service
    agent: develop-expert
    dependencies: [design]
    parallel_group: "service-a"
    metadata:
      service: "quality-service"
      
  # Service B 开发（并行组 B）
  - id: develop-service-b
    type: develop-service
    agent: develop-expert
    dependencies: [design]
    parallel_group: "service-b"
    metadata:
      service: "workflow-service"
      
  # 集成验证（依赖两个服务）
  - id: verify-integration
    type: verify
    agent: verify-expert
    dependencies: [develop-service-a, develop-service-b]
```

## 7. 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0 | 2025-06-24 | 初始版本 |
