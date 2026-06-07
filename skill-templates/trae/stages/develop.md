---
stage: Develop
type: stage-instruction
---

## 阶段五：Develop（开发执行）

### 🔴🔴 主 Agent 零编辑约束（本阶段入口铁律）

> **⚠️ 最高优先级**：主 Agent 是纯调度器，绝对禁止 Edit/Write 代码文件。
> **所有代码编辑必须由 develop-expert subagent 执行。** 完整规则见 `references/protocol.md`。

---

### 🔔 入口 Banner（本阶段开始时输出）

```
▶ Develop（开发执行）
════════════════════════════════════
目标：按设计方案和任务拆分编写完整代码
输出：代码文件 + develop-result.yaml
模式：L0 / L1 / L2 / L3
预计：10-60 分钟（取决于规模）
════════════════════════════════════
```

### 触发条件
- 全流程模式（Task Split 确认后）
- 用户输入 `/dev-flow -develop <需求>`（直接开发，跳过设计和拆分）

### ⚠️ 文件数检测（执行前必须检查）

**Step 0: 检测需求规模，防止上下文溢出**

在启动 Develop 阶段前，必须预估需求涉及的文件数：

**检测逻辑**：
```
1. 解析需求描述，识别需要开发的文件类型和数量
2. 统计预估文件数（Entity ~1/对象, DTO ~2/对象, Enum ~1, Mapper ~1, Service ~2, Controller ~1）
3. 判断：
   ├── ≤ 5 → ✅ 标准模式
   ├── 6-10 → ⚠️ 警告，建议使用 /dev-flow -subagent 模式，询问用户
   └── > 10 → 🚨 强制阻止，提示使用 /dev-flow -subagent
```

### Step 0.5: 代码生成规划与分段决策（v3.0 结构化分段协议）

> **目的**：在开始编码前，预估目标代码量，决定是否启用"骨架 + 逐方法填充"分段模式。
> **触发条件**：Subagent 模式下，或预估单个文件输出 > 20KB 时。
> **详细分段执行规则见 `agents/develop-expert.md` — 结构化代码分段生成协议章节。**

**决策流程**：

```
1. 从子任务设计文档分析目标文件和方法数量
2. 估算每个方法的代码量（简单 ~2KB / 中等 ~4KB / 复杂 ~8KB）
3. 计算预估总输出量 = 方法总和 + imports/class/fields 开销（~5KB）

判断：
  ├── 预估输出 ≤ 20KB → 标准模式（一次生成）
  │
  └── 预估输出 > 20KB → 分段模式（骨架 + 逐方法填充）
        │
        ├── 如果存在 code-gen-plan-{taskId}.yaml → 按计划执行
        │
        └── 否则 → 先运行 segment-code.cjs --plan 生成计划
```

**分段模式执行步骤**：

| 阶段 | 操作 | 输出量 | 说明 |
|------|------|--------|------|
| Phase 0: 规划 | 运行 `segment-code.cjs --plan` | ~2KB YAML | 生成 code-generation-plan.yaml |
| Phase 1: 骨架 | 生成 imports + class + fields + 方法签名（空体） | ~10KB | 所有方法体 = `// TODO: implement {method_name}` |
| Phase 2: 填充 | 逐方法读取文件 + 生成方法体 + Edit 替换 TODO | 5-8KB/次 | 每次只实现一个方法，始终在安全输出区 |
| Phase 3: 验证 | 读取完整文件 + 编译 + 契约校验 + 完整性验证 | 0KB（只读） | 确保最终文件无 TODO、无空方法、编译通过 |

---

### 执行模式

> **统一 Subagent 执行模型**：无论需求规模，Develop 阶段必须由 develop-expert subagent 执行。
> 主 Agent 仅负责调度，不直接编辑代码。
>
> **调度方式由 Router 层动态重评估网关决定**：
> - **串行调度**（简单需求）：主 Agent 串行创建单个 develop-expert subagent，按任务列表顺序执行
> - **并行调度**（复杂需求）：主 Agent 启动 Orchestrator，按 DAG 拓扑排序分批并行派发多个 develop-expert subagent
>
> **触发条件**：Router 动态重评估判定（任务数>5/写写冲突/DAG深度>3/批次>3 → 并行调度）

### 主 Agent 调度协议（本阶段入口由主 Agent 执行）

> **⚠️ 本节描述主 Agent 的调度步骤，不是 develop-expert 的执行步骤。**

```
Step D1: 读取阶段指令 → Read stages/develop.md（本文件）
Step D2: 读取任务拆分文档和 DAG
        ├── 读取 .dev-flow/deliverables/{需求简称}/04-task-breakdown.md
        └── 读取 .dev-flow/contracts/{需求简称}/task-dag.yaml
Step D3: 运行 prepare-context.cjs（如 Subagent 模式）
        ├── node scripts/prepare-context.cjs --task {taskId}
        └── 为每个任务生成 task-brief-{taskId}.md
Step D4: 根据调度策略创建 develop-expert subagent
        ├── 串行调度 → 创建 1 个 develop-expert，传递 task-brief + design-contract
        │     └── subagent 按 develop-expert.md 工作流执行所有任务
        └── 并行调度 → 启动 Orchestrator，按 DAG 批次派发多个 develop-expert
              └── 详见 orchestrator.md 的工作流
Step D5: 监控 subagent 执行
        ├── 接收进度汇报
        ├── 处理阻塞问题（协调依赖）
        └── 向用户展示进度看板
Step D6: 收集所有 develop-result.yaml
Step D7: 运行 validate-result.cjs 验证产出
        ├── node scripts/validate-result.cjs --task {taskId}
        └── 如有失败项 → 标记需 Fix 阶段处理
Step D8: 执行 Step 6 并行开发集成验证检查点（如多个 subagent）
Step D9: 向用户汇报开发结果，输出确认清单
        └── 暂停等待用户确认
```

### 执行步骤

**Step 1: 读取任务拆分文档、设计契约和项目记忆**
- 读取 `.dev-flow/deliverables/{需求简称}/04-task-breakdown.md`（如有）
- ⭐ **读取 `.dev-flow/contracts/{需求简称}/design-contract.yaml` - Design → Develop 标准数据交换格式**
  - 必须理解：API 接口定义、DTO 字段规范、方法命名约定、输入输出类型
  - 禁止忽略或覆盖此契约中的任何定义
- 读取 `.dev-flow/memory/conventions.md` - 遵守编码规范
- 读取 `.dev-flow/memory/patterns.md` - 复用已有代码模式
- 读取 `.dev-flow/memory/mistakes.md` - 避免历史错误
- **如果是 Java 微服务（多服务模式），额外读取：**
  - `.dev-flow/memory/service-registry.md` - 了解各服务的模块结构
  - `.dev-flow/memory/dependency-graph.md` - 了解服务间依赖顺序
  - `.dev-flow/memory/common-modules.md` - 了解可复用的公共类

---

**Step 1.1: 读取上下文注入文件（🔴 如果存在则优先使用）**

> **目的**：如果 Orchestrator 已通过 `prepare-context.cjs` 预准备了上下文注入文件，
> subagent 应优先读取该文件获取所有必要上下文，而不是自行逐个读取文件。
> 这确保 subagent 拥有完整、准确的上下文，不遗漏任何关键信息。

**检查流程**：

```
Step 1.1.1: 检查上下文注入文件是否存在
  ├── 文件路径: .dev-flow/runtime/task-brief-{当前taskId}.md
  ├── 存在 → 读取该文件，获取完整上下文
  │     └── 文件已包含：任务描述、子任务设计、Design Contract、依赖类定义、编码规范、错误模式
  │     └── 直接进入 Step 2（代码生成），依赖读取验证已由 prepare-context.cjs 完成
  │
  └── 不存在 → 继续执行 develop-expert.md 的 Step 2.5（手动读取依赖验证）
      └── 这通常意味着 Orchestrator 未使用 prepare-context.cjs，或当前是标准模式（非 Subagent 模式）
```

---

### 代码开发步骤（由 develop-expert subagent 执行）

> **⚠️ 以下所有步骤由 develop-expert subagent 执行，主 Agent 仅负责调度。**
> **完整执行规范见 `agents/develop-expert.md`。**

| 步骤 | 内容 | 关键规则 |
|------|------|---------|
| Step 2 | 按依赖顺序开发（Enum→Entity→DTO→Mapper→Service→Controller） | 禁止逆序 |
| Step 2.5 | 强制读取验证（依赖类定义、Import 路径、方法签名、类型匹配） | 禁止猜测 |
| Step 3 | 代码生成（编码规范、逻辑步骤标注） | 每个方法体必须 100% 完整 |
| Step 3.5 | 完整性防线（检测 TODO/空实现/日志占位） | 写入后立即执行 |
| Step 4 | 代码自检（Import/方法/类型/字段） | 编译前必须全部通过 |
| 业务代码优先 | P0 业务代码必须先于 P1 测试代码全部完成 | 禁止逆序生成 |

---

### 🔴 Step 4: 实际编译验证（🔴 必须执行，不可跳过）

> **自检通过后，必须执行实际编译验证。** AI 自检可能遗漏泛型类型、隐式转换、注解缺失等问题。编译验证是确保代码可运行的最后一道防线。

**Java 项目**：
```bash
# 单服务
mvn compile -pl {module-name} -am -q

# 多服务（仅编译当前服务）
mvn compile -pl {service-module} -am -q

# 编译失败自动修复循环（最多 3 次）
# 循环: 读取错误 → 修复代码 → 重新编译 → 验证通过
```

**前端项目**：
```bash
npm run build 2>&1 | head -50
# 或
npx tsc --noEmit
```

**编译结果处理**：
| 结果 | 操作 |
|------|------|
| ✅ 通过 | 继续 |
| ❌ 失败 | 编译修复循环（读取错误→定位→修复→重编译），最多 3 轮，超过→暂停报告用户 |
| ⚠️ 警告 | 评估是否修复（类型安全警告建议修复） |

---

### 🔴 Step 4.2: 前置单元测试验证（🔴 编译通过后必须执行）

> **目的**：compile pass ≠ 逻辑正确。编译通过只证明语法正确，不证明业务逻辑正确。
> 在每个 develop-expert 完成代码后、声明完成之前，立即运行针对该代码的基础单元测试，
> 形成开发-验证闭环，将逻辑错误拦截在 Develop 阶段而非等到 Test 阶段才发现。

> **🔴🔴 前置条件（违反则禁止执行本步骤）**：
> 1. Step 2 所有业务代码文件（Enum/Entity/DTO/Mapper/Service/Controller）已全部生成
> 2. Step 4 实际编译验证已通过（`mvn compile` 或等效命令）
> 3. `develop-result.yaml` 中不存在 `compilation_status: failed`
>
> **⚠️ 如果上述任何一条未满足，禁止生成任何测试代码。**
> 不得以"先搭建测试框架""先准备 TestBase"为由提前生成测试类。
> 测试代码的生成是 Step 4.2 的专属职责，不允许提前到 Step 2/3/4 阶段执行。

**触发条件**：Step 4 编译通过后

**执行流程**：

```
Step 4.2.1: 为每个 Service 方法生成基础单元测试（*QuickTest.java，放 src/test/java/.../quicktest/）
  ├── 正向测试：合法输入 → 期望输出
  ├── 参数校验测试：非法输入 → 期望抛异常
  └── 空值/边界测试：null/空集合 → 期望优雅处理

Step 4.2.2: 运行前置测试（超时 30 秒）
  ├── Java：mvn test -Dtest={ClassName}QuickTest -pl {module} -q
  └── 前端：npx jest --testPathPattern="quicktest" --passWithNoTests

Step 4.2.3: 分析结果
  ├── 全部通过 → 继续
  ├── 部分失败 → 修复（优先修业务代码而非测试），最多 2 轮
  │   └── 2 轮仍失败 → 标记"需 Test 阶段深入验证"
  └── 测试框架未配置 → 跳过，记录到 develop-result.yaml
```

**前置测试要求**：

| 要求 | 说明 |
|------|------|
| 测试必须可运行 | 不能只生成测试代码而不执行 |
| 修复目标为业务代码 | 测试失败时，优先修复业务代码而非修改测试 |
| 超时保护 | 30 秒超时防止卡住 |
| 轻量化 | 只测本次开发的代码，不运行全量测试 |
| 不阻塞整体流程 | 2 轮修复仍失败 → 标记并继续，由 Test 阶段深入处理 |

**前置测试与 Test 阶段的关系**：
> 前置测试（QuickTest）是"快速筛查"：范围仅本次开发代码，深度正向+边界。
> 正式 Test 阶段做全面验证：全部代码+回归测试，深度包含并发/性能/集成。
> **前置测试不能替代正式 Test 阶段。**

### 🔴 Step 4.3: 设计逻辑回溯验证（🔴 编译通过+前置测试通过后必须执行）

> **目的**：compile pass + Quick Test pass ≠ 业务逻辑 100% 正确。本步骤逐条对比
> design-contract.yaml 中的每个 logic step / condition / action 与实际代码实现，
> 确保设计意图被完整翻译为代码，无遗漏、无偷换。

**触发条件**：Step 4 编译通过 且 Step 4.2 前置测试通过（或标记跳过）

**执行流程**：

```
Step 4.3.1: 提取设计契约中的所有逻辑单元
  ├── 读取 .dev-flow/contracts/{需求简称}/design-contract.yaml
  ├── 提取每个 Service 方法的 logic_steps 列表（step 编号 + action 类型）
  ├── 提取每个 logic step 的 conditions（条件分支定义）
  ├── 提取每个 call action 的 target + method + params
  └── 输出：design_logic_inventory.yaml

Step 4.3.2: 在生成的代码中逐条定位实现
  ├── 对每个 logic step：Grep "// Step {N}:" 或对应业务逻辑段落，验证 action 类型匹配
  │   └── 记录：logic step → 代码行号范围 → 实现状态
  ├── 对每个 condition：搜索对应 if/else 分支，验证 condition 和 onSuccess/onFail 都有实现
  │   └── 记录：condition → 代码行号 → 实现状态
  └── 对每个 call action：验证 target.method 存在（非 log.info 替代），参数与设计一致
      └── 记录：call action → 代码行号 → 匹配状态

Step 4.3.3: 计算覆盖率（三项覆盖率均须 = 100%）
  ├── logic_step_coverage = 已实现 step / 设计 step 总数
  ├── condition_coverage = 已实现 condition / 设计 condition 总数
  └── call_action_coverage = 已实现 call / 设计 call 总数

Step 4.3.4: 处理未覆盖项
  ├── 覆盖率 = 100% → 验证通过，继续
  ├── 覆盖率 < 100% → 列出所有未覆盖项，逐项修复
  │   ├── 读取未覆盖 logic step 的设计定义
  │   ├── 在代码中补充实现
  │   ├── 重新编译验证（Step 4）
  │   └── 重新计算覆盖率
  └── 最多 2 轮修复，超过则暂停报告用户
```

**覆盖率阈值**：logic_step_coverage / condition_coverage / call_action_coverage 均必须 = 100%。

**处理未覆盖项**：覆盖率 < 100% → 列出未覆盖项，逐项修复 → 重新编译验证 → 重新计算覆盖率。最多 2 轮修复，超过则暂停报告用户。

**输出文件**：`.dev-flow/runtime/logic-coverage-matrix.yaml`

**与 step-enforcer R3-4-1/R3-4-2 的集成**：

> Step 4.3 的逻辑覆盖率验证与 step-enforcer.md 中的 R3-4-1（逻辑步骤覆盖率验证）
> 和 R3-4-2（条件分支覆盖率验证）形成双重保障：
> - **Step 4.3** 由 develop-expert 自执行，在开发阶段就完成逻辑回溯
> - **R3-4-1/R3-4-2** 由 step-enforcer 独立执行，作为外部验证
> 两者独立运行，结果交叉比对，确保无遗漏。

### 🔴 失败恢复策略

1. **保存当前进度**：将已完成的文件写入磁盘
2. **记录失败信息**：`develop-result.yaml` 中标记 `compilation_status: failed`
3. **通知 Orchestrator**：通过 `task-result.yaml` 报告失败原因
4. **不要静默跳过**：禁止跳过编译错误继续开发

---

**Step 4.5: 上下文监控与保护（关键！）**

> **每批次文件生成后执行**：检查当前上下文使用情况，防止溢出导致后续代码生成失败。
> 注意：如果使用了 prepare-context.cjs 注入模式，大部分上下文已在 task-brief.md 中预加载，
> 此步骤主要用于监控代码生成过程中的增量上下文消耗。

**监控阈值**（基于模型实际上下文窗口，非固定 50KB）：

| 上下文使用率 | 级别 | 操作 |
|-------------|------|------|
| < 70% | 安全 | 继续正常开发 |
| 70% - 85% | 警告 | 保存进度到 checkpoint 文件 |
| 85% - 95% | 临界 | 强制保存，清理上下文，建议分段执行 |
| > 95% | 溢出 | 立即停止，保存进度，建议启用 Subagent 模式 |

**清理后的上下文保留**：
- ✅ 保留：已生成文件的列表和路径
- ✅ 保留：项目记忆的关键摘要（编码规范、常用模式）
- ✅ 保留：当前需求的精简描述
- ❌ 清除：已生成文件的完整代码内容（已保存到文件系统）
- ❌ 清除：中间分析过程的详细内容

---

### 代码质量要求

> **完整禁止事项和完整性铁律见 `agents/develop-expert.md`。**
> develop-expert 必须确保：无 TODO/FIXME、无空壳占位、无 return null 空实现、每个方法体至少 3 行实质代码。

---

**Step 5: 开发中汇报机制（并行模式必须）**

> **目的**：让主 Agent 实时了解各 subagent 的开发进度，及时处理阻塞问题。

**汇报时机**：
- **任务开始时**：向主 Agent 报告"开始执行 Task-X"
- **任务完成时**：向主 Agent 报告"Task-X 完成"，并提交成果
- **遇到阻塞时**：向主 Agent 报告"Task-X 阻塞"，说明原因，请求协助
- **批次完成时**：主 Agent 汇总该批次所有任务状态，决定是否进入下一批次

**汇报格式**：
```
【进度汇报】
- Subagent ID: @develop-expert-1
- 当前任务: Task-5 (新增 XxxMapper)
- 状态: 进行中 / 已完成 / 阻塞
- 完成文件: entity/XxxEntity.java, enums/XxxEnum.java
- 阻塞原因: （如有）需要 basedata-api 的 ProductDTO，但未找到
- 预计完成时间: 5 分钟后
```

**主 Agent 职责**：接收汇报 → 汇总进度看板 → 处理阻塞问题 → 决定是否进入下一批次 → 向用户展示整体进度

**进度看板示例**：
```
| 批次 | 任务 | Subagent | 状态 |
| 1 | Task-1 Entity | @dev-1 | ✅ 完成 |
| 2 | Task-5 Mapper | @dev-1 | 🔄 进行中 |
```

### 🔴 结构化进度汇报格式（替代自然语言汇报）

> **每个 develop-expert subagent 必须按以下格式写入结构化进度文件**，使主 Agent 可程序化解析和展示。

**进度文件路径**：`.dev-flow/runtime/task-progress-{taskId}.yaml`

```yaml
# .dev-flow/runtime/task-progress-{taskId}.yaml
task_id: "Task-5"
task_name: "用户管理模块 - Entity + DTO"
status: "in_progress"  # pending | in_progress | completed | blocked | failed
progress: 60           # 百分比 0-100
started_at: "2026-06-06T08:00:00"
updated_at: "2026-06-06T08:15:00"
completed_files:
  - path: "entity/User.java"
    lines: 85
    checksum: "a1b2c3d4e5f6g7h8"
  - path: "dto/UserRequestDTO.java"
    lines: 35
    checksum: "i9j0k1l2m3n4o5p6"
remaining_files:
  - path: "dto/UserResponseDTO.java"
    estimated_lines: 25
  - path: "mapper/UserMapper.java"
    estimated_lines: 45
blocker: null         # null 或阻塞原因描述
compilation_status: null  # null | success | failed
error_count: 0
```

**主 Agent 解析规则**：
- 读取 `.dev-flow/runtime/task-progress-*.yaml` 文件
- 汇总所有任务的 status/progress 生成看板
- 发现 `status: blocked` 或 `status: failed` → 触发 Subagent 失败硬阻断协议
- 发现 `compilation_status: failed` → 触发失败恢复流程

**主 Agent 汇总看板格式**（展示给用户）：

```
📊 开发进度看板
═════════════════════════════════════════
Task-3: Entity + Enum       ████████████████░░░  80%  ✅ 编译通过
Task-5: DTO + Mapper         ██████████░░░░░░░░  50%  ⏳ 开发中
Task-7: Service 实现          ████░░░░░░░░░░░░░  20%  ⏳ 开发中
Task-9: Controller + Feign    ░░░░░░░░░░░░░░░░░   0%  ⏳ 等待中
═════════════════════════════════════════
总计: 4 个任务, 1 个完成, 2 个进行中, 1 个等待中
```

**🔴🔴 Step 5.5: 生成阶段交付物（v3.1 新增，🔴 所有 Develop 任务完成后必须执行）**

> **目的**：生成独立的阶段交付物文档，供主 Agent 打开给用户审阅。

**执行时机**：所有 develop-expert subagent 完成、Step 6 集成验证通过后

**交付物路径**：`.dev-flow/deliverables/{需求简称}/05-develop-result.md`

**交付物必须包含**：开发概述、文件变更清单、编译验证结果、前置测试结果、设计逻辑覆盖率（步骤/条件/调用均需 100%）、集成验证结果、实现说明。
**自检**：交付物文件已生成且非空，包含 `@generated-by: develop-expert subagent(s)` 溯源注释。

**暂停，等待用户确认后再进入 Test 阶段。**

---

**🔴 Step 6: 并行开发集成验证检查点（Subagent 模式必须执行）**

> **目的**：当多个 subagent 并行开发完成后，在进入 Test 阶段前，执行全局集成验证，确保各 subagent 的产出能够正确协同工作。

**触发条件**：使用了多个 subagent 并行执行 Develop 任务

**验证流程**：

| Step | 验证项 | 说明 |
|------|--------|------|
| 6.1 | 收集 task-result.yaml | 检查每个 subagent 的 status，partial/failed → 标记需 Fix |
| 6.2 | 全局编译 | Java: `mvn compile -q`，前端: `npm run build`；失败 → 修复循环（最多 3 次） |
| 6.3 | 接口一致性 | 对比 design-contract.yaml 与实际产出：Controller 路径、Service 签名、DTO 字段、Feign Client |
| 6.4 | 依赖传递 | 遍历 task-result.yaml 的 dependencies_provided，验证前置任务产出已就绪 |
| 6.4.5 | interface-registry | 读取 interface-registry.yaml，Grep 验证每个声明接口在代码中真实存在 |
| 6.5 | 输出报告 | 写入 `.dev-flow/contracts/{需求简称}/develop集成验证.yaml` |

**如果验证全部通过**：进入 Test 阶段
**如果存在失败项**：进入 Fix 阶段修复后重新验证（最多 3 次，超过则暂停报告用户）

### ✅ 阶段确认清单

| # | 确认项 | 状态 |
|---|--------|------|
| 0 | **执行者审计**：Develop 阶段由 develop-expert subagent 执行，主 Agent 未直接编辑任何代码文件 | ⬜ 待确认 |
| 1 | 所有设计文档中的文件都已生成 | ⬜ 待确认 |
| 2 | 所有文件编译通过（Step 4 实际编译验证） | ⬜ 待确认 |
| 3 | 前置单元测试通过或已标记需深入验证（Step 4.2） | ⬜ 待确认 |
| 4 | **设计逻辑 100% 覆盖（Step 4.3 逻辑回溯验证）** | ⬜ 待确认 |
| 5 | 无 TODO/FIXME/空方法体残留 | ⬜ 待确认 |
| 6 | Import 路径、方法签名、类型全部验证通过 | ⬜ 待确认 |
| 7 | 跨服务 Feign Client 与目标 Controller 端点一致 | ⬜ 待确认 |
| 8 | 开发报告已输出 | ⬜ 待确认 |

**暂停，等待用户确认。**
**用户确认后，系统自动写入 `develop.confirmed` 确认文件。**

> **阶段确认机制和交付物协议详见 `references/protocol.md`。**
