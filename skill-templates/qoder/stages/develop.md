---
stage: Develop
type: stage-instruction
---

## 阶段五：Develop（开发执行）

### 🔴🔴 主 Agent 零编辑约束（本阶段入口铁律）

> **⚠️ 最高优先级**：主 Agent 在 Develop 阶段的唯一角色是**调度器**。
> **主 Agent 绝对禁止直接使用 Edit/Write 工具修改任何代码文件。**
> **所有代码编辑必须由 develop-expert subagent 执行。**

**主 Agent 在本阶段的合法操作**：

| 操作 | 是否允许 | 说明 |
|------|---------|------|
| 读取阶段指令文件 | ✅ | Read develop.md 获取执行规范 |
| 读取任务 DAG 和结果 | ✅ | Read task-dag.yaml、develop-result.yaml |
| 读取确认文件 | ✅ | Read *.confirmed |
| 执行编译命令 | ✅ | Bash `mvn compile`（Step 6 集成验证时） |
| 创建 develop-expert subagent | ✅ | 派发开发任务 |
| 收集/汇总 subagent 结果 | ✅ | 读取 develop-result.yaml 并向用户汇报 |
| **直接 Edit/Write 代码文件** | 🔴 **绝对禁止** | 违反零编辑铁律 |

**如果主 Agent 发现自己正在输出代码编辑内容**：
1. 立即停止
2. 改为创建 develop-expert subagent 执行该任务
3. 将已输出的编辑内容作为 subagent 的初始上下文传递

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
2. 统计预估文件数：
   - Entity: 通常 1 个/业务对象
   - DTO: 通常 2 个/业务对象（Request + Response）
   - Enum: 通常 1 个/业务对象（如有状态）
   - Mapper: 通常 1 个/业务对象
   - Service: 通常 1 个接口 + 1 个实现/业务对象
   - Controller: 通常 1 个/业务对象
   - Config: 按需
   - Feign Client: 按需

3. 判断：
   ├── 预估文件数 ≤ 5
   │     └── ✅ 可以继续（标准模式）
   │
   ├── 预估文件数 > 5 且 ≤ 10
   │     └── ⚠️ 警告："需求涉及 X 个文件，建议使用 /dev-flow -subagent 模式"
   │     └── 询问用户是否继续
   │
   └── 预估文件数 > 10
         └── 🚨 强制阻止："需求涉及 X 个文件，超出标准模式处理能力"
         └── 提示："请使用 /dev-flow -subagent <需求> 执行"
         └── 标准模式拒绝执行
```

**示例**：
```
用户输入: /dev-flow -develop 实现用户管理模块（含用户增删改查、角色分配）

系统检测:
- Entity: User.java (1)
- DTO: UserRequestDTO.java, UserResponseDTO.java (2)
- Enum: UserStatus.java (1)
- Mapper: UserMapper.java (1)
- Service: UserService.java + UserServiceImpl.java (2)
- Controller: UserController.java (1)
- 总计: 8 个文件

系统响应:
⚠️ 检测到需求涉及 8 个文件，超过标准模式建议阈值（5 个文件）。
使用标准模式可能导致：
- 代码生成不完整（出现 TODO 占位符）
- 上下文溢出导致逻辑错误

建议使用 Subagent 模式：
/dev-flow -subagent 实现用户管理模块（含用户增删改查、角色分配）

[切换到 Subagent 模式] [仍使用标准模式（不推荐）] [取消]
```

### Step 0.5: 代码生成规划与分段决策（v3.0 结构化分段协议）

> **目的**：在开始编码前，预估目标代码量，决定是否启用"骨架 + 逐方法填充"分段模式。
> **触发条件**：Subagent 模式下，或预估单个文件输出 > 20KB 时。

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

**分段模式的核心规则**：

```yaml
segmented_execution_rules:
  rule_1_skeleton_first: "必须先生成完整骨架，不能直接生成某个方法"
  rule_2_one_method_per_call: "每次调用只实现一个方法体，不重新生成其他代码"
  rule_3_edit_not_write: "使用 Edit 工具替换 TODO 行，不使用 Write 覆盖整个文件"
  rule_4_read_before_fill: "每次填充前必须 Read 当前文件获取最新状态"
  rule_5_verify_after_all: "所有方法填充完成后，执行完整验证（Step 5 自检）"
  rule_6_context_budget: "每次填充调用：system(~15KB) + method_spec(~20KB) + file(~10-45KB) = 45-80KB"
```

**与 prepare-context.cjs 的协作**：

```
标准模式:  prepare-context.cjs 生成 task-brief → subagent 一次性生成代码
分段模式:  prepare-context.cjs 生成 task-brief → subagent 执行 Phase 1 骨架
           → segment-code.cjs --fill 为每个方法提取最小化规格
           → subagent 逐方法填充
```

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
Step D1: 读取阶段指令 → Read {{STAGES_PATH}}develop.md（本文件）
Step D2: 读取任务拆分文档和 DAG
        ├── 读取 .dev-flow/docs/{需求简称}-任务拆分.md
        └── 读取 .dev-flow/docs/{需求简称}-task-dag.yaml
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
- 读取 `.dev-flow/docs/{需求简称}-任务拆分.md`（如有）
- ⭐ **读取 `.dev-flow/docs/{需求简称}-design-contract.yaml` - Design → Develop 标准数据交换格式**
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
  │     └── 直接进入 Step 2（代码生成），Step 1.5 的依赖读取已由 prepare-context.cjs 完成
  │
  └── 不存在 → 继续执行 Step 1.5（手动读取依赖）
      └── 这通常意味着 Orchestrator 未使用 prepare-context.cjs，或当前是标准模式（非 Subagent 模式）
```

**如果上下文注入文件存在**：
- 文件中已包含所有依赖类的实际定义 → 无需再次执行 Step 1.5 的依赖扫描
- 文件中已包含 Design Contract → 无需再次搜索 design-contract.yaml
- 文件中已包含编码规范和错误模式 → 无需再次读取 conventions.md / mistakes.md
- **但仍需执行 Step 1.6 Import 路径验证、Step 1.7 方法签名验证、Step 1.8 类型匹配**
  - 注入文件中的信息来自设计时，Import 路径和方法签名需要在实际代码中验证

**如果上下文注入文件不存在**：
- 按原有流程继续：Step 1.5 → Step 1.6 → Step 1.7 → Step 1.8

---

**Step 1.5: 🔴 强制读取依赖定义（必须执行，禁止跳过）**

> **⚠️ 铁律**：在生成任何代码之前，必须先读取所有依赖类的**实际定义**。
> **禁止行为**：根据命名习惯猜测方法名、类型、import 路径。

**为什么必须执行此步骤？**

| 错误模式 | 后果 | 示例 |
|---------|------|------|
| 猜测方法名 | 编译错误：方法不存在 | `getStatus()` → 实际是 `getInspectionBatchStatus()` |
| 猜测类型 | 编译错误：类型不兼容 | `Integer` → 实际是 `byte` |
| 猜测 import 路径 | 编译错误：找不到类 | `service.rework.Xxx` → 实际在 `service.Xxx` |
| 猜测参数 | 编译错误：参数不匹配 | 缺少第4个参数 |

**必须读取的类清单**：

| 类类型 | 读取方法 | 验证内容 |
|--------|---------|---------|
| Entity | `Read {EntityPath}.java` | 字段名、字段类型、getter/setter 方法名 |
| DTO | `Read {DTOPath}.java` | 字段名、校验注解、嵌套 DTO |
| Enum | `Read {EnumPath}.java` | 枚举值名称、枚举方法 |
| Service | `Read {ServicePath}.java` | 方法签名、参数类型、返回类型 |
| Mapper | `Read {MapperPath}.java` | 方法签名、SQL 注解 |
| Feign Client | `Read {FeignPath}.java` | 接口方法、路径、参数 |
| Util | `Read {UtilPath}.java` | 方法签名、参数类型 |

**读取后必须输出确认表**：

```markdown
### 依赖类确认表

| 类名 | 读取状态 | 关键发现 | 是否确认 |
|------|---------|---------|---------|
| QmsInspectionBatch | ✅ 已读取 | status 字段类型为 byte，方法名为 getInspectionBatchStatus() | ✅ 确认 |
| QmsReworkSopRegisterBaseService | ✅ 已读取 | 包路径为 com.transsion.qms.quality.core.service（非 rework 子包） | ✅ 确认 |
| QmsBusinessException | ✅ 已读取 | 包路径为 com.transsion.qms.common.i18n（非 exception 包） | ✅ 确认 |
| XxxDTO | ⏳ 待读取 | - | - |
```

**如果类在项目记忆中标记为"未采样（按需加载）"**：
1. 触发 On-Demand Loader 加载该类
2. 等待加载完成后再继续

**如果无法找到类**：
1. 使用 `Grep "class Xxx"` 搜索类定义
2. 如果仍找不到，标记为"类不存在，可能需要创建"
3. **不要猜测路径**

**禁止的猜测行为**：
```
❌ 错误：根据命名习惯，假设有 getStatus() 方法
❌ 错误：通常在 rework 包下，所以 import service.rework.Xxx
❌ 错误：status 字段通常是 Integer 类型
❌ 错误：根据方法名猜测参数

✅ 正确：Read Entity 定义 → 确认实际方法名为 getInspectionBatchStatus()
✅ 正确：Grep 搜索类位置 → 确认实际包路径
✅ 正确：Read Entity 定义 → 确认字段类型为 byte
✅ 正确：Read Service 定义 → 确认方法签名和参数
```

---

**Step 1.6: Import 路径验证（🔴 必须执行）**

> **目的**：确保每个 import 语句都指向实际存在的类，避免编译错误。

**验证流程**：

```
对于每个需要 import 的类：

1. 搜索确认位置
   Grep "class QmsBusinessException" --glob="**/*.java"
   
2. 如果找到多个，读取每个文件确认哪个是正确的
   Read path/to/QmsBusinessException.java（前 30 行）
   
3. 记录实际路径
   | 类名 | 猜测路径 | 实际路径 | 状态 |
   |------|---------|---------|------|
   | QmsBusinessException | common.exception | common.i18n | ✅ 已修正 |
   | QmsReworkSopRegisterBaseService | service.rework | service | ✅ 已修正 |
```

**常见错误模式**：

| 错误猜测 | 实际路径 | 原因 |
|---------|---------|------|
| `service.rework.XxxService` | `service.XxxService` | 假设 rework 是子包 |
| `common.exception.QmsBusinessException` | `common.i18n.QmsBusinessException` | 根据类名猜测包名 |
| `entity.Xxx` | `domain.Xxx` | 项目使用 domain 而非 entity |

**验证输出**：

```markdown
### Import 路径验证结果

| 类名 | import 语句 | 验证方法 | 状态 |
|------|------------|---------|------|
| QmsBusinessException | import com.transsion.qms.common.i18n.QmsBusinessException; | Grep 搜索确认 | ✅ 正确 |
| QmsReworkSopRegisterBaseService | import com.transsion.qms.quality.core.service.QmsReworkSopRegisterBaseService; | Grep 搜索确认 | ✅ 正确 |
| XxxDTO | import com.xxx.XxxDTO; | Grep 未找到 | ⚠️ 需要创建 |
```

---

**Step 1.7: 方法签名验证（🔴 必须执行）**

> **目的**：确保每个方法调用的方法名、参数个数、参数类型都与实际定义一致。

**验证流程**：

```
对于每个方法调用：

1. 读取目标类定义
   Read: src/main/java/.../entity/QmsInspectionBatch.java
   
2. 提取实际方法列表
   实际方法：
   - getInspectionBatchId(): Long
   - getInspectionBatchStatus(): byte
   - getBatchNo(): String
   
3. 匹配调用
   需要调用：getStatus()
   实际存在：getInspectionBatchStatus()
   生成代码：getInspectionBatchStatus() ✅
   
4. 如果不存在
   标记为"方法不存在，需要确认"
   不要生成调用
```

**常见错误模式**：

| 错误调用 | 实际方法 | 原因 |
|---------|---------|------|
| `batch.getStatus()` | `batch.getInspectionBatchStatus()` | 根据字段名猜测方法名 |
| `service.save(dto)` | `service.save(dto, userId)` | 未读取方法签名，缺少参数 |
| `list.get(0).getId()` | `list.get(0).getXxxId()` | 假设 getId() 通用 |

**验证输出**：

```markdown
### 方法签名验证结果

| 调用位置 | 调用代码 | 目标类 | 实际方法 | 状态 |
|---------|---------|--------|---------|------|
| ServiceImpl:45 | batch.getStatus() | QmsInspectionBatch | ❌ 不存在 | 需改为 getInspectionBatchStatus() |
| ServiceImpl:50 | service.save(dto) | XxxService | save(dto, userId) | ⚠️ 缺少参数 |
| ServiceImpl:55 | entity.getId() | XxxEntity | getXxxId() | ❌ 不存在 |
```

---

**Step 1.8: 类型强制匹配（🔴 必须执行）**

> **目的**：确保每个字段赋值都类型兼容，避免隐式类型转换导致的编译错误。

**验证流程**：

```
对于每个字段赋值：

1. 读取字段实际类型
   Read Entity 定义：
   - status: byte (不是 Integer!)
   - count: Integer
   - name: String
   
2. 类型转换检查
   赋值：status = 1
   实际类型：byte
   生成：status = (byte) 1 或 status = Byte.valueOf("1")
   
3. 如果类型不匹配，必须显式转换
```

**常见错误模式**：

| 错误赋值 | 实际类型 | 正确写法 |
|---------|---------|---------|
| `status = 1` | `byte` | `status = (byte) 1` |
| `type = "A"` | `Integer` | `type = 1` 或 `Integer.parseInt("1")` |
| `flag = true` | `Integer` | `flag = 1` |
| `count = null` | `int` | `count = 0` 或改为 `Integer` |

**类型转换规则**：

| 源类型 | 目标类型 | 转换方式 |
|--------|---------|---------|
| `int` | `byte` | `(byte) value` |
| `Integer` | `byte` | `value.byteValue()` |
| `String` | `Integer` | `Integer.valueOf(value)` |
| `String` | `Long` | `Long.valueOf(value)` |
| `int` | `String` | `String.valueOf(value)` |

**验证输出**：

```markdown
### 类型匹配验证结果

| 赋值位置 | 赋值代码 | 字段名 | 实际类型 | 状态 |
|---------|---------|--------|---------|------|
| ServiceImpl:30 | status = 1 | status | byte | ⚠️ 需要显式转换 |
| ServiceImpl:35 | count = 0 | count | Integer | ✅ 自动装箱 |
| ServiceImpl:40 | name = "test" | name | String | ✅ 类型匹配 |
```

---

### 🔴🔴 业务代码优先铁律（最高优先级，不可违反）

> **核心原则**：Develop 阶段的首要目标是生成**业务代码**（Entity/DTO/Mapper/Service/Controller 等），
> 测试代码仅在业务代码完成后作为验证手段生成。
> **严禁在任何业务代码文件完成前生成或修改测试类。**

**规则定义**：

| 优先级 | 代码类型 | 执行时机 | 说明 |
|--------|---------|---------|------|
| P0（最高） | 业务代码（Enum/Entity/DTO/Mapper/Service/Controller） | Step 2 → Step 4 | 必须先全部完成 |
| P1（次高） | 测试代码（QuickTest 等） | Step 4.2 | 仅在 P0 全部编译通过后才执行 |

**强制规则**：

1. **禁止逆序生成**：不得在 Service/Controller 等业务代码未完成前，生成任何 `*Test.java`、`*TestBase.java`、`*QuickTest.java` 文件
2. **禁止修复测试优先于业务**：即使上下文中出现"测试失败""Re-run test"等信息，也必须先完成业务代码开发，测试修复在 Test 阶段处理
3. **例外情况**：仅当 `task-context.yaml` 中 `task_type` 明确标记为 `test-fix` 或 `test-only` 时，允许跳过业务代码直接处理测试
4. **违反检测**：Step 4.2 的触发条件已包含"编译通过后"——如果尚未执行 Step 4 编译验证，说明业务代码未完成，此时禁止生成任何测试

**AI 行为纠正**：

```
❌ 错误行为（必须避免）：
  - 收到任务后第一个动作是读取/生成 TestBase.java
  - 看到上下文中有"Re-run test"就开始修复测试
  - 生成测试基类/测试工具类作为"准备工作"
  - TDD 模式先写测试再写实现

✅ 正确行为（必须遵循）：
  - 收到任务后按 Step 2 顺序依次生成业务代码
  - 即使上下文中有测试失败信息，也先完成业务代码
  - 测试代码仅在 Step 4.2 中作为验证手段生成
  - 测试修复在 Test 阶段（Step 5）专门处理
```

---

**Step 2: 按依赖顺序开发（按项目类型）**

**如果是 Java 微服务（多服务模式），按以下顺序开发：**

1. **公共模块变更**（如有）- 优先开发公共模块，因为其他服务依赖它
   - 公共 Entity / DTO / Enum / Util
   - 明确标注：`[公共模块 common-xxx]`
2. **Feign Client 接口**（如有新增跨服务调用）
   - 在调用方服务的 client 模块中定义 Feign Client 接口
   - 明确标注：`[服务A - client 模块]`
3. **按服务依赖顺序，逐服务开发**（根据 dependency-graph.md 确定顺序）：
   - 先开发被依赖的服务（被调用的服务），再开发调用方服务
   - 每个服务内部按以下层级顺序开发：
     1. **Enum** - 状态枚举、类型枚举（被其他层依赖）
     2. **Entity** - 实体类（被 Mapper 和 DTO 依赖）
     3. **DTO** - 请求/响应 DTO（被 Controller 和 Service 依赖）
     4. **Mapper** - 数据访问层（被 Service 依赖）
     5. **Service Interface** - 服务接口定义
     6. **Service Implementation** - 服务实现（依赖 Mapper，可能依赖 Feign Client）
     7. **Controller** - 控制器层（依赖 Service）
     8. **Exception** - 自定义异常（如需新增）
     9. **Config** - 配置类（如需新增）
   - **每个文件明确标注所属服务和模块**：`[服务名 - 模块名] 文件路径`

**如果是 Java 单服务项目，按以下顺序开发：**
1. **Enum** - 状态枚举、类型枚举（被其他层依赖）
2. **Entity** - 实体类（被 Mapper 和 DTO 依赖）
3. **DTO** - 请求/响应 DTO（被 Controller 和 Service 依赖）
4. **Mapper** - 数据访问层（被 Service 依赖）
5. **Service Interface** - 服务接口定义
6. **Service Implementation** - 服务实现（依赖 Mapper）
7. **Controller** - 控制器层（依赖 Service）
8. **Exception** - 自定义异常（如需新增）
9. **Config** - 配置类（如需新增）

**如果是前端项目，按以下顺序开发：**
1. 数据模型/类型定义
2. 工具函数
3. API 端点/服务层
4. 状态管理（Hooks/Store）
5. 展示组件
6. 容器组件/页面组件
7. 路由配置

**Step 3: 代码生成规范（Java 项目）**

**如果是 Java 微服务（多服务模式），额外遵循以下跨服务代码生成规范：**

**Feign Client 规范**：
- 接口使用 `@FeignClient(name = "目标服务名")` 注解
- 方法签名与目标服务 Controller 端点保持一致
- 放置在调用方服务的 client 模块中
- 返回值使用统一包装 `ApiResponse<T>` 或直接返回 DTO（根据项目约定）
- 建议配置 `fallbackFactory` 实现降级处理
- 方法参数使用 `@RequestParam`、`@PathVariable`、`@RequestBody`，与目标 Controller 一致

**公共模块引用规范**：
- 引用公共模块中的类时，使用公共模块的完整包名
- 不在服务模块中重复定义公共模块已有的类
- 如果公共模块的类不满足需求，优先扩展而非新建

**跨服务 DTO 转换规范**：
- 服务内部使用服务专属 DTO，跨服务传输使用公共 DTO 或 client 模块 DTO
- 使用 MapStruct 或手动转换进行 DTO 间转换
- 转换逻辑放在 Service 实现层，不暴露到 Controller

**单服务代码生成规范（所有 Java 项目通用）：**

**Entity 规范**：
- 使用 Lombok 注解（`@Data`、`@Builder`）
- MyBatis-Plus 注解（`@TableName`、`@TableId`、`@TableField`）
- 字段校验注解（`@NotNull`、`@Size`、`@Email`）
- 逻辑删除字段（`@TableLogic`）
- 自动填充（`@TableField(fill = ...)` + `MetaObjectHandler`）

**DTO 规范**：
- 使用 Lombok 注解
- 请求 DTO 必须包含校验注解
- 响应 DTO 考虑字段脱敏（手机号、邮箱等）
- 使用分组校验（`@Validated(CreateGroup.class)`）

**Mapper 规范**：
- 继承 `BaseMapper<Entity>`
- 复杂查询使用 `@Select` 注解或 XML
- XML 文件放在 `src/main/resources/mapper/`

**Service 规范**：
- 接口定义在 `service/` 包
- 实现类在 `service/impl/` 包，后缀 `Impl`
- 使用 `@Service` 注解
- 依赖注入使用构造器注入（推荐）或 `@Autowired`
- 事务注解 `@Transactional(rollbackFor = Exception.class)`
- 业务异常使用 `throw new BusinessException("错误消息")`

**Controller 规范**：
- 使用 `@RestController` 和 `@RequestMapping`
- 基础路径使用复数名词（`/api/orders`）
- 方法使用 `@GetMapping`、`@PostMapping` 等
- 请求体使用 `@RequestBody @Valid`
- 路径参数使用 `@PathVariable`
- 查询参数使用 `@RequestParam`
- 返回统一包装 `ApiResponse<T>`

**每个文件必须**：
- 完整可编译运行
- 包含类/方法 Javadoc 注释
- 遵守项目已有的编码风格
- 每个文件生成后，简要说明实现思路

**Step 3.1: 分段执行模式（仅当 Step 0.5 判定为分段模式时执行）**

> **前置条件**：Step 0.5 已判定预估输出 > 20KB，且 code-generation-plan.yaml 已生成。

**Phase 1: 骨架生成**

1. 生成目标文件的完整骨架：
   - 所有 import 语句
   - 类/接口声明和注解
   - 字段声明和注入
   - 所有方法签名（参数、返回类型、注解）
   - 每个方法体只包含：`// TODO: implement {methodName}`
2. Write 骨架到目标文件
3. 验证骨架编译通过（如有编译错误立即修复）

**Phase 2: 逐方法填充（按 code-generation-plan.yaml 中的 seg 顺序）**

对于每个 method_fill segment：

1. `Read` 当前目标文件（获取骨架 + 已填充的方法）
2. `Read` 方法规格（从 task-brief 或 segment-code.cjs --fill 输出）
3. 用 Edit 工具将 `// TODO: implement {method}` 替换为完整方法体
4. 方法体必须包含逻辑步骤标注（Step 3 的标注规范）
5. 方法体完成后，执行 Step 3.5 完整性防线（仅扫描当前方法）
6. 确认当前方法无 TODO/空实现/log-only 后，继续下一个方法

**Phase 3: 全量验证**

所有方法填充完成后：
1. `Read` 完整目标文件
2. 扫描确认：无任何 TODO/FIXME/空方法体/log-only 方法体
3. 执行编译验证
4. 执行 Step 4.3 逻辑回溯验证

---

#### 🔴🔴 每个方法的完整性要求（关键！）

> **核心原则**：你是在写**可直接部署的完整代码**，不是在写骨架或占位。

**每个方法体必须满足**：
1. **包含实质性的业务逻辑**（数据库操作/外部调用/业务计算/状态变更），而非仅有日志
2. **每个条件分支都有完整的处理代码**（if/else 的每个分支不能为空）
3. **每个 try-catch 的 catch 有实际错误处理**（不能只有 log.error）
4. **返回值经过实际计算/查询/转换**（不能直接 return null 或硬编码）

**🔴🔴 写入每个文件后立即执行完整性自检**：
```
1. 扫描 TODO/FIXME → 如果发现，立即补充完整实现
2. 扫描 return null → 如果发现，补充实际返回逻辑
3. 对每个 public/protected 方法检查方法体：
   - 如果方法体只有 log 调用 → 立即补充真实业务逻辑
   - 如果方法体为空或只有 throw → 立即补充完整实现
4. 对比设计文档 → 检查所有方法、条件分支、外部调用是否都已实现
```

**强制规则**：发现任何不完整代码 → 立即修复，不得延后。如果上下文不足导致无法写出完整代码 → 暂停并明确告知用户，而不是生成占位代码。

**Step 4: 自检（🔴 编译前必须执行）**

每个文件生成后，AI 自行检查以下项目：

**基础检查**：
- 是否有编译错误（Java 语法、类型匹配）
- 是否有未处理的边界情况（空指针、数组越界）
- 是否与已有代码风格一致（命名、注释、格式）
- 是否有安全漏洞（SQL 注入、XSS、敏感信息泄露）
- 是否正确使用事务（查询方法不加 `@Transactional`）
- 是否正确处理异常（自定义异常 vs 运行时异常）

**🔴 强制检查项（必须通过）**：

| 检查项 | 检查方法 | 通过标准 |
|--------|---------|---------|
| **Import 路径** | 每个 import 都通过 Grep 确认存在 | ✅ 全部路径可搜索到 |
| **方法调用** | 每个方法调用都对应 Step 1.5 读取到的实际方法 | ✅ 方法名、参数个数、参数类型完全匹配 |
| **类型兼容** | 每个字段赋值都类型兼容 | ✅ 无隐式类型转换，或显式声明转换 |
| **字段引用** | 每个字段引用都对应 Step 1.5 读取到的实际字段 | ✅ 字段名、字段类型完全匹配 |

**输出检查报告**：

```markdown
### 编译前自检报告

| 检查项 | 状态 | 详情 |
|--------|------|------|
| Import 路径 | ✅ 全部确认 | 共 12 个 import，全部通过 Grep 验证 |
| 方法调用 | ✅ 全部匹配 | 共 8 个方法调用，全部与 Step 1.5 读取结果一致 |
| 类型兼容 | ⚠️ 1 处警告 | `status = 1` → 实际类型为 byte，需要显式转换 |
| 字段引用 | ✅ 全部匹配 | 共 5 个字段引用，全部与 Entity 定义一致 |

**需要修复的问题**：
1. `status = 1` → 修改为 `status = (byte) 1` 或 `Byte.valueOf("1")`
```

**如果有任何检查项失败**：
1. **必须修复后才能继续**
2. 不要声称"开发完成"
3. 不要进入下一个文件的开发

**多服务模式额外检查**：
  - Feign Client 接口是否与目标服务 Controller 端点匹配（路径、参数、返回值）
  - 公共模块的类是否被正确引用（包名、类名）
  - 跨服务 DTO 转换是否完整（字段映射无遗漏）
  - 服务间依赖顺序是否正确（被依赖的服务先开发）
  - 是否有循环依赖（A 调 B，B 调 A）

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
| ✅ 编译通过 | 继续下一个文件 |
| ❌ 编译失败 | **进入编译修复循环（最多 3 轮）**：<br>1. 读取编译错误信息<br>2. 定位错误源文件和行号<br>3. 修复编译错误<br>4. 重新编译验证<br>5. 如果 3 轮后仍失败 → 暂停并报告用户 |
| ⚠️ 警告 | 评估是否需要修复（类型安全警告建议修复） |

**编译修复循环记录**（每次修复后追加）：
```yaml
# .dev-flow/runtime/compile-fix-log.yaml
fix_rounds:
  - round: 1
    file: "service/impl/XxxServiceImpl.java"
    error: "cannot find symbol: method getStatus()"
    fix: "改为 getInspectionBatchStatus()"
    result: "compile_pass"
```

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
Step 4.2.1: 生成针对本次开发代码的单元测试
  ├── 读取本次开发的 Service/Mapper/Controller
  ├── 为每个 Service 方法生成基础单元测试
  │   ├── 正向测试：合法输入 → 期望输出
  │   ├── 参数校验测试：非法输入 → 期望抛异常
  │   └── 空值/边界测试：null/空集合 → 期望优雅处理
  ├── 测试类命名：{ClassName}QuickTest.java（区别于正式测试的 *Test.java）
  └── 测试放置路径：src/test/java/.../quicktest/

Step 4.2.2: 运行前置测试
  ├── Java 项目：mvn test -Dtest={ClassName}QuickTest -pl {module} -q
  ├── 前端项目：npx jest --testPathPattern="quicktest" --passWithNoTests
  └── 超时限制：30 秒（防止测试卡住）

Step 4.2.3: 分析测试结果
  ├── 全部通过 → 代码逻辑基本正确，继续
  ├── 部分失败 → 进入前置修复循环
  │   ├── 读取失败信息（断言值不匹配 / 空指针 / 异常）
  │   ├── 判断失败原因：
  │   │   ├── 代码逻辑错误 → 修复业务代码（不是改测试！）
  │   │   ├── 测试用例本身错误 → 修正测试用例
  │   │   └── 环境问题（如数据库未启动）→ 标记跳过，记录原因
  │   ├── 修复后重新编译 + 重新运行测试
  │   └── 最多 2 轮修复，超过则标记为"需 Test 阶段深入验证"
  └── 测试类不存在/框架未配置 → 跳过前置测试，记录到 develop-result.yaml
```

**前置测试要求**：

| 要求 | 说明 |
|------|------|
| 测试必须可运行 | 不能只生成测试代码而不执行 |
| 修复目标为业务代码 | 测试失败时，优先修复业务代码而非修改测试 |
| 超时保护 | 30 秒超时防止卡住 |
| 轻量化 | 只测本次开发的代码，不运行全量测试 |
| 不阻塞整体流程 | 2 轮修复仍失败 → 标记并继续，由 Test 阶段深入处理 |

**前置测试结果记录**：

```yaml
# .dev-flow/runtime/pre-test-result.yaml
quick_test:
  timestamp: "2026-06-05T12:00:00"
  task_id: "Task-5"
  test_class: "XxxServiceQuickTest"
  test_count: 5
  passed: 4
  failed: 1
  failed_tests:
    - method: "testCreate_withNullParam"
      error: "AssertionError: expected NullPointerException but no exception was thrown"
      fix_applied: "Added @NotNull validation in XxxServiceImpl.create()"
      retest_result: "pass"
  overall: "pass_with_fixes"
```

**前置测试与 Test 阶段的关系**：

```
Develop 阶段前置测试（Quick Test）：
  ├── 目标：快速验证本次开发代码的基本逻辑正确性
  ├── 范围：仅本次开发的 Service/Mapper
  ├── 深度：正向+参数校验+空值边界
  └── 文件名：*QuickTest.java

Test 阶段正式测试（Full Test）：
  ├── 目标：全面验证所有代码的正确性
  ├── 范围：全部修改/新增的代码 + 回归测试
  ├── 深度：正向+异常+边界+并发+集成
  └── 文件名：*Test.java
```

> **⚠️ 前置测试不能替代正式 Test 阶段**。前置测试是"快速筛查"，
> 正式 Test 阶段会做更深入、更全面的测试（包括并发、性能、集成等）。

### 🔴 Step 4.3: 设计逻辑回溯验证（🔴 编译通过+前置测试通过后必须执行）

> **目的**：compile pass + Quick Test pass ≠ 业务逻辑 100% 正确。本步骤逐条对比
> design-contract.yaml 中的每个 logic step / condition / action 与实际代码实现，
> 确保设计意图被完整翻译为代码，无遗漏、无偷换。

**触发条件**：Step 4 编译通过 且 Step 4.2 前置测试通过（或标记跳过）

**执行流程**：

```
Step 4.3.1: 提取设计契约中的所有逻辑单元
  ├── 读取 .dev-flow/docs/{需求简称}-design-contract.yaml
  ├── 提取每个 Service 方法的 logic_steps 列表（step 编号 + action 类型）
  ├── 提取每个 logic step 的 conditions（条件分支定义）
  ├── 提取每个 call action 的 target + method + params
  └── 输出：design_logic_inventory.yaml

Step 4.3.2: 在生成的代码中逐条定位实现
  ├── 对每个 logic step，在对应 ServiceImpl 中搜索实现代码
  │   ├── Grep "// Step {N}:" 或方法体中对应的业务逻辑段落
  │   ├── 验证 action 类型与代码特征匹配：
  │   │   ├── validate → 存在 if/null-check/@Valid/@NotNull
  │   │   ├── query → 存在 mapper.select/list/get 调用
  │   │   ├── convert → 存在 Entity↔DTO 转换代码（BeanUtils.copy 或手动赋值）
  │   │   ├── assign → 存在字段赋值操作（setXxx / builder.setXxx）
  │   │   ├── throw → 存在 throw new XxxException
  │   │   ├── return → 存在 return 语句（非 return null）
  │   │   ├── call → 存在 target.method(...) 调用（非 log 替代）
  │   │   └── branch → 存在 if/else 或 switch/case 结构
  │   └── 记录：logic step → 代码行号范围 → 实现状态
  │
  ├── 对每个 condition，在代码中搜索对应的 if/else 分支
  │   ├── 验证 condition 的 field + operator 在代码中有对应判断
  │   ├── 验证 onSuccess 和 onFail 分支都有实现
  │   └── 记录：condition → 代码 if 行号 → else/throw 行号 → 实现状态
  │
  └── 对每个 call action，在代码中搜索实际外部调用
      ├── 验证 target.method 在代码中存在（非 log.info 替代）
      ├── 验证参数列表与设计一致
      └── 记录：call action → 代码行号 → 调用匹配状态

Step 4.3.3: 计算覆盖率并生成矩阵
  ├── 覆盖率计算：
  │   ├── logic_step_coverage = (已实现 step 数 / 设计 step 总数) × 100%
  │   ├── condition_coverage = (已实现 condition 数 / 设计 condition 总数) × 100%
  │   └── call_action_coverage = (已实现 call action 数 / 设计 call action 总数) × 100%
  │
  ├── 覆盖率阈值：
  │   ├── logic_step_coverage 必须 = 100%（不允许任何 step 遗漏）
  │   ├── condition_coverage 必须 = 100%（每个分支都必须有实现）
  │   └── call_action_coverage 必须 = 100%（每个外部调用必须有实际代码）
  │
  └── 输出：logic-coverage-matrix.yaml

Step 4.3.4: 处理未覆盖项
  ├── 覆盖率 = 100% → 验证通过，继续
  ├── 覆盖率 < 100% → 列出所有未覆盖项，逐项修复
  │   ├── 读取未覆盖 logic step 的设计定义
  │   ├── 在代码中补充实现
  │   ├── 重新编译验证（Step 4）
  │   └── 重新计算覆盖率
  └── 最多 2 轮修复，超过则暂停报告用户
```

**逻辑覆盖率矩阵输出**：

```yaml
# .dev-flow/runtime/logic-coverage-matrix.yaml
logic_traceability:
  timestamp: "2026-06-05T12:30:00"
  task_id: "Task-5"
  service: "XxxServiceImpl"
  
  coverage_summary:
    logic_steps_total: 12
    logic_steps_implemented: 12
    logic_step_coverage: "100%"
    conditions_total: 8
    conditions_implemented: 8
    condition_coverage: "100%"
    call_actions_total: 5
    call_actions_implemented: 5
    call_action_coverage: "100%"
    overall_status: "passed"
  
  logic_steps:
    - step: 1
      action: "validate"
      design: "校验订单参数"
      code_location: "ServiceImpl.java:45-52"
      implementation: "if (orderDTO == null) throw new BusinessException(...)"
      status: "matched"
    - step: 2
      action: "query"
      design: "查询订单是否存在"
      code_location: "ServiceImpl.java:53-55"
      implementation: "OrderEntity existing = orderMapper.selectById(orderDTO.getId())"
      status: "matched"
    # ... 每个步骤逐条记录
  
  conditions:
    - id: "cond_001"
      design: "order.status == DRAFT"
      code_if: "ServiceImpl.java:60"
      code_else: "ServiceImpl.java:68"
      on_fail: "throw BusinessException"
      status: "matched"
    # ... 每个条件逐条记录
  
  call_actions:
    - target: "sapFeignClient"
      method: "pushOrder"
      code_location: "ServiceImpl.java:72"
      has_real_call: true
      status: "matched"
    # ... 每个外部调用逐条记录
  
  uncovered_items: []  # 为空表示全部覆盖
```

**与 step-enforcer R3-4-1/R3-4-2 的集成**：

> Step 4.3 的逻辑覆盖率验证与 step-enforcer.md 中的 R3-4-1（逻辑步骤覆盖率验证）
> 和 R3-4-2（条件分支覆盖率验证）形成双重保障：
> - **Step 4.3** 由 develop-expert 自执行，在开发阶段就完成逻辑回溯
> - **R3-4-1/R3-4-2** 由 step-enforcer 独立执行，作为外部验证
> 两者独立运行，结果交叉比对，确保无遗漏。

### 🔴 失败恢复策略

如果代码生成过程中遇到无法解决的问题：

1. **保存当前进度**：将已完成的文件写入磁盘，不要丢弃
2. **记录失败信息**：在 `develop-result.yaml` 中标记 `compilation_status: failed`，记录具体错误
3. **通知 Orchestrator**：通过 `task-result.yaml` 报告失败，包含失败原因和建议的修复方向
4. **不要静默跳过**：禁止跳过编译错误继续开发下一个文件

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

**自动保存内容**：
```yaml
# .dev-flow/runtime/develop-checkpoint.yaml
checkpoint:
  timestamp: "2026-05-26 14:30:00"
  status: "critical"  # warning / critical / emergency
  completed_files:
    - "entity/User.java"
    - "dto/UserRequestDTO.java"
  remaining_files:
    - "service/UserService.java"
    - "controller/UserController.java"
  context_usage: "87%"
  next_action: "建议分段执行剩余任务"
```

**清理后的上下文保留**：
- ✅ 保留：已生成文件的列表和路径
- ✅ 保留：项目记忆的关键摘要（编码规范、常用模式）
- ✅ 保留：当前需求的精简描述
- ❌ 清除：已生成文件的完整代码内容（已保存到文件系统）
- ❌ 清除：中间分析过程的详细内容

**输出格式**：
每个文件生成后，按以下格式展示：

**如果是 Java 微服务（多服务模式）：**
| 服务 | 模块 | 文件路径 | 操作 | 说明 |
|------|------|----------|------|------|
| common-bean | dto | `xxx/XxxDTO.java` | 新建 | 跨服务共享 DTO |
| common-bean | enums | `xxx/XxxType.java` | 新建 | 共享枚举 |
| 服务A | client | `xxx/XxxClient.java` | 新建 | Feign Client 接口 |
| 服务A | entity | `xxx/Xxx.java` | 新建 | 实体类 |
| 服务A | core | `dto/XxxRequest.java` | 新建 | 请求 DTO |
| 服务A | core | `mapper/XxxMapper.java` | 新建 | 数据访问层 |
| 服务A | core | `service/XxxService.java` | 新建 | 服务接口 |
| 服务A | core | `service/impl/XxxServiceImpl.java` | 新建 | 服务实现 |
| 服务A | manage | `controller/XxxController.java` | 新建 | REST API |
| 服务B | core | `service/XxxService.java` | 修改 | 新增被调用方法 |

**如果是 Java 单服务项目：**
| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `entity/Order.java` | 新建 | 订单实体类，包含 MyBatis-Plus 注解 |
| `dto/OrderRequest.java` | 新建 | 创建订单请求 DTO，包含校验注解 |
| `mapper/OrderMapper.java` | 新建 | 订单数据访问层，继承 BaseMapper |
| `service/OrderService.java` | 新建 | 订单服务接口 |
| `service/impl/OrderServiceImpl.java` | 新建 | 订单服务实现，包含业务逻辑 |
| `controller/OrderController.java` | 新建 | 订单 REST API 控制器 |
| `enums/OrderStatus.java` | 新建 | 订单状态枚举 |

**前端项目：**
| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `src/models/user.ts` | 新建 | 用户数据模型和类型定义 |
| `src/api/userApi.ts` | 新建 | 用户相关 API 请求函数 |
| `src/components/UserList.tsx` | 新建 | 用户列表展示组件 |

### 代码质量要求

**Java 项目必须做到**：
- ✅ 完整的类/方法 Javadoc 注释
- ✅ 完整的字段校验注解（DTO/Entity）
- ✅ 完整的异常处理（自定义异常 + 全局处理器）
- ✅ 正确的事务边界（`@Transactional`）
- ✅ 正确的依赖注入（构造器注入优先）
- ✅ 遵循项目已有的命名规范（PascalCase/camelCase）
- ✅ 使用 Lombok 简化代码（`@Data`、`@Builder`）
- ✅ 统一的 API 响应包装（`ApiResponse<T>`）

**前端项目必须做到**：
- ✅ 完整的类型定义（interface/type）
- ✅ 完整的错误处理（try-catch / Error Boundary）
- ✅ 完整的 JSDoc 注释（公共方法）
- ✅ 完整的 Props 验证和默认值
- ✅ 完整的 API 请求验证和错误响应
- ✅ 遵循项目已有的命名规范和文件组织方式

**禁止事项（所有项目）**:
- ❌ `// TODO: 实现业务逻辑`
- ❌ `{/* 描述 */}`（前端）
- ❌ `data: null` 硬编码返回
- ❌ `return null;` 空实现（Java）
- ❌ 任何形式的空壳/占位代码

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

**主 Agent 职责**：
1. 接收所有 subagent 的汇报
2. 汇总进度，更新任务看板
3. 处理阻塞问题（如协调其他 subagent 优先完成依赖任务）
4. 决定是否进入下一批次
5. 向用户展示整体进度

**进度看板示例**：
```
| 批次 | 任务 | Subagent | 状态 |
|------|------|----------|------|
| 1 | Task-1 Entity | @dev-1 | ✅ 完成 |
| 1 | Task-2 Enum | @dev-2 | ✅ 完成 |
| 2 | Task-5 Mapper | @dev-1 | 🔄 进行中 |
| 2 | Task-6 DTO | @dev-2 | ⏳ 等待 |
```

**暂停，等待用户确认后再进入 Test 阶段。**

> **🔴 Develop 完成后必须输出开发报告**：

---

**🔴 Step 6: 并行开发集成验证检查点（Subagent 模式必须执行）**

> **目的**：当多个 subagent 并行开发完成后，在进入 Test 阶段前，执行全局集成验证，确保各 subagent 的产出能够正确协同工作。

**触发条件**：使用了多个 subagent 并行执行 Develop 任务

**验证流程**：

```
Step 6.1: 收集所有 subagent 的 task-result.yaml
  ├── 检查每个 subagent 的 status 字段是否为 success
  └── status 为 partial/failed → 标记为需要 Fix

Step 6.2: 全局编译验证
  ├── Java：mvn compile -q（所有涉及的服务/模块）
  ├── 前端：npm run build 或 npx tsc --noEmit
  └── 编译失败 → 自动进入编译修复循环（最多 3 次）

Step 6.3: 接口一致性校验
  ├── 读取 design-contract.yaml 中冻结的接口定义
  ├── 验证每个 subagent 产出的接口是否与契约一致
  │   ├── Controller 路径和参数与契约匹配
  │   ├── Service 方法签名与契约匹配
  │   ├── DTO 字段类型和注解与契约匹配
  │   └── Feign Client 与目标 Controller 端点匹配（多服务模式）
  └── 不一致 → 记录并标记需要 Fix

Step 6.4: 依赖传递验证
  ├── 遍历所有 task-result.yaml 的 dependencies_provided 字段
  ├── 对每个 "needs_to_know" 验证前置任务的产出是否已就绪
  └── 缺失 → 标记为阻塞

Step 6.4.5: interface-registry 运行时验证（🔴 必须执行）
  ├── 读取 .dev-flow/docs/interface-registry.yaml
  ├── 逐项验证每个声明的接口是否在代码中真实存在
  │   ├── Grep "public.*{methodName}" → 验证方法签名是否与声明一致
  │   ├── Grep "class {className}" → 验证类是否存在
  │   └── 对比参数类型和返回类型是否匹配
  ├── 验证结果：
  │   ├── 所有声明已兑现 → 接口契约运行时验证通过
  │   └── 有声明未兑现 → 标记为违约，需修复
  └── 验证报告追加到集成验证文档

Step 6.5: 输出集成验证报告
  └── 写入 .dev-flow/docs/{需求简称}-develop集成验证.md
```

**如果验证全部通过**：进入 Test 阶段
**如果存在失败项**：进入 Fix 阶段修复后重新验证（最多 3 次，超过则暂停报告用户）

> - **正式文档**：`.dev-flow/docs/{需求简称}-开发报告.md`
> - **会话记录**：追加到 `.dev-flow/sessions/` 当前会话文件
> - **更新记忆**：更新 `patterns.md`（新模式）、`mistakes.md`（遇到的问题）
>
> **开发报告模板**：
> ```markdown
> # 开发报告：{需求标题}
> 
> <!-- last-updated: YYYY-MM-DD HH:mm -->
> 
> ## 1. 开发概述
> | 项目 | 内容 |
> |------|------|
> | 需求标题 | {标题} |
> | 开发时间 | YYYY-MM-DD HH:mm |
> | 涉及服务 | {服务列表} |
> 
> ## 2. 文件变更清单
> | 操作 | 文件路径 | 说明 |
> |------|----------|------|
> | 新增 | ... | ... |
> | 修改 | ... | ... |
> 
> ## 3. 实现说明
> （每个新增/修改文件的实现思路说明）
> 
> ## 4. 自检结果
> | 检查项 | 结果 |
> |--------|------|
> | 编译通过 | ✅/❌ |
> | 边界处理 | ✅/❌ |
> | 编码规范 | ✅/❌ |
> | 安全检查 | ✅/❌ |
> | 事务处理 | ✅/❌ |
> | 跨服务一致性 | ✅/❌ |
> ```

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
