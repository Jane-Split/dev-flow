---
stage: Analyze
type: stage-instruction
---

## 阶段二：Analyze（需求分析）

### 🔔 入口 Banner（本阶段开始时输出）

```
▶ Analyze（需求分析）
════════════════════════════════════
目标：解析需求，识别影响范围
输出：PRD-{需求简称}.md, prd-contract.yaml
模式：L1 / L2 / L3
预计：2-5 分钟
════════════════════════════════════
```

### 触发条件
- 全流程模式（Research 确认后）
- 用户输入 `/dev-flow -analyze <需求>`

### 🔴🔴 主 Agent 零编辑约束（本阶段入口铁律）

> **⚠️ 最高优先级**：主 Agent 在本阶段的唯一角色是**调度器**。
> **主 Agent 绝对禁止直接使用 Edit/Write 工具编辑本阶段的任何产出文件。**
> **所有文件编辑必须由 analyze-expert subagent 执行。**
> **完整零编辑铁律、失败硬阻断规则、交付物协议见 `.cursor/references/protocol.md`。**

### 执行步骤

> **⚠️ 以下步骤由 analyze-expert subagent 在独立上下文中执行，主 Agent 不直接执行这些步骤。主 Agent 的职责是：创建 subagent → 传递上下文 → 等待结果 → 向用户汇报。**

**Step 0.5: 输入源识别与解析（新增）**

> **目的**：支持从外部需求文档（产品需求模板、飞书/Confluence URL、Markdown 文件）解析需求，降低产品经理使用门槛。

**输入类型检测**：

| 输入类型 | 识别方式 | 解析策略 |
|---------|---------|---------|
| 文件路径（@xxx.md） | 用户需求描述中包含文件路径 | 读取文件内容，检测格式（Markdown/Word/纯文本） |
| URL（飞书/Confluence） | 以 http:// 或 https:// 开头 | 抓取页面内容，提取正文 |
| 产品需求模板 | 文件内容匹配模板章节结构 | 按模板章节解析为结构化功能点 |
| 对话描述（默认） | 以上均不匹配 | 直接使用用户需求描述 |

**解析流程**：

```
Step 0.5.1: 检测输入类型
  ├── 文件路径 → 读取文件 → 检测格式 → 解析
  ├── URL → 抓取内容 → 提取正文 → 解析
  ├── 产品需求模板 → 按章节结构解析
  └── 对话描述 → 直接使用

Step 0.5.2: 解析为需求草稿
  ├── 提取：业务背景 → overview
  ├── 提取：功能描述 → requirements[]（初始版，待 Step 1-3 补充技术细节）
  ├── 提取：页面交互 → 前端模块识别
  ├── 提取：数据要求 → data_model（初始版，待补充类型和约束）
  ├── 提取：验收标准 → acceptance[]（初始版，待补充断言）
  └── 写入 .dev-flow/contracts/{需求简称}/demand-draft.yaml

Step 0.5.3: 传递给 Step 1 继续现有流程
```

> **⚠️ 降级兼容**：如果用户直接在对话框中描述需求（无外部文档），跳过本步骤，直接进入 Step 1，行为与 v3.4.0 完全一致。

**Step 1: 需求解析**
- 识别需求类型：新功能 / 功能增强 / Bug 修复 / 重构 / 性能优化
- 识别优先级：P0(紧急) / P1(高) / P2(中) / P3(低)
- 提取核心功能点列表
- **如果是 Java 微服务（多服务模式）：**
  - 读取 `.dev-flow/memory/service-registry.md`，识别需求可能涉及的服务
  - 读取 `.dev-flow/memory/dependency-graph.md`，分析跨服务依赖影响
  - 评估跨服务影响范围：哪些服务会被直接影响，哪些会被间接影响（通过 Feign 调用链）

**Step 2: 上下文关联**
- 读取 `.dev-flow/memory/` 中的项目记忆
- **根据项目类型，识别与需求相关的已有代码：**

**如果是 Java 微服务（多服务模式）：**
- 读取 `.dev-flow/memory/service-registry.md` - 识别受影响的服务及其模块结构
- 读取 `.dev-flow/memory/dependency-graph.md` - 理解跨服务依赖关系和 Feign 调用链
- 读取 `.dev-flow/memory/common-modules.md` - 识别可复用的公共类（Entity/DTO/Enum/Util）
- 对每个受影响的服务：
  - 读取该服务的 `.dev-flow/memory/modules.md`（如有）或从 service-registry.md 获取模块信息
  - 识别相关的 Service、Mapper、Controller、Entity、DTO、Enum
  - 识别该服务中哪些具体模块需要变更
- 评估跨服务变更需求：
  - 是否需要新建 Feign Client 接口？（A 服务需要调用 B 服务的新方法）
  - 是否需要在公共模块中新增类？（多个服务共享的 Entity/DTO/Enum）
  - 是否需要修改现有 Feign Client？（增加新的跨服务调用方法）
  - 是否需要新增服务间的事件/消息通信？

**如果是 Java 单服务项目：**
- 读取 `modules.md` - 识别相关的 Service、Mapper、Controller、Entity、DTO、Enum
- 读取 `apis.md` - 识别需要新增或修改的 REST API 端点
- 读取 `models.md` - 识别相关的数据模型（Entity、DTO、数据库表）
- 读取 `config.md` - 识别相关的配置（数据库、Redis、消息队列等）
- 评估需求对现有代码的影响范围：
  - 是否需要新增 Entity/表？
  - 是否需要修改现有 Service 接口？
  - 是否需要新增 Controller 端点？
  - 是否需要新增或复用 DTO？
  - 是否需要新增 Enum？
  - 是否需要修改数据库配置或添加中间件？

**如果是前端项目：**
- 读取 `components.md` - 识别与需求相关的已有组件
- 读取 `apis.md` - 识别相关的 API 端点
- 读取 `models.md` - 识别相关的数据模型
- 评估需求对现有代码的影响范围

**Step 3: 歧义识别（🔴 强制执行，不允许跳过）**

> **🔴🔴 强制规则**：如果发现任何歧义或缺失信息，必须暂停并等待用户澄清。
> **禁止行为**：AI 自行假设歧义项的答案并继续分析。
> **唯一例外**：歧义项有明显的行业标准答案且用户需求明确符合该标准（如 CRUD 操作的分页默认）。

- 列出需求中不明确的地方
- 列出缺失的信息（如：认证方式未指定、错误处理策略未定义、数据库事务要求未明确）
- **🔴 强制向用户提问澄清（必须等待用户回复后才能继续）**

**歧义强制澄清模板**：

```markdown
### ⚠️ 需求歧义澄清（必须逐项确认后才能继续）

| # | 歧义项 | 默认假设（未经确认，不可使用） | 需要用户确认 |
|---|--------|--------------------------|-------------|
| 1 | {歧义描述} | {如果用户不回复，AI 可能假设的答案} | ❓ 待确认 |
| 2 | {歧义描述} | {假设答案} | ❓ 待确认 |

**🔴 请用户逐项回复**：
- 确认 → "第1项确认，第2项改为 XXX"
- 全部接受默认 → "全部确认"（AI 才能使用默认假设）
- 补充说明 → 提供更多信息
```

> **硬性阻断**：如果 Step 3 发现歧义，在用户回复之前，**禁止进入 Step 4**。
> 即使用户没有主动回复歧义项，也不允许 AI 在后续步骤中使用未确认的默认假设。

**Step 3.5: 需求一致性校验（🔴 必须执行）**

> **目的**：检测需求中的逻辑矛盾、不可达状态、循环依赖等问题，防止后续阶段基于矛盾需求进行设计和开发。

**校验流程**：

```
Step 3.5.1: 逻辑矛盾检测

  检查需求描述中是否存在以下矛盾：
  ├── 互斥条件：要求同时满足 A 和 B，但 A、B 互斥
  │   示例："状态必须为 ACTIVE 时才能删除" + "已删除的记录状态为 DELETED"
  │   → 矛盾：DELETED 状态不应再被操作
  │
  ├── 不可达状态：状态机中存在无法从初始状态到达的终态
  │   示例：要求支持"草稿 → 已发布 → 已撤回"流程，但同时要求"已撤回必须先审批才能重新发布"
  │   → 如果没有"审批"状态，则"重新发布"不可达
  │
  ├── 循环依赖：功能 A 依赖 B，B 依赖 C，C 又依赖 A
  │   示例："用户创建后自动发送邮件" + "邮件验证后才能激活用户" + "只有激活用户才能创建"
  │   → 死锁
  │
  └── 资源冲突：多个功能点竞争同一资源且无冲突解决策略
      示例："并发更新同一记录时不加锁" + "要求数据一致性"
      → 矛盾

Step 3.5.2: 数据完整性约束检测

  检查是否存在数据完整性问题：
  ├── 必填字段无默认值：新增功能要求某字段必填但未提供默认值或输入方式
  ├── 外键约束缺失：关联数据删除时无级联策略
  └── 数据格式冲突：同一字段在不同功能点中的格式要求不一致

Step 3.5.3: 输出校验报告

  如果发现矛盾，输出：
  | # | 矛盾类型 | 描述 | 涉及功能点 | 建议解决方案 |
  |---|---------|------|-----------|-------------|
  | 1 | 互斥条件 | 状态约束矛盾 | 功能A、功能B | 建议：删除后不允许状态变更为 DELETED |

  如果无矛盾，输出：✅ 需求一致性校验通过，未发现逻辑矛盾
```

**Step 4: 生成 PRD 契约与 PRD 文档**

> **🔴 核心产出**：本步骤生成两个关联文件，共享同一个 requirements[] ID 空间。
> prd-contract.yaml 是全流程的**单一真相源**，后续 Design/Test/Fix 阶段均从此文件读取。

**4.1: 生成 prd-contract.yaml（机器可执行契约）**

写入路径：`.dev-flow/contracts/{需求简称}/prd-contract.yaml`

结构化契约必须包含以下所有章节：

```yaml
# prd-contract.yaml — 单一真相源
# 路径: .dev-flow/contracts/{需求简称}/prd-contract.yaml

meta:
  id: "PRD-{YYYY}-{NNN}"              # PRD 编号
  title: "{需求标题}"
  type: "new-feature"                  # new-feature | bugfix | optimize
  priority: "P0"                       # P0/P1/P2/P3
  version: "1.0"
  created_at: "{ISO 8601 datetime}"
  status: "draft"                      # draft | reviewing | approved

overview:                              # 一、需求概述
  background: |                        # 背景
  objective: |                         # 目标
  target_users: []                      # 目标用户
  deadline: "{YYYY-MM-DD}"              # 截止日期（如有）
  scope:                               # 影响范围
    services: [{name, impact_type}]     # 影响的服务
    frontend_modules: []                # 影响的前端模块
    common_module_changes: []           # 公共模块变更
    database_changes: ""                # 数据库变更描述

requirements:                          # 二、功能点清单 + 验收标准 + 业务规则 + 异常（核心）
  - id: "REQ-{NNN}"                    # 需求唯一 ID
    title: "{功能点标题}"
    type: "crud"                        # crud | query | workflow | integration | permission
    priority: "P0"
    complexity: "medium"                # low | medium | high
    description: |
    preconditions: []
    postconditions: []

    acceptance:                         # 验收标准
      - id: "AC-{REQ}-{NN}"
        description: "{验收标准描述}"
        priority: "must"                # must | should | could
        test_level: "e2e"              # unit | e2e | integration
        assertions:                     # 高层断言（精确 API/DB 路径由 Design 阶段补充）
          - "{断言描述}"

    rules:                             # 业务规则
      validation: [{name, target, condition, fail_behavior}]
      business: [{name, trigger, if_condition, then_behavior, else_behavior}]
      concurrency: [{scenario, type, strategy}]

    exceptions:                        # 异常场景
      input: [{scenario, trigger, expected}]
      business: [{scenario, trigger, expected}]
      system: [{scenario, trigger, expected}]
      boundary: [{scenario, input, expected}]

    data_model:                        # 数据模型（Analyze 阶段的预定义，Design 可细化）
      entity: "{EntityName}"
      table: "{table_name}"
      fields: [{name, java_type, db_type, required, validation, unique, default, enum_ref, relation}]
      indexes: [{name, fields, type}]

    api:                               # API 交互（Analyze 阶段的预估路径，Design 可调整）
      - name: "{接口名称}"
        method: "{GET|POST|PUT|DELETE}"
        path: "/api/{resource}"
        request_fields: [{name, type, required, validation}]
        response_success: {code, data_fields}
        response_errors: [{scenario, http_status, code}]
        permission: "{角色}"

enums:                                 # 三、枚举定义（全局）
  - name: "{EnumName}"
    package: "{module}"
    values: [{code, label, rules}]

workflows:                             # 四、业务流程 + 状态机（全局）
  - name: "{流程名称}"
    states: [{id, label}]
    transitions: [{from, to, trigger, precondition, system_behavior}]
    forbidden_matrix: [{state, forbidden_actions}]

cross_service_calls:                   # 五、跨服务调用（全局）
  - caller: "{service}"
    target: "{service}"
    purpose: "{调用目的}"
    method_signature: "{signature}"
    expected_return: "{返回类型描述}"
    timeout: "{超时时间}"
    failure_strategy: "{失败策略}"

non_functional:                         # 六、非功能需求
  performance: [{scenario, metric, condition}]
  security: [{scenario, requirement}]

runtime:                               # 七、运行时信息（为 Step 2/3 预留，Analyze 阶段预填基础信息）
  services:
    - name: "{service}"
      start_command: "{启动命令}"
      health_check: "{健康检查端点}"
      db: {type, host, port, database}
  frontend:
    start_command: "npm run dev"
    base_url: "http://localhost:{port}"
    route_prefix: "/{prefix}"

traceability:                           # 八、需求追踪矩阵
  requirements:
    - id: "REQ-{NNN}"
      title: "{功能点标题}"
      priority: "P0"
      status: "analyzed"               # analyzed → designed → developed → tested
  # 后续阶段持续更新每个 REQ 的 design/code/test 字段

self_check:                            # 九、自检结果
  accuracy:
    A1_feature_io_field_level: true
    A2_data_model_types_clear: true
    A3_business_rules_format: true
    A4_state_machine_complete: true
    A5_acceptance_verifiable: true
  completeness:
    B1_exception_per_feature: true
    B2_enum_values_defined: true
    B3_write_idempotency: true
    B4_cross_service_degradation: true
  consistency:
    C1_no_contradictory_transitions: true
    C2_no_conflicting_rules: true
    C3_acceptance_matches_rules: true
  logic:
    D1_flow_step_error_handling: true
    D2_forbidden_action_matrix: true
    D3_boundary_scenarios: true
    D4_unique_error_codes: true
```

**验收标准生成规则**（从 PRD-Contract 派生）：

| 功能点类型 | 必须包含的验收标准 |
|-----------|------------------|
| 所有功能 | 正向路径（happy path）验收 |
| 所有功能 | 参数校验/非法输入处理 |
| 写操作 | 重复操作/幂等性处理 |
| 写操作 | 数据一致性验证（写入后可读取） |
| 列表查询 | 分页正确性验证 |
| 列表查询 | 排序正确性验证 |
| 列表查询 | 筛选条件正确性验证 |
| 状态变更 | 状态机流转正确性验证 |
| 跨服务调用 | Feign 调用超时/降级处理 |
| 跨服务调用 | 目标服务不可用时的降级策略 |

**两层验证精度**：
- Analyze 阶段的 assertions 为**高层断言**（如 "HTTP 200 + recordCode 格式匹配 NC-\\d{8}-\\d{4}"）
- Design 阶段的 design-contract.yaml 补充精确的 API 路径/DB 表名
- Test 阶段自动合并两层信息生成精确测试脚本

**4.2: 渲染 PRD-{需求简称}.md（人类可读文档）**

写入路径：`.dev-flow/deliverables/{需求简称}/PRD-{需求简称}.md`

从 prd-contract.yaml 渲染为人类可读的 Markdown 文档，结构对应：
- 第一章：需求概述（overview）
- 第二章：功能点清单（requirements 纵览表）
- 第三章：数据模型（requirements[].data_model）
- 第四章：业务流程（workflows）
- 第五章：业务规则（requirements[].rules）
- 第六章：异常场景（requirements[].exceptions）
- 第七章：API 交互（requirements[].api）
- 第八章：非功能需求（non_functional）
- 第九章：验收标准（requirements[].acceptance）
- 第十章：自检清单（self_check）

**PRD 文档头部**：
```markdown
<!-- @generated-by: analyze-expert subagent | session: {session-id} | stage: analyze -->
# PRD：{需求标题}

<!-- last-updated: YYYY-MM-DD HH:mm -->
<!-- status: analyzed -->
<!-- prd-contract: .dev-flow/contracts/{需求简称}/prd-contract.yaml -->
```

**Step 4.3: 从 prd-contract.yaml 自动派生 test-case-contract.yaml（新增）**

> **目的**：将 PRD 契约中的验收标准自动转化为可执行的测试用例契约，实现需求→测试的闭环追溯。
> **详细格式见 `.cursor/references/runtime-protocol.md` — 测试用例契约格式章节。**

**派生规则**：

| PRD 字段 | 派生到 test-case-contract 字段 | 说明 |
|---------|-------------------------------|------|
| requirements[].acceptance[] | test_suites[].cases[] | 每个 AC 生成一个 TC |
| acceptance.test_level: "unit" | case.type: "api" | 单元测试用 API MockMvc |
| acceptance.test_level: "e2e" | case.type: "api" + case.type: "ui" | E2E 级别生成双通道 |
| acceptance.test_level: "integration" | case.type: "integration" | 集成测试 |
| requirements[].api[] | cases[].steps[] | API 调用步骤 |
| requirements[].data_model | cases[].steps[].db_assert | 数据库断言 |
| requirements[].exceptions[] | 额外 TC（异常路径） | 异常场景测试用例 |

**写入路径**：`.dev-flow/contracts/{需求简称}/test-case-contract.yaml`

**自检**：
- 每个 REQ 至少有 API 通道测试用例
- 每个 test_level: "e2e" 的 AC 同时生成 API 和 UI 通道
- 每个 API 步骤包含 db_assert（如有 data_model 定义）
- TC ID 与 AC ID 可追溯

**Step 4.4: 从 prd-contract.yaml 的 runtime 章节生成 runtime-contract.yaml（新增）**

> **目的**：为 Test 阶段的服务编排启动提供运行时环境配置。
> **详细格式见 `.cursor/references/runtime-protocol.md` — 运行时契约格式章节。**

**生成规则**：

| 信息来源 | runtime-contract 字段 | 说明 |
|---------|----------------------|------|
| prd-contract.yaml runtime.services[] | services[] | 服务启动配置 |
| Research 记忆 service-registry.md | services[].health_check | 服务端口和健康检查端点 |
| Research 记忆 project-overview.md | services[].build_command | 构建命令推断 |
| Research 记忆 config.md | infrastructure[] | 基础设施连接信息 |
| prd-contract.yaml runtime.frontend | frontend[] | 前端启动配置 |

**自动推断规则**：

| 项目类型 | build_command | start_command | health_check |
|---------|--------------|---------------|-------------|
| Java SpringBoot | `mvn clean package -DskipTests -q` | `java -jar target/{name}.jar --spring.profiles.active=test` | `/actuator/health` |
| Vue | - | `npm run dev` | 页面根路径 `/` |
| React | - | `npm start` | 页面根路径 `/` |

**写入路径**：`.dev-flow/contracts/{需求简称}/runtime-contract.yaml`

**自检**：
- 所有受影响的服务都在 services[] 中
- 健康检查端点正确
- 启动顺序符合依赖关系
- 基础设施连接信息完整

> **⚠️ 降级兼容**：如果 runtime-contract.yaml 不存在，Test 阶段将跳过服务编排，假设服务已手动启动，行为与 v3.4.0 一致。

**Step 5: 需求追溯与验收标准**

> **注意**：需求追踪矩阵和验收标准已内嵌到 `prd-contract.yaml` 的 `traceability` 和 `requirements[].acceptance` 章节中，不再单独生成文件。
> 每个 REQ-XXX 必须分配唯一 ID，后续 Design、Develop、Test 阶段都从此 ID 追溯。

**每个功能点必须分配 REQ-XXX 格式的唯一 ID**，后续 Design、Develop、Test 阶段都会引用此 ID 确保追溯。

**自检**：
- 每个功能点是否都已分配 REQ-XXX ID（在 requirements[] 中）
- ID 编号是否连续无跳号
- 每个 REQ 至少有 2 个 must 级验收标准（在 acceptance[] 中）
- 验收标准描述明确、可量化（不能是"功能正常"这样的模糊描述）
- 每个验收标准标注了 test_level（unit/e2e/integration）

**Step 6: 自检**
- 验证每个功能点是否都有对应的已有代码关联
- 验证影响范围是否完整覆盖所有受影响模块（Java 项目需覆盖 Entity/Mapper/Service/Controller/DTO/Enum）
- 验证歧义项是否都已提出澄清建议
- 验证预计文件列表是否符合项目分层架构规范
- 验证 prd-contract.yaml 所有必填章节已填写（meta/overview/requirements/enums/workflows/cross_service_calls/non_functional/traceability/self_check）
- 验证每个 REQ 的 acceptance 包含高层断言（assertions）
- 验证 self_check 所有项均为 true
- **多服务模式额外验证**：
  - 是否所有受影响的服务都被识别到
  - 跨服务调用链是否完整（A → B → C 的间接依赖是否考虑）
  - 公共模块的变更是否会影响其他未识别的服务
  - Feign Client 变更是否与依赖图谱一致

**Step 7: 🔴 生成阶段交付物（v3.1 新增）**
> **目的**：生成独立的阶段交付物文档，供主 Agent 打开给用户审阅。

**交付物路径**：`.dev-flow/deliverables/{需求简称}/PRD-{需求简称}.md`
**契约路径**：`.dev-flow/contracts/{需求简称}/prd-contract.yaml`

**交付物内容**：
```markdown
<!-- @generated-by: analyze-expert subagent | session: {session-id} | stage: analyze -->

# PRD：{需求标题}

<!-- last-updated: YYYY-MM-DD HH:mm -->
<!-- status: analyzed -->
<!-- prd-contract: .dev-flow/contracts/{需求简称}/prd-contract.yaml -->

## 1. 基本信息
| 项目 | 内容 |
|------|------|
| 需求标题 | {标题} |
| PRD 编号 | PRD-{YYYY}-{NNN} |
| 需求类型 | 新功能 / 功能增强 / Bug 修复 / 重构 / 性能优化 |
| 优先级 | P0 / P1 / P2 / P3 |
| 分析时间 | YYYY-MM-DD HH:mm |
| 影响服务 | {服务列表} |

## 2. 需求概述
{从 overview 章节渲染}

## 3. 核心功能点
| # | ID | 功能点 | 类型 | 描述 | 优先级 |
|---|-----|--------|------|------|--------|
| 1 | REQ-001 | ... | crud | ... | P0 |

## 4. 影响范围分析
| 服务 | 影响类型 | 说明 |
|------|----------|------|
| ... | ... | ... |

## 5. 预计新增/修改文件
| 服务 | 模块 | 类型 | 文件路径 | 操作 | 说明 |
|------|------|------|----------|------|------|

## 6. 数据模型
{从 requirements[].data_model 渲染}

## 7. 业务流程与状态机
{从 workflows 渲染}

## 8. 业务规则
{从 requirements[].rules 渲染}

## 9. 异常场景
{从 requirements[].exceptions 渲染}

## 10. API 交互
{从 requirements[].api 渲染}

## 11. 跨服务调用
{从 cross_service_calls 渲染}

## 12. 验收标准
| # | ID | 关联 REQ | 描述 | 优先级 | 测试级别 |
|---|-----|---------|------|--------|---------|
| 1 | AC-001-1 | REQ-001 | ... | must | e2e |

## 13. 非功能需求
{从 non_functional 渲染}

## 14. 需求一致性校验
| # | 检查类型 | 结果 | 说明 |
|---|---------|------|------|
| 1 | 逻辑矛盾检测 | ✅/❌ | ... |

## 15. 歧义与待确认项
（如有）

## 16. 自检结果
{从 self_check 渲染}
```

**自检**：
- 交付物文件已生成且内容非空
- 包含 `@generated-by: analyze-expert subagent` 溯源注释
- 所有 REQ-XXX 功能点均已列出
- prd-contract.yaml 所有必填章节已填写
- 验收标准已关联到每个 REQ

**暂停，等待用户确认。**

---

### ✅ 阶段确认清单

| # | 确认项 | 状态 |
|---|--------|------|
| 0 | **执行者审计**：本阶段由 analyze-expert subagent 执行，主 Agent 未直接编辑任何文件 | ⬜ 待确认 |
| 1 | 所有功能点已识别且描述清晰无歧义 | ⬜ 待确认 |
| 2 | 需求一致性校验通过（无逻辑矛盾） | ⬜ 待确认 |
| 3 | 影响范围已完整覆盖所有受影响的模块和服务 | ⬜ 待确认 |
| 4 | 预计新增/修改文件列表符合项目分层架构规范 | ⬜ 待确认 |
| 5 | 歧义项已全部澄清或提出建议方案 | ⬜ 待确认 |
| 6 | 跨服务调用链（多服务模式）已完整识别 | ⬜ 待确认 |
| 7 | PRD 契约已输出（prd-contract.yaml 完整，每个 REQ 至少 2 个 must 级验收标准） | ⬜ 待确认 |
| 8 | 需求追踪矩阵已内嵌到 prd-contract.yaml（REQ-XXX ID 完整无跳号） | ⬜ 待确认 |
| 9 | PRD 文档（人类可读）已生成且内容完整 | ⬜ 待确认 |
| 10 | **测试用例契约**：test-case-contract.yaml 已生成，每个 REQ 至少有 API 通道测试用例，DB 断言已定义 | ⬜ 待确认 |
| 11 | **运行时契约**：runtime-contract.yaml 已生成，服务启动命令和健康检查端点正确 | ⬜ 待确认 |
| 12 | **产品输入解析**：产品需求文档已完整解析（如有），无遗漏功能点 | ⬜ 待确认 |

**用户操作**：确认无误 → 回复 "确认" 进入 Design 阶段（系统自动写入 `analyze.confirmed`）；需要修改 → 指出具体问题

> **阶段确认机制和交付物协议详见 `.cursor/references/protocol.md`。**

---
