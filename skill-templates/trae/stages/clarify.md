---
stage: Clarify
type: stage-instruction
---

## 阶段二：Clarify（需求澄清）

### 🔔 入口 Banner（本阶段开始时输出）

```
▶ Clarify（需求澄清）
════════════════════════════════════
目标：深度分析需求文档，结合项目上下文迭代问答，消除所有歧义
输出：clarification-result.yaml, 02-clarification-report.md
模式：迭代问答（自动收敛）
预计：3-10 分钟（取决于问答轮次）
════════════════════════════════════
```

### 触发条件
- 全流程模式（Research 确认后自动触发）
> **项目类型适配（v3.7.0）**：澄清维度按 `project_type` 自动选择：
> `frontend` → 侧重UI交互、组件复用（2个维度）；`backend` → 侧重API、数据模型（5个维度）；
> `java-microservice` → 全10个维度（含Entity/Service复用、跨服务调用）；`fullstack`/`java-fullstack` → 全10个维度。

- 用户输入 `/dev-flow -clarify <需求>`
- 用户输入 `/dev-flow -clarify @requirement.md`

### 🔴🔴 主 Agent 零编辑约束（本阶段入口铁律）

> **⚠️ 最高优先级**：主 Agent 在本阶段的唯一角色是**调度器**。
> **主 Agent 绝对禁止直接使用 Edit/Write 工具编辑本阶段的任何产出文件。**
> **所有文件编辑必须由 clarify-expert subagent 执行。**
> **完整零编辑铁律、失败硬阻断规则、交付物协议见 `references/protocol.md`。**

### 🔴 可选性说明

> **Clarify 是可选阶段**，跳过时整个流程回退为 8 阶段（与 v3.4.0 一致）。
> 跳过后 Analyze 阶段完整执行所有步骤（包括 Step 0.5 输入源解析和 Step 3 歧义识别）。
> 即使经过 Clarify，Analyze 的 Step 3 仍保留为兜底机制。

### 执行步骤

> **⚠️ 以下步骤由 clarify-expert subagent 在独立上下文中执行，主 Agent 不直接执行这些步骤。主 Agent 的职责是：创建 subagent → 传递上下文 → 等待结果 → 向用户汇报。**

**Step 0: 输入源识别与解析**

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
Step 0.1: 检测输入类型
  ├── 文件路径 → 读取文件 → 检测格式 → 解析
  ├── URL → 抓取内容 → 提取正文 → 解析
  ├── 产品需求模板 → 按章节结构解析
  └── 对话描述 → 直接使用

Step 0.2: 解析为需求草稿
  ├── 提取：业务背景 → overview
  ├── 提取：功能描述 → requirements[]（初始版，待 Step 1-3 补充技术细节）
  ├── 提取：页面交互 → 前端模块识别
  ├── 提取：数据要求 → data_model（初始版，待补充类型和约束）
  ├── 提取：验收标准 → acceptance[]（初始版，待补充断言）
  └── 写入 .dev-flow/contracts/{需求简称}/demand-draft.yaml

Step 0.3: 传递给 Step 1 继续流程
```

> **⚠️ 降级兼容**：如果用户直接在对话框中描述需求（无外部文档），跳过本步骤，直接进入 Step 1。

**Step 1: 项目上下文关联分析**

> **目的**：不仅识别需求本身的歧义，还结合项目代码生成技术关联确认项。这是 Clarify 相比 Analyze Step 3 的核心增强。

**读取项目记忆**：

```
必读：
  - .dev-flow/memory/project-overview.md    → 技术栈、架构
  - .dev-flow/memory/service-registry.md    → 服务列表（多服务模式）
  - .dev-flow/memory/dependency-graph.md    → 服务间依赖
  - .dev-flow/memory/common-modules.md      → 可复用公共类
  - .dev-flow/memory/conventions.md         → 编码规范
  - .dev-flow/memory/session/models.md      → 数据模型
  - .dev-flow/memory/session/apis.md        → API 端点

按需读取（根据需求关键词匹配）：
  - 需求涉及"用户"→ 读取 user-service 相关 Entity/Service/Controller
  - 需求涉及"订单"→ 读取 order-service 相关代码
  - 需求涉及"审批"→ 读取 workflow-service 相关代码
```

**关联分析维度（10 个维度）**：

| 分析维度 | 分析内容 | 问题生成示例 |
|---------|---------|------------|
| **已有 Entity 复用** | 需求中的数据实体是否与已有 Entity 重叠 | "需求提到'产品'，项目中已有 `Product` 实体（含 id/name/spec 字段），是否复用？" |
| **已有 Service 复用** | 需求中的业务逻辑是否已有 Service 实现 | "需求提到'查询产品列表'，项目中已有 `ProductService.list()`，是否复用？" |
| **已有 API 端点** | 需求中的接口是否与已有端点冲突或重叠 | "需求要求 `GET /api/products`，但项目已有该端点，是扩展还是新建？" |
| **已有枚举复用** | 需求中的枚举值是否与已有枚举重叠 | "需求提到'状态：待审批/已通过/已驳回'，项目已有 `ApprovalStatusEnum`，是否复用？" |
| **跨服务调用** | 需求是否需要调用其他服务 | "需求提到'审批'，项目已有 `workflow-service`，是否通过 Feign 调用？" |
| **公共模块变更** | 需求是否需要在公共模块新增类 | "需求涉及跨服务共享 DTO，是否放在 `common-bean` 模块？" |
| **中间件依赖** | 需求是否需要引入新的中间件 | "需求提到'消息通知'，项目已集成 RabbitMQ，是否复用？" |
| **数据权限** | 需求是否涉及数据隔离 | "需求提到'部门级数据隔离'，项目已有 `DataScope` 注解，是否复用？" |
| **状态机** | 需求是否涉及状态流转 | "需求提到状态变更，项目是否有通用状态机框架？" |
| **前端组件复用** | 需求中的页面是否与已有组件重叠 | "需求提到'列表页+表单弹窗'，项目已有 `ProTable` + `ModalForm`，是否复用？" |

**Step 2: 生成问题清单**

> 将 Step 1 的分析结果转化为结构化问题清单，一次性提交给用户。

**问题分类体系**：

```yaml
questions:
  # A 类：业务歧义（需求文档本身的模糊/缺失）
  - id: "Q-R1-001"
    category: "business_ambiguity"       # 业务歧义
    dimension: "missing_info"            # 缺失信息
    question: "审批流程中，如果审批人超过 24 小时未审批，系统应如何处理？"
    default_assumption: "超时后自动提醒审批人，不自动通过或驳回"
    impact: "影响审批状态机设计"
    source: "需求文档未定义审批超时策略"

  # B 类：项目技术关联（结合项目代码的确认项）
  - id: "Q-R1-002"
    category: "project_technical"        # 项目技术关联
    dimension: "entity_reuse"            # Entity 复用
    question: "需求提到的'产品'与项目中已有的 Product 实体是否为同一实体？"
    default_assumption: "是同一实体，复用 Product 类"
    impact: "影响数据模型设计——复用则无需新建表，否则需新建"
    source: "项目已有 com.xxx.entity.Product（含 id/name/spec 字段）"
    related_code: "com.xxx.entity.Product"

  # C 类：业务规则确认（需要用户明确的业务约束）
  - id: "Q-R1-003"
    category: "business_rule"            # 业务规则确认
    dimension: "concurrency"             # 并发策略
    question: "同一条不合格品记录，是否允许两个审批人同时审批？"
    default_assumption: "不允许，使用乐观锁保证只有一个审批人能成功"
    impact: "影响并发控制策略和错误码设计"
    source: "需求文档未定义并发审批行为"
```

**问题优先级排序**：

| 优先级 | 类别 | 说明 |
|--------|------|------|
| P0 | 业务歧义（阻塞型） | 不确认则无法继续设计 |
| P1 | 项目技术关联 | 不确认可能导致返工 |
| P2 | 业务规则确认 | 影响细节但不阻塞主流程 |

**问题展示格式**（给用户看的）：

```markdown
### ⚠️ 需求澄清 — 第 {N} 轮（共 {M} 个问题）

> 以下问题基于需求文档分析和项目代码关联发现，请逐项确认或补充。

#### 🔴 P0 — 必须确认（阻塞设计）

| # | 问题 | 默认假设 | 你的回答 |
|---|------|---------|---------|
| 1 | {问题} | {默认假设} | ❓ |

#### 🟡 P1 — 建议确认（避免返工）

| # | 问题 | 默认假设 | 你的回答 |
|---|------|---------|---------|
| 2 | {问题} | {默认假设} | ❓ |

#### 🟢 P2 — 可选确认（影响细节）

| # | 问题 | 默认假设 | 你的回答 |
|---|------|---------|---------|
| 3 | {问题} | {默认假设} | ❓ |

**回复方式**：
- 逐项回复："第1项：XXX；第2项确认；第3项确认..."
- 全部接受默认："全部确认"
- 补充说明：提供更多信息
```

**Step 3: 用户回答收集与整合**

> 主 Agent 收集用户回答后，传递给 clarify-expert subagent 进行整合分析。

**用户回答解析**：

```yaml
answers:
  - question_id: "Q-R1-001"
    answer: "超时后自动驳回"
    is_custom: true           # 非默认假设
  - question_id: "Q-R1-002"
    answer: "确认"
    is_custom: false          # 接受默认假设
```

**Step 4: 收敛检测（核心算法）**

> 这是自动收敛的关键机制。

```
🔴 收敛检测算法

Step 4.1: 整合用户回答到需求理解
  ├── 将 answers[] 合并到 demand-draft.yaml
  ├── 更新 requirements[] 中的业务规则
  ├── 更新 data_model 中的实体定义
  └── 更新 workflows 中的状态机

Step 4.2: 重新分析（与 Step 1 相同的分析维度）
  ├── 基于更新后的需求理解，重新执行关联分析
  ├── 检查用户回答是否引入新的歧义或矛盾
  │   示例：用户回答"超时后自动驳回"→ 新问题："自动驳回后，质检员是否可以重新提交？"
  └── 检查用户回答是否与项目代码产生新冲突
      示例：用户回答"不走 workflow-service"→ 新问题："审批流如何实现？自建审批表？"

Step 4.3: 新问题生成
  ├── 过滤规则：已问过且已回答的问题不再重复
  ├── 过滤规则：与已确认答案一致的新发现不算新问题
  └── 生成新问题清单（仅包含真正的新问题）

Step 4.4: 收敛判定
  │
  ├── new_question_count = 0 → ✅ 收敛，进入 Step 5
  │
  ├── new_question_count > 0 且 round < MAX_ROUNDS(5) → 继续下一轮
  │   ├── 生成新问题清单
  │   ├── 提交给用户
  │   └── 回到 Step 3
  │
  └── new_question_count > 0 且 round >= MAX_ROUNDS(5) → ⚠️ 强制收敛
      ├── 未解决问题标记为 "unresolved"
      ├── 使用默认假设填充
      └── 进入 Step 5（在报告中标注未解决项）
```

**收敛检测规则**：

| 规则 | 说明 |
|------|------|
| **去重规则** | 同一问题不同表述视为同一问题，不重复提问 |
| **依赖规则** | 用户回答 A 后可能暴露对 B 的影响，B 成为新问题 |
| **矛盾检测** | 用户回答与已有项目代码矛盾时，生成确认项 |
| **最大轮次** | 10 轮，防止无限循环 |
| **最小轮次** | 至少 1 轮（即使需求非常清晰，也要确认项目技术关联） |

**Step 5: 生成澄清结果契约**

> 收敛后，生成 `clarification-result.yaml`，作为 Analyze 阶段的增强输入。

写入路径：`.dev-flow/contracts/{需求简称}/clarification-result.yaml`

结构化契约必须包含以下章节：

```yaml
# clarification-result.yaml — 澄清结果契约
# 路径: .dev-flow/contracts/{需求简称}/clarification-result.yaml

meta:
  demand_name: "{需求简称}"
  total_rounds: 3                      # 实际执行轮次
  total_questions: 15                  # 总问题数
  resolved_questions: 14               # 已解决问题数
  unresolved_questions: 1              # 未解决问题数（使用默认假设）
  convergence_type: "auto"             # auto | forced
  generated_at: "{ISO 8601 datetime}"

# 原始需求解析结果
demand_draft:
  source_type: "file"                  # file | url | dialog
  source_path: "@requirement.md"       # 原始输入
  overview:                            # 从需求文档提取
    background: "..."
    objective: "..."
    target_users: [...]
  requirements: [...]                  # 初始功能点列表
  data_model: [...]                    # 初始数据模型
  acceptance: [...]                    # 初始验收标准

# 所有问答记录（完整追溯）
qa_records:
  - round: 1
    questions:
      - id: "Q-R1-001"
        category: "business_ambiguity"
        question: "审批超时如何处理？"
        default_assumption: "超时提醒"
        answer: "超时后自动驳回"
        is_custom: true
        impact: "状态机需增加超时自动驳回转换"
      - id: "Q-R1-002"
        category: "project_technical"
        question: "产品是否复用已有 Product 实体？"
        default_assumption: "是"
        answer: "确认"
        is_custom: false
        related_code: "com.xxx.entity.Product"
    new_questions_count: 5

  - round: 2
    questions:
      - id: "Q-R2-001"
        category: "business_ambiguity"
        question: "自动驳回后，质检员是否可以重新提交？"
        default_assumption: "可以重新提交"
        answer: "可以，但需修改缺陷描述后才能重新提交"
        is_custom: true
        impact: "状态机需增加 已驳回→待审批 转换"
    new_questions_count: 0              # 收敛！

# 澄清后的需求理解（整合所有问答后的完整版本）
clarified_requirements:
  overview:
    background: "..."
    objective: "..."
    target_users: [...]
    scope:
      services: [{name, impact_type}]
      frontend_modules: [...]
      common_module_changes: [...]
      database_changes: "..."

  requirements:                         # 澄清后的功能点（已补充业务规则和异常处理）
    - id: "REQ-001"
      title: "不合格品登记"
      type: "crud"
      priority: "P0"
      description: "..."
      preconditions: [...]
      postconditions: [...]
      rules:
        validation: [...]
        business: [...]
      exceptions:
        input: [...]
        business: [...]
        boundary: [...]

  data_model:                           # 澄清后的数据模型（已确认实体复用关系）
    entities:
      - name: "NonConformingProduct"
        reuse_existing: false            # 是否复用已有实体
        reused_entity: null
        fields: [...]
      - name: "Product"
        reuse_existing: true             # 复用已有 Product 实体
        reused_entity: "com.xxx.entity.Product"
        additional_fields: []            # 需要额外新增的字段

  workflows: [...]                      # 澄清后的状态机

  cross_service_calls: [...]            # 澄清后的跨服务调用

# 项目技术关联确认结果
project_context_decisions:
  entity_reuse:
    - entity: "Product"
      decision: "reuse"
      source_class: "com.xxx.entity.Product"
  service_reuse:
    - service_method: "ProductService.list()"
      decision: "reuse"
  api_conflict:
    - endpoint: "GET /api/products"
      decision: "extend"                # extend | new | modify
  enum_reuse:
    - enum: "ApprovalStatusEnum"
      decision: "reuse"
  middleware:
    - name: "RabbitMQ"
      decision: "reuse_existing"         # 复用现有 RabbitMQ
  frontend_component:
    - component: "ProTable"
      decision: "reuse"

# 未解决问题（使用默认假设）
unresolved:
  - question_id: "Q-R3-001"
    question: "处置登记时，返工任务是否需要关联生产工单？"
    default_assumption: "不关联，仅记录返工处置"
    reason: "达到最大轮次限制，用户未回答"
```

**Step 6: 生成阶段交付物**

**交付物路径**：`.dev-flow/deliverables/{需求简称}/02-clarification-report.md`

**交付物内容**：
```markdown
<!-- @generated-by: clarify-expert subagent | session: {session-id} | stage: clarify -->

# 需求澄清报告：{需求标题}

<!-- last-updated: YYYY-MM-DD HH:mm -->
<!-- status: clarified -->
<!-- clarification-contract: .dev-flow/contracts/{需求简称}/clarification-result.yaml -->

## 1. 澄清概况

| 项目 | 内容 |
|------|------|
| 需求标题 | {标题} |
| 澄清时间 | YYYY-MM-DD HH:mm |
| 问答轮次 | N 轮 |
| 总问题数 | N 个 |
| 已解决 | N 个 |
| 未解决（使用默认假设） | N 个 |
| 收敛方式 | 自动收敛 / 强制收敛 |

## 2. 需求来源

| 项目 | 内容 |
|------|------|
| 输入类型 | 文件 / URL / 对话描述 |
| 来源路径 | @requirement.md |
| 解析状态 | ✅ 完整解析 |

## 3. 问答记录

### 第 1 轮（N 个问题）

| # | 类别 | 问题 | 默认假设 | 用户回答 | 是否自定义 |
|---|------|------|---------|---------|-----------|
| 1 | 业务歧义 | ... | ... | ... | ✅/❌ |
| 2 | 项目技术关联 | ... | ... | ... | ✅/❌ |

### 第 2 轮（N 个问题）
...

## 4. 澄清后的需求摘要

### 4.1 功能点清单

| # | ID | 功能点 | 类型 | 优先级 | 关键澄清项 |
|---|-----|--------|------|--------|-----------|

### 4.2 数据模型确认

| 实体 | 决策 | 说明 |
|------|------|------|
| Product | 复用已有 | com.xxx.entity.Product |
| NonConformingProduct | 新建 | 需新建表 |

### 4.3 跨服务调用确认

| 调用方 | 被调用方 | 决策 | 说明 |
|--------|---------|------|------|

### 4.4 状态机确认

```
[待审批] ──提交──→ [审批中] ──通过──→ [已通过] ──处置──→ [已处置]
                    │                    │
                    └──驳回──→ [已驳回] ──重新提交──→ [审批中]
```

## 5. 项目技术关联决策

| 维度 | 决策 | 涉及代码 | 说明 |
|------|------|---------|------|
| Entity 复用 | 复用 Product | com.xxx.entity.Product | 不新建产品表 |
| Service 复用 | 复用 ProductService.list() | com.xxx.service.ProductService | 扩展查询条件 |
| API 端点 | 扩展现有 | GET /api/products | 增加筛选参数 |
| 枚举复用 | 复用 ApprovalStatusEnum | com.xxx.enums.ApprovalStatusEnum | 新增 2 个枚举值 |
| 中间件 | 复用 RabbitMQ | 已有配置 | 使用现有消息队列 |

## 6. 未解决问题

| # | 问题 | 默认假设 | 风险 |
|---|------|---------|------|
| 1 | 返工任务是否关联生产工单？ | 不关联 | 可能需要后续补充 |

## 7. 收敛分析

| 轮次 | 新问题数 | 累计解决 | 说明 |
|------|---------|---------|------|
| 1 | 5 | 5 | 首轮：业务歧义 + 项目关联 |
| 2 | 2 | 7 | 回答引入新问题 |
| 3 | 0 | 7 | 收敛 ✅ |
```

**自检**：
- 交付物文件已生成且内容非空
- 包含 `@generated-by: clarify-expert subagent` 溯源注释
- 所有问答记录已完整追溯
- 澄清结果契约已输出
- 未解决问题已标注默认假设和风险

**暂停，等待用户确认。**

---

### ✅ 阶段确认清单

| # | 确认项 | 状态 |
|---|--------|------|
| 0 | **执行者审计**：本阶段由 clarify-expert subagent 执行，主 Agent 未直接编辑任何文件 | ⬜ 待确认 |
| 1 | 需求文档已完整解析，无遗漏功能点 | ⬜ 待确认 |
| 2 | 所有业务歧义已澄清或使用默认假设 | ⬜ 待确认 |
| 3 | 项目技术关联确认项已全部确认（Entity/Service/API/枚举复用） | ⬜ 待确认 |
| 4 | 跨服务调用关系已确认 | ⬜ 待确认 |
| 5 | 状态机流转已确认 | ⬜ 待确认 |
| 6 | 数据模型实体复用关系已确认 | ⬜ 待确认 |
| 7 | 澄清结果契约已输出（clarification-result.yaml 完整） | ⬜ 待确认 |
| 8 | 澄清报告已生成且内容完整 | ⬜ 待确认 |
| 9 | 未解决问题已标注默认假设和风险 | ⬜ 待确认 |

**用户操作**：确认无误 → 回复 "确认" 进入 Analyze 阶段（系统自动写入 clarify.confirmed）；需要修改 → 指出具体问题

> **阶段确认机制和交付物协议详见 `references/protocol.md`。**

---
