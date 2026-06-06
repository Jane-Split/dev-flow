---
stage: Design
type: stage-instruction
---

## 阶段三：Design（详细设计）

### 🔔 入口 Banner（本阶段开始时输出）

```
▶ Design（详细设计）
════════════════════════════════════
目标：生成详细设计方案，定义接口契约
输出：design-result.md, design-contract.yaml
模式：L1 / L2 / L3
预计：5-15 分钟
════════════════════════════════════
```

### 触发条件
- 全流程模式（Analyze 确认后）
- 用户输入 `/dev-flow -design <需求>`

### 🔴🔴 主 Agent 零编辑约束（本阶段入口铁律）

> **⚠️ 最高优先级**：主 Agent 在本阶段的唯一角色是**调度器**。
> **主 Agent 绝对禁止直接使用 Edit/Write 工具编辑本阶段的任何产出文件。**
> **所有文件编辑必须由 design-expert subagent 执行。**
> **完整零编辑铁律、失败硬阻断规则、交付物协议见 `.qoder/references/protocol.md`。**

### 🔴 入口前检查：阶段门禁

> **完整门禁检查流程见 `.qoder/references/protocol.md` — 阶段门禁检查章节。**
> **快速检查**：`.dev-flow/stage-confirmations/analyze.confirmed` 必须存在。

### 🔴 入口前检查：加载需求追踪矩阵

> **必须读取** `.dev-flow/docs/{需求简称}-traceability.yaml`，获取所有 REQ-XXX 需求 ID。
> 设计文档中的每个设计章节必须标注对应的 REQ-XXX ID，确保需求 → 设计的追溯关系。

```markdown
## 3.1 用户注册接口设计 [REQ-001]
...
## 3.2 用户登录接口设计 [REQ-002]
...
```

设计完成后，更新 traceability.yaml 中每个 REQ 的 design 字段：
```yaml
traceability:
  REQ-001:
    design:
      section: "3.1 用户注册接口设计"
      file: "design-result.md"
    status: designed  # analyzed → designed
```

### ⚠️ 重要：Design 输出规范（必须遵守）

> **Design 阶段的所有输出必须遵循以下规范，否则 Develop 阶段无法正确解析。**

#### Design 输出 JSON Schema

Design 阶段输出的所有设计必须包含以下结构化字段，用于 Develop 阶段自动解析：

**Entity 设计必须包含**：
```yaml
entity:
  className: "User"                    # 类名（必填）
  package: "com.xxx.entity"            # 包路径（必填）
  tableName: "t_user"                 # 数据库表名（必填）
  fields:
    - name: "id"                     # 字段名（必填）
      type: "Long"                   # Java 类型（必填，如 Long/String/byte/Integer）
      column: "id"                   # 数据库列名
      javaTypeNote: "使用包装类型 Long（可null），不用基本类型 long"  # 类型说明
    - name: "status"
      type: "byte"                   # ⚠️ 特殊类型必须标注
      javaTypeNote: "使用基本类型 byte，0=正常 1=禁用"
  getterSetterMethods:                 # ⚠️ 必须标注 getter/setter 方法名
    getId: "getUserId"               # 实际 getter 方法名
    getStatus: "getUserStatus"        # 实际 getter 方法名（含类名前缀）
    setStatus: "setUserStatus"        # 实际 setter 方法名
```

**⚠️ 字段类型规范（防止编译错误）**：
| Design 类型 | Java 类型 | 说明 |
|-------------|-----------|------|
| Long | `Long` | 包装类型，可为 null |
| long | `long` | 基本类型，不可为 null |
| byte | `byte` | 基本类型，赋值需 `(byte) 1` |
| Integer | `Integer` | 包装类型 |
| String | `String` | 字符串 |
| LocalDateTime | `LocalDateTime` | 日期时间 |

**⚠️ 方法命名规范（必须遵循项目实际命名）**：
- 必须通过读取已有 Entity 确认实际方法名
- 常见命名模式：`get{ClassName}{Field}()` 而非 `get{Field}()`
- 示例：`getUserStatus()` 而非 `getStatus()`

#### Design → Develop 数据交换格式

Design 阶段完成后，生成标准交换文件 `.dev-flow/docs/{需求简称}-design-contract.yaml`：

```yaml
# Design Contract（设计契约）
# 此文件是 Design → Develop 的标准数据交换格式
# Develop 阶段必须读取此文件

contract_version: "1.0"
demand_name: "用户管理模块"
generated_at: "2026-05-29 14:00:00"
generated_by: "Design Expert"

# Entity 定义
entities:
  - name: "User"
    package: "com.xxx.entity"
    table: "t_user"
    fields:
      - name: "id"
        type: "Long"
        getter: "getUserId"
        setter: "setUserId"
      - name: "status"
        type: "byte"
        getter: "getUserStatus"
        setter: "setUserStatus"
        typeNote: "基本类型，赋值需 (byte) 转换"
    primaryKey: "id"
    
  - name: "Role"
    package: "com.xxx.entity"
    table: "t_role"
    fields:
      - name: "id"
        type: "Long"
        getter: "getRoleId"
        setter: "setRoleId"
    primaryKey: "id"

# DTO 定义
dtos:
  - name: "UserRequestDTO"
    package: "com.xxx.dto"
    fields:
      - name: "username"
        type: "String"
        validation: "@NotBlank"
      - name: "status"
        type: "byte"
        typeNote: "对应 Entity 的 byte 类型"

# Service 定义
services:
  - name: "UserService"
    package: "com.xxx.service"
    methods:
      - name: "create"
        params: ["UserRequestDTO", "Long"]  # DTO + userId
        returnType: "User"
        throws: ["BusinessException"]

# Controller 定义
controllers:
  - name: "UserController"
    package: "com.xxx.controller"
    apis:
      - method: "POST"
        path: "/api/users"
        paramType: "UserRequestDTO"
        returnType: "ApiResponse<User>"

# Feign Client 定义（微服务）
feignClients:
  - name: "RoleApi"
    targetService: "role-service"
    methods:
      - name: "getById"
        path: "/api/roles/{id}"
        returnType: "RoleDTO"

# 枚举定义
enums:
  - name: "UserStatus"
    package: "com.xxx.enums"
    values:
      - name: "NORMAL"
        code: 0
        description: "正常"
      - name: "DISABLED"
        code: 1
        description: "禁用"
    methods:
      - name: "getCode"
        returnType: "int"
      - name: "fromCode"
        params: ["int"]
        returnType: "UserStatus"

# Mapper 定义
mappers:
  - name: "UserMapper"
    package: "com.xxx.mapper"
    entity: "User"
    extends: "BaseMapper<User>"
    customMethods:
      - name: "selectByCondition"
        params: ["UserQueryDTO"]
        returnType: "List<User>"
        sqlType: "XML" # XML / Annotation
        description: "条件查询"
      - name: "checkExistsByName"
        params: ["String"]
        returnType: "boolean"
        sqlType: "Annotation" # @Select
        description: "检查名称是否存在"

# 异常类定义
exceptions:
  - name: "UserException"
    package: "com.xxx.exception"
    parentException: "BusinessException"
    errorCodes:
      - code: "USER_NOT_FOUND"
        message: "用户不存在"
        httpStatus: 404
      - code: "USER_ALREADY_EXISTS"
        message: "用户已存在"
        httpStatus: 409

# 跨子任务接口契约定义
interfaces:
  serviceContracts:
    - name: "UserService"
      package: "com.xxx.service"
      methods:
        - name: "getById"
          params: ["Long"]
          returnType: "User"
          stability: "frozen"  # frozen = 设计确认后不可随意修改
          description: "根据ID查询用户"
          
  eventContracts:
    - name: "OrderCreatedEvent"
      topic: "order-events"
      payload:
        - name: "orderId"
          type: "Long"
        - name: "userId"
          type: "Long"
        - name: "totalAmount"
          type: "BigDecimal"
      stability: "frozen"
      
  dataContracts:
    - name: "UserSummary"
      fields:
        - name: "id"
          type: "Long"
        - name: "username"
          type: "String"
        - name: "status"
          type: "UserStatus"
      stability: "frozen"
```

#### Design Contract 多语言格式

> **Design Contract 支持多种语言。根据 Research 阶段识别的项目类型，选择对应的契约格式。**

**语言选择规则**：

| 项目类型 | 契约格式 | 位置 |
|---------|---------|------|
| Java（默认） | YAML（见上方 Java Design Contract） | design.md 内联 |
| TypeScript / 前端 | TypeScript Contract | `.qoder/references/design-contract-typescript.md` |
| Python / 后端 | Python Contract | `.qoder/references/design-contract-python.md` |
| Go / 后端 | Go Contract | `.qoder/references/design-contract-go.md` |

> **选择规则**：design-expert subagent 读取 Research 阶段的 `project-overview.md` 识别项目语言，
> 然后按需加载对应的 Contract 参考文件。Java 项目直接使用上方的内联格式。

---

#### 方法命名规范检查（Design 阶段必须执行）

**Step 0.5: 方法命名规范检查（🔴 必须执行）**

> **目的**：确保 Design 阶段输出的方法名与实际代码一致，防止 Develop 阶段生成错误的调用代码。

**检查流程**：

```
1. 读取已有 Entity 定义
   Read: {EntityPath}.java
   
2. 提取实际 getter/setter 方法名
   实际方法：
   - getUserId() / setUserId()
   - getUserStatus() / setUserStatus()
   
3. 对比 Design 输出
   Design 输出：getStatus()
   实际方法：getUserStatus()
   是否一致：❌ 不一致
   
4. 修正 Design 输出
   Design 输出：getUserStatus()
   是否一致：✅ 一致
```

**常见错误模式**：

| Design 猜测 | 实际方法名 | 原因 |
|-------------|-----------|------|
| getStatus() | getUserStatus() | Entity 方法名包含类名前缀 |
| getId() | getInspectionBatchId() | Entity 方法名包含业务前缀 |
| setName() | setUserName() | Entity 方法名包含类名前缀 |

**输出方法命名检查表**：

```markdown
### 方法命名规范检查

| Entity | Design 方法名 | 实际方法名 | 一致性 | 修正后 |
|--------|-------------|-----------|--------|--------|
| User | getId() | getUserId() | ❌ | getUserId() |
| User | getStatus() | getUserStatus() | ❌ | getUserStatus() |
| Role | getId() | getRoleId() | ❌ | getRoleId() |
```

---

### 执行步骤

> **⚠️ 以下步骤由 design-expert subagent 在独立上下文中执行，主 Agent 不直接执行这些步骤。主 Agent 的职责是：创建 subagent → 传递上下文 → 等待结果 → 向用户汇报。**

**Step 0: 读取项目记忆**
- 读取 `.dev-flow/memory/project-overview.md` - 了解项目技术栈和架构
- 读取 `.dev-flow/memory/architecture.md` - 了解架构决策和约束
- 读取 `.dev-flow/memory/conventions.md` - 了解编码规范
- **如果是 Java 微服务（多服务模式），额外读取：**
  - `.dev-flow/memory/service-registry.md` - 了解所有服务的角色、端口、模块结构
  - `.dev-flow/memory/dependency-graph.md` - 了解服务间依赖关系和 Feign 调用链
  - `.dev-flow/memory/common-modules.md` - 了解可复用的公共类
- 确保设计方案符合项目整体架构

**Step 1: 数据层设计（按项目类型）**

**如果是 Java 微服务（多服务模式）：**
- **实体归属设计**：
  - 确定每个 Entity 属于哪个服务（数据归属原则：谁拥有数据的读写权限，谁负责存储）
  - 确定哪些 Entity 放在公共模块（多个服务共享的数据模型）
  - 确定哪些 Entity 放在服务专属模块（仅该服务使用）
- **Entity 设计**（同单服务模式）：
  - 类名、表名（`@TableName`）、主键策略
  - 字段名、类型、数据库列名（`@TableField`）
  - 字段校验注解（`@NotNull`、`@Size`、`@Email` 等）
  - 关联关系（`@OneToOne`、`@OneToMany`、`@ManyToMany`）
  - 逻辑删除字段（`@TableLogic`）
  - 自动填充字段（`@TableField(fill = FieldFill.INSERT)`）
- **DTO 放置策略**：
  - 跨服务传输的 DTO → 放在公共模块或被调用方的 Feign Client 所在模块
  - 服务内部使用的 DTO → 放在服务专属模块
  - Request/Response DTO → 放在服务专属模块
- **Enum 设计**：状态枚举、类型枚举、错误码枚举
  - 多服务共享的枚举 → 放在公共模块
  - 服务专属枚举 → 放在服务专属模块
- **数据库设计**：表结构、索引、外键约束（注意：微服务中不同服务使用不同数据库，避免跨库外键）

**如果是 Java 单服务项目：**
- **Entity 设计**：
  - 类名、表名（`@TableName`）、主键策略
  - 字段名、类型、数据库列名（`@TableField`）
  - 字段校验注解（`@NotNull`、`@Size`、`@Email` 等）
  - 关联关系（`@OneToOne`、`@OneToMany`、`@ManyToMany`）
  - 逻辑删除字段（`@TableLogic`）
  - 自动填充字段（`@TableField(fill = FieldFill.INSERT)`）
- **DTO 设计**：
  - Request DTO：请求参数、校验注解、分组校验
  - Response DTO：响应字段、脱敏处理
- **Enum 设计**：状态枚举、类型枚举、错误码枚举
- **数据库设计**：表结构、索引、外键约束

**如果是前端项目：**
- 设计数据模型（TypeScript interface）
- 定义字段、类型、默认值、验证规则
- 设计模型间关系

**Step 2: 接口层设计**

**如果是 Java 微服务（多服务模式），额外设计 Feign Client 接口：**
- **Feign Client 接口设计**：
  - 接口名、`@FeignClient(name = "目标服务名")` 注解
  - 方法签名（路径、请求参数、返回值）
  - 放置位置：调用方服务的 client 模块
  - 跨服务传输的 DTO 定义（放在 client 模块或公共模块）
  - 超时配置、熔断降级策略（如有）
  - 错误码映射（目标服务的错误码如何映射到调用方的错误处理）

**通用接口层设计（所有 Java 项目）：**
- 设计 RESTful API 端点（方法、路径、请求体、响应体）
- 定义错误码和错误响应格式
- 设计认证和权限要求（`@PreAuthorize`、`@RolesAllowed`）
- 设计接口版本控制策略

**Step 3: 分层架构设计（按项目类型）**

**如果是 Java 微服务（多服务模式）：**
- **跨服务模块放置设计**：
  - 对每个受影响的服务，根据 Research 阶段扫描结果，明确代码放置在哪个子模块中：
    - Entity → 放在含 `@Entity` / `@TableName` 注解的模块
    - DTO → 跨服务共享的放公共模块，服务内部的放服务专属模块
    - Mapper → 放在含 `@Mapper` 注解的模块
    - Service → 放在含 `@Service` 注解的模块
    - Controller → 放在含 `@Controller` / `@RestController` 注解的模块
    - Feign Client → 放在含 `@FeignClient` 注解的模块，或根据项目约定新建
  - **公共模块新增设计**：
    - 列出需要在公共模块中新增的类（Entity/DTO/Enum/Util）
    - 说明新增原因（哪些服务需要共享）
  - **Feign Client 生成计划**：
    - 列出需要新建或修改的 Feign Client 接口
    - 明确调用方服务、被调用方服务、方法签名
- **各服务内部分层设计**（同单服务模式）：
  - **Mapper 层设计**：继承 `BaseMapper` 还是自定义 SQL、XML 映射文件、复杂查询 SQL
  - **Service 层设计**：接口定义、实现类逻辑、事务边界、依赖注入
  - **Controller 层设计**：基础路径、端点方法、参数绑定、统一响应包装
  - **异常处理设计**：自定义异常类、全局异常处理器

**如果是 Java 单服务项目：**
- **Mapper 层设计**：
  - 继承 `BaseMapper` 还是自定义 SQL
  - 是否需要 XML 映射文件
  - 复杂查询的 SQL 设计
- **Service 层设计**：
  - 接口定义（方法签名、参数、返回值）
  - 实现类业务逻辑流程
  - 事务边界（`@Transactional`）
  - 依赖的 Service/Mapper 注入
- **Controller 层设计**：
  - 基础路径（`@RequestMapping`）
  - 端点方法（`@GetMapping`、`@PostMapping` 等）
  - 参数绑定（`@RequestBody`、`@PathVariable`、`@RequestParam`）
  - 统一响应包装（`ApiResponse<T>`）
- **异常处理设计**：
  - 自定义异常类
  - 全局异常处理器（`@ControllerAdvice`）

**如果是前端项目：**
- 设计组件树（页面 → 容器 → 展示组件）
- 定义每个组件的 Props 接口
- 定义组件间的数据流和事件流

**Step 4: 业务逻辑设计**
- 描述核心业务流程（用文字或流程图）
- 定义状态流转（如订单状态机）
- 定义事务边界和并发控制
- 定义缓存策略（Redis key 设计、过期时间）
- 定义消息队列使用（如果有异步处理）
- **如果是 Java 微服务（多服务模式），额外设计：**
  - **分布式事务考虑**：
    - 是否需要跨服务事务？如果需要，选择方案：
      - Seata（AT/TCC/Saga 模式）
      - 本地消息表 + 最终一致性
      - 事件驱动（Spring Cloud Stream / RocketMQ 事务消息）
      - 最大努力通知（对一致性要求不高的场景）
    - 如果不需要强一致性，说明各服务的最终一致性策略
  - **服务调用链设计**：
    - 请求从哪个服务进入，经过哪些服务，最终由哪个服务处理
    - 每个服务在调用链中的职责
    - 同步调用 vs 异步调用的选择
  - **跨服务错误处理**：
    - Feign 调用失败时的降级策略（fallback）
    - 超时处理策略
    - 重试策略（哪些操作可以重试，哪些不能）
    - 跨服务错误码传播机制

**Step 5: 自检**

- 检查每个功能点是否都有对应的 Entity、DTO、Service 方法覆盖
- 检查 API 端点是否都有对应的 Request/Response DTO
- 检查 Service 方法是否都有对应的 Mapper 查询支持
- 检查异常场景是否都有对应的错误码和处理方案
- 检查数据库设计是否符合范式要求
- **多服务模式额外验证**：
  - 检查跨服务调用是否有对应的 Feign Client 设计
  - 检查分布式事务方案是否合理（是否过度设计或设计不足）
  - 检查公共模块新增类是否会影响其他服务
  - 检查服务调用链是否有循环依赖
  - 检查跨服务 DTO 是否完整定义（调用方和被调用方一致）
  - 检查 Feign Client 接口是否与目标服务的 Controller 端点匹配

**Step 5.5: 🔴 设计完整性自检清单（🔴 必须执行，不允许跳过）**

> **目的**：系统化检查设计文档是否覆盖所有必要维度，防止遗漏边界条件、异常流程等。
> 每个检查项必须逐项确认，不通过的必须补充设计。

**自检清单（共 15 项）**：

```markdown
### 🔴 设计完整性自检报告

#### A. API 接口完整性
| # | 检查项 | 状态 | 说明 |
|---|--------|------|------|
| A1 | 所有 API 端点是否都设计了错误码（400/404/409/500） | ⬜ | 不能只有 200 成功 |
| A2 | 所有列表接口是否设计了分页参数 | ⬜ | pageNum/pageSize 或 limit/offset |
| A3 | 所有写接口是否设计了幂等性策略 | ⬜ | 防重复提交 |
| A4 | 所有接口是否设计了认证/授权要求 | ⬜ | @PreAuthorize 或类似 |

#### B. 数据完整性
| # | 检查项 | 状态 | 说明 |
|---|--------|------|------|
| B1 | 所有 Entity 是否设计了主键策略 | ⬜ | ID 生成方式 |
| B2 | 所有枚举字段是否有默认值 | ⬜ | 避免数据库插入 null |
| B3 | 所有时间字段是否设计了自动填充策略 | ⬜ | createTime/updateTime |
| B4 | 是否需要逻辑删除字段 | ⬜ | @TableLogic |
| B5 | 所有唯一约束是否已识别 | ⬜ | 唯一索引 |

#### C. 业务逻辑完整性
| # | 检查项 | 状态 | 说明 |
|---|--------|------|------|
| C1 | 所有状态变更是否有完整的状态机设计 | ⬜ | 状态→状态+触发条件 |
| C2 | 所有条件分支（if/else）是否都覆盖了 else 分支 | ⬜ | 不能只设计正常路径 |
| C3 | 所有跨服务调用是否设计了超时和降级策略 | ⬜ | 多服务模式必须 |
| C4 | 所有写操作是否设计了事务边界 | ⬜ | @Transactional |
| C5 | 所有查询操作是否正确标注为只读事务 | ⬜ | @Transactional(readOnly=true) |

#### D. 契约完整性
| # | 检查项 | 状态 | 说明 |
|---|--------|------|------|
| D1 | Design Contract YAML 字段是否与设计文档一致 | ⬜ | 无遗漏/不一致 |
| D2 | 所有 getter/setter 方法名是否与实际代码匹配 | ⬜ | Step 0.5 检查 |
| D3 | 所有跨子任务接口是否已定义为 stability: frozen | ⬜ | 防止后续阶段随意修改 |

自检结果：通过 __ / 16 项
未通过项及补充方案：
- [ ] __: __
```

**自检不通过的处理**：
- 不通过的检查项 → 立即补充对应设计
- 补充后重新执行自检，直到全部通过
- 自检报告写入设计文档的"自检结果"章节

**Step 6: 写入项目记忆并输出文档**

> **🔴 必须输出正式文档**：将设计结果写入独立文档文件，方便用户追溯。

**输出文档**：
- **正式文档**：`.dev-flow/docs/{需求简称}-详细设计.md`
- **会话记录**：追加到 `.dev-flow/sessions/` 当前会话文件
- **更新记忆**：如有新架构决策更新 `decisions.md`，如有新模式更新 `patterns.md`

**文档模板**：
```markdown
# 详细设计：{需求标题}

<!-- last-updated: YYYY-MM-DD HH:mm -->
<!-- status: designed | approved | deprecated -->

## 1. 设计概述
| 项目 | 内容 |
|------|------|
| 需求标题 | {标题} |
| 设计时间 | YYYY-MM-DD HH:mm |
| 涉及服务 | {服务列表} |
| 新增文件 | {文件列表} |
| 修改文件 | {文件列表} |

## 2. 数据层设计
### 数据库设计
| 表名 | 说明 | 主要字段 |
|------|------|----------|

### Entity 设计
（完整代码）

### DTO 设计
（Request/Response DTO 完整代码）

### Enum 设计
（枚举完整代码）

## 3. 接口层设计
### Service 接口
（接口定义代码）

### Feign Client（跨服务）
（Feign Client 代码）

### REST API
| Controller | 方法 | 端点 | 说明 |
|-----------|------|------|------|

## 4. 业务逻辑设计
### 核心算法
（伪代码或流程描述）

### 事务处理
（事务边界和隔离级别）

### 并发控制
（锁策略、乐观锁/悲观锁）

## 5. 自检结果
| 检查项 | 结果 |
|--------|------|
| 符合编码规范 | ✅/❌ |
| 无循环依赖 | ✅/❌ |
| Feign Client 匹配 | ✅/❌ |

## 6. 用户确认
- [ ] 用户已确认设计方案
```

**输出格式**：

**如果是 Java 微服务（多服务模式）：**
```markdown
## 设计文档：[需求标题]

### 跨服务设计总览
| 维度 | 说明 |
|------|------|
| 涉及服务 | [服务A]、[服务B]、[公共模块] |
| 服务调用链 | [请求入口服务] → [中间服务] → [数据服务] |
| 分布式事务方案 | [Seata AT / 最终一致性 / 无需跨服务事务] |
| 新增 Feign Client | [XxxClient]、[YyyClient] |
| 公共模块变更 | 新增 [XxxDTO]、[XxxEnum] |

### 服务：[服务A] 设计
#### 数据库设计
| 表名 | 说明 | 主要字段 |
|------|------|----------|
| xxx | xxx 表 | id, name, ... |

#### Entity 设计
```java
@Data
@TableName("xxx")
public class Xxx {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    @TableField("name")
    @NotNull(message = "名称不能为空")
    private String name;
}
```

#### DTO 设计
**XxxRequest**
```java
@Data
public class XxxRequest {
    @NotNull(message = "名称不能为空")
    @Size(max = 50, message = "名称最多50字符")
    private String name;
}
```

#### API 设计
| 方法 | 路径 | 说明 | 请求体 | 响应体 |
|------|------|------|--------|--------|
| POST | /api/xxx | 创建 | XxxRequest | ApiResponse<Xxx> |
| GET | /api/xxx/{id} | 查询 | - | ApiResponse<Xxx> |

#### Service 设计
**接口方法**
```java
ApiResponse<Xxx> create(XxxRequest request);
ApiResponse<Xxx> getById(Long id);
```

**实现逻辑**
1. 参数校验
2. 业务逻辑处理
3. 数据库操作
4. 返回结果

#### 异常设计
| 场景 | 异常类 | 错误码 | HTTP 状态 |
|------|--------|--------|-----------|
| 参数错误 | BusinessException | 400001 | 400 |
| 资源不存在 | ResourceNotFoundException | 404001 | 404 |

### 服务：[服务B] 设计
（同上结构）

### Feign Client 设计
| Feign Client | 调用方 | 目标服务 | 方法 | 说明 |
|-------------|--------|----------|------|------|
| XxxClient | 服务A | 服务B | getXxxById() | 查询 xxx 数据 |

**XxxClient 接口定义**
```java
@FeignClient(name = "服务B", fallbackFactory = XxxClientFallbackFactory.class)
public interface XxxClient {
    @GetMapping("/api/xxx/{id}")
    ApiResponse<XxxDTO> getXxxById(@PathVariable("id") Long id);
}
```

### 公共模块变更
| 模块 | 类型 | 类名 | 说明 |
|------|------|------|------|
| common-bean | DTO | XxxDTO | 跨服务传输 DTO |
| common-bean | Enum | XxxType | 共享枚举 |
```

**如果是 Java 单服务项目：**
```markdown
## 设计文档：[需求标题]

### 数据库设计
| 表名 | 说明 | 主要字段 |
|------|------|----------|
| xxx | xxx 表 | id, name, ... |

### Entity 设计
```java
@Data
@TableName("xxx")
public class Xxx {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    @TableField("name")
    @NotNull(message = "名称不能为空")
    private String name;
}
```

### DTO 设计
**XxxRequest**
```java
@Data
public class XxxRequest {
    @NotNull(message = "名称不能为空")
    @Size(max = 50, message = "名称最多50字符")
    private String name;
}
```

### API 设计
| 方法 | 路径 | 说明 | 请求体 | 响应体 |
|------|------|------|--------|--------|
| POST | /api/xxx | 创建 | XxxRequest | ApiResponse<Xxx> |
| GET | /api/xxx/{id} | 查询 | - | ApiResponse<Xxx> |

### Service 设计
**接口方法**
```java
ApiResponse<Xxx> create(XxxRequest request);
ApiResponse<Xxx> getById(Long id);
```

**实现逻辑**
1. 参数校验
2. 业务逻辑处理
3. 数据库操作
4. 返回结果

### 异常设计
| 场景 | 异常类 | 错误码 | HTTP 状态 |
|------|--------|--------|-----------|
| 参数错误 | BusinessException | 400001 | 400 |
| 资源不存在 | ResourceNotFoundException | 404001 | 404 |
```

**前端项目：**
```markdown
## 设计文档：[需求标题]

### 数据模型
\`\`\`typescript
interface User { ... }
\`\`\`

### API 设计
| 方法 | 路径 | 说明 | 请求体 | 响应体 |
|------|------|------|--------|--------|
| POST | /api/users | 创建用户 | CreateUserReq | User |

### 组件设计
| 组件 | 类型 | Props | 说明 |
|------|------|-------|------|
| UserList | 页面 | - | 用户列表页 |
| UserCard | 展示 | User | 用户卡片 |

### 业务流程
1. 用户打开页面 → 调用 GET /api/users → 渲染列表
2. 用户点击"新增" → 打开表单弹窗
3. ...
```

**Step 7: 🔴 生成阶段交付物（v3.1 新增）**

> **目的**：生成独立的阶段交付物文档，供主 Agent 打开给用户审阅。

**交付物路径**：`.dev-flow/deliverables/03-design-result.md`

**交付物内容**：
```markdown
<!-- @generated-by: design-expert subagent | session: {session-id} | stage: design -->

# 详细设计报告：{需求标题}

<!-- last-updated: YYYY-MM-DD HH:mm -->
<!-- status: designed -->

## 1. 设计概述
| 项目 | 内容 |
|------|------|
| 需求标题 | {标题} |
| 设计时间 | YYYY-MM-DD HH:mm |
| 涉及服务 | {服务列表} |
| 新增文件数 | X |
| 修改文件数 | X |

## 2. 数据层设计摘要
- Entity 定义清单（表名/类名/关键字段）
- DTO 定义清单
- Enum 定义清单

## 3. 接口层设计摘要
- REST API 端点清单（方法/路径/说明）
- Service 接口方法清单
- Feign Client 定义（如有）

## 4. 设计契约
- Design Contract 文件：`.dev-flow/docs/{需求简称}-design-contract.yaml`
- 契约版本：1.0
- 语言/框架：{技术栈}

## 5. 自检结果
| # | 检查项 | 结果 |
|---|--------|------|
| 1 | 设计完整性自检（16项） | 通过 X/16 |
| 2 | 方法命名规范检查 | ✅/❌ |
| 3 | 无循环依赖 | ✅/❌ |
| 4 | Feign Client 端点匹配 | ✅/❌ |

## 6. 设计决策
（记录关键设计决策及其理由）
```

**自检**：
- 交付物文件已生成且内容非空
- 包含 `@generated-by: design-expert subagent` 溯源注释
- Design Contract 引用正确
- 所有功能点都有对应设计覆盖

**暂停，等待用户确认。**

---

### ✅ 阶段确认清单

| # | 确认项 | 状态 |
|---|--------|------|
| 0 | **执行者审计**：本阶段由 design-expert subagent 执行，主 Agent 未直接编辑任何文件 | ⬜ 待确认 |
| 1 | 所有功能点都有对应的 Entity/DTO/Service/Controller 设计覆盖 | ⬜ 待确认 |
| 2 | Design Contract YAML 已生成且字段完整 | ⬜ 待确认 |
| 3 | 方法命名规范检查已完成（与实际代码一致） | ⬜ 待确认 |
| 4 | API 端点设计完整（HTTP 方法/路径/请求体/响应体/错误码） | ⬜ 待确认 |
| 5 | 跨服务 Feign Client 与目标 Controller 端点匹配（多服务模式） | ⬜ 待确认 |
| 6 | 分布式事务方案已设计（多服务模式，如需要） | ⬜ 待确认 |
| 7 | 自检通过（无循环依赖/无不匹配引用） | ⬜ 待确认 |
| 8 | 设计文档已输出 | ⬜ 待确认 |

**用户操作**：确认无误 → 回复 "确认" 进入 Task Split 阶段；需要修改 → 指出具体问题

> **阶段确认机制和交付物协议详见 `.qoder/references/protocol.md`。**

---
