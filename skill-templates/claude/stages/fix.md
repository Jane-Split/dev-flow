---
stage: Fix
type: stage-instruction
---

## 阶段八：Fix（Bug 修复）

### 🔔 入口 Banner（本阶段开始时输出）

```
▶ Fix（Bug 修复）
════════════════════════════════════
目标：分析并修复测试/运行时发现的缺陷
输出：fix-report.md + 修复代码
模式：L0 / L1 / L2 / L3
预计：5-30 分钟
════════════════════════════════════
```

### 触发条件
- Test 阶段发现失败用例
- 用户输入 `/dev-flow -fix`

### 🔴🔴 主 Agent 零编辑约束（本阶段入口铁律）

> **⚠️ 最高优先级**：主 Agent 在本阶段的唯一角色是**调度器**。
> **主 Agent 绝对禁止直接使用 Edit/Write 工具编辑本阶段的任何产出文件。**
> **所有文件编辑必须由 fix-expert subagent 执行。**
> **完整零编辑铁律、失败硬阻断规则、交付物协议见 `.claude/references/protocol.md`。**

### 执行步骤

> **⚠️ 以下步骤由 fix-expert subagent 在独立上下文中执行，主 Agent 不直接执行这些步骤。主 Agent 的职责是：创建 subagent → 传递上下文 → 等待结果 → 向用户汇报。**

**Step 1: Bug 自动分类（🔴 必须执行）**

> **目的**：在分析失败原因之前，先将 Bug 自动分类到正确的类别，以便选择最优的诊断和修复策略。

**分类流程**：

```
Step 1.1: 读取失败输出（堆栈跟踪 / 测试报告 / 编译错误）
Step 1.2: 自动分类

  ├── 编译错误（Compilation Error）
  │   ├── 特征：编译阶段报错，包含 "cannot find symbol", "incompatible types" 等
  │   └── 诊断策略 → Step 2A
  │
  ├── 运行时错误（Runtime Error）
  │   ├── 特征：运行阶段抛出异常，包含 NullPointerException, ClassCastException 等
  │   └── 诊断策略 → Step 2B
  │
  ├── 逻辑错误（Logic Error）
  │   ├── 特征：代码可编译可运行，但输出结果不符合预期（断言失败 / 业务值错误）
  │   └── 诊断策略 → Step 2C
  │
  ├── 集成错误（Integration Error）
  │   ├── 特征：单个模块测试通过，但跨模块/跨服务调用失败
  │   └── 诊断策略 → Step 2D
  │
  └── 配置/环境错误（Environment Error）
      ├── 特征：配置缺失、端口冲突、依赖版本不兼容
      └── 诊断策略 → Step 2E
```

**Step 2A: 编译错误诊断**

```
2A.1 提取错误信息：错误文件、行号、错误类型
2A.2 定位根因：
  ├── Import 缺失 / 路径错误 → Grep 搜索正确路径
  ├── 方法不存在 / 签名不匹配 → Read 目标类验证实际签名
  ├── 类型不兼容 → 检查类型转换规则
  └── 泛型类型擦除 → 检查泛型使用方式
2A.3 修复策略：精确修复，不猜测
```

**Step 2B: 运行时错误诊断**

```
2B.1 解析异常堆栈：异常类型、错误消息、调用链
2B.2 定位触发点：
  ├── NullPointerException → 查找首个 null 值，追踪来源
  ├── ClassCastException → 检查实际类型 vs 预期类型
  ├── IndexOutOfBoundsException → 检查索引边界计算
  └── BusinessException → 检查业务规则触发条件
2B.3 修复策略：
  ├── 防御性编程（增加 null 检查）
  ├── 类型安全（增加 instanceof 检查）
  └── 边界保护（增加范围校验）
```

**Step 2C: 逻辑错误诊断**

```
2C.1 提取断言失败信息：期望值 vs 实际值
2C.2 对比设计文档：实现是否与设计一致
2C.3 逐步追踪：输入 → 数据转换 → 条件分支 → 返回值
2C.4 修复策略：修正逻辑，不改变接口
```

**Step 2D: 集成错误诊断**

```
2D.1 定位集成点：哪个模块/服务的哪个接口
2D.2 检查接口一致性（调用方参数 vs 被调用方期望）
2D.3 检查 Design Contract：实际实现是否与契约定义一致
2D.4 修复策略：对齐接口 / 修复数据转换 / 更新契约
```

**Step 2E: 配置/环境错误诊断**

```
2E.1 检查配置文件是否存在且格式正确
2E.2 检查依赖版本是否兼容
2E.3 修复策略：修正配置或调整环境
```

**Step 3: 修复策略选择树 + 多 Bug 排序算法**

> **3A. 单 Bug 严重程度分级**（用于分类，不影响排序优先级）：

```
Bug 严重程度判断：
├── 🔴 P0 阻塞性（Blocker）：核心流程不可用 / 数据丢失风险 / 安全漏洞
├── 🟠 P1 严重（Critical）：重要功能异常 / 主路径中断
├── 🟡 P2 一般（Major）：次要功能异常 / 边界条件错误
└── 🟢 P3 轻微（Minor）：UI 美化 / 提示文案 / 非关键路径
```

> **3B. 多 Bug 并发修复排序算法（🔴 核心新增）**

当 Test 阶段返回多个失败用例（bugs ≥ 2）时，按以下算法确定修复顺序和并行策略：

**排序优先级矩阵（从高到低）**：

| 优先级 | 排序维度 | 权重 | 说明 |
|--------|----------|------|------|
| 1 | **安全等级** | 最高 | 安全漏洞(CVE/注入/越权) > 所有其他 Bug，无条件最高优先 |
| 2 | **阻断度** | 高 | Blocker(核心流程不可用) > Critical > Major > Minor |
| 3 | **影响面** | 中高 | affected_files 数量多 > 少（影响面大的先修，减少回归范围）|
| 4 | **依赖关系** | 高 | 被其他 Bug 依赖的先修（见下文依赖分析）|
| 5 | **修复置信度** | 中 | 根因明确的 > 根因模糊的（快速胜利先拿，建立修复动量）|
| 6 | **同类聚合** | 低 | 同一文件的 Bug 聚合修复（减少文件切换开销）|

**完整排序伪代码**：

```
INPUT: bugs[] (从 verification-trace-report.yaml 的 failures 列表)
OUTPUT: sorted_bugs[], parallel_groups[]

Step B1: 安全筛选
  security_bugs = bugs.filter(b => b.category in ["安全漏洞", "CVE", "注入", "越权"])
  if security_bugs non-empty:
    sorted_bugs.addAll(security_bugs)   // 安全 Bug 无条件排在最前

Step B2: 构建依赖图
  FOR each bug_i IN bugs:
    FOR each bug_j IN bugs WHERE i != j:
      IF bug_i.affected_files ∩ bug_j.affected_files ≠ ∅:
        ADD edge bug_i → bug_j  // 共享文件 → 可能存在依赖
      IF bug_i 的修复可能引入 bug_j 的回归:
        ADD dependency bug_j depends_on bug_i

Step B3: 拓扑排序（处理依赖）
  dependent_bugs = RUN topological_sort(dependency_graph)
  // 有依赖关系的 Bug 必须串行：被依赖的先修

Step B4: 分组（无依赖的可并行）
  independent_bugs = bugs - dependent_bugs
  // 按 [阻断度 → 影响面 → 置信度] 排序 independent_bugs
  SORT independent_bugs BY:
    PRIMARY:   severity_rank(P0=1, P1=2, P2=3, P3=4)
    SECONDARY: DESC(len(affected_files))     // 影响面大的先修
    TERTIARY:  DESC(confidence_score)        // 根因明确的高置信度先修
    QUATERNARY: file_cluster                // 同文件聚合

Step B5: 构建并行组
  parallel_groups = []
  current_group = []
  FOR each bug IN (security_bugs + dependent_bugs_sorted + independent_bugs_sorted):
    IF bug HAS unmet_dependencies:
      // 必须等待前置 Bug 修复完成 → 放入下一组
      parallel_groups.ADD(current_group)
      current_group = [bug]
    ELSE IF current_group 与 bug 无共享文件:
      current_group.ADD(bug)               // 可并行
    ELSE:
      parallel_groups.ADD(current_group)     // 共享文件 → 下一组
      current_group = [bug]
  parallel_groups.ADD(current_group)

RETURN sorted_bugs (线性顺序), parallel_groups (并行批次)
```

**并行执行约束**：

| 约束 | 规则 | 原因 |
|------|------|------|
| 共享文件互斥 | 同一文件的两个 Bug **禁止并行** | 避免合并冲突 |
| 依赖串行 | 有依赖关系的 Bug **必须串行** | 后续 Bug 依赖前置修复的结果 |
| 安全最前 | 安全类 Bug **必须在第一批单独执行** | 最小化暴露窗口 |
| Codex 并发上限 | 每批并行数 ≤ Codex 最大并发数（默认 6） | 平台限制 |
| 回归检测批间必做 | 每批修复完成后**必须执行回归测试**后再启动下一批 | 防止错误传播 |

**排序示例**：

```
输入 5 个 Bug:
  BUG-001: P0 NullPointerException UserService.java (根因明确)
  BUG-002: P1 Feign超时 OrderService.java (根因需排查)
  BUG-003: P2 分页错误 UserService.java (与 BUG-001 共享文件)
  BUG-004: P1 SQL语法错误 ProductMapper.xml (独立)
  BUG-005: P0 SQL注入 UserMapper.xml (安全漏洞)

排序结果:
  Batch 1 (并行): [BUG-005(安全)]                    ← 安全最前，单独一批
  Batch 2 (并行): [BUG-001(P0,UserService)]           ← 阻塞性最高
  Batch 3 (并行): [BUG-004(P1,ProductMapper)]         ← 与Batch2无共享文件，可并行
  Batch 4 (串行): [BUG-003(P2,UserService)]           ← 依赖 BUG-001 修复后的 UserService
  Batch 5 (串行): [BUG-002(P1,OrderService)]          ← 最后处理根因模糊的
```

**Step 4: 按并行组分批执行修复**

> **⚠️ 当仅有 1 个 Bug 时**：直接执行修复，走原有的单 Bug 流程。
> **当有多个 Bug 时（≥2）**：严格按 Step 3B 的 parallel_groups 分批执行。

**每批执行流程**：

```
FOR EACH batch IN parallel_groups (按顺序):

  ┌─ Step 4.1: 创建本批修复 subagent
  │     为 batch 中的每个 Bug 创建 fix-expert subagent
  │     同一批内的 subagent **并行执行**（Codex ≤ 6 并发）
  │     传入上下文：该 Bug 的 root_cause + affected_files + 设计契约相关片段
  │
  ├─ Step 4.2: 等待本批所有 subagent 完成
  │     ├── 全部成功 → 进入 Step 4.3
  │     ├── 部分失败 → 对失败的 subagent 执行三级失败处理协议（见 .claude/references/protocol.md）
  │     └── 全部失败 → 升级到 Level 3 人工介入
  │
  ├─ Step 4.3: 本批编译验证
  │     mvn compile / npm run build (或项目对应编译命令)
  │     ├── 编译通过 → 进入 Step 4.4
  │     └── 编译失败 → 标记编译错误 Bug，加入下一轮修复队列（最多 3 轮）
  │
  └─ Step 4.4: 本批回归测试（🔴 批间必须执行）
        仅运行受影响的测试用例（非全量）：
        - Java: mvn test -pl {affected_module} -Dtest={affected_test} -q
        - 前端: npx jest --testPathPattern="{affected_test}" --passWithNoTests
        ├── 回归通过 → 进入下一 batch
        └── 发现新回归 → 记录回归 Bug，追加到修复队列末尾（不阻塞后续 batch 但最终需清零）

END FOR (所有 batch 执行完毕)
```

**跨批状态维护**：

```yaml
# Fix 阶段跨批状态（主 Agent 在内存中维护，最终写入 fix-contract.yaml）
fix_session:
  current_batch: 1
  total_batches: N
  bugs_status:
    - id: "BUG-001"
      batch_assigned: 1
      status: "fixed"       # fixed / pending / failed / regression
      verification: "passed"
    - id: "BUG-003"
      batch_assigned: 4      # 因共享文件依赖被安排到第 4 批
      status: "pending"
      depends_on: ["BUG-001"] # 依赖 BUG-001 先修复
  regression_log: []          # 每批回归发现的新问题
  compilation_errors: 0       # 累计编译错误次数
  max_rounds: 3               # 含回归的总修复轮次上限
```

**Step 5: 回归测试（🔴 必须执行）**

> **目的**：修复 Bug 可能引入新 Bug（回归）。修复完成后必须自动重新运行之前通过的测试用例，确保未引入回归。

**回归测试流程**：

```
Step 5.1: 收集之前通过的测试用例列表
  ├── 读取 .dev-flow/deliverables/{需求简称}/06-test-report.md（E2E 测试通过列表）
  ├── 读取 .dev-flow/deliverables/{需求简称}/06-test-report.md（单元测试通过列表）
  └── 读取 .dev-flow/runtime/pre-test-result.yaml（前置测试通过列表）

Step 5.2: 重新运行所有之前通过的测试
  ├── Java 项目：mvn test -pl {module} -q（运行全量测试）
  ├── 前端项目：npx jest --passWithNoTests
  └── 对比本次运行结果与历史结果

Step 5.3: 回归检测结果
  ├── 全部通过（无回归）→ 修复成功，继续
  ├── 新失败用例 → 分析是否由本次修复引入
  │   ├── 确认是回归 → 回滚修复，重新分析根因
  │   ├── 确认是独立问题 → 记录为新 Bug，本轮修复不影响
  │   └── 无法确认 → 标记为"可疑回归"，建议人工审查
  └── 原失败用例仍失败 → 修复未生效，重新分析

Step 5.4: 回归测试报告
  └── 写入 .dev-flow/contracts/{需求简称}/回归测试报告.md
```

**回归阻断规则**：
- 如果回归率 > 0%（即有新失败），**必须分析每个回归的根因**
- 回归修复不计入 Fix 阶段的 3 轮修复限制（回归修复有额外 2 轮）
- 如果 2 轮回归修复后仍有回归 → 暂停并报告用户，建议人工代码审查

- 更新 prd-contract.yaml 的 traceability 章节中对应 REQ 的测试状态

**修复记录格式**：
```yaml
# .dev-flow/contracts/{需求简称}/fix-log.yaml
fixes:
  - round: 1
    bugs:
      - test: "testRegister()"
        type: "runtime_error"
        classification: "NullPointerException"
        root_cause: "UserService.register() 未校验 email 参数 null"
        fix: "增加 @NotNull 校验 + null 检查"
        strategy: "Step 2B - 防御性编程"
        file: "service/impl/UserServiceImpl.java"
        line: 45
        regression_test: "通过"
    remaining_failures: 1
```

**阶段流转**：
- 如果所有测试通过：流程结束，向用户展示总结
- 如果仍有失败用例：回到 Fix 阶段继续修复（最多循环 3 次，超过则提示用户人工介入）

---

**Step 5: 写入结构化修复契约（供后续阶段使用）**

> **目的**：生成机器可读的结构化修复记录，供 Test 阶段验证和 Delivery 阶段审计。

**写入路径**：`.dev-flow/contracts/{需求简称}/fix-contract.yaml`

```yaml
# fix-contract.yaml — Bug 修复契约
# 路径: .dev-flow/contracts/{需求简称}/fix-contract.yaml
# 生成者: fix-expert subagent
# 使用者: Test 阶段（验证修复）、Delivery 阶段（审计）

meta:
  version: "1.0"
  generated_by: "fix-expert"
  timestamp: "2026-06-12T10:00:00"
  requirement_id: "{需求简称}"
  fix_round: 1  # 第几轮修复

summary:
  total_bugs: 5
  fixed: 4
  remaining: 1
  compilation_status: "success"  # success / failed
  test_status: "partial"  # passed / partial / failed

bugs:
  - id: "BUG-001"
    category: "编译错误"
    severity: "high"
    description: "缺少 import 语句"
    root_cause: "Entity 字段类型变更后未更新 DTO"
    affected_files:
      - "src/main/java/com/xxx/dto/UserDTO.java"
    fix:
      type: "代码修改"
      changes:
        - file: "src/main/java/com/xxx/dto/UserDTO.java"
          action: "add"
          content: "import com.xxx.enums.UserStatus;"
      verification: "编译通过"
    status: "fixed"

  - id: "BUG-002"
    category: "运行时错误"
    severity: "medium"
    description: "NullPointerException in UserService"
    root_cause: "未检查空值"
    affected_files:
      - "src/main/java/com/xxx/service/impl/UserServiceImpl.java"
    fix:
      type: "代码修改"
      changes:
        - file: "src/main/java/com/xxx/service/impl/UserServiceImpl.java"
          action: "modify"
          content: "添加空值检查逻辑"
      verification: "单元测试通过"
    status: "fixed"

  - id: "BUG-003"
    category: "逻辑错误"
    severity: "low"
    description: "分页参数计算错误"
    root_cause: "pageNum 和 pageSize 未校验"
    affected_files:
      - "src/main/java/com/xxx/service/impl/UserServiceImpl.java"
    fix:
      type: "代码修改"
      changes:
        - file: "src/main/java/com/xxx/service/impl/UserServiceImpl.java"
          action: "modify"
          content: "添加分页参数校验"
      verification: "待验证"
    status: "pending"  # fixed / pending / wontfix

# 修复影响分析
impact_analysis:
  modified_files:
    - "src/main/java/com/xxx/dto/UserDTO.java"
    - "src/main/java/com/xxx/service/impl/UserServiceImpl.java"
  new_files: []
  deleted_files: []
  regression_risk: "low"  # low / medium / high

# 与 mistakes.md 的联动
knowledge_update:
  - pattern: "DTO 字段类型变更后需同步更新 import"
    added_to_mistakes: true
    mistakes_file: ".dev-flow/memory/mistakes.md"
```

---

**🔴 生成阶段交付物（v3.1 新增）**

> **目的**：生成独立的阶段交付物文档，供主 Agent 打开给用户审阅。

**交付物路径**：`.dev-flow/deliverables/{需求简称}/07-fix-report.md`

**交付物内容**：
```markdown
<!-- @generated-by: fix-expert subagent | session: {session-id} | stage: fix -->

# Bug 修复报告：{需求标题}

<!-- last-updated: YYYY-MM-DD HH:mm -->
<!-- status: fixed -->

## 1. 修复概述
| 项目 | 内容 |
|------|------|
| 需求标题 | {标题} |
| 修复时间 | YYYY-MM-DD HH:mm |
| Bug 数量 | X |
| 修复数量 | X |

## 2. Bug 分类统计
| 分类 | 数量 | 已修复 | 未修复 |
|------|------|--------|--------|
| 编译错误 | X | X | X |
| 运行时错误 | X | X | X |
| 逻辑错误 | X | X | X |
| 测试失败 | X | X | X |

## 3. 修复明细
| # | Bug 描述 | 分类 | 根因 | 修复方案 | 修复文件 | 验证结果 |
|---|----------|------|------|----------|----------|----------|

## 4. 编译验证
- 编译结果：✅/❌
- 修复后测试结果：✅/❌

## 5. 未修复项（如有）
| # | Bug 描述 | 未修复原因 | 计划 |
|---|----------|-----------|------|
```

**自检**：
- 交付物文件已生成且内容非空
- 包含 `@generated-by: fix-expert subagent` 溯源注释
- 所有 Bug 分类和修复明细已记录
- 编译验证结果已记录

**暂停，等待用户确认。**

---

### ✅ 阶段确认清单

| # | 确认项 | 状态 |
|---|--------|------|
| 0 | **执行者审计**：本阶段由 fix-expert subagent 执行，主 Agent 未直接编辑任何文件 | ⬜ 待确认 |
| 1 | 所有失败用例的根本原因已分析 | ⬜ 待确认 |
| 2 | 修复代码已验证不引入新问题（回归测试通过） | ⬜ 待确认 |
| 3 | 回归测试报告已输出（Step 5，含回归率统计） | ⬜ 待确认 |
| 4 | 修复记录已写入 mistakes.md（防止同类错误复发） | ⬜ 待确认 |
| 5 | 修复循环不超过 3 次（超过则需人工介入评估） | ⬜ 待确认 |
| 6 | Fix 报告已输出 | ⬜ 待确认 |

**用户操作**：确认修复完成 → 回复 "确认" 返回测试阶段重测（系统写入确认文件）；仍有问题 → 指出遗留问题

> **阶段确认机制和交付物协议详见 `.claude/references/protocol.md`。**

---
