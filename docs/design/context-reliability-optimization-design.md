# Dev-Flow 上下文可靠性优化方案 — 详细设计文档

> **版本**: v1.0  
> **日期**: 2026-06-11  
> **目标**: 将企业级开发场景下的全流程可靠性从 ~55% 提升至 99%+  
> **范围**: 五层防御体系详细设计，本次不修改代码

---

## 目录

1. [整体架构概览](#1-整体架构概览)
2. [第一层：上下文预算硬约束](#2-第一层上下文预算硬约束)
3. [第二层：分段生成事务化](#3-第二层分段生成事务化)
4. [第三层：主 Agent 上下文隔离](#4-第三层主-agent-上下文隔离)
5. [第四层：冗余验证链](#5-第四层冗余验证链)
6. [第五层：故障自动恢复](#6-第五层故障自动恢复)
7. [可靠性量化模型](#7-可靠性量化模型)
8. [实施优先级与里程碑](#8-实施优先级与里程碑)
9. [风险与回滚策略](#9-风险与回滚策略)

---

## 1. 整体架构概览

### 1.1 当前架构的问题根因

当前 dev-flow 的可靠性瓶颈可以归纳为一句话：**"建议性规范 vs 强制性约束"**。

| 层面 | 当前状态 | 问题表现 |
|------|----------|----------|
| 上下文限制 | 软性阈值（警告后继续） | subagent 在截断上下文中工作，产生错误代码 |
| 代码生成 | 文件系统状态传递，无事务 | TODO 残留、部分方法未实现难以自动发现 |
| 主 Agent | 内存中累积全量历史 | 长会话后期上下文溢出，质量断崖式下降 |
| 验证 | 单层 AI 自检 | 遗漏错误、R5 逻辑覆盖依赖人工标注 |
| 故障处理 | 三级失败即终止 | 单点失败阻断全流程，无部分交付能力 |

### 1.2 五层防御体系架构图

```
┌─────────────────────────────────────────────────────────────────┐
│  第五层：故障自动恢复                                              │
│  ├─ 优雅降级策略矩阵（5种场景 × 4级降级）                          │
│  ├─ 部分交付机制（阻塞/非阻塞任务分离）                             │
│  └─ 人工升级触发条件（明确边界，减少误触发）                         │
├─────────────────────────────────────────────────────────────────┤
│  第四层：冗余验证链                                                │
│  ├─ Layer 1: 静态验证（机器自动，硬阻断）                           │
│  ├─ Layer 2: AI 验证（独立 subagent，软阻断）                       │
│  ├─ Layer 3: 对抗性验证（参考级，不阻断）                           │
│  └─ R5 逻辑覆盖率自动化（AST 解析替代人工标注）                       │
├─────────────────────────────────────────────────────────────────┤
│  第三层：主 Agent 上下文隔离                                         │
│  ├─ 上下文预算池（阶段级硬预算）                                    │
│  ├─ 阶段间零状态传递（文件系统唯一真相源）                           │
│  └─ 会话级上下文清理（多需求连续开发）                               │
├─────────────────────────────────────────────────────────────────┤
│  第二层：分段生成事务化                                             │
│  ├─ 代码生成 FSM（5 状态 + 转换规则）                               │
│  ├─ 自动 Checkpoint 系统（文件级快照）                               │
│  └─ 骨架-填充协议强化（验证门控）                                    │
├─────────────────────────────────────────────────────────────────┤
│  第一层：上下文预算硬约束                                            │
│  ├─ 动态上下文预算计算（模型自适应）                                  │
│  ├─ Step 2.5 完整性门控（硬阻断截断）                                │
│  ├─ 多候选依赖解析（置信度评分）                                     │
│  └─ @on-demand-loader 按需读取（降级方案）                           │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 设计原则

1. **硬约束优于软建议**：所有上下文限制从"警告"升级为"门控"
2. **状态外置优于内存保留**：主 Agent 上下文占用与需求复杂度解耦
3. **冗余验证优于单点信任**：关键校验由独立系统交叉确认
4. **优雅降级优于完全阻塞**：允许部分成功，而非全有或全无
5. **机器校验优于 AI 自觉**：静态分析工具承担主要验证职责

---

## 2. 第一层：上下文预算硬约束

### 2.1 问题分析

#### 2.1.1 当前 `prepare-context.cjs` 的阈值设计

```javascript
// 当前实现（prepare-context.cjs L29-L31）
const MAX_BRIEF_SIZE = 120 * 1024; // 120KB - 给 subagent 留足够空间
const MAX_FILE_READ = 30 * 1024;   // 单个依赖文件最大 30KB
```

**问题 1：固定阈值不考虑模型差异**
- Claude 3.5 Sonnet: 200K tokens ≈ 150KB 代码
- GPT-4: 128K tokens ≈ 100KB 代码
- GPT-4o-mini: 128K tokens ≈ 100KB 代码
- 固定 120KB 对 GPT-4 可能过高，对 Claude 可能过低

**问题 2：单文件 30KB 截断无阻断机制**

```javascript
// 当前实现（prepare-context.cjs L164-L177）
function safeRead(filePath, maxSize) {
  maxSize = maxSize || MAX_FILE_READ;
  // ...
  if (stat.size > maxSize) {
    console.warn(`[WARN] 文件过大 (${Math.round(stat.size / 1024)}KB)，跳过...`);
    return `/* 文件过大(${Math.round(stat.size / 1024)}KB)，内容省略... */`;
  }
}
```

- 企业级 Service 类（50-100KB）被截断后，subagent 看到的是占位符
- subagent 继续工作，但基于不完整的依赖信息生成代码
- 导致方法签名不匹配、类型错误、逻辑遗漏

**问题 3：依赖类搜索局限性**

```javascript
// 当前实现（prepare-context.cjs L547-L600）
function searchClassFile(projectRoot, className) {
  const maxDepth = 15;
  const maxResults = 5;  // 只返回前5个
  // 精确类名匹配，无模糊匹配
  if (entry.name === `${className}${ext}`) {
    results.push(fullPath);
  }
}
```

- 同名类冲突（如 `com.order.service.UserService` vs `com.user.service.UserService`）
- 内部类、匿名类不支持
- Kotlin/Scala 等 JVM 语言不支持

#### 2.1.2 当前 `design-contract.yaml` 提取逻辑

```javascript
// 当前实现（prepare-context.cjs L448-L481）
function extractRelevantContract(contractContent, taskId) {
  if (contractContent.length < 40 * 1024) return contractContent;
  // 基于正则匹配 taskNum 和关键词提取相关部分
  for (const line of lines) {
    if (line.match(new RegExp(`task[-_]?${taskNum}\\b`, 'i')) ||
        line.match(/(service|mapper|entity|controller|dto|enum)s?:/i)) {
      inRelevantSection = true;
    }
  }
}
```

- 40KB 阈值在企业级设计中极易突破
- 正则匹配粗粒度，可能遗漏跨任务的共享接口
- 无结构感知（YAML 的层级关系丢失）

### 2.2 优化方案设计

#### 2.2.1 动态上下文预算计算（替代固定阈值）

**设计目标**：根据实际使用的 AI 模型动态计算安全预算，而非使用固定值。

**模型上下文映射表**：

| 模型 | 总上下文窗口 | 代码等效容量 | 推荐预算比例 | 计算后预算 |
|------|-------------|-------------|-------------|-----------|
| Claude 3.5 Sonnet | 200K tokens | ~150KB | 60% | 90KB |
| Claude 3 Opus | 200K tokens | ~150KB | 60% | 90KB |
| GPT-4 Turbo | 128K tokens | ~100KB | 60% | 60KB |
| GPT-4o | 128K tokens | ~100KB | 60% | 60KB |
| GPT-4o-mini | 128K tokens | ~100KB | 55% | 55KB |
| 本地模型 (Ollama) | 8K-32K | ~6-24KB | 50% | 3-12KB |

**预算计算公式**：

```javascript
// 新增 dynamic-budget.cjs
function calculateBudget(modelName, systemPromptSizeKB) {
  const MODEL_CONFIG = {
    'claude-3-5-sonnet': { totalTokens: 200000, codeRatio: 0.75 },
    'claude-3-opus': { totalTokens: 200000, codeRatio: 0.75 },
    'gpt-4-turbo': { totalTokens: 128000, codeRatio: 0.78 },
    'gpt-4o': { totalTokens: 128000, codeRatio: 0.78 },
    'gpt-4o-mini': { totalTokens: 128000, codeRatio: 0.78 },
    'default': { totalTokens: 128000, codeRatio: 0.75 }
  };
  
  const config = MODEL_CONFIG[modelName] || MODEL_CONFIG['default'];
  const totalCodeKB = (config.totalTokens / 4) * config.codeRatio / 1024;
  
  // 预留：系统提示 + 响应空间 + 安全边距
  const reservedKB = systemPromptSizeKB + 20 + 10; // 20KB响应 + 10KB安全边距
  const budgetKB = Math.floor(totalCodeKB * 0.6 - reservedKB);
  
  return {
    briefSizeKB: Math.max(budgetKB, 30),  // 最低 30KB
    fileReadKB: Math.min(Math.floor(budgetKB / 3), 50),  // 单文件上限
    maxDependencyFiles: Math.min(Math.floor(budgetKB / 10), 15)  // 最大依赖文件数
  };
}
```

**集成点**：
- 修改 `prepare-context.cjs`，在 `generateTaskBrief` 函数开头调用 `calculateBudget`
- 从 `model-context-config.md` 或环境变量读取当前模型名称
- 预算值写入 `task-brief` 头部元数据，供后续工具链使用

#### 2.2.2 Step 2.5 完整性门控（硬阻断机制）

**设计目标**：在 subagent 派发前，强制检查所有依赖类是否完整读取，有任何截断即阻断。

**门控流程**：

```yaml
new_gate: step_2_5_completeness_gate
  位置: "prepare-context.cjs generateTaskBrief() 返回前"
  
  输入:
    - taskBrief: string (已生成的 task-brief)
    - truncatedFiles: string[] (被截断的文件列表)
    - missingFiles: string[] (未找到的文件列表)
  
  检查项:
    check_1_no_truncated_dependencies:
      条件: "truncatedFiles.length === 0"
      失败动作: 
        - 记录: "[GATE_BLOCKED] 依赖类截断: ${file}"
        - 触发降级策略（见 2.2.4）
      
    check_2_no_missing_core_dependencies:
      条件: "missingFiles 中无核心依赖（Service/Controller/Entity）"
      失败动作:
        - 记录: "[GATE_BLOCKED] 核心依赖缺失: ${file}"
        - 触发搜索扩展（深度+5，跳过目录放宽）
      
    check_3_contract_integrity:
      条件: "design-contract 提取后包含所有必要 section"
      验证方法: "YAML 结构校验（非正则）"
      失败动作:
        - 记录: "[GATE_BLOCKED] 设计契约结构不完整"
        - 回退到完整契约（不提取）
  
  通过动作:
    - 在 task-brief 头部添加: "[GATE_PASSED] 完整性校验通过"
    - 继续派发 subagent
```

**关键实现细节**：

```javascript
// 新增 completeness-gate.cjs
class CompletenessGate {
  constructor(budget) {
    this.budget = budget;
    this.truncatedFiles = [];
    this.missingFiles = [];
  }
  
  check(taskBrief, dependencies) {
    const issues = [];
    
    // Check 1: 截断文件
    for (const dep of dependencies) {
      if (dep.content.includes('/* 文件过大') || dep.content.includes('/* File too large')) {
        issues.push({
          type: 'TRUNCATED_DEPENDENCY',
          file: dep.path,
          size: dep.originalSize,
          severity: 'BLOCKING'
        });
      }
    }
    
    // Check 2: 核心依赖缺失
    const corePatterns = [/Service\.java$/, /Controller\.java$/, /Entity\.java$/, /Mapper\.java$/];
    for (const dep of dependencies) {
      if (dep.content === null && corePatterns.some(p => p.test(dep.path))) {
        issues.push({
          type: 'MISSING_CORE_DEPENDENCY',
          file: dep.path,
          severity: 'BLOCKING'
        });
      }
    }
    
    // Check 3: 契约完整性
    const contractSection = this.extractContractSection(taskBrief);
    if (!this.validateContractStructure(contractSection)) {
      issues.push({
        type: 'INVALID_CONTRACT_STRUCTURE',
        severity: 'WARNING'  // 非阻断，但记录
      });
    }
    
    return {
      passed: issues.filter(i => i.severity === 'BLOCKING').length === 0,
      issues,
      recommendation: this.generateRecommendation(issues)
    };
  }
  
  generateRecommendation(issues) {
    const truncated = issues.filter(i => i.type === 'TRUNCATED_DEPENDENCY');
    if (truncated.length > 0) {
      return {
        action: 'SPLIT_TASK',
        reason: `任务依赖 ${truncated.length} 个超大文件，建议拆分`,
        details: truncated.map(t => ({ file: t.file, size: t.size }))
      };
    }
    // ... 其他推荐
  }
}
```

#### 2.2.3 多候选依赖解析（置信度评分）

**设计目标**：解决同名类冲突，提供 disambiguation 机制。

**置信度评分算法**：

```javascript
// 新增 dependency-resolver.cjs
class DependencyResolver {
  calculateConfidence(className, candidatePath, context) {
    let score = 0;
    const pathParts = candidatePath.split('/');
    
    // 1. 路径语义匹配（权重 40%）
    // 例如：OrderService 在 order/ 目录下得分高
    const semanticMatch = this.checkSemanticMatch(className, pathParts);
    score += semanticMatch * 0.4;
    
    // 2. 引用频率（权重 30%）
    // 被其他类 import 的次数
    const referenceCount = this.getReferenceCount(candidatePath);
    score += Math.min(referenceCount / 10, 1) * 0.3;
    
    // 3. 最近修改时间（权重 15%）
    // 最近修改的文件更可能是活跃依赖
    const recency = this.getRecencyScore(candidatePath);
    score += recency * 0.15;
    
    // 4. 与当前任务的关联度（权重 15%）
    // 通过包名相似度计算
    const packageSimilarity = this.calculatePackageSimilarity(
      candidatePath, 
      context.currentFile
    );
    score += packageSimilarity * 0.15;
    
    return Math.min(score, 1.0);
  }
  
  resolve(className, projectRoot, context) {
    const candidates = this.findAllCandidates(className, projectRoot);
    
    if (candidates.length === 0) {
      return { status: 'NOT_FOUND', candidates: [] };
    }
    
    if (candidates.length === 1) {
      return { 
        status: 'UNIQUE', 
        candidate: candidates[0],
        confidence: 1.0 
      };
    }
    
    // 多候选：计算置信度
    const scored = candidates.map(c => ({
      path: c,
      confidence: this.calculateConfidence(className, c, context)
    })).sort((a, b) => b.confidence - a.confidence);
    
    // 如果 top-1 置信度 >= 0.8，直接返回
    if (scored[0].confidence >= 0.8) {
      return { 
        status: 'HIGH_CONFIDENCE', 
        candidate: scored[0].path,
        confidence: scored[0].confidence,
        alternatives: scored.slice(1, 3)
      };
    }
    
    // 如果 top-1 置信度 < 0.8，返回多候选供 subagent 选择
    return {
      status: 'AMBIGUOUS',
      candidates: scored.slice(0, 5),
      disambiguationHint: this.generateDisambiguationHint(scored, context)
    };
  }
}
```

**Subagent 交互协议**：

```markdown
## 依赖类解析结果

### com.example.service.OrderService
- **推荐**: `src/main/java/com/order/service/OrderService.java` (置信度: 0.92)
- **备选**: 
  - `src/main/java/com/legacy/service/OrderService.java` (置信度: 0.45)
  - `src/test/java/com/order/service/OrderService.java` (置信度: 0.12)

> 如果推荐不正确，请使用 Grep 搜索确认：
> `Grep: {"pattern": "class OrderService", "glob": "**/*.java"}`
```

#### 2.2.4 @on-demand-loader 按需读取（降级方案）

**设计目标**：当完整性门控阻断时，提供一种让 subagent 在运行时按需读取大文件的机制，而非一次性加载。

**使用场景**：
- 核心依赖类 > 30KB，无法完整放入 task-brief
- 任务需要读取的依赖文件数量超过预算上限

**实现设计**：

```yaml
on_demand_loader_spec:
  原理: |
    不在 prepare-context 阶段读取超大文件，
    而是在 task-brief 中注入"按需加载指令"，
    subagent 在需要时通过工具调用读取
  
  task-brief 注入内容: |
    ## 按需加载资源
    以下文件因大小超过预算未完整加载，如需使用请按需读取：
    
    - `src/main/java/com/example/service/OrderService.java` (85KB)
      - 已知方法: createOrder, cancelOrder, getOrderStatus
      - 按需读取命令: `Read: {"file_path": "...", "offset": 1, "limit": 50}`
    
    - `src/main/java/com/example/entity/Order.java` (45KB)
      - 已知字段: id, userId, items, status, createTime
      - 按需读取命令: `Read: {"file_path": "...", "offset": 1, "limit": 50}`
  
  使用约束: |
    1. 按需读取次数限制：每个 subagent 最多 5 次
    2. 单次读取限制：最多 100 行或 10KB
    3. 优先读取方法签名和类型定义，跳过实现体
    4. 读取后需缓存到 .dev-flow/cache/ 避免重复读取
  
  风险提示: |
    - 按需读取会增加 subagent 的上下文占用
    - 如果 subagent 频繁按需读取，说明任务可能过大，应触发拆分
```

**与完整性门控的集成**：

```javascript
// 在 completeness-gate.cjs 中
if (issues.some(i => i.type === 'TRUNCATED_DEPENDENCY')) {
  const recommendation = gate.generateRecommendation(issues);
  
  if (recommendation.action === 'SPLIT_TASK') {
    // 首选：拆分任务
    return { action: 'SPLIT', details: recommendation };
  }
  
  // 如果拆分不可行（如单文件任务），启用按需加载
  if (recommendation.details.length === 1 && recommendation.details[0].size < 150 * 1024) {
    return { 
      action: 'ON_DEMAND_LOAD',
      files: recommendation.details.map(d => d.file)
    };
  }
}
```

### 2.3 第一层可靠性提升预估

| 优化项 | 当前可靠性 | 优化后可靠性 | 提升方式 |
|--------|-----------|-------------|----------|
| 动态预算计算 | 65% | 72% | 消除模型不匹配导致的溢出 |
| 完整性门控 | 65% | 82% | 阻断截断依赖的 subagent 派发 |
| 多候选解析 | 70% | 78% | 减少依赖类解析错误 |
| 按需加载降级 | 60% | 75% | 超大文件场景有替代方案 |
| **第一层综合** | **65%** | **85%** | 硬约束阻断主要错误源 |

---

## 3. 第二层：分段生成事务化

### 3.1 问题分析

#### 3.1.1 当前骨架-填充协议的脆弱性

当前 `segment-code.cjs` 的工作流程：

```
Step 1: 生成骨架（方法签名 + // TODO）
Step 2: 逐个方法填充（多次 subagent 调用）
Step 3: 合并为最终文件
```

**问题 1：无事务保证**
- Step 2 中某个方法填充失败，骨架中的 TODO 残留
- 失败可能静默发生（subagent 返回空内容或超时）
- `validate-result.cjs` 虽然检测 TODO，但修复需要再启 subagent

**问题 2：状态依赖文件系统**
- 骨架写入文件系统后，填充阶段依赖文件存在性
- 如果中途 session 崩溃，重启后难以恢复状态
- 无 checkpoint 机制，失败即从头开始

**问题 3：填充顺序无优化**
- 当前按方法声明顺序填充
- 如果方法 A 依赖方法 B，先填充 A 时上下文不足
- 无依赖感知填充顺序

#### 3.1.2 当前阈值设计

```javascript
// segment-code.cjs L36-L40
const SAFE_OUTPUT_LIMIT_KB = 15;
const SKELETON_LIMIT_KB = 12;
const SEGMENT_THRESHOLD_KB = 20;
```

- 15KB 安全输出限制基于经验值，无模型自适应
- 20KB 分段阈值固定，不区分语言（Java 15KB ≈ 200 行，Python 15KB ≈ 400 行）

### 3.2 优化方案设计

#### 3.2.1 代码生成状态机（FSM）

**设计目标**：将代码生成从"无状态过程"升级为"有状态机"，每个状态有明确的进入条件、验证规则和失败回滚策略。

**状态定义**：

```yaml
code_generation_fsm:
  states:
    IDLE:
      description: "初始状态，等待生成计划"
      entry_actions:
        - "分析设计契约，提取方法列表"
        - "计算方法依赖图（Method Dependency Graph）"
        - "确定填充顺序（拓扑排序）"
      exit_condition: "code-gen-plan.yaml 生成完成"
      
    SKELETON_WRITTEN:
      description: "骨架已写入文件系统"
      validation_rules:
        - rule: "文件存在且非空"
          check: "fs.existsSync(filePath) && fs.statSync(filePath).size > 0"
        - rule: "所有方法签名存在"
          check: "AST 解析确认每个设计方法都有声明"
        - rule: "所有方法体为 TODO 或 throw"
          check: "每个方法体匹配 /TODO|throw new|NotImplemented/"
        - rule: "无语法错误"
          check: "javac --dry-run 或对应语言的快速解析"
      on_validation_fail:
        action: "DELETE_FILE"
        next_state: "IDLE"
        retry_limit: 2
      
    METHOD_FILLING:
      description: "正在逐个填充方法"
      substates:
        - name: "FILLING_METHOD_N"
          entry_actions:
            - "读取当前文件状态"
            - "创建 checkpoint"
          validation_rules:
            - rule: "方法 N 的 TODO 已被替换"
              check: "方法 N 体不再匹配 TODO 正则"
            - rule: "方法 N 体非空"
              check: "方法 N 体行数 >= 3"
            - rule: "填充后文件无语法错误"
              check: "快速编译检查"
            - rule: "未破坏已填充方法"
              check: "diff 确认其他方法未变"
          on_validation_fail:
            action: "ROLLBACK_TO_CHECKPOINT"
            next_state: "METHOD_FILLING"
            retry_limit: 2
          on_retry_exhausted:
            action: "MARK_METHOD_FAILED"
            next_state: "DIAGNOSE"
            
    COMPLETE:
      description: "所有方法填充完成"
      validation_rules:
        - rule: "无 TODO/FIXME/NotImplemented"
          check: "全文正则扫描"
        - rule: "编译通过"
          check: "完整编译"
        - rule: "R5 逻辑覆盖率 100%"
          check: "logic-coverage-validator（见第四层）"
      on_validation_fail:
        action: "ENTER_DIAGNOSE"
        next_state: "DIAGNOSE"
        
    DIAGNOSE:
      description: "诊断失败原因，决定修复策略"
      entry_actions:
        - "分析失败日志"
        - "分类失败类型（语法/逻辑/依赖/上下文）"
      decision_branches:
        - condition: "语法错误且可自动修复"
          action: "AUTO_FIX"
          next_state: "METHOD_FILLING"
        - condition: "逻辑错误且范围可控"
          action: "RE_FILL_METHOD"
          next_state: "METHOD_FILLING"
        - condition: "依赖缺失或上下文不足"
          action: "ESCALATE_SPLIT"
          next_state: "IDLE"  # 重新拆分后从头开始
        - condition: "无法自动诊断"
          action: "HUMAN_ESCALATION"
          next_state: "TERMINAL"
          
    TERMINAL:
      description: "终止状态，等待人工介入"
      output:
        - "失败原因报告"
        - "当前 checkpoint 路径"
        - "建议修复方案"
```

**状态转换图**：

```
                    +------------------+
                    v                  |
  [Start] --> IDLE --> SKELETON_WRITTEN --> METHOD_FILLING --> COMPLETE --> [End]
                  |           |                |      ^            |
                  |           |                |      |            v
                  |           |                +------+         DIAGNOSE
                  |           |                       |            |
                  |           | (validation fail)     | (retry)    | (escalate)
                  |           +-----------------------+            v
                  |                                     +-----> TERMINAL
                  | (retry exhausted)
                  v
              TERMINAL
```

#### 3.2.2 自动 Checkpoint 系统

**设计目标**：在关键状态转换点自动保存快照，支持失败回滚和 session 恢复。

**Checkpoint 结构**：

```yaml
# .dev-flow/checkpoints/{taskId}/{timestamp}.yaml
checkpoint:
  metadata:
    task_id: "T3"
    task_name: "OrderService.createOrder"
    state: "METHOD_FILLING"  # 当前 FSM 状态
    created_at: "2026-06-11T10:30:00Z"
    sequence_number: 3  # 第几个 checkpoint
    
  code_snapshot:
    file_path: "src/main/java/com/example/service/OrderService.java"
    content_hash: "sha256:abc123..."
    content_backup: "..."  # 完整代码内容（gzip 压缩）
    
  progress:
    total_methods: 8
    completed_methods: ["validateOrder", "checkInventory"]
    current_method: "calculatePrice"
    pending_methods: ["applyDiscount", "saveOrder", "sendNotification"]
    
  context_summary:
    # 当前 subagent 的上下文摘要（前 50 行）
    brief_excerpt: "..."
    # 已使用的 token 数估算
    tokens_used: 45000
    
  dependencies:
    # 当前已加载的依赖类清单
    loaded_files:
      - path: ".../Order.java"
        hash: "sha256:..."
      - path: ".../InventoryService.java"
        hash: "sha256:..."
```

**Checkpoint 管理器**：

```javascript
// 新增 checkpoint-manager.cjs
class CheckpointManager {
  constructor(taskId) {
    this.taskId = taskId;
    this.checkpointDir = `.dev-flow/checkpoints/${taskId}`;
    this.ensureDir();
  }
  
  create(state, codeSnapshot, progress, contextSummary) {
    const checkpoint = {
      metadata: {
        task_id: this.taskId,
        state,
        created_at: new Date().toISOString(),
        sequence_number: this.getNextSequence()
      },
      code_snapshot: {
        file_path: codeSnapshot.filePath,
        content_hash: this.hash(codeSnapshot.content),
        content_backup: this.compress(codeSnapshot.content)
      },
      progress,
      context_summary: contextSummary
    };
    
    const path = `${this.checkpointDir}/${checkpoint.metadata.sequence_number}.yaml`;
    fs.writeFileSync(path, yaml.dump(checkpoint));
    
    // 保留最近 5 个 checkpoint，删除旧的
    this.gcCheckpoints(5);
    
    return checkpoint.metadata.sequence_number;
  }
  
  restore(sequenceNumber) {
    const path = `${this.checkpointDir}/${sequenceNumber}.yaml`;
    const checkpoint = yaml.load(fs.readFileSync(path, 'utf8'));
    
    return {
      state: checkpoint.metadata.state,
      code: this.decompress(checkpoint.code_snapshot.content_backup),
      progress: checkpoint.progress,
      contextSummary: checkpoint.context_summary
    };
  }
  
  getLatest() {
    const files = fs.readdirSync(this.checkpointDir)
      .filter(f => f.endsWith('.yaml'))
      .sort();
    if (files.length === 0) return null;
    return this.restore(parseInt(files[files.length - 1]));
  }
  
  // Session 恢复：从最新 checkpoint 继续
  resume() {
    const latest = this.getLatest();
    if (!latest) return null;
    
    // 恢复代码文件
    fs.writeFileSync(latest.progress.filePath, latest.code);
    
    // 返回恢复状态
    return {
      canResume: true,
      state: latest.state,
      progress: latest.progress,
      message: `从 checkpoint #${latest.sequenceNumber} 恢复，当前方法: ${latest.progress.currentMethod}`
    };
  }
}
```

#### 3.2.3 方法依赖图与拓扑填充

**设计目标**：根据方法间的调用关系确定最优填充顺序，减少上下文不足导致的错误。

**依赖图构建**：

```javascript
// 新增 method-dependency-graph.cjs
class MethodDependencyGraph {
  buildFromContract(contract) {
    const graph = new Map();
    
    for (const method of contract.methods) {
      const deps = [];
      
      // 从方法逻辑步骤中提取调用的其他方法
      for (const step of method.logicSteps) {
        const calledMethods = this.extractMethodCalls(step.description);
        deps.push(...calledMethods);
      }
      
      // 从接口契约中提取调用的外部服务方法
      for (const call of method.calls || []) {
        deps.push(call.method);
      }
      
      graph.set(method.name, [...new Set(deps)]);
    }
    
    return graph;
  }
  
  topologicalSort(graph) {
    const visited = new Set();
    const temp = new Set();
    const result = [];
    
    const visit = (method) => {
      if (temp.has(method)) {
        // 循环依赖：按字母序打破
        return;
      }
      if (visited.has(method)) return;
      
      temp.add(method);
      for (const dep of graph.get(method) || []) {
        if (graph.has(dep)) visit(dep);
      }
      temp.delete(method);
      visited.add(method);
      result.push(method);
    };
    
    for (const method of graph.keys()) {
      visit(method);
    }
    
    return result;
  }
  
  // 生成填充计划
  generateFillPlan(contract) {
    const graph = this.buildFromContract(contract);
    const order = this.topologicalSort(graph);
    
    return {
      order,
      batches: this.groupIntoBatches(order, graph),
      rationale: `按依赖关系排序：被调用方法先于调用方法填充`
    };
  }
  
  // 将方法分组为批次（每批次上下文预算内）
  groupIntoBatches(order, graph) {
    const batches = [];
    let currentBatch = [];
    let currentBatchDeps = new Set();
    
    for (const method of order) {
      const methodDeps = graph.get(method) || [];
      
      // 如果当前批次已包含此方法的依赖，可以加入
      const canAdd = methodDeps.every(d => 
        currentBatch.includes(d) || !order.includes(d)
      );
      
      if (canAdd && currentBatch.length < 3) {  // 每批最多 3 个方法
        currentBatch.push(method);
        methodDeps.forEach(d => currentBatchDeps.add(d));
      } else {
        if (currentBatch.length > 0) batches.push([...currentBatch]);
        currentBatch = [method];
        currentBatchDeps = new Set(methodDeps);
      }
    }
    
    if (currentBatch.length > 0) batches.push(currentBatch);
    return batches;
  }
}
```

#### 3.2.4 骨架验证强化

**设计目标**：在骨架阶段增加更多验证，确保骨架质量，减少后续填充阶段的错误。

**增强验证规则**：

```yaml
enhanced_skeleton_validation:
  原有规则:
    - "文件存在且非空"
    - "所有方法签名存在"
    - "所有方法体为 TODO"
  
  新增规则:
    - rule: "类声明与设计契约一致"
      check: |
        AST 解析类名、包名、继承关系、实现接口
        与设计契约中的 class 定义逐字段比对
      
    - rule: "方法签名与设计契约一致"
      check: |
        方法名、参数类型（含泛型）、返回类型、异常声明
        必须与 design-contract 完全匹配
      
    - rule: "导入语句完整"
      check: |
        所有方法签名中引用的类型都有 import
        未解析的类型标注为 "需要按需加载"
      
    - rule: "注解与框架规范一致"
      check: |
        Controller 有 @RestController
        Service 有 @Service
        Entity 有 @Entity
        等框架特定注解
      
    - rule: "骨架自身可编译"
      check: |
        javac --dry-run 骨架文件
        允许 "符号找不到" 错误（因为依赖可能未完全加载）
        不允许语法错误
```

### 3.3 第二层可靠性提升预估

| 优化项 | 当前可靠性 | 优化后可靠性 | 提升方式 |
|--------|-----------|-------------|----------|
| 代码生成 FSM | 70% | 85% | 状态机强制验证，失败即回滚 |
| Checkpoint 系统 | 60% | 88% | 支持失败恢复和 session 续跑 |
| 拓扑填充顺序 | 70% | 82% | 减少依赖缺失导致的填充错误 |
| 骨架验证强化 | 75% | 90% | 早期发现问题，降低后续修复成本 |
| **第二层综合** | **70%** | **88%** | 事务化保证代码生成完整性 |

---

## 4. 第三层：主 Agent 上下文隔离

### 4.1 问题分析

#### 4.1.1 主 Agent 上下文累积机制

当前主 Agent（Orchestrator）在 9 阶段流程中需要维护：

```yaml
主 Agent 内存中的状态:
  - SKILL.md 完整内容 (~10KB)
  - 当前阶段指令 (~5-15KB)
  - 已完成阶段的历史摘要 (~5KB × 已完成阶段数)
  - 任务 DAG 和状态 (~10-50KB，取决于任务数量)
  - 各 subagent 的进度跟踪 (~2KB × 并行 subagent 数)
  - 编译错误日志和修复历史 (可变，可能 10-30KB)
  - 用户交互历史 (可变)
```

**问题 1：阶段历史压缩不彻底**
- `stage-summary.yaml` 只压缩代码内容，但保留了大量元数据
- 9 个阶段全部完成后，历史摘要可能累积到 40-60KB

**问题 2：任务 DAG 随复杂度膨胀**
- 企业级需求可能产生 30-50 个任务
- 每个任务的依赖关系、状态、结果都需要跟踪
- DAG 本身的 YAML 表示可能达到 30-50KB

**问题 3：编译修复循环的日志累积**
- 每轮编译失败产生错误日志（可能 5-10KB）
- 3 轮修复循环后，日志累积到 15-30KB
- 这些日志在主 Agent 上下文中，挤占其他信息空间

#### 4.1.2 多需求连续开发的 session 污染

当前设计未考虑：
- 一个 session 中连续执行多个需求
- 前一个需求的上下文残留影响后一个需求
- 无明确的 session 清理机制

### 4.2 优化方案设计

#### 4.2.1 上下文预算池（阶段级硬预算）

**设计目标**：将主 Agent 的上下文视为有限预算池，每个阶段有明确的预算上限，超预算时强制清理。

**预算分配模型**：

```yaml
context_budget_pool:
  total_budget: "模型上下文窗口 × 0.5"  # 50% 留给主 Agent
  
  固定开销（必须保留）:
    skill_compressed: 5KB      # SKILL.md 的压缩版（只保留阶段列表和规则）
    current_stage: 10KB        # 当前阶段指令
    safety_margin: 10KB        # 安全边距
    
  可变开销（受预算约束）:
    stage_summaries: 5KB       # 已完成阶段摘要（总预算，非每个）
    task_dag: 10KB             # 任务 DAG 压缩表示
    subagent_status: 5KB       # subagent 状态摘要
    error_logs: 5KB            # 错误日志（滚动保留）
    
  预算超限时的清理策略:
    priority_1: "压缩 error_logs（只保留最近 1 轮）"
    priority_2: "归档最旧 stage_summary 到文件系统"
    priority_3: "简化 task_dag（只保留未完成任务）"
    priority_4: "减少 subagent_status 细节（只保留状态，去掉输出摘要）"
```

**压缩版 SKILL.md 设计**：

```markdown
# SKILL.md (Compressed Version for Main Agent)

## 阶段列表（只保留名称和状态）
1. Research [COMPLETED] → summary: .dev-flow/stage-summaries/research.yaml
2. Clarify [COMPLETED] → summary: .dev-flow/stage-summaries/clarify.yaml
3. Analyze [COMPLETED] → summary: .dev-flow/stage-summaries/analyze.yaml
4. Design [COMPLETED] → summary: .dev-flow/stage-summaries/design.yaml
5. TaskSplit [COMPLETED] → summary: .dev-flow/stage-summaries/task-split.yaml
6. Develop [IN_PROGRESS] → current
7. Test [PENDING]
8. Fix [PENDING]
9. Delivery [PENDING]

## 核心规则（只保留硬约束）
- 必须遵循 protocol.md 的 5 步工作法
- 必须遵循 model-context-config.md 的上下文管理规则
- 阶段切换必须更新 session-index.yaml
- 任务完成必须更新 task-dag.yaml

## 当前状态（动态更新）
- 当前阶段: Develop
- 当前批次: Batch 2/5
- 活跃 subagent: 3
- 上下文使用率: 45%

> 详细指令请加载当前阶段文件
```

#### 4.2.2 阶段间零状态传递（文件系统唯一真相源）

**设计目标**：主 Agent 内存中只保留当前阶段的执行状态，所有跨阶段状态从文件系统实时读取。

**状态外置规范**：

```yaml
state_externalization:
  当前模式:
    主 Agent 内存: "保留全量历史、任务列表、依赖图"
    问题: "内存状态与文件系统可能不一致，且占用上下文"
  
  优化模式:
    主 Agent 内存只保留:
      - current_stage: string  # 当前阶段名称
      - next_action: string    # 下一个操作（从 session-index.yaml 读取）
      - active_subagents: number  # 当前活跃 subagent 数量
    
    所有其他状态从文件系统实时读取:
      task_list:
        source: ".dev-flow/task-dag.yaml"
        read_method: "yaml.load(fs.readFileSync(...))"
        cache_ttl: "0s"  # 不缓存，每次读取最新
        
      stage_history:
        source: ".dev-flow/stage-summaries/{stage}.yaml"
        read_method: "按需读取，只读当前需要的阶段"
        
      subagent_results:
        source: ".dev-flow/task-results/"
        read_method: "读取特定 taskId 的结果文件"
        
      error_logs:
        source: ".dev-flow/compilation-logs/"
        read_method: "只读取最近 1 个日志文件"
```

**Session 索引协议（简化版）**：

```yaml
# .dev-flow/session-index.yaml
session:
  id: "sess-20260611-001"
  current_stage: "Develop"
  current_batch: 2
  next_action: "dispatch_batch_3"  # 明确的下一步操作
  
  # 所有详细状态外置到独立文件
  refs:
    task_dag: ".dev-flow/task-dag.yaml"
    stage_summaries: ".dev-flow/stage-summaries/"
    task_results: ".dev-flow/task-results/"
    checkpoints: ".dev-flow/checkpoints/"
    
  # 运行时统计（只保留数字）
  stats:
    total_tasks: 15
    completed_tasks: 8
    failed_tasks: 1
    pending_tasks: 6
```

**主 Agent 阶段切换流程**：

```
1. 完成当前阶段最后一批 subagent
2. 生成阶段摘要 → 写入 .dev-flow/stage-summaries/{stage}.yaml
3. 更新 session-index.yaml: current_stage = next_stage
4. 从内存中丢弃当前阶段指令
5. 加载下一阶段指令（新的 Layer 3）
6. 继续执行
```

#### 4.2.3 会话级上下文清理（多需求连续开发）

**设计目标**：支持一个 session 中连续执行多个需求，每个需求有独立的上下文空间，互不污染。

**需求隔离机制**：

```yaml
session_isolation:
  目录结构:
    .dev-flow/
      sessions/
        {session-id}/
          requirements/
            {req-id}/
              stage-summaries/
              task-results/
              task-dag.yaml
              design-contract.yaml
              session-index.yaml
              checkpoints/
          
  切换需求时的清理流程:
    1. 保存当前需求状态到 requirements/{current-req-id}/
    2. 主 Agent 内存清理:
       - 丢弃所有阶段历史
       - 丢弃所有任务状态
       - 只保留 SKILL.md 压缩版
    3. 加载新需求的 session-index.yaml
    4. 从 Research 阶段开始（或从 checkpoint 恢复）
    
  上下文隔离保证:
    - 需求 A 的 task-dag 不会出现在需求 B 的上下文中
    - 需求 A 的编译错误不会干扰需求 B
    - 每个需求有独立的预算池
```

**需求间共享数据（可选）**：

```yaml
shared_data:
  # 如果多个需求属于同一项目，可以共享项目级数据
  project_context:
    source: ".dev-flow/project-context.yaml"
    content:
      - 项目技术栈
      - 公共依赖版本
      - 已确认的架构决策
    
  # 共享数据有独立预算，不占用需求预算
  budget: 10KB
  update_rule: "只追加，不删除（避免信息丢失）"
```

### 4.3 第三层可靠性提升预估

| 优化项 | 当前可靠性 | 优化后可靠性 | 提升方式 |
|--------|-----------|-------------|----------|
| 上下文预算池 | 75% | 88% | 硬预算强制清理，防止累积溢出 |
| 零状态传递 | 70% | 90% | 主 Agent 上下文占用与复杂度解耦 |
| 会话隔离 | 60% | 85% | 多需求连续开发无上下文污染 |
| **第三层综合** | **75%** | **90%** | 主 Agent 上下文恒定为 O(1) |

---

## 5. 第四层：冗余验证链

### 5.1 问题分析

#### 5.1.1 当前验证链的单点失败风险

当前验证流程：

```
Develop 完成
  → validate-result.cjs (文件级检查)
  → contract-validator (AI subagent，结构检查 R1-R4)
  → verify-expert (AI subagent，逻辑检查 R5)
  → 编译验证
```

**问题 1：单层验证无交叉确认**
- `validate-result.cjs` 是脚本，但只检查文件存在性和 TODO
- `contract-validator` 和 `verify-expert` 都是 AI subagent，可能犯相同错误
- 无"机器验证"与"AI 验证"的交叉确认

**问题 2：R5 逻辑覆盖率依赖人工标注**

```markdown
// 当前 R5 检查方式（develop.md）
R5. 逻辑步骤覆盖：
  检查方式: "contract-validator 检查代码中是否有每个 logic step 的注释标注"
  问题: "subagent 可能遗漏标注，导致 R5 误报通过"
```

**问题 3：验证与开发串行，增加上下文压力**
- 验证阶段需要加载代码 + 设计契约 + 验证规则
- 如果开发阶段已接近上下文上限，验证阶段更容易溢出

### 5.2 优化方案设计

#### 5.2.1 三重独立验证架构

**设计目标**：建立三层独立的验证体系，每层有不同的验证方法和阻断策略。

**Layer 1: 静态验证（机器自动，硬阻断）**

```javascript
// 新增 static-validation-suite.cjs
class StaticValidationSuite {
  run(filePath, contract, config) {
    const results = [];
    
    // 1. 文件存在性和非空性
    results.push(this.checkFileExists(filePath));
    
    // 2. TODO/FIXME/NotImplemented 扫描
    results.push(this.checkNoPlaceholders(filePath));
    
    // 3. 空方法体检测
    results.push(this.checkNoEmptyMethods(filePath));
    
    // 4. 语法正确性（快速编译检查）
    results.push(this.checkSyntax(filePath, config.language));
    
    // 5. 设计契约签名匹配（精确字符串比较）
    results.push(this.checkContractSignatures(filePath, contract));
    
    // 6. 导入完整性（无未解析的符号）
    results.push(this.checkImports(filePath));
    
    // 7. 代码风格一致性（与项目现有代码对比）
    results.push(this.checkStyleConsistency(filePath, config.projectRoot));
    
    return {
      passed: results.every(r => r.passed),
      results,
      // 硬阻断：任何失败都阻止进入下一阶段
      blocking: results.filter(r => !r.passed && r.severity === 'BLOCKING'),
      warnings: results.filter(r => !r.passed && r.severity === 'WARNING')
    };
  }
  
  checkContractSignatures(filePath, contract) {
    const ast = this.parseAST(filePath);
    const issues = [];
    
    for (const method of contract.methods) {
      const found = ast.methods.find(m => m.name === method.name);
      if (!found) {
        issues.push({ type: 'MISSING_METHOD', method: method.name });
        continue;
      }
      
      // 精确匹配参数类型和返回类型
      if (JSON.stringify(found.params) !== JSON.stringify(method.params)) {
        issues.push({ type: 'PARAM_MISMATCH', method: method.name });
      }
      if (found.returnType !== method.returnType) {
        issues.push({ type: 'RETURN_MISMATCH', method: method.name });
      }
    }
    
    return {
      passed: issues.length === 0,
      issues,
      severity: 'BLOCKING'
    };
  }
}
```

**Layer 2: AI 验证（独立 subagent，软阻断）**

```markdown
# contract-validator-v2.md（增强版）

## 职责
独立验证代码与设计契约的一致性，与开发者 subagent 完全隔离。

## 输入
- 代码文件路径（只读）
- 设计契约片段（只读）
- 验证规则清单（只读）

## 验证项
1. R1: 结构一致性（类名、包名、继承、接口）
2. R2: 方法签名一致性（精确匹配）
3. R3: 类型一致性（参数、返回、泛型）
4. R4: 注解一致性（框架注解、自定义注解）
5. R5: 逻辑覆盖率（由 logic-coverage-validator 提供结果，不自行判断）

## 输出格式
```yaml
validation_result:
  passed: true/false
  
  structure_check:
    passed: true/false
    issues: []
    
  signature_check:
    passed: true/false
    issues: []
    
  # ... 其他检查项
  
  overall_assessment: "通过/有条件通过/不通过"
```

## 阻断策略
- 任何 R1-R4 失败 → 软阻断（允许 1 次自动修复重试）
- R5 结果直接采用 logic-coverage-validator 的输出
```

**Layer 3: 对抗性验证（参考级，不阻断）**

```markdown
# adversarial-reviewer.md

## 职责
以"代码审查员"视角，主动寻找代码中的潜在问题。

## 方法
1. 假设代码有 bug，尝试找出
2. 考虑边界情况和异常路径
3. 检查是否有未处理的错误场景
4. 验证性能敏感点是否有优化空间

## 输出
- 发现的问题列表（按严重程度排序）
- 修复建议
- 不阻断流程，只作为参考

## 触发时机
- 只在 Layer 1 和 Layer 2 都通过后执行
- 结果写入 .dev-flow/reviews/adversarial-{taskId}.md
```

#### 5.2.2 R5 逻辑覆盖率自动化（AST 解析替代人工标注）

**设计目标**：通过 AST（抽象语法树）解析自动匹配设计步骤与代码实现，消除对人工标注的依赖。

**实现设计**：

```javascript
// 新增 logic-coverage-auto.cjs
class LogicCoverageAnalyzer {
  analyze(filePath, contract) {
    const ast = this.parseAST(filePath);
    const method = ast.methods.find(m => m.name === contract.methodName);
    
    // 1. 从设计契约提取逻辑步骤
    const designSteps = contract.logicSteps.map((step, idx) => ({
      id: `step-${idx + 1}`,
      description: step.description,
      keywords: this.extractKeywords(step.description)
    }));
    
    // 2. 从代码 AST 提取控制流
    const codeBlocks = this.extractControlFlow(method);
    // 结果：[
    //   { type: 'if', condition: 'order == null', lines: [10, 15] },
    //   { type: 'for', iterator: 'item', lines: [20, 30] },
    //   { type: 'try', lines: [35, 50] },
    //   { type: 'method_call', name: 'inventoryService.check', lines: [40] }
    // ]
    
    // 3. 自动匹配：design step ↔ code block
    const matches = [];
    for (const step of designSteps) {
      const matchedBlock = this.findBestMatch(step, codeBlocks);
      matches.push({
        step: step.id,
        matched: matchedBlock !== null,
        confidence: matchedBlock ? matchedBlock.confidence : 0,
        codeLocation: matchedBlock ? matchedBlock.lines : null
      });
    }
    
    // 4. 计算覆盖率
    const coverage = matches.filter(m => m.matched).length / matches.length;
    
    return {
      coverage,
      matches,
      unmappedSteps: matches.filter(m => !m.matched).map(m => m.step),
      unmappedBlocks: codeBlocks.filter(b => !b.matched).map(b => b.type)
    };
  }
  
  findBestMatch(step, codeBlocks) {
    let best = null;
    let bestScore = 0;
    
    for (const block of codeBlocks) {
      const score = this.calculateMatchScore(step, block);
      if (score > bestScore && score > 0.6) {  // 置信度阈值
        best = block;
        bestScore = score;
      }
    }
    
    return best ? { ...best, confidence: bestScore } : null;
  }
  
  calculateMatchScore(step, block) {
    let score = 0;
    
    // 关键词匹配（权重 50%）
    const keywordMatch = step.keywords.filter(k => 
      block.condition?.includes(k) || 
      block.name?.includes(k)
    ).length / step.keywords.length;
    score += keywordMatch * 0.5;
    
    // 语义匹配（权重 30%）
    // 例如："校验" 对应 if (validation) 或 try-catch
    const semanticMatch = this.checkSemanticAlignment(step, block);
    score += semanticMatch * 0.3;
    
    // 位置匹配（权重 20%）
    // 设计步骤的顺序应与代码块的顺序一致
    const positionMatch = this.checkPositionAlignment(step, block);
    score += positionMatch * 0.2;
    
    return score;
  }
}
```

**匹配示例**：

```yaml
# 设计契约
logic_steps:
  - step: 1
    description: "校验订单参数合法性"
  - step: 2
    description: "查询库存是否充足"
  - step: 3
    description: "计算订单总价"
  - step: 4
    description: "保存订单到数据库"

# 代码 AST 提取的控制流
control_flow:
  - type: "if"
    condition: "order == null || order.items.isEmpty()"
    matched_step: "step-1"
    confidence: 0.92
  - type: "method_call"
    name: "inventoryService.checkStock"
    matched_step: "step-2"
    confidence: 0.88
  - type: "method_call"
    name: "priceCalculator.calculate"
    matched_step: "step-3"
    confidence: 0.85
  - type: "method_call"
    name: "orderRepository.save"
    matched_step: "step-4"
    confidence: 0.95

# 覆盖率报告
coverage: 100%  # 所有步骤都有匹配
unmapped_steps: []
unmapped_blocks: []  # 无额外代码块
```

#### 5.2.3 验证与开发的上下文解耦

**设计目标**：将验证阶段从主 Agent 的上下文中剥离，使用独立的 subagent 执行，减少上下文压力。

**解耦设计**：

```yaml
validation_decoupling:
  当前模式:
    - 开发 subagent 生成代码
    - 主 Agent 加载代码 + 契约 + 验证规则
    - 主 Agent 执行验证（占用主 Agent 上下文）
    
  优化模式:
    - 开发 subagent 生成代码 → 写入文件系统
    - 验证 subagent（独立）读取代码 + 契约片段
    - 验证 subagent 执行 Layer 1-2 验证
    - 验证结果写入 .dev-flow/validation-results/{taskId}.yaml
    - 主 Agent 只读取验证结果（1KB），不加载代码
    
  好处:
    - 主 Agent 上下文不膨胀
    - 验证可以并行执行（多个验证 subagent 同时运行）
    - 验证失败不影响主 Agent 的决策能力
```

### 5.3 第四层可靠性提升预估

| 优化项 | 当前可靠性 | 优化后可靠性 | 提升方式 |
|--------|-----------|-------------|----------|
| Layer 1 静态验证 | 75% | 95% | 机器自动，硬阻断，无 AI 幻觉 |
| Layer 2 AI 验证 | 80% | 90% | 独立 subagent，与开发者隔离 |
| Layer 3 对抗性验证 | N/A | 85% | 主动寻找问题，补充前两层的盲点 |
| R5 自动化 | 60% | 92% | AST 解析替代人工标注 |
| 验证解耦 | 70% | 88% | 减少主 Agent 上下文压力 |
| **第四层综合** | **80%** | **95%** | 三重交叉确认，错误难以漏过 |

---

## 6. 第五层：故障自动恢复

### 6.1 问题分析

#### 6.1.1 当前三级失败协议的局限性

```markdown
// 当前失败处理（develop.md）
三级失败处理：
  L1: 自动重试（最多3次）
  L2: 诊断重试（分析原因后重试）
  L3: 人工升级（完全停止）
```

**问题 1：L3 完全停止**
- 任何无法自动修复的问题都导致整个流程终止
- 无"部分成功"的继续机制
- 企业场景中，一个文件的失败不应阻断其他 20 个文件的开发

**问题 2：无降级策略**
- 上下文不足时，唯一选择是停止
- 无"简化需求继续"或"跳过非核心功能"的选项

**问题 3：修复循环无上下文清理**
- 编译验证循环（最多 3 轮）中，错误日志累积
- 第 3 轮时上下文使用率最高，修复质量最低

### 6.2 优化方案设计

#### 6.2.1 优雅降级策略矩阵

**设计目标**：为 5 种常见故障场景定义 4 级降级策略，每级有明确的触发条件和执行动作。

**场景 1：上下文不足导致代码生成失败**

```yaml
degradation_scenario_1:
  name: "上下文不足"
  trigger: "完整性门控阻断 或 subagent 返回 CONTEXT_OVERFLOW 错误"
  
  level_1_split_task:
    condition: "任务包含 >3 个方法 或 依赖文件总大小 > 预算 80%"
    action: "拆分为更小的子任务"
    example: "OrderService (8 方法) → 拆为 OrderValidator + OrderCalculator + OrderSaver"
    
  level_2_on_demand_load:
    condition: "只有 1-2 个超大依赖文件"
    action: "启用 @on-demand-loader，subagent 按需读取"
    risk: "subagent 可能频繁读取，进一步增加上下文压力"
    
  level_3_skeleton_only:
    condition: "即使按需加载也不足"
    action: "只生成骨架（方法签名 + 空实现），标记为待人工填充"
    output: "文件可编译，但功能未实现"
    
  level_4_skip_non_core:
    condition: "当前任务是边缘功能（如日志、监控）"
    action: "跳过该任务，记录到 pending 清单"
    impact: "不影响核心功能交付"
```

**场景 2：验证失败（编译错误）**

```yaml
degradation_scenario_2:
  name: "编译验证失败"
  trigger: "编译器返回错误"
  
  level_1_auto_fix:
    condition: "错误类型为：语法错误、类型不匹配、缺失导入"
    action: "自动修复（最多 3 轮，已有）"
    enhancement: "每轮修复前清理错误日志，只保留当前轮次"
    
  level_2_isolated_fix:
    condition: "错误集中在单个文件，其他文件已验证通过"
    action: "锁定其他文件（只读），只修复错误文件"
    benefit: "减少上下文占用，聚焦问题"
    
  level_3_checkpoint_rollback:
    condition: "自动修复 3 轮后仍失败"
    action: "回滚到上一个 checkpoint，尝试替代实现方案"
    example: "换用不同的算法或库函数"
    
  level_4_human_fix:
    condition: "回滚后仍失败，或错误涉及复杂业务逻辑"
    action: "标记文件为 NEEDS_HUMAN_FIX，继续其他文件"
    output: "交付报告中包含：文件路径 + 错误日志 + 建议修复方案"
```

**场景 3：Subagent 完全无响应**

```yaml
degradation_scenario_3:
  name: "Subagent 无响应"
  trigger: "subagent 调用超时 或 返回空内容"
  
  level_1_restart:
    condition: "首次超时"
    action: "重启 subagent（保留 task-brief）"
    
  level_2_simplify:
    condition: "重启后仍超时"
    action: "简化任务（去掉非核心功能，减少上下文）"
    
  level_3_serial_mode:
    condition: "并行模式下频繁超时"
    action: "降级到串行模式（减少系统负载）"
    
  level_4_human_escalation:
    condition: "串行模式下仍超时"
    action: "标记为 NEEDS_HUMAN_ATTENTION"
```

**场景 4：设计契约与实现冲突**

```yaml
degradation_scenario_4:
  name: "契约冲突"
  trigger: "contract-validator 发现 R1-R4 失败"
  
  level_1_auto_align:
    condition: "差异为：命名风格、注解缺失、参数顺序"
    action: "自动调整代码以匹配契约"
    
  level_2_contract_update:
    condition: "差异为：契约设计不合理（如循环依赖）"
    action: "更新设计契约（需记录变更原因）"
    approval: "自动执行，但记录到变更日志"
    
  level_3_partial_implement:
    condition: "契约中部分方法在当前上下文中无法实现"
    action: "实现可完成的部分，标记不可完成的部分"
    
  level_4_redesign:
    condition: "契约与实现根本冲突"
    action: "触发重新设计（回到 Design 阶段）"
    limit: "最多 1 次重新设计，避免无限循环"
```

**场景 5：长时间运行导致的 session 不稳定**

```yaml
degradation_scenario_5:
  name: "Session 不稳定"
  trigger: "主 Agent 响应变慢、上下文使用率 >90%"
  
  level_1_compress_history:
    condition: "上下文使用率 70-85%"
    action: "强制压缩阶段历史，只保留最近 2 个阶段"
    
  level_2_save_and_resume:
    condition: "上下文使用率 85-95%"
    action: "保存当前状态到 checkpoint，提示用户重新开始 session"
    benefit: "新 session 上下文清零，从 checkpoint 恢复"
    
  level_3_partial_delivery:
    condition: "上下文使用率 >95% 且无法压缩"
    action: "立即交付已完成的部分"
    output: "包含：已完成代码 + pending 清单 + 恢复指南"
    
  level_4_emergency_stop:
    condition: "系统级错误（如文件系统满、内存不足）"
    action: "紧急停止，保留所有 checkpoint"
```

#### 6.2.2 部分交付机制

**设计目标**：允许流程在部分任务失败的情况下继续，最终交付"已完成部分 + 待人工部分"。

**任务分类体系**：

```yaml
task_classification:
  分类维度:
    - 阻塞性:
        description: "下游任务依赖此任务"
        example: "OrderService（被 OrderController 依赖）"
        fail_policy: "BLOCKING - 必须成功，否则下游无法继续"
        
    - 核心非阻塞:
        description: "核心功能，但无下游依赖"
        example: "OrderAuditLogService"
        fail_policy: "DEFERRABLE - 可延期到后续迭代"
        
    - 边缘功能:
        description: "非核心功能，不影响主流程"
        example: "OrderExportService, OrderMetricsService"
        fail_policy: "SKIPPABLE - 可跳过，记录到 pending"
        
    - 优化类:
        description: "性能优化、代码重构"
        example: "OrderCacheOptimizer"
        fail_policy: "SKIPPABLE - 可跳过"

  自动分类规则:
    - "如果被 >2 个其他任务依赖 → 阻塞性"
    - "如果属于核心业务流程（CRUD 中的 CUD）→ 核心非阻塞"
    - "如果名称包含 Export, Metrics, Cache, Log → 边缘或优化"
    - "人工标注优先于自动分类"
```

**部分交付流程**：

```yaml
partial_delivery_flow:
  触发条件:
    - "阻塞性任务全部成功"
    - "存在失败的核心非阻塞或边缘任务"
    
  执行步骤:
    1. 收集所有失败任务
    2. 为每个失败任务生成 "修复指南":
       - 任务描述
       - 失败原因
       - 已尝试的修复方法
       - 建议的人工修复方案
       - 相关代码文件路径
       
    3. 生成 "部分交付报告":
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
             reason: "上下文不足，Excel 生成库依赖复杂"
             guide: ".dev-flow/pending/T15-fix-guide.md"
             
           - task: "订单监控指标"
             reason: "编译错误，Micrometer 配置冲突"
             guide: ".dev-flow/pending/T18-fix-guide.md"
             
         next_steps:
           - "查看 pending 清单了解待完成功能"
           - "按修复指南人工完成失败任务"
           - "重新运行 dev-flow 验证完整性"
       ```
       
    4. 继续执行后续阶段（Test/Fix/Delivery）
       - 只测试已完成的任务
       - Fix 阶段只修复已发现的问题
       - Delivery 包含部分交付报告
```

#### 6.2.3 编译验证循环的上下文清理

**设计目标**：在编译修复循环中定期清理累积的错误日志和上下文，防止第 3 轮质量下降。

**清理策略**：

```yaml
compile_loop_context_management:
  当前问题:
    - "每轮编译错误日志累积（5-10KB/轮）"
    - "3 轮后上下文占用 +15-30KB"
    - "修复质量随轮次下降"
    
  优化策略:
    round_1:
      action: "正常修复"
      context_preservation: "保留完整错误日志"
      
    round_2:
      pre_action: "压缩 round_1 日志"
      compression: "只保留错误类型和位置，去掉详细堆栈"
      context_saving: "节省 ~60% 日志空间"
      
    round_3:
      pre_action: "完全清理 round_1-2 日志"
      replacement: "只保留当前轮次的错误"
      fallback: "如果 round_3 仍失败，回滚到 checkpoint 而非继续第 4 轮"
      
    round_3_fail:
      action: "不再继续编译循环"
      next_step: "触发降级策略（level_3 checkpoint 回滚 或 level_4 人工修复）"
```

### 6.3 第五层可靠性提升预估

| 优化项 | 当前可靠性 | 优化后可靠性 | 提升方式 |
|--------|-----------|-------------|----------|
| 优雅降级矩阵 | 60% | 85% | 5 种场景 × 4 级策略，有路可退 |
| 部分交付机制 | 50% | 88% | 单点失败不阻断全流程 |
| 编译循环清理 | 65% | 90% | 防止修复质量随轮次下降 |
| **第五层综合** | **70%** | **92%** | 故障是常态，恢复是关键 |

---

## 7. 可靠性量化模型

### 7.1 单层可靠性计算

假设各层的故障模式相对独立（实际有一定相关性，但独立假设给出保守估计）：

```
Layer 1 (上下文硬约束):  85% 成功率
Layer 2 (分段事务化):    88% 成功率
Layer 3 (主 Agent 隔离):  90% 成功率
Layer 4 (冗余验证):       95% 成功率
Layer 5 (故障恢复):       92% 成功率
```

### 7.2 组合可靠性计算

**串联模型**（所有层都必须通过）：

```
R_total = R1 × R2 × R3 × R4 × R5
        = 0.85 × 0.88 × 0.90 × 0.95 × 0.92
        = 0.9923
        = 99.23%
```

**当前可靠性对比**：

```
R_current = 0.65 × 0.70 × 0.75 × 0.80 × 0.70
          = 0.1911
          = 19.11%
```

> 注：当前 19% 看起来很低，但实际体验可能在 50-60% 左右，因为各层故障有一定重叠（如上下文不足同时影响 Layer 1 和 Layer 3）。优化后的 99% 是理论上限，实际可能在 95-98%。

### 7.3 敏感性分析

| 场景 | 调整 | 组合可靠性 |
|------|------|-----------|
| 基础方案 | 如上 | 99.23% |
| 保守估计 | 每层 -5% | 0.80 × 0.83 × 0.85 × 0.90 × 0.87 = 87.6% |
| 极端保守 | 每层 -10% | 0.75 × 0.78 × 0.80 × 0.85 × 0.82 = 72.4% |
| 仅实施 P0/P1 | Layer 1-2 实施，3-5 不实施 | 0.85 × 0.88 × 0.75 × 0.80 × 0.70 = 62.7% |

### 7.4 关键路径识别

要达到 99% 可靠性，最关键的因素：

1. **完整性门控必须硬阻断**（Layer 1）
   - 如果允许截断依赖通过，后续所有层的努力都基于错误前提
   - 此单项可将可靠性从 65% 提升到 82%

2. **Checkpoint 系统必须可靠**（Layer 2）
   - 代码生成失败后的恢复能力决定实际可交付率
   - 无 checkpoint 时，失败 = 全部重来

3. **主 Agent 上下文必须隔离**（Layer 3）
   - 长会话的上下文累积是当前最大的隐性风险
   - 此问题在 20+ 任务的企业级需求中必然触发

---

## 8. 实施优先级与里程碑

### 8.1 优先级矩阵

| 优先级 | 优化项 | 影响 | 复杂度 | 文件变更 | 预计工作量 |
|--------|--------|------|--------|----------|-----------|
| **P0** | 2.2.2 Step 2.5 完整性门控 | 极高 | 低 | `prepare-context.cjs` + 新增 `completeness-gate.cjs` | 1-2 天 |
| **P0** | 5.2.1 优雅降级矩阵（场景 1-2） | 极高 | 低 | `develop.md` + 新增 `degradation-matrix.yaml` | 1-2 天 |
| **P0** | 4.2.1 Layer 1 静态验证强化 | 极高 | 中 | 新增 `static-validation-suite.cjs` | 2-3 天 |
| **P1** | 3.2.1 上下文预算池 | 高 | 中 | `orchestrator.md` + 新增 `budget-pool.cjs` | 2-3 天 |
| **P1** | 3.2.2 阶段间零状态传递 | 高 | 中 | `orchestrator.md` + `session-index.yaml` 协议更新 | 2-3 天 |
| **P1** | 2.2.1 动态上下文预算 | 中高 | 低 | `prepare-context.cjs` + 新增 `dynamic-budget.cjs` | 1 天 |
| **P2** | 3.2.2 Checkpoint 系统 | 高 | 中 | 新增 `checkpoint-manager.cjs` + `segment-code.cjs` 集成 | 3-4 天 |
| **P2** | 3.2.3 方法依赖图 | 中 | 中 | 新增 `method-dependency-graph.cjs` | 2-3 天 |
| **P2** | 4.2.2 R5 自动化 | 高 | 高 | 新增 `logic-coverage-auto.cjs` + AST 解析器 | 5-7 天 |
| **P3** | 2.2.3 多候选依赖解析 | 中 | 中 | 新增 `dependency-resolver.cjs` | 2-3 天 |
| **P3** | 2.2.4 @on-demand-loader | 中 | 中 | 新增 `on-demand-loader.md` + `prepare-context.cjs` 集成 | 2-3 天 |
| **P3** | 5.2.2 部分交付机制 | 中 | 中 | `delivery.md` + 新增 `partial-delivery.cjs` | 2-3 天 |
| **P4** | 4.2.3 验证解耦 | 中 | 高 | 重构验证流程，新增验证 subagent | 4-5 天 |
| **P4** | 5.2.3 编译循环清理 | 中 | 低 | `develop.md` + `validate-result.cjs` | 1-2 天 |

### 8.2 实施里程碑

```yaml
milestone_1_week_1_2:
  name: "P0 紧急防护"
  target_reliability: "75%"
  deliverables:
    - "完整性门控（硬阻断截断依赖）"
    - "静态验证套件（Layer 1 硬阻断）"
    - "优雅降级矩阵（场景 1-2）"
  
milestone_2_week_3_4:
  name: "主 Agent 稳定性"
  target_reliability: "85%"
  deliverables:
    - "上下文预算池"
    - "阶段间零状态传递"
    - "动态上下文预算"
    - "Checkpoint 系统"
  
milestone_3_week_5_6:
  name: "验证链完善"
  target_reliability: "92%"
  deliverables:
    - "R5 逻辑覆盖率自动化"
    - "多候选依赖解析"
    - "验证解耦"
  
milestone_4_week_7_8:
  name: "完整交付能力"
  target_reliability: "99%"
  deliverables:
    - "@on-demand-loader"
    - "部分交付机制"
    - "编译循环清理"
    - "全链路集成测试"
```

### 8.3 回滚策略

每项优化都应支持独立开关和回滚：

```yaml
feature_flags:
  completeness_gate:
    enabled: true
    fallback: "记录警告但不阻断（恢复当前行为）"
    
  dynamic_budget:
    enabled: true
    fallback: "使用固定阈值 120KB/30KB"
    
  checkpoint_system:
    enabled: true
    fallback: "无 checkpoint，失败即终止"
    
  static_validation:
    enabled: true
    fallback: "只保留 validate-result.cjs 的基础检查"
    
  partial_delivery:
    enabled: true
    fallback: "任何失败都阻断全流程"
```

---

## 9. 风险与回滚策略

### 9.1 实施风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 完整性门控过于严格，导致正常任务被阻断 | 中 | 高 | 门控阈值可调，初始阶段记录但不阻断，观察 1 周后启用 |
| R5 自动化 AST 解析不准确 | 中 | 中 | 保留人工标注作为 fallback，自动化结果只作为参考 |
| Checkpoint 系统增加 I/O 开销 | 高 | 低 | Checkpoint 异步写入，不影响主流程 |
| 阶段间零状态传递增加文件读取次数 | 高 | 低 | 使用内存缓存（TTL 5 秒），平衡一致性和性能 |
| 多候选依赖解析增加搜索时间 | 中 | 低 | 缓存搜索结果，同一 session 内复用 |

### 9.2 验证计划

每项优化实施后，需要通过以下测试验证：

```yaml
validation_tests:
  unit_tests:
    - "完整性门控：模拟截断文件，验证是否正确阻断"
    - "动态预算：模拟不同模型，验证预算计算正确"
    - "Checkpoint：模拟失败，验证恢复后状态一致"
    - "R5 自动化：提供已知代码和契约，验证覆盖率计算正确"
    
  integration_tests:
    - "端到端：中等复杂度需求（5-10 个文件）"
    - "端到端：高复杂度需求（20+ 个文件）"
    - "长会话：连续执行 3 个需求"
    - "故障注入：模拟 subagent 超时、截断、编译错误"
    
  benchmark_tests:
    - "上下文使用率对比（优化前 vs 优化后）"
    - "开发时间对比（优化前 vs 优化后）"
    - "成功率统计（至少 20 个真实需求样本）"
```

---

## 附录

### A. 新增文件清单

| 文件 | 职责 | 优先级 |
|------|------|--------|
| `scripts/completeness-gate.cjs` | 完整性门控 | P0 |
| `scripts/dynamic-budget.cjs` | 动态上下文预算计算 | P1 |
| `scripts/static-validation-suite.cjs` | Layer 1 静态验证 | P0 |
| `scripts/checkpoint-manager.cjs` | Checkpoint 管理 | P2 |
| `scripts/method-dependency-graph.cjs` | 方法依赖图构建 | P2 |
| `scripts/logic-coverage-auto.cjs` | R5 自动化分析 | P2 |
| `scripts/dependency-resolver.cjs` | 多候选依赖解析 | P3 |
| `scripts/partial-delivery.cjs` | 部分交付报告生成 | P3 |
| `skill-templates/_core/references/degradation-matrix.md` | 降级策略矩阵 | P0 |
| `skill-templates/_core/references/on-demand-loader.md` | 按需加载协议 | P3 |

### B. 修改文件清单

| 文件 | 修改内容 | 优先级 |
|------|----------|--------|
| `scripts/prepare-context.cjs` | 集成动态预算、完整性门控、多候选解析 | P0/P1 |
| `scripts/segment-code.cjs` | 集成 FSM、Checkpoint、拓扑填充 | P2 |
| `scripts/validate-result.cjs` | 集成静态验证套件 | P0 |
| `skill-templates/_core/agents/orchestrator.md` | 上下文预算池、零状态传递 | P1 |
| `skill-templates/_core/agents/contract-validator.md` | 集成 R5 自动化结果 | P2 |
| `skill-templates/_core/stages/develop.md` | 降级策略、编译循环清理 | P0/P4 |
| `skill-templates/_core/stages/delivery.md` | 部分交付报告 | P3 |

---

> **文档结束**  
> 本设计文档为 dev-flow 项目五层优化方案的完整详细设计。  
> 待用户确认后，可进入实施阶段。
