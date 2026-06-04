---
stage: Develop
type: stage-instruction
---

## 阶段五：Develop（开发执行）

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

### 执行模式

**标准模式**：单个 develop-expert subagent 顺序执行所有任务
**并行模式**：多个 develop-expert subagent 并行执行同一批次的任务

> **并行模式由主 Agent 协调**：根据任务拆分文档中的批次信息，同时派发多个 subagent。

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

### 🔴 Step 4: 实际编译验证（强烈建议执行）

> 自检通过后，强烈建议执行实际编译验证，因为 AI 自检可能遗漏泛型类型、隐式转换等问题。

**Java 项目**：
```bash
# 单服务
mvn compile -pl {module-name} -am -q

# 多服务（仅编译当前服务）
mvn compile -pl {service-module} -am -q
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
| ❌ 编译失败 | 1. 读取错误信息 2. 修复编译错误 3. 重新编译验证 |
| ⚠️ 警告 | 评估是否需要修复（类型安全警告建议修复） |

### 🔴 失败恢复策略

如果代码生成过程中遇到无法解决的问题：

1. **保存当前进度**：将已完成的文件写入磁盘，不要丢弃
2. **记录失败信息**：在 `develop-result.yaml` 中标记 `compilation_status: failed`，记录具体错误
3. **通知 Orchestrator**：通过 `task-result.yaml` 报告失败，包含失败原因和建议的修复方向
4. **不要静默跳过**：禁止跳过编译错误继续开发下一个文件

---

**Step 4.5: 上下文监控与保护（关键！）**

> **⚠️ 每个文件生成后必须执行**：检查当前上下文使用情况，防止溢出导致后续代码生成失败。

**监控机制**：

| 上下文使用率 | 级别 | 操作 |
|-------------|------|------|
| < 70% | 🟢 安全 | 继续正常开发 |
| 70% - 85% | 🟡 警告 | 提示用户："上下文即将满载，建议保存进度" |
| 85% - 95% | 🔴 临界 | **强制保存**：<br>1. 立即保存所有已生成文件<br>2. 将开发状态写入 `.dev-flow/runtime/develop-checkpoint.yaml`<br>3. 清理 AI 上下文，只保留关键摘要<br>4. 提示用户："已进入安全模式，建议分段执行剩余任务" |
| > 95% | 🚨 溢出 | **立即停止**：<br>1. 保存所有已生成内容<br>2. 拒绝继续生成新文件<br>3. 提示用户："上下文溢出，请使用 `/dev-flow -subagent` 重新执行" |

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

---
