# dev-flow 修复设计文档 v1.0.5

## 文档信息

- **版本**: v1.0.5
- **日期**: 2026-06-02
- **状态**: 设计完成，待实施
- **目标**: 解决上下文限制导致的代码生成问题，保证 99% 准确性和完整性

---

## 一、问题背景

### 1.1 原始问题

在使用 dev-flow 进行企业级项目开发时，发现以下严重问题：

1. **日志占位替代实际业务逻辑**
   - SAP 推送功能被替换为 `log.info("推送订单到SAP")`
   - 返工复检完整性检查被替换为日志占位
   - QM10 流程触发完全缺失

2. **上下文限制导致敷衍生成**
   - AI 模型上下文限制（128K/256K）导致无法加载完整依赖
   - 为了"完成"任务，AI 用日志占位替代复杂业务逻辑
   - 代码能编译通过，但功能完全缺失

3. **任务拆分不考虑依赖关系**
   - 并行任务过多导致每个任务上下文不足
   - 任务间冲突未解决（文件冲突、接口冲突）
   - 复杂任务拆分后逻辑断裂

### 1.2 根本原因分析

```
上下文限制（128K/256K tokens）
    ↓
无法加载完整依赖类定义
    ↓
AI 不知道实际的方法签名、类型、import 路径
    ↓
选择"简化实现"：日志占位、TODO、空实现
    ↓
代码能编译，但功能缺失
```

**核心矛盾**：
- 准确性 vs 完整性：上下文不足时，AI 被迫牺牲准确性或完整性
- 并行效率 vs 上下文安全：并行任务越多，每个任务上下文越少

---

## 二、设计目标

### 2.1 核心目标

| 目标 | 指标 | 说明 |
|------|------|------|
| **准确性** | 99% | 代码逻辑正确，无猜测、无占位 |
| **完整性** | 99% | 功能完整实现，无遗漏 |
| **并行效率** | 3-10x | 支持多任务并行开发 |
| **上下文效率** | 90%+ | 相比传统模式节省 90% 上下文 |

### 2.2 设计原则

1. **准确性优先**：宁可串行执行，也不能生成错误代码
2. **上下文自适应**：根据 AI 模型限制（128K/256K/1M）动态调整策略
3. **精细任务拆分**：按方法级/功能点级拆分，每个任务聚焦单一职责
4. **上下文片段化**：只加载任务需要的上下文片段，而非完整文档
5. **多层防护体系**：预防→检测→修复→兜底，四层保障

---

## 三、整体架构设计

### 3.1 系统架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         dev-flow v1.0.5 架构                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     编排层 (Orchestrator)                        │    │
│  │  - 任务调度：DAG 拓扑排序 + 批次执行                              │    │
│  │  - 模式决策：并行/串行/混合                                       │    │
│  │  - 冲突协调：文件锁 + 接口注册表                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                   上下文管理层 (Context Manager)                  │    │
│  │  - 自动检测：识别 AI 模型上下文限制                               │    │
│  │  - 动态分配：根据任务复杂度分配上下文                             │    │
│  │  - 片段加载：按需加载上下文片段                                   │    │
│  │  - 监控保护：70%/85%/95% 三级阈值                                │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    任务拆分层 (Task Split)                        │    │
│  │  - 粒度决策：服务级 → 方法级 → 功能点级                          │    │
│  │  - 依赖分析：强依赖/弱依赖/传递依赖                              │    │
│  │  - 契约生成：接口契约 + 数据契约                                 │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    片段化层 (Context Fragmenter)                  │    │
│  │  - 需求片段：功能点级需求切分                                     │    │
│  │  - 设计片段：类级/方法级设计切分                                  │    │
│  │  - 规范片段：规则级规范切分                                       │    │
│  │  - 依赖片段：字段级依赖裁剪                                       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     开发层 (Develop Expert)                       │    │
│  │  - Step 2.5：强制读取验证（Entity/Import/方法签名）              │    │
│  │  - Step 3.1：结构化业务逻辑实现                                  │    │
│  │  - Step 5：代码自检 + 编译验证                                   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     验证层 (Validation Layer)                     │    │
│  │  - contract-validator：R1/R2/R3/R4 四规则校验                    │    │
│  │  - design-contract-validator：设计 vs 实现一致性                  │    │
│  │  - bytecode-analyzer：日志占位/简化实现检测                       │    │
│  │  - step-enforcer：关键步骤强制执行                              │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     修复层 (Recovery Layer)                       │    │
│  │  - 编译错误修复：A/B/C/D 分类 + 循环修复                          │    │
│  │  - 错误模式学习：P001/P003/P005/P009 自动修复                     │    │
│  │  - 检查点恢复：断点续传 + 状态恢复                                │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 核心组件说明

| 组件 | 职责 | 关键文件 |
|------|------|---------|
| **Context Manager** | 上下文分配、执行模式决策、动态监控 | `context-manager.md` |
| **Task Split Expert** | 智能任务拆分、依赖分析、契约生成 | `task-split-expert.md` |
| **Context Fragmenter** | 上下文片段化、按需加载、片段索引 | `context-fragmenter.md` (新增) |
| **Contract Validator** | 契约一致性校验、四规则验证 | `contract-validator.md` |
| **Step Enforcer** | 关键步骤强制执行、验证阻塞 | `step-enforcer.md` |
| **Error Pattern Learner** | 错误模式学习、自动修复 | `error-pattern-learner.md` |

---

## 四、关键机制设计

### 4.1 自适应上下文管理

#### 4.1.1 三种上下文限制配置

```yaml
# 配置文件: .dev-flow/profiles/context-{limit}.yaml

# 128K 限制（紧张模式）
context_profile_128k:
  name: "tight_mode"
  total_tokens: 128000
  estimated_code_kb: 100
  
  allocation:
    minimum_safe_context: "30KB"      # 硬约束
    code_generation_space: "8KB"      # 代码生成预留
    dependency_read_space: "10KB"     # 依赖读取预留
    system_prompt_space: "8KB"        # 系统提示词
    buffer_space: "4KB"               # 应急缓冲
    
  execution:
    max_parallel_tasks: 1             # 强制串行
    execution_mode: "serial_only"
    task_split_threshold: 30          # 30行即拆分
    
  monitoring:
    warning_threshold: 60
    critical_threshold: 75
    emergency_threshold: 90

# 256K 限制（平衡模式）
context_profile_256k:
  name: "balanced_mode"
  total_tokens: 256000
  estimated_code_kb: 200
  
  allocation:
    minimum_safe_context: "50KB"
    code_generation_space: "15KB"
    dependency_read_space: "20KB"
    system_prompt_space: "10KB"
    buffer_space: "5KB"
    
  execution:
    max_parallel_tasks: 3
    execution_mode: "adaptive"
    task_split_threshold: 50
    
  monitoring:
    warning_threshold: 70
    critical_threshold: 85
    emergency_threshold: 95

# 1M 限制（充裕模式）
context_profile_1m:
  name: "abundant_mode"
  total_tokens: 1000000
  estimated_code_kb: 800
  
  allocation:
    minimum_safe_context: "100KB"
    code_generation_space: "50KB"
    dependency_read_space: "80KB"
    system_prompt_space: "20KB"
    buffer_space: "20KB"
    
  execution:
    max_parallel_tasks: 10
    execution_mode: "parallel_first"
    task_split_threshold: 200
    
  monitoring:
    warning_threshold: 80
    critical_threshold: 90
    emergency_threshold: 95
```

#### 4.1.2 自动检测算法

```yaml
context_limit_detection:
  priority_order:
    1. config_file: ".dev-flow/config/context-profile.yaml"
    2. environment_variable: "DEV_FLOW_CONTEXT_LIMIT"
    3. model_identifier: "根据模型名称识别"
    4. runtime_probe: "运行时试探检测"
    
  detection_result_mapping:
    "< 120KB": "128k"
    "120KB - 220KB": "256k"
    "> 220KB": "1m"
```

### 4.2 精细任务拆分

#### 4.2.1 拆分粒度策略

```yaml
task_split_strategy:
  # 简单方法（<50行）：方法级
  simple_method:
    condition: "method_lines <= 50"
    granularity: "method_level"
    context_estimate: "15-20KB"
    
  # 中等方法（50-150行）：功能点级
  medium_method:
    condition: "50 < method_lines <= 150"
    granularity: "function_point_level"
    split_pattern:
      - "validate"      # 参数校验
      - "query"         # 数据查询
      - "business"      # 业务处理
      - "save"          # 数据保存
    context_estimate: "8-12KB per function point"
    
  # 复杂方法（>150行）：必须拆分
  complex_method:
    condition: "method_lines > 150"
    granularity: "function_point_level"
    mandatory_split: true
    context_estimate: "8-12KB per function point"
```

#### 4.2.2 依赖关系分类

```yaml
dependency_classification:
  # 无依赖：可并行
  no_dependency:
    examples: ["Entity", "Enum"]
    parallel: true
    
  # 只读依赖：可并行（通过接口契约）
  read_only_dependency:
    examples: ["DTO", "Mapper"]
    parallel: true
    mechanism: "interface_contract"
    
  # 写依赖：必须串行
  write_dependency:
    examples: ["Service", "Controller"]
    parallel: false
    reason: "可能修改共享状态"
    
  # 传递依赖：自动追踪
  transitive_dependency:
    detection: "A → B → C 链式依赖"
    handling: "自动加入 dependencies.transitive"
```

### 4.3 上下文片段化

#### 4.3.1 片段类型

```yaml
context_fragment_types:
  # 需求片段
  requirement_fragment:
    granularity: "功能点级"
    size: "0.3-0.5KB"
    content: "单个功能点的需求描述"
    
  # 设计片段
  design_fragment:
    granularity: "类级/方法级"
    size: "0.8-1.5KB"
    content: "类定义或方法签名 + 逻辑步骤"
    
  # 规范片段
  convention_fragment:
    granularity: "规则级"
    size: "0.2-0.5KB"
    content: "单条编码规范或最佳实践"
    
  # 依赖片段
  dependency_fragment:
    granularity: "字段级"
    size: "0.5-2KB"
    content: "Entity/DTO 的字段裁剪（只包含使用字段）"
```

#### 4.3.2 片段索引机制

```yaml
fragment_index:
  version: "1.0"
  
  by_task:
    - task_id: "task-003"
      fragments:
        - type: "requirement"
          fragment_id: "req-001"
        - type: "design"
          fragment_id: "method-user-getById"
        - type: "convention"
          fragment_id: "conv-validation"
        - type: "dependency"
          fragment_id: "entity-user-core"
          
  by_type:
    entities:
      - fragment_id: "entity-user-core"
        entity: "User"
        fields: ["id", "username", "email"]
        size: "1.2KB"
        
    methods:
      - fragment_id: "method-user-getById"
        service: "UserService"
        method: "getById"
        size: "0.8KB"
```

#### 4.3.3 按需加载流程

```yaml
on_demand_loading:
  trigger: "subagent 请求特定上下文"
  
  process:
    1. query_index: "从 fragment-index 查找片段"
    2. load_fragment: "加载片段内容"
    3. field_filtering: "字段级裁剪（只加载需要的字段）"
    4. integrity_check: "验证上下文完整性"
    5. cache_result: "缓存结果供后续使用"
    
  fallback: "如果片段缺失，触发完整加载或报错"
```

### 4.4 执行模式决策

#### 4.4.1 决策矩阵

| 条件 | 执行模式 | 说明 |
|------|---------|------|
| 所有任务 <=50KB 且总数 <=3 | **并行模式** | 效率优先 |
| 任一任务 >50KB | **串行模式** | 准确性优先 |
| 总任务数 >3 | **混合模式** | 分批并行+串行 |
| 上下文总量不足 | **强制串行** | 安全兜底 |

#### 4.4.2 混合模式策略

```yaml
hybrid_mode:
  phase_1:
    name: "并行阶段"
    tasks: "无依赖任务（Entity、Enum）"
    mode: "parallel"
    
  phase_2:
    name: "串行阶段"
    tasks: "依赖链任务（DTO → Mapper → Service → Controller）"
    mode: "serial"
    order: "dependency_chain"
```

### 4.5 多层防护体系

#### 4.5.1 预防层（贡献 85% 正确性）

```yaml
prevention_layer:
  design_stage:
    - "完整依赖图构建（DAG）"
    - "接口契约声明（provides/dependencies）"
    - "结构化业务逻辑设计（消除歧义）"
    
  execution_stage:
    - "强依赖串行执行"
    - "批次隔离（批次间同步）"
    - "上下文阈值监控（70%/85%/95%）"
    
  development_stage:
    - "Step 2.5 强制读取验证"
    - "禁止猜测方法名/类型/import 路径"
    - "禁止 TODO/日志占位/空实现"
```

#### 4.5.2 检测层（贡献 10% 正确性）

```yaml
detection_layer:
  contract_validation:
    R1: "方法签名一致性（设计 vs 代码）"
    R2: "Entity 字段一致性"
    R3: "实现完整性（无 TODO/空实现/日志占位）"
    R4: "依赖调用一致性"
    
  design_contract_validation:
    - "call action 实现完整性"
    - "日志占位检测"
    - "外部服务调用验证"
    
  conflict_detection:
    - "文件冲突检测（文件锁）"
    - "接口冲突检测（interface-registry）"
    - "命名冲突检测（命名空间隔离）"
```

#### 4.5.3 修复层（贡献 4% 正确性）

```yaml
recovery_layer:
  compile_error_recovery:
    A_class: "单任务内部错误 → develop-expert 修复"
    B_class: "跨任务接口不匹配 → contract-validator + 修复"
    C_class: "设计契约偏差 → design-expert 更新"
    D_class: "依赖版本冲突 → analyze-expert 分析"
    
  error_pattern_learning:
    P001: "Entity getter 方法名不匹配"
    P003: "Mapper 返回类型错误"
    P005: "Import 路径错误"
    P009: "日志占位替代业务逻辑"
```

#### 4.5.4 兜底层（贡献 1% 正确性）

```yaml
fallback_layer:
  manual_review:
    trigger: "连续 3 次自动修复失败"
    action: "标记为需要人工确认"
    
  checkpoint_recovery:
    trigger: "上下文溢出或任务失败"
    action: "从检查点恢复，清理上下文后继续"
```

---

## 五、冲突解决机制

### 5.1 文件冲突

```yaml
file_conflict_resolution:
  detection: "多个任务声明相同 output_files"
  
  resolution:
    1. file_lock: "子任务执行前锁定 output_files"
    2. serial_execution: "冲突任务串行执行"
    3. merge_strategy: "如果必须并行，使用文件合并策略"
```

### 5.2 接口冲突

```yaml
interface_conflict_resolution:
  registry: "interface-registry.yaml 统一管理"
  
  rules:
    - "接口首次定义后标记为 available"
    - "后续任务引用接口时检查签名一致性"
    - "接口冻结后（frozen）不可修改"
    - "冲突时以设计文档为准"
```

### 5.3 Entity 冲突

```yaml
entity_conflict_resolution:
  owner_mechanism: "Entity Owner 独占修改权"
  
  process:
    1. "Entity 首次创建者成为 Owner"
    2. "其他任务需要修改时提交变更请求"
    3. "Owner 审核并执行变更"
    4. "变更后通知所有依赖任务"
```

---

## 六、实施路线图

### 6.1 阶段划分

```yaml
implementation_roadmap:
  phase_1:
    name: "基础框架"
    duration: "2周"
    tasks:
      - "实现 context-manager（自适应上下文管理）"
      - "实现 context-fragmenter（上下文片段化）"
      - "创建三种配置文件（128k/256k/1m）"
    deliverable: "可运行的基础框架"
    
  phase_2:
    name: "任务拆分增强"
    duration: "2周"
    tasks:
      - "增强 task-split-expert（方法级拆分）"
      - "实现依赖关系分类（强/弱/传递）"
      - "实现接口契约生成"
    deliverable: "精细任务拆分能力"
    
  phase_3:
    name: "验证层完善"
    duration: "2周"
    tasks:
      - "增强 contract-validator（四规则校验）"
      - "增强 design-contract-validator（设计验证）"
      - "实现冲突检测机制"
    deliverable: "完整验证体系"
    
  phase_4:
    name: "集成测试"
    duration: "2周"
    tasks:
      - "集成到 orchestrator"
      - "编写单元测试"
      - "性能测试"
      - "文档编写"
    deliverable: "生产就绪的系统"
```

### 6.2 文件变更清单

| 文件 | 变更类型 | 变更内容 |
|------|---------|---------|
| `context-manager.md` | 新增 | 自适应上下文管理 |
| `context-fragmenter.md` | 新增 | 上下文片段化 |
| `task-split-expert.md` | 修改 | 增强方法级拆分 |
| `orchestrator.md` | 修改 | 集成 context-manager |
| `contract-validator.md` | 修改 | 增强四规则校验 |
| `design-contract-validator.md` | 修改 | 增强设计验证 |
| `step-enforcer.md` | 修改 | 增强 Step 3.1 验证 |
| `profiles/context-128k.yaml` | 新增 | 128K 配置文件 |
| `profiles/context-256k.yaml` | 新增 | 256K 配置文件 |
| `profiles/context-1m.yaml` | 新增 | 1M 配置文件 |

---

## 七、预期效果

### 7.1 上下文效率提升

| 维度 | 传统模式 | 精细拆分模式 | 提升 |
|------|---------|-------------|------|
| 设计文档 | 30KB | 3KB | **90%** |
| 依赖定义 | 20KB | 2KB | **90%** |
| 编码规范 | 10KB | 1KB | **90%** |
| 需求文档 | 15KB | 1KB | **93%** |
| **总计** | **75KB** | **7KB** | **91%** |

### 7.2 并行能力提升

| 模型限制 | 传统模式 | 精细拆分模式 | 提升 |
|---------|---------|-------------|------|
| **128K** | 1 个任务 | **5-8 个任务** | **5-8x** |
| **256K** | 2-3 个任务 | **15-20 个任务** | **7-10x** |
| **1M** | 10 个任务 | **100+ 个任务** | **10x+** |

### 7.3 正确性保障

| 指标 | 目标值 | 实现方式 |
|------|--------|---------|
| **准确性** | 99% | 五层防护体系 |
| **完整性** | 99% | 强制验证 + 循环修复 |
| **编译成功率** | >=90% | 全局集成编译 + 错误分类修复 |
| **日志占位检测率** | 100% | bytecode-analyzer + design-contract-validator |

---

## 八、风险与缓解

| 风险 | 严重程度 | 缓解措施 |
|------|---------|---------|
| 片段缺失导致错误 | 🔴 高 | 完整性校验 + 自动补全 + 缺失警告 |
| 任务数量爆炸 | 🟡 中 | 任务组机制 + 层级协调 |
| 一致性冲突 | 🔴 高 | 契约锁 + 文件锁 + Entity Owner |
| 协调开销增加 | 🟡 中 | 子协调器 + 状态外置 |
| 阈值设置不当 | 🟡 中 | 动态调整 + 历史数据学习 |

---

## 九、关键设计决策

### 决策 1：准确性优先 vs 效率优先

**选择**：准确性优先

**理由**：
- 宁可串行执行，也不能生成错误代码
- 错误代码的修复成本远高于重新生成
- 99% 准确性是底线，效率是优化目标

### 决策 2：50KB 最小安全上下文

**选择**：根据模型限制动态调整（128K:30KB, 256K:50KB, 1M:100KB）

**理由**：
- 不同模型限制需要不同策略
- 128K 需要更保守，1M 可以更激进
- 动态调整比固定阈值更灵活

### 决策 3：方法级拆分粒度

**选择**：方法级 + 功能点级混合

**理由**：
- 方法级：简单方法不拆分，保持效率
- 功能点级：复杂方法拆分，保证上下文安全
- 平衡效率与安全性

### 决策 4：上下文片段化

**选择**：四层片段化（需求/设计/规范/依赖）

**理由**：
- 每层独立切分，按需加载
- 字段级裁剪最大程度节省上下文
- 片段索引保证快速检索

---

## 十、总结

### 核心创新点

1. **自适应上下文管理**：根据 AI 模型限制动态调整策略
2. **精细任务拆分**：方法级/功能点级拆分，聚焦单一职责
3. **上下文片段化**：只加载需要的片段，节省 90%+ 上下文
4. **多层防护体系**：预防→检测→修复→兜底，99% 正确性保障
5. **智能执行模式**：并行/串行/混合自动决策，平衡效率与准确性

### 解决的问题

- ✅ 上下文限制导致的日志占位问题
- ✅ 并行任务过多导致的上下文不足问题
- ✅ 任务拆分不考虑依赖关系导致的冲突问题
- ✅ 代码生成不完整/敷衍生成问题

### 最终目标

> **无论使用 128K、256K 还是 1M 的 AI 模型，都能保证代码生成的准确性 99%、完整性 99%，同时实现 3-10x 的并行效率提升。**

---

## 附录

### A. 相关文档索引

- `context-manager.md` - 上下文管理器
- `context-fragmenter.md` - 上下文片段化
- `task-split-expert.md` - 任务拆分专家
- `contract-validator.md` - 契约验证器
- `design-contract-validator.md` - 设计契约验证器
- `step-enforcer.md` - 步骤执行验证器
- `error-pattern-learner.md` - 错误模式学习器
- `orchestrator.md` - 主协调者

### B. 配置文件模板

见 `profiles/` 目录下的 `context-128k.yaml`、`context-256k.yaml`、`context-1m.yaml`。

### C. 变更日志

见 `CHANGELOG.md` v1.0.5 章节。

---

**文档结束**
