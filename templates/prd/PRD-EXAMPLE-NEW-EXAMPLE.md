# PRD 示例 — 新需求

> 本示例展示一个"不合格品登记与处置管理"的新需求如何填写 PRD 模板。
> 产品经理可直接参考此示例的填写风格和详细程度。

---

## 一、需求概述

### 1.1 基本信息 【必填】

| 项目 | 内容 |
|------|------|
| **需求标题** | 不合格品登记与处置管理 |
| **优先级** | P0(紧急) |
| **需求背景** | 当前产线发现不合格品后通过纸质单据登记，审批流程依赖线下签字，导致：1) 审批周期长（平均 3 天）；2) 数据无法实时统计；3) 不合格品处置记录缺失，无法追溯。需要建设线上化登记→审批→处置的全流程管理能力。 |
| **目标用户** | 质检员、质量主管、仓库管理员、生产主管 |
| **期望上线时间** | 2026-07-15 |

### 1.2 影响范围 【必填】

| 项目 | 内容 |
|------|------|
| **涉及服务/模块** | quality-management（质量服务，主服务）、warehouse-service（仓库服务，库存扣减）、workflow-service（审批服务，审批流） |
| **跨服务交互** | 是。审批调用 workflow-service、处置扣库存调用 warehouse-service |
| **公共模块变更** | 是。需在 common-bean 新增 NonConformingProductDTO、NCPStatusEnum |
| **数据库变更** | 新建 2 张表：non_conforming_product（不合格品主表）、disposition_record（处置记录表） |

---

## 二、功能点清单 【必填】

### 2.1 功能点列表

| # | 功能点名称 | 输入 | 输出 | 业务规则摘要 | 优先级 | 复杂度 |
|---|-----------|------|------|-------------|--------|--------|
| 1 | 不合格品登记 | 产品ID、批次号、缺陷类型、缺陷描述、缺陷数量、发现工序 | 不合格品编号、状态=待审批 | 编号格式 NC-{YYYYMMDD}-{4位序号}，同批次同缺陷类型防重复 | P0 | 中 |
| 2 | 提交审批 | 不合格品ID、审批意见 | 状态→审批中、审批流启动 | 待审批状态才能提交 | P0 | 低 |
| 3 | 审批通过 | 不合格品ID、审批意见 | 状态→已通过 | 审批中状态才能通过，乐观锁防并发 | P0 | 中 |
| 4 | 审批驳回 | 不合格品ID、驳回原因 | 状态→已驳回 | 审批中状态才能驳回 | P0 | 低 |
| 5 | 处置登记 | 不合格品ID、处置方式（返工/报废/让步接收）、处置说明 | 处置记录ID | 已通过才能处置，处置方式不同后续流程不同 | P0 | 高 |
| 6 | 不合格品列表查询 | 产品ID/批次号/状态/时间范围（筛选） | 分页列表（编号、产品、批次、状态、时间） | 支持多条件组合筛选，部门级数据隔离 | P1 | 中 |
| 7 | 不合格品详情查看 | 不合格品ID | 完整信息+处置记录列表 | 无 | P1 | 低 |

### 2.2 功能点说明 【必填】

#### 功能点 1：不合格品登记

| 项目 | 内容 |
|------|------|
| **详细描述** | 质检员在产线发现不合格品后，选择对应产品、填写批次号、选择缺陷类型（外观缺陷/尺寸偏差/功能异常/其他）、描述缺陷详情和数量，提交后系统自动生成编号并保存为"待审批"状态。 |
| **前置条件** | 质检员已登录，对应产品在系统中存在且未删除 |
| **后置条件** | 数据库新增一条 non_conforming_product 记录，status=0（待审批），recordCode 已生成 |
| **涉及实体** | NonConformingProduct |
| **涉及接口** | POST /api/quality/non-conforming-products |

#### 功能点 2：提交审批

| 项目 | 内容 |
|------|------|
| **详细描述** | 质检员对待审批的不合格品确认无误后，提交审批。系统调用 workflow-service 启动审批流程，将状态更新为"审批中"（1），并通知质量主管。 |
| **前置条件** | 不合格品存在且 status=0（待审批） |
| **后置条件** | status=1（审批中），workflow-service 中已创建审批实例 |
| **涉及实体** | NonConformingProduct |
| **涉及接口** | POST /api/quality/non-conforming-products/{id}/submit |

#### 功能点 3：审批通过

| 项目 | 内容 |
|------|------|
| **详细描述** | 质量主管审批通过后，系统将状态更新为"已通过"（2），记录审批人ID和审批时间，并通知质检员进行处置。 |
| **前置条件** | 不合格品存在且 status=1（审批中），当前用户有审批权限 |
| **后置条件** | status=2（已通过），approveUserId 和 approveTime 已填充 |
| **涉及实体** | NonConformingProduct |
| **涉及接口** | POST /api/quality/non-conforming-products/{id}/approve |

#### 功能点 4：审批驳回

| 项目 | 内容 |
|------|------|
| **详细描述** | 质量主管驳回时，系统将状态更新为"已驳回"（3），记录驳回原因和驳回时间，通知质检员。质检员可修改信息后重新提交。 |
| **前置条件** | 不合格品存在且 status=1（审批中），驳回原因不能为空 |
| **后置条件** | status=3（已驳回），rejectReason 和 rejectTime 已填充 |
| **涉及实体** | NonConformingProduct |
| **涉及接口** | POST /api/quality/non-conforming-products/{id}/reject |

#### 功能点 5：处置登记

| 项目 | 内容 |
|------|------|
| **详细描述** | 审批通过后，质检员根据审批意见选择处置方式（返工/报废/让步接收），填写处置说明。系统生成处置记录。若处置方式为"报废"，还需调用仓库服务扣减库存。若为"返工"，生成返工任务。若为"让步接收"，更新产品状态为已放行。 |
| **前置条件** | 不合格品存在且 status=2（已通过） |
| **后置条件** | 新增 disposition_record 记录，不合格品 status=4（已处置）。若报废则仓库库存已扣减。 |
| **涉及实体** | NonConformingProduct、DispositionRecord |
| **涉及接口** | POST /api/quality/non-conforming-products/{id}/disposition |

#### 功能点 6：不合格品列表查询

| 项目 | 内容 |
|------|------|
| **详细描述** | 支持按产品ID、批次号、状态、发现时间范围组合筛选，返回分页列表。仅显示当前用户所在部门的数据。列表按发现时间倒序排列。 |
| **前置条件** | 用户已登录 |
| **后置条件** | 无数据变更 |
| **涉及实体** | NonConformingProduct |
| **涉及接口** | GET /api/quality/non-conforming-products |

#### 功能点 7：不合格品详情查看

| 项目 | 内容 |
|------|------|
| **详细描述** | 查看不合格品完整信息（基本信息+审批记录+处置记录列表）。处置记录按处置时间正序排列。 |
| **前置条件** | 不合格品存在 |
| **后置条件** | 无数据变更 |
| **涉及实体** | NonConformingProduct、DispositionRecord |
| **涉及接口** | GET /api/quality/non-conforming-products/{id} |

---

## 三、数据模型 【必填】

### 3.1 核心实体

#### 实体：NonConformingProduct（不合格品）

| 字段名 | Java 类型 | 数据库类型 | 必填 | 默认值 | 说明 | 校验规则 | 关系 |
|--------|----------|-----------|------|--------|------|----------|------|
| id | Long | bigint | 自动 | - | 主键 | 自增 | - |
| record_code | String | varchar(32) | 是 | - | 不合格品编号 | 格式 NC-YYYYMMDD-XXXX | - |
| product_id | Long | bigint | 是 | - | 关联产品ID | @NotNull | → Product.id |
| batch_no | String | varchar(64) | 是 | - | 批次号 | @NotBlank, 最大 64 字符 | - |
| defect_type | Integer | tinyint | 是 | - | 缺陷类型 | @NotNull, 枚举值 1-4 | - |
| defect_description | String | varchar(500) | 是 | - | 缺陷描述 | @NotBlank, 最大 500 字符 | - |
| defect_quantity | Integer | int | 是 | - | 缺陷数量 | @Min(1) | - |
| discovery_process | String | varchar(64) | 是 | - | 发现工序 | @NotBlank | - |
| status | Byte | tinyint | 是 | 0 | 状态 | 枚举值 0-4 | - |
| discoverer_id | Long | bigint | 是 | - | 发现人ID | @NotNull | → User.id |
| department_id | Long | bigint | 是 | - | 所属部门ID | @NotNull | → Department.id |
| approver_id | Long | bigint | 否 | null | 审批人ID | 审批通过时填充 | → User.id |
| approve_time | LocalDateTime | datetime | 否 | null | 审批时间 | 审批通过时填充 | - |
| reject_reason | String | varchar(500) | 否 | null | 驳回原因 | 驳回时必填，最大 500 字符 | - |
| reject_time | LocalDateTime | datetime | 否 | null | 驳回时间 | 驳回时填充 | - |
| workflow_instance_id | String | varchar(64) | 否 | null | 审批流实例ID | 提交审批时填充 | - |
| version | Integer | int | 是 | 0 | 乐观锁版本号 | @Min(0) | - |
| deleted | Byte | tinyint | 是 | 0 | 逻辑删除标记 | 0=正常, 1=删除 | - |
| create_time | LocalDateTime | datetime | 是 | CURRENT_TIMESTAMP | 创建时间 | 自动填充 | - |
| update_time | LocalDateTime | datetime | 是 | CURRENT_TIMESTAMP | 更新时间 | 自动更新 | - |

**索引设计**：

| 索引名 | 字段 | 类型 | 说明 |
|--------|------|------|------|
| uk_record_code | record_code | 唯一索引 | 编号全局唯一 |
| idx_product_batch | product_id, batch_no | 普通索引 | 按产品+批次查询 |
| idx_status | status | 普通索引 | 按状态筛选 |
| idx_department | department_id | 普通索引 | 部门数据隔离 |
| idx_discoverer | discoverer_id | 普通索引 | 按发现人查询 |
| idx_create_time | create_time | 普通索引 | 按时间范围查询 |

#### 实体：DispositionRecord（处置记录）

| 字段名 | Java 类型 | 数据库类型 | 必填 | 默认值 | 说明 | 校验规则 | 关系 |
|--------|----------|-----------|------|--------|------|----------|------|
| id | Long | bigint | 自动 | - | 主键 | 自增 | - |
| ncp_id | Long | bigint | 是 | - | 关联不合格品ID | @NotNull | → NonConformingProduct.id |
| disposition_type | Integer | tinyint | 是 | - | 处置方式 | @NotNull, 枚举值 1-3 | - |
| disposition_description | String | varchar(500) | 是 | - | 处置说明 | @NotBlank | - |
| disposer_id | Long | bigint | 是 | - | 处置人ID | @NotNull | → User.id |
| disposition_time | LocalDateTime | datetime | 是 | CURRENT_TIMESTAMP | 处置时间 | 自动填充 | - |
| inventory_adjusted | Byte | tinyint | 是 | 0 | 库存是否已调整 | 0=否, 1=是 | - |

**索引设计**：

| 索引名 | 字段 | 类型 | 说明 |
|--------|------|------|------|
| idx_ncp_id | ncp_id | 普通索引 | 按不合格品查处置记录 |

### 3.2 跨服务共享数据 【条件必填】

| 数据名称 | 类型（DTO/Enum/VO） | 放置位置 | 使用方服务 | 说明 |
|---------|-------------------|---------|-----------|------|
| NonConformingProductDTO | DTO | common-bean | quality-management, warehouse-service | 不合格品摘要信息，仓库服务扣库存时使用 |
| NCPStatusEnum | Enum | common-bean | quality-management, workflow-service | 不合格品状态枚举，工作流回调时使用 |
| DefectTypeEnum | Enum | common-bean | quality-management | 缺陷类型枚举（1=外观缺陷, 2=尺寸偏差, 3=功能异常, 4=其他） |
| DispositionTypeEnum | Enum | common-bean | quality-management | 处置方式枚举（1=返工, 2=报废, 3=让步接收） |

### 3.3 枚举定义 【条件必填】

#### 枚举：NCPStatus（不合格品状态）

| 枚举值（code） | 显示名称 | 含义说明 | 业务规则 |
|---------------|---------|---------|---------|
| 0 | 待审批 | 初始状态 | 新建时默认值，允许编辑、提交、删除 |
| 1 | 审批中 | 已提交审批 | 不允许编辑、删除；仅允许审批通过和驳回 |
| 2 | 已通过 | 审批通过 | 不允许编辑、删除、提交；仅允许处置登记 |
| 3 | 已驳回 | 审批驳回 | 允许编辑缺陷信息、重新提交；不允许审批操作 |
| 4 | 已处置 | 已完成处置 | 终态，不允许任何操作 |

#### 枚举：DefectType（缺陷类型）

| 枚举值（code） | 显示名称 | 含义说明 | 业务规则 |
|---------------|---------|---------|---------|
| 1 | 外观缺陷 | 表面划痕、变色、变形等 | 无 |
| 2 | 尺寸偏差 | 超出公差范围 | 无 |
| 3 | 功能异常 | 功能测试不通过 | 无 |
| 4 | 其他 | 不属于以上分类的缺陷 | 需在描述中详细说明 |

#### 枚举：DispositionType（处置方式）

| 枚举值（code） | 显示名称 | 含义说明 | 业务规则 |
|---------------|---------|---------|---------|
| 1 | 返工 | 返回生产线重新加工 | 处置后产品状态不变，可重新检验 |
| 2 | 报废 | 不可修复，销毁处理 | 触发仓库库存扣减 |
| 3 | 让步接收 | 不合格但可用，特殊放行 | 产品状态标记为已放行 |

### 3.4 实体关系 【建议】

```
Product (1) ←── (N) NonConformingProduct  [product_id]
User (1) ←── (N) NonConformingProduct     [discoverer_id]
User (1) ←── (N) NonConformingProduct     [approver_id]
Department (1) ←── (N) NonConformingProduct  [department_id]
NonConformingProduct (1) ←── (N) DispositionRecord  [ncp_id]
User (1) ←── (N) DispositionRecord        [disposer_id]
```

---

## 四、业务流程 【必填】

### 4.1 主业务流程

#### 流程 1：不合格品登记与处置全流程

| 步骤 | 角色 | 操作 | 输入 | 系统处理逻辑 | 输出 | 异常处理 |
|------|------|------|------|-------------|------|---------|
| 1 | 质检员 | 创建不合格品记录 | productId=1001, batchNo="BATCH-20260701", defectType=1, description="表面有2处划痕", quantity=3, process="喷涂工序" | 校验产品存在性→校验批次号非空→生成编号 NC-20260707-0001→保存记录(status=0) | 返回 {id: 1, recordCode: "NC-20260707-0001", status: 0} | 产品不存在→400 PRODUCT_NOT_FOUND；同批次同缺陷重复→409 DUPLICATE_NCP |
| 2 | 质检员 | 提交审批 | ncpId=1 | 校验 status=0→调用 workflow-service.startProcess()→更新 status=1, workflowInstanceId=xxx | 返回 200 | status≠0→400 STATUS_NOT_ALLOWED；workflow 超时→降级处理，重试 3 次 |
| 3 | 质量主管 | 审批通过 | ncpId=1, comment="同意处置" | 校验 status=1→校验审批权限→UPDATE status=2, approverId, approveTime（WHERE id=? AND status=1 AND version=?）→检查 affected rows | 返回 200 | affected rows=0→500 UPDATE_FAILED；无权限→403 FORBIDDEN |
| 4 | 质检员 | 登记处置 | ncpId=1, dispositionType=2(报废), description="表面缺陷无法返工，予以报废" | 校验 status=2→创建 disposition_record→调用 warehouse-service.deductInventory(productId, quantity)→更新 NCP status=4 | 返回 {dispositionId: 1, status: 4} | status≠2→400 STATUS_NOT_ALLOWED；仓库扣减失败→500 INVENTORY_ERROR，处置记录标记 inventoryAdjusted=0 |

#### 流程 2：审批驳回→修改→重新提交

| 步骤 | 角色 | 操作 | 输入 | 系统处理逻辑 | 输出 | 异常处理 |
|------|------|------|------|-------------|------|---------|
| 1 | 质量主管 | 驳回 | ncpId=1, rejectReason="请补充缺陷照片" | 校验 status=1→UPDATE status=3, rejectReason, rejectTime | 返回 200 | status≠1→400；rejectReason 为空→400 |
| 2 | 质检员 | 修改缺陷描述 | ncpId=1, description="表面有2处划痕（见附件照片）", defectQuantity=3 | 校验 status=3→更新 description、defectQuantity | 返回 200 | status≠3→400 |
| 3 | 质检员 | 重新提交审批 | ncpId=1 | 校验 status=3→调用 workflow-service→更新 status=1 | 返回 200 | 同步骤 1 的异常 |

### 4.2 状态机定义 【条件必填】

**状态流转**：

```
[待审批(0)] ──提交──→ [审批中(1)]
[审批中(1)] ──通过──→ [已通过(2)]
[审批中(1)] ──驳回──→ [已驳回(3)]
[已驳回(3)] ──重新提交──→ [审批中(1)]
[已通过(2)] ──处置──→ [已处置(4)]
```

| 当前状态 | 允许操作 | 目标状态 | 前置条件 | 触发后系统行为 |
|----------|---------|---------|---------|--------------|
| 0(待审批) | 提交审批 | 1(审批中) | 无 | 调用 workflow-service，发送通知给质量主管 |
| 0(待审批) | 编辑信息 | 0(待审批) | 无 | 更新缺陷信息，version+1 |
| 0(待审批) | 删除 | - | 仅创建人可删除 | 逻辑删除 deleted=1 |
| 1(审批中) | 审批通过 | 2(已通过) | 当前用户有 quality_manager 角色 | 记录审批人和时间 |
| 1(审批中) | 审批驳回 | 3(已驳回) | 当前用户有 quality_manager 角色，驳回原因不为空 | 记录驳回原因和时间 |
| 3(已驳回) | 编辑信息 | 3(已驳回) | 无 | 更新缺陷信息，version+1 |
| 3(已驳回) | 重新提交 | 1(审批中) | 无 | 重新启动审批流 |
| 2(已通过) | 处置登记 | 4(已处置) | 处置方式和说明不为空 | 创建处置记录，按处置方式执行后续逻辑 |

**禁止操作矩阵**（当前状态下不允许的操作）：

| 当前状态 | 禁止操作 | 系统行为 |
|----------|---------|---------|
| 1(审批中) | 编辑缺陷信息 | 返回 400 STATUS_NOT_ALLOWED "审批中不允许修改" |
| 1(审批中) | 删除记录 | 返回 400 STATUS_NOT_ALLOWED "审批中不允许删除" |
| 1(审批中) | 重新提交审批 | 返回 400 STATUS_NOT_ALLOWED "已提交审批，请等待审批结果" |
| 2(已通过) | 编辑缺陷信息 | 返回 400 STATUS_NOT_ALLOWED "已通过不允许修改" |
| 2(已通过) | 删除记录 | 返回 400 STATUS_NOT_ALLOWED "已通过不允许删除" |
| 2(已通过) | 审批操作 | 返回 400 STATUS_NOT_ALLOWED "已完成审批" |
| 3(已驳回) | 删除记录 | 返回 400 STATUS_NOT_ALLOWED "已驳回记录不允许删除" |
| 3(已驳回) | 审批操作 | 返回 400 STATUS_NOT_ALLOWED "已驳回，请修改后重新提交" |
| 4(已处置) | 所有操作 | 返回 400 STATUS_NOT_ALLOWED "已处置记录不允许任何变更" |

### 4.3 跨服务调用定义 【条件必填】

| 调用方 | 被调用方 | 调用目的 | 方法签名 | 期望返回 | 超时 | 失败降级策略 |
|--------|---------|---------|---------|---------|------|------------|
| quality-mgmt | workflow-service | 提交审批时启动审批流 | `startProcess(StartProcessRequest)` | 流程实例ID（String） | 3s | 记录 WARN 日志，异步重试 3 次（间隔 1s/2s/4s），3 次仍失败则 status 回滚为 0，通知质检员 |
| quality-mgmt | warehouse-service | 报废处置时扣减库存 | `deductInventory(DeductInventoryRequest)` | 扣减结果（boolean） | 5s | 记录 ERROR 日志，处置记录 inventoryAdjusted=0，status 仍更新为 4（已处置），由人工处理库存对账 |

---

## 五、业务规则 【必填】

### 5.1 校验规则 【必填】

| # | 规则名称 | 校验对象 | 校验条件 | 不满足时行为 | 错误码 | 错误信息 |
|---|---------|---------|---------|-------------|--------|---------|
| 1 | 产品存在性 | productId | 产品必须存在且 deleted=0 | 返回 400 | PRODUCT_NOT_FOUND | "产品不存在或已删除" |
| 2 | 批次号非空 | batchNo | 不为空且不超过 64 字符 | 返回 400 | BATCH_NO_REQUIRED | "批次号不能为空" |
| 3 | 缺陷描述非空 | defectDescription | 不为空且不超过 500 字符 | 返回 400 | DEFECT_DESC_REQUIRED | "缺陷描述不能为空" |
| 4 | 缺陷数量正整数 | defectQuantity | >= 1 | 返回 400 | INVALID_QUANTITY | "缺陷数量必须大于 0" |
| 5 | 缺陷类型有效值 | defectType | 值在 1-4 范围内 | 返回 400 | INVALID_DEFECT_TYPE | "缺陷类型无效" |
| 6 | 驳回原因非空 | rejectReason | 驳回时不为空且不超过 500 字符 | 返回 400 | REJECT_REASON_REQUIRED | "驳回原因不能为空" |
| 7 | 处置方式有效值 | dispositionType | 值在 1-3 范围内 | 返回 400 | INVALID_DISPOSITION_TYPE | "处置方式无效" |
| 8 | 处置说明非空 | dispositionDescription | 不为空且不超过 500 字符 | 返回 400 | DISPOSITION_DESC_REQUIRED | "处置说明不能为空" |

### 5.2 业务规则 【必填】

| # | 规则名称 | 触发场景 | 条件（IF） | 行为（THEN） | 否则行为（ELSE） |
|---|---------|---------|-----------|-------------|----------------|
| 1 | 同批次同缺陷类型防重复 | 创建不合格品 | 同一 productId + batchNo + defectType 在 status=0 或 1 的记录中已存在 | 拒绝创建，返回 409 DUPLICATE_NCP "同一批次同一缺陷类型已有待审批或审批中的记录" | 允许创建 |
| 2 | 编号每日自增 | 创建不合格品 | 当日已有 N 条记录 | 编号序号为 N+1（4 位补零） | 编号序号为 0001 |
| 3 | 审批人权限校验 | 审批通过/驳回 | 当前用户不拥有 quality_manager 角色 | 返回 403 FORBIDDEN "无审批权限" | 允许审批操作 |
| 4 | 报废触发库存扣减 | 处置登记且处置方式=报废(2) | dispositionType == 2 | 调用 warehouse-service.deductInventory(productId, defectQuantity)，成功则 inventoryAdjusted=1 | inventoryAdjusted=0，记录 ERROR 日志 |
| 5 | 返工标记待重新检验 | 处置登记且处置方式=返工(1) | dispositionType == 1 | 创建处置记录后，通知生产主管安排返工，产品状态不自动变更 | 无额外操作 |
| 6 | 让步接收标记放行 | 处置登记且处置方式=让步接收(3) | dispositionType == 3 | 创建处置记录后，产品标记为"已放行"状态 | 无额外操作 |
| 7 | 审批通过后不可重新提交 | 提交审批 | 已审批通过(status=2)或已处置(status=4)的记录 | 返回 400 STATUS_NOT_ALLOWED | 允许提交 |
| 8 | 乐观锁冲突检测 | 更新不合格品 | UPDATE 的 WHERE version=? 匹配 0 行 | 返回 500 UPDATE_FAILED "数据已被修改，请刷新后重试" | 正常更新，version+1 |

### 5.3 并发与一致性规则 【条件必填】

| # | 场景 | 并发类型 | 策略 | 说明 |
|---|------|---------|------|------|
| 1 | 同一记录并发审批（主管 A 通过 + 主管 B 同时通过） | 写-写冲突 | 乐观锁（version 字段） | UPDATE ... WHERE id=? AND status=1 AND version=?，只有一条能成功，另一条 affected rows=0 → 抛异常 |
| 2 | 同一记录并发处置登记 | 写-写冲突 | 乐观锁（version 字段） | 同上机制，处置登记时校验 version |
| 3 | 同批次并发创建不合格品 | 写-写冲突 | 唯一索引 + 业务校验 | uk_record_code 保证编号不重复；业务层校验同批次同缺陷类型防重复（规则 1） |

---

## 六、异常场景 【必填】

### 6.1 输入异常

| # | 异常场景 | 触发条件 | 期望系统行为 | HTTP 状态码 | 错误码 |
|---|---------|---------|-------------|-----------|--------|
| 1 | 产品ID不存在 | productId 在产品表中不存在或已删除 | 返回错误，不创建记录 | 400 | PRODUCT_NOT_FOUND |
| 2 | 批次号为空 | batchNo 字段未传或为空字符串 | 返回具体字段名和提示 | 400 | BATCH_NO_REQUIRED |
| 3 | 缺陷描述为空 | defectDescription 未传或为空 | 返回具体字段名和提示 | 400 | DEFECT_DESC_REQUIRED |
| 4 | 缺陷数量为 0 或负数 | defectQuantity <= 0 | 返回具体字段名和提示 | 400 | INVALID_QUANTITY |
| 5 | 缺陷类型无效值 | defectType 不在 1-4 范围 | 返回具体字段名和提示 | 400 | INVALID_DEFECT_TYPE |
| 6 | 驳回原因为空 | 审批驳回时 rejectReason 未传或为空 | 返回具体字段名和提示 | 400 | REJECT_REASON_REQUIRED |
| 7 | 处置说明为空 | 处置登记时 dispositionDescription 未传或为空 | 返回具体字段名和提示 | 400 | DISPOSITION_DESC_REQUIRED |
| 8 | 多个字段同时为空 | productId 和 batchNo 同时为空 | 返回所有为空字段的校验错误列表 | 400 | VALIDATION_FAILED |

### 6.2 业务异常

| # | 异常场景 | 触发条件 | 期望系统行为 | HTTP 状态码 | 错误码 |
|---|---------|---------|-------------|-----------|--------|
| 1 | 同批次同缺陷重复 | productId+batchNo+defectType 在待审批/审批中已有记录 | 拒绝创建，提示已有记录 | 409 | DUPLICATE_NCP |
| 2 | 状态不允许操作 | 对记录执行当前状态不允许的操作 | 返回 400 和允许操作列表 | 400 | STATUS_NOT_ALLOWED |
| 3 | 审批权限不足 | 非质量主管角色执行审批操作 | 返回 403 | 403 | FORBIDDEN |
| 4 | 乐观锁冲突 | 并发修改导致 version 不匹配 | 返回 500，提示刷新 | 500 | UPDATE_FAILED |
| 5 | 重复审批 | 已审批通过的记录再次审批 | 返回 400 | 400 | STATUS_NOT_ALLOWED |

### 6.3 系统异常

| # | 异常场景 | 触发条件 | 期望系统行为 | HTTP 状态码 | 错误码 |
|---|---------|---------|-------------|-----------|--------|
| 1 | 审批服务超时 | workflow-service 调用超时（>3s） | 重试 3 次仍失败→status 回滚为 0，通知质检员 | 200(降级) | WORKFLOW_TIMEOUT |
| 2 | 仓库服务超时 | warehouse-service 调用超时（>5s） | 处置记录标记 inventoryAdjusted=0，记录 ERROR 日志 | 200(降级) | INVENTORY_ERROR |
| 3 | 数据库连接异常 | 数据库不可用 | 返回 500，不重试 | 500 | DB_ERROR |
| 4 | 编号生成冲突 | 同一毫秒内并发创建导致编号冲突 | 重试编号生成（最多 3 次），仍失败返回 500 | 500 | CODE_GENERATION_FAILED |

### 6.4 边界场景 【必填】

| # | 场景 | 输入值 | 期望行为 |
|---|------|--------|---------|
| 1 | 缺陷描述恰好 500 字符 | defectDescription 填满 500 字符 | 正常保存 |
| 2 | 缺陷描述超过 500 字符 | defectDescription 填 501 字符 | 返回 400，提示超过最大长度 |
| 3 | 缺陷数量为 1 | defectQuantity = 1 | 正常保存 |
| 4 | 缺陷数量为大值 | defectQuantity = 999999 | 正常保存 |
| 5 | 批次号恰好 64 字符 | batchNo 填满 64 字符 | 正常保存 |
| 6 | 批次号超过 64 字符 | batchNo 填 65 字符 | 返回 400，提示超过最大长度 |
| 7 | 同日第一条记录 | 当日数据库无记录 | 编号为 NC-YYYYMMDD-0001 |
| 8 | 同日第 9999 条记录 | 当日已有 9998 条 | 编号为 NC-YYYYMMDD-9999 |
| 9 | 不合格品 ID 不存在 | 传入不存在的 ID 进行任何操作 | 返回 404 RESOURCE_NOT_FOUND |

---

## 七、API 交互 【必填】

### 7.1 接口清单

| # | 接口名称 | HTTP 方法 | 路径 | 请求参数 | 响应体 | 说明 |
|---|----------|-----------|------|---------|--------|------|
| 1 | 创建不合格品 | POST | /api/quality/non-conforming-products | Request Body | NCPDetailVO | 创建并返回完整信息 |
| 2 | 提交审批 | POST | /api/quality/non-conforming-products/{id}/submit | 无 | 200 OK | 提交审批 |
| 3 | 审批通过 | POST | /api/quality/non-conforming-products/{id}/approve | ApproveRequest | 200 OK | 通过审批 |
| 4 | 审批驳回 | POST | /api/quality/non-conforming-products/{id}/reject | RejectRequest | 200 OK | 驳回审批 |
| 5 | 处置登记 | POST | /api/quality/non-conforming-products/{id}/disposition | DispositionRequest | DispositionVO | 登记处置 |
| 6 | 列表查询 | GET | /api/quality/non-conforming-products | Query Params | Page<NCPListVO> | 分页查询 |
| 7 | 详情查询 | GET | /api/quality/non-conforming-products/{id} | Path Variable | NCPDetailVO | 查看详情 |

### 7.2 接口详细定义

#### 接口 1：创建不合格品

**请求体**：

| 字段 | 类型 | 必填 | 校验规则 | 说明 |
|------|------|------|---------|------|
| productId | Long | 是 | @NotNull | 关联产品ID |
| batchNo | String | 是 | @NotBlank, @Size(max=64) | 批次号 |
| defectType | Integer | 是 | @NotNull, 值域 [1,4] | 缺陷类型 |
| defectDescription | String | 是 | @NotBlank, @Size(max=500) | 缺陷描述 |
| defectQuantity | Integer | 是 | @Min(1) | 缺陷数量 |
| discoveryProcess | String | 是 | @NotBlank, @Size(max=64) | 发现工序 |

**成功响应** (200)：

```json
{
  "code": 0,
  "data": {
    "id": 1,
    "recordCode": "NC-20260707-0001",
    "status": 0,
    "createTime": "2026-07-07T10:30:00"
  }
}
```

**错误响应**：

| 场景 | HTTP 状态码 | code | message |
|------|-----------|------|---------|
| 产品不存在 | 400 | PRODUCT_NOT_FOUND | "产品不存在或已删除" |
| 同批次重复 | 409 | DUPLICATE_NCP | "同一批次同一缺陷类型已有待审批或审批中的记录" |
| 参数校验失败 | 400 | VALIDATION_FAILED | 具体字段校验错误列表 |

#### 接口 3：审批通过

**请求体**：

| 字段 | 类型 | 必填 | 校验规则 | 说明 |
|------|------|------|---------|------|
| comment | String | 否 | @Size(max=500) | 审批意见 |

**成功响应** (200)：

```json
{
  "code": 0,
  "message": "审批通过"
}
```

**错误响应**：

| 场景 | HTTP 状态码 | code | message |
|------|-----------|------|---------|
| 不存在 | 404 | RESOURCE_NOT_FOUND | "不合格品记录不存在" |
| 状态不对 | 400 | STATUS_NOT_ALLOWED | "仅审批中的记录可以审批" |
| 无权限 | 403 | FORBIDDEN | "无审批权限" |
| 乐观锁冲突 | 500 | UPDATE_FAILED | "数据已被修改，请刷新后重试" |

#### 接口 5：处置登记

**请求体**：

| 字段 | 类型 | 必填 | 校验规则 | 说明 |
|------|------|------|---------|------|
| dispositionType | Integer | 是 | @NotNull, 值域 [1,3] | 处置方式 |
| dispositionDescription | String | 是 | @NotBlank, @Size(max=500) | 处置说明 |

**成功响应** (200)：

```json
{
  "code": 0,
  "data": {
    "dispositionId": 1,
    "ncpStatus": 4,
    "inventoryAdjusted": true
  }
}
```

#### 接口 6：列表查询

**查询参数**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| productId | Long | 否 | 产品ID筛选 |
| batchNo | String | 否 | 批次号模糊匹配 |
| status | Byte | 否 | 状态筛选 |
| startTime | String | 否 | 发现时间起始，格式 yyyy-MM-dd HH:mm:ss |
| endTime | String | 否 | 发现时间截止 |
| page | Integer | 否 | 页码，默认 1 |
| size | Integer | 否 | 每页条数，默认 20，最大 100 |

**成功响应** (200)：

```json
{
  "code": 0,
  "data": {
    "total": 42,
    "list": [
      {
        "id": 1,
        "recordCode": "NC-20260707-0001",
        "productName": "精密轴承 A-100",
        "batchNo": "BATCH-20260701",
        "defectType": 1,
        "defectTypeName": "外观缺陷",
        "defectQuantity": 3,
        "status": 0,
        "statusName": "待审批",
        "createTime": "2026-07-07T10:30:00"
      }
    ]
  }
}
```

### 7.3 接口权限

| 接口路径 | 允许角色 | 权限说明 |
|---------|---------|---------|
| POST /api/quality/non-conforming-products | quality_inspector | 质检员可创建 |
| POST .../submit | quality_inspector | 仅创建人可提交 |
| POST .../approve | quality_manager | 质量主管可审批 |
| POST .../reject | quality_manager | 质量主管可驳回 |
| POST .../disposition | quality_inspector | 质检员可处置登记 |
| GET /api/quality/non-conforming-products | quality_inspector, quality_manager | 质检员看本部门，主管看全部 |
| GET .../{id} | quality_inspector, quality_manager | 同上 |

---

## 八、非功能需求 【建议】

### 8.1 性能需求

| 场景 | 指标 | 说明 |
|------|------|------|
| 列表查询（默认分页） | < 500ms (P99) | 含 20 条数据，5 个查询条件 |
| 详情查询 | < 200ms (P99) | 含处置记录子查询 |
| 创建不合格品 | < 300ms (P99) | 含编号生成、校验、插入 |
| 处置登记 | < 1s (P99) | 含跨服务调用仓库 |

### 8.2 安全需求

| 场景 | 要求 | 说明 |
|------|------|------|
| 数据权限 | 部门级隔离 | 质检员只能查看/操作本部门的记录，质量主管可查看所有部门 |
| 幂等性 | 写接口幂等 | 重复提交审批返回 400 STATUS_NOT_ALLOWED（而非重复执行） |
| 审计日志 | 关键操作记录 | 创建、审批通过、驳回、处置登记写入审计日志 |

---

## 九、验收标准 【必填】

### 9.1 功能验收标准 【必填】

| # | 关联功能点 | 验收场景 | 验收条件（断言） | 优先级 | 测试级别 |
|---|-----------|---------|----------------|--------|---------|
| 1 | 不合格品登记 | 正常创建 | 传入合法参数→HTTP 200 + data.id != null + recordCode 格式匹配 NC-\d{8}-\d{4} + status=0 | must | e2e |
| 2 | 不合格品登记 | 产品不存在 | productId=99999→HTTP 400 + code=PRODUCT_NOT_FOUND | must | unit |
| 3 | 不合格品登记 | 同批次重复 | 同 productId+batchNo+defectType 创建第 2 条（第 1 条 status=0）→HTTP 409 + code=DUPLICATE_NCP | must | unit |
| 4 | 不合格品登记 | 编号自增 | 当日第 2 条创建→recordCode 序号为 0002 | must | unit |
| 5 | 提交审批 | 正常提交 | 待审批记录提交→HTTP 200 + 查询 status=1 + workflowInstanceId != null | must | e2e |
| 6 | 提交审批 | 非待审批状态 | 审批中记录提交→HTTP 400 + code=STATUS_NOT_ALLOWED | must | unit |
| 7 | 审批通过 | 正常通过 | 审批中记录通过→HTTP 200 + status=2 + approverId != null + approveTime != null | must | e2e |
| 8 | 审批通过 | 并发审批 | 两个请求同时通过同一条→一个成功(status=2)，另一个 HTTP 500 + code=UPDATE_FAILED | must | unit |
| 9 | 审批驳回 | 正常驳回 | 审批中记录驳回（含原因）→HTTP 200 + status=3 + rejectReason="请补充照片" | must | e2e |
| 10 | 审批驳回 | 驳回原因为空 | rejectReason=""→HTTP 400 + code=REJECT_REASON_REQUIRED | must | unit |
| 11 | 处置登记-报废 | 正常报废 | 已通过记录处置(type=2)→HTTP 200 + status=4 + inventoryAdjusted=true | must | e2e |
| 12 | 处置登记-报废 | 仓库超时 | mock 仓库超时→HTTP 200 + status=4 + inventoryAdjusted=false | must | integration |
| 13 | 处置登记-返工 | 正常返工 | 已通过记录处置(type=1)→HTTP 200 + status=4 + inventoryAdjusted 不适用 | should | e2e |
| 14 | 列表查询 | 正常查询 | GET 带 productId+status→HTTP 200 + data.total >= 0 + data.list 每条包含 recordCode | must | e2e |
| 15 | 列表查询 | 部门隔离 | 部门 A 质检员查询→不包含部门 B 的数据 | must | e2e |

### 9.2 集成验收标准 【建议】

| # | 验收场景 | 验收条件 | 优先级 | 测试级别 |
|---|---------|---------|--------|---------|
| 1 | workflow-service 不可用 | mock 返回超时→提交审批重试 3 次后 status 回滚为 0 | should | integration |
| 2 | warehouse-service 不可用 | mock 返回超时→处置登记成功但 inventoryAdjusted=false | should | integration |

---

## 十、补充信息 【选填】

| 项目 | 内容 |
|------|------|
| 参考文档 | [原型图](http://xxx)、[数据字典](http://xxx)、[现有产品表结构](http://xxx) |
| 备注 | 当前版本不包含统计报表功能，后续迭代需求单独提报 |

---

## 附录：自检清单 【必填】

### 准确性（无歧义）

| # | 检查项 | 通过标准 | 自检结果 |
|---|--------|---------|---------|
| A1 | 功能点输入/输出 | 具体到字段级别，无"信息"等模糊词 | ✅ 通过 |
| A2 | 数据模型字段 | 类型明确、校验规则清晰 | ✅ 通过 |
| A3 | 业务规则格式 | 使用"如果...则...否则..."格式 | ✅ 通过 |
| A4 | 状态机完整性 | 所有状态和转换路径已定义 | ✅ 通过（5 个状态，8 条转换） |
| A5 | 验收标准可验证 | 无"功能正常""体验良好"等主观描述 | ✅ 通过 |

### 完整性（无遗漏）

| # | 检查项 | 通过标准 | 自检结果 |
|---|--------|---------|---------|
| B1 | 异常场景 | 每个功能点至少 2 个异常场景 | ✅ 通过 |
| B2 | 枚举值 | 所有枚举值含义和规则已定义 | ✅ 通过 |
| B3 | 写接口幂等性 | 每个写接口定义了重复提交行为 | ✅ 通过 |
| B4 | 跨服务降级 | 每个跨服务调用定义了失败策略 | ✅ 通过 |

### 一致性（无矛盾）

| # | 检查项 | 通过标准 | 自检结果 |
|---|--------|---------|---------|
| C1 | 状态机无矛盾 | 无互斥的状态转换 | ✅ 通过 |
| C2 | 业务规则无矛盾 | 无规则互相冲突 | ✅ 通过 |
| C3 | 验收标准与规则一致 | 期望行为与规则定义不冲突 | ✅ 通过 |

### 逻辑性（无遗漏路径）

| # | 检查项 | 通过标准 | 自检结果 |
|---|--------|---------|---------|
| D1 | 流程步骤异常处理 | 每步的"异常处理"列已填写 | ✅ 通过 |
| D2 | 禁止操作矩阵 | 每个状态都有禁止操作定义 | ✅ 通过 |
| D3 | 边界场景 | 有边界值的字段都有边界测试 | ✅ 通过 |
| D4 | 错误码唯一 | 同一错误码不对应多个场景 | ✅ 通过 |

---

*PRD 版本: v1.0 | 模板版本: v2.0 | 产品负责人: 张三 | 编写日期: 2026-07-01*
